-- ============================================================
-- SCHÉMA SUPABASE - Horizon Libre
-- ============================================================
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- (Dashboard > SQL Editor > New query > coller > Run).
--
-- Rôles applicatifs : admin (le bureau), instructor, pilot, member.
-- Seul le bureau (admin) valide les réservations et gère les données
-- sensibles (décision du 10/06/2026, voir CAHIER_DES_CHARGES.md).

create extension if not exists btree_gist;

-- ------------------------------------------------------------
-- MEMBRES
-- ------------------------------------------------------------
-- La fiche membre est indépendante du compte de connexion : le bureau
-- peut enregistrer un membre avant qu'il ait un compte. À la création
-- d'un compte (auth.users), la fiche portant le même email est liée
-- automatiquement, sinon une fiche est créée.

create table profiles (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid unique references auth.users(id) on delete set null,
    email           text unique not null,
    full_name       text not null,
    phone           text,
    role            text not null default 'member'
                    check (role in ('admin', 'instructor', 'pilot', 'member')),
    license_number  text,
    license_expiry  date,
    medical_expiry  date,
    qualifications  text,
    active          boolean not null default true,
    created_at      timestamptz not null default now()
);

create or replace function app_role()
returns text language sql stable security definer set search_path = public as $$
    select role from profiles where user_id = auth.uid() and active;
$$;

create or replace function app_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
    select id from profiles where user_id = auth.uid() and active;
$$;

create or replace function is_admin()
returns boolean language sql stable as $$
    select app_role() = 'admin';
$$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    update profiles set user_id = new.id where email = new.email and user_id is null;
    if not found then
        insert into profiles (user_id, email, full_name)
        values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
    end if;
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- MACHINES & MAINTENANCE
-- ------------------------------------------------------------

create table machines (
    id                      uuid primary key default gen_random_uuid(),
    registration            text unique not null,
    model                   text not null,
    type                    text not null default 'multiaxe'
                            check (type in ('multiaxe', 'pendulaire', 'autogire', 'paramoteur', 'autre')),
    hours_total             numeric(8,1) not null default 0,
    maintenance_interval    numeric(6,1) not null default 50,   -- heures entre visites
    last_maintenance_hours  numeric(8,1) not null default 0,    -- compteur à la dernière visite
    notes                   text default '',
    active                  boolean not null default true,
    created_at              timestamptz not null default now()
);

create table maintenance_logs (
    id            uuid primary key default gen_random_uuid(),
    machine_id    uuid not null references machines(id) on delete cascade,
    date          date not null default current_date,
    description   text not null,
    hours_at_log  numeric(8,1) not null,
    performed_by  text,
    created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- RÉSERVATIONS
-- ------------------------------------------------------------

create table reservations (
    id             uuid primary key default gen_random_uuid(),
    machine_id     uuid not null references machines(id),
    member_id      uuid not null references profiles(id),
    instructor_id  uuid references profiles(id),
    start_at       timestamptz not null,
    end_at         timestamptz not null,
    flight_type    text not null default 'libre'
                   check (flight_type in ('libre', 'formation', 'bapteme', 'maintenance')),
    status         text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
    actual_hours   numeric(5,1),
    remarks        text default '',
    created_at     timestamptz not null default now(),
    check (end_at > start_at),
    -- Une machine ne peut pas être réservée deux fois sur le même créneau
    exclude using gist (
        machine_id with =,
        tstzrange(start_at, end_at) with &&
    ) where (status <> 'cancelled')
);

-- À la clôture d'un vol, les heures réelles s'ajoutent au compteur machine
create or replace function apply_flight_hours()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.status = 'completed' and old.status <> 'completed' and new.actual_hours is not null then
        update machines set hours_total = hours_total + new.actual_hours
        where id = new.machine_id;
    end if;
    return new;
end;
$$;

create trigger on_reservation_completed
    after update on reservations
    for each row execute function apply_flight_hours();

-- ------------------------------------------------------------
-- COTISATIONS
-- ------------------------------------------------------------

create table cotisations (
    id         uuid primary key default gen_random_uuid(),
    member_id  uuid not null references profiles(id) on delete cascade,
    year       int not null,
    amount     numeric(8,2) not null default 0,
    status     text not null default 'unpaid' check (status in ('paid', 'unpaid')),
    paid_at    date,
    unique (member_id, year)
);

-- ------------------------------------------------------------
-- BAPTÊMES DE L'AIR
-- ------------------------------------------------------------
-- Les réservations publiques arrivent en statut 'pending' ; le bureau
-- les confirme après vérification du paiement HelloAsso (payment_ref).

create table baptemes (
    id              uuid primary key default gen_random_uuid(),
    slot_at         timestamptz not null,
    formula         text not null check (formula in ('decouverte', 'sensation', 'prestige')),
    price           numeric(8,2) not null,
    customer_name   text not null,
    customer_email  text not null,
    customer_phone  text,
    pilot_id        uuid references profiles(id),
    machine_id      uuid references machines(id),
    status          text not null default 'pending'
                    check (status in ('pending', 'paid', 'done', 'cancelled')),
    payment_ref     text,
    notes           text default '',
    created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SÉCURITÉ (Row Level Security)
-- ------------------------------------------------------------

alter table profiles enable row level security;
alter table machines enable row level security;
alter table maintenance_logs enable row level security;
alter table reservations enable row level security;
alter table cotisations enable row level security;
alter table baptemes enable row level security;

-- Profiles : annuaire visible par les membres connectés ;
-- chacun modifie sa fiche, le bureau gère tout.
create policy "profiles_select" on profiles for select to authenticated using (true);
-- Un membre peut modifier sa fiche mais pas changer son propre rôle
create policy "profiles_update_own" on profiles for update to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid() and role = app_role());
create policy "profiles_admin_all" on profiles for all to authenticated
    using (is_admin()) with check (is_admin());

-- Machines : lecture par les membres, écriture par le bureau.
create policy "machines_select" on machines for select to authenticated using (true);
create policy "machines_admin_write" on machines for all to authenticated
    using (is_admin()) with check (is_admin());

create policy "maintenance_select" on maintenance_logs for select to authenticated using (true);
create policy "maintenance_admin_write" on maintenance_logs for all to authenticated
    using (is_admin()) with check (is_admin());

-- Réservations : visibles par tous les membres (calendrier partagé).
-- Un membre crée pour lui-même (statut pending), peut annuler tant que
-- ce n'est pas validé. Seul le bureau confirme/clôture.
create policy "reservations_select" on reservations for select to authenticated using (true);
create policy "reservations_insert_own" on reservations for insert to authenticated
    with check (member_id = app_profile_id() and status = 'pending');
create policy "reservations_update_own_pending" on reservations for update to authenticated
    using (member_id = app_profile_id() and status = 'pending')
    with check (member_id = app_profile_id() and status in ('pending', 'cancelled'));
create policy "reservations_admin_all" on reservations for all to authenticated
    using (is_admin()) with check (is_admin());

-- Cotisations : chacun voit les siennes, le bureau gère tout.
create policy "cotisations_select_own" on cotisations for select to authenticated
    using (member_id = app_profile_id());
create policy "cotisations_admin_all" on cotisations for all to authenticated
    using (is_admin()) with check (is_admin());

-- Baptêmes : le public (non connecté) peut déposer une demande ;
-- seul le bureau consulte et gère les demandes.
create policy "baptemes_public_insert" on baptemes for insert to anon, authenticated
    with check (status = 'pending' and pilot_id is null and machine_id is null and payment_ref is null);
create policy "baptemes_admin_all" on baptemes for all to authenticated
    using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- APRÈS EXÉCUTION
-- ------------------------------------------------------------
-- 1. Créez le compte du bureau : Dashboard > Authentication > Add user
--    (email + mot de passe, cochez "auto-confirm").
-- 2. Donnez-lui le rôle admin :
--      update profiles set role = 'admin' where email = 'votre@email.fr';
-- 3. Renseignez SUPABASE_URL et SUPABASE_ANON_KEY dans assets/js/config.js.
