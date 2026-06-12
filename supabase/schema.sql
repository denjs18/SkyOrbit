-- ============================================================
-- SCHÉMA SUPABASE - SkyOrbit (plateforme multi-clubs)
-- ============================================================
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- (Dashboard > SQL Editor > New query > coller > Run).
--
-- ⚠️  Ce script RECRÉE toutes les tables : il supprime les données
--     existantes. À n'exécuter que sur une base vide ou à réinitialiser.
--
-- Modèle : chaque aéro-club a ses propres membres, machines,
-- réservations, cotisations et baptêmes. L'annuaire des clubs (infos de
-- base) est public ; tout le reste n'est visible que par les membres du
-- club concerné. Rôles applicatifs par club : admin (le bureau),
-- instructor, pilot, member.

create extension if not exists btree_gist;

-- Nettoyage (ré-exécution possible)
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists baptemes cascade;
drop table if exists cotisations cascade;
drop table if exists reservations cascade;
drop table if exists maintenance_logs cascade;
drop table if exists machines cascade;
drop table if exists profiles cascade;
drop table if exists clubs cascade;
drop function if exists handle_new_user cascade;
drop function if exists apply_flight_hours cascade;
drop function if exists create_club cascade;
drop function if exists app_role cascade;
drop function if exists app_profile_id cascade;
drop function if exists app_club_id cascade;
drop function if exists is_admin cascade;

-- ------------------------------------------------------------
-- CLUBS
-- ------------------------------------------------------------

create table clubs (
    id             uuid primary key default gen_random_uuid(),
    name           text unique not null,
    base_code      text,            -- ex : LF3177
    base_name      text,            -- ex : Toulouse Nord Fronton
    city           text,            -- ex : Fronton
    latitude       double precision,  -- utilisé pour la météo du club
    longitude      double precision,
    description    text default '',
    contact_email  text,
    contact_phone  text,
    created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MEMBRES
-- ------------------------------------------------------------
-- La fiche membre est indépendante du compte de connexion : le bureau
-- peut enregistrer un membre avant qu'il ait un compte. À la création
-- d'un compte (auth.users), la fiche portant le même email est liée
-- automatiquement, sinon une fiche sans club est créée.

create table profiles (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid unique references auth.users(id) on delete set null,
    club_id         uuid references clubs(id) on delete set null,
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

create or replace function app_club_id()
returns uuid language sql stable security definer set search_path = public as $$
    select club_id from profiles where user_id = auth.uid() and active;
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

-- Crée un club et fait de l'appelant (connecté) son administrateur.
-- Appelé depuis la page « Créer mon club ».
create or replace function create_club(
    p_name text,
    p_base_code text default null,
    p_base_name text default null,
    p_city text default null,
    p_latitude double precision default null,
    p_longitude double precision default null,
    p_description text default null,
    p_contact_email text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
    v_profile_id uuid;
    v_club_id uuid;
begin
    select id into v_profile_id from profiles where user_id = auth.uid() and active;
    if v_profile_id is null then
        raise exception 'Connectez-vous d''abord pour créer un club';
    end if;
    if (select club_id from profiles where id = v_profile_id) is not null then
        raise exception 'Vous êtes déjà membre d''un club';
    end if;

    insert into clubs (name, base_code, base_name, city, latitude, longitude, description, contact_email)
    values (p_name, p_base_code, p_base_name, p_city, p_latitude, p_longitude, coalesce(p_description, ''), p_contact_email)
    returning id into v_club_id;

    update profiles set club_id = v_club_id, role = 'admin' where id = v_profile_id;
    return v_club_id;
end;
$$;

-- ------------------------------------------------------------
-- MACHINES & MAINTENANCE
-- ------------------------------------------------------------

create table machines (
    id                      uuid primary key default gen_random_uuid(),
    club_id                 uuid not null references clubs(id) on delete cascade,
    registration            text not null,
    model                   text not null,
    type                    text not null default 'multiaxe'
                            check (type in ('multiaxe', 'pendulaire', 'autogire', 'paramoteur', 'autre')),
    hours_total             numeric(8,1) not null default 0,
    maintenance_interval    numeric(6,1) not null default 50,   -- heures entre visites
    last_maintenance_hours  numeric(8,1) not null default 0,    -- compteur à la dernière visite
    notes                   text default '',
    active                  boolean not null default true,
    created_at              timestamptz not null default now(),
    unique (club_id, registration)
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
    club_id        uuid not null references clubs(id) on delete cascade,
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
    club_id    uuid not null references clubs(id) on delete cascade,
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
-- Les réservations publiques arrivent en statut 'pending' pour le club
-- choisi ; son bureau les confirme après vérification du paiement
-- HelloAsso (payment_ref).

create table baptemes (
    id              uuid primary key default gen_random_uuid(),
    club_id         uuid not null references clubs(id) on delete cascade,
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

alter table clubs enable row level security;
alter table profiles enable row level security;
alter table machines enable row level security;
alter table maintenance_logs enable row level security;
alter table reservations enable row level security;
alter table cotisations enable row level security;
alter table baptemes enable row level security;

-- Clubs : annuaire public (lecture par tous, même sans compte) ;
-- modification par le bureau du club uniquement. La création passe
-- exclusivement par la fonction create_club().
create policy "clubs_public_select" on clubs for select to anon, authenticated using (true);
create policy "clubs_admin_update" on clubs for update to authenticated
    using (is_admin() and id = app_club_id())
    with check (is_admin() and id = app_club_id());

-- Profiles : chacun voit sa propre fiche ; l'annuaire des membres n'est
-- visible que par les membres du même club ; le bureau gère son club.
create policy "profiles_select_self" on profiles for select to authenticated
    using (user_id = auth.uid());
create policy "profiles_select_club" on profiles for select to authenticated
    using (club_id is not null and club_id = app_club_id());
create policy "profiles_update_own" on profiles for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid() and role = app_role() and club_id = app_club_id());
create policy "profiles_admin_all" on profiles for all to authenticated
    using (is_admin() and club_id = app_club_id())
    with check (is_admin() and club_id = app_club_id());

-- Machines : lecture par les membres du club, écriture par son bureau.
create policy "machines_select_club" on machines for select to authenticated
    using (club_id = app_club_id());
create policy "machines_admin_write" on machines for all to authenticated
    using (is_admin() and club_id = app_club_id())
    with check (is_admin() and club_id = app_club_id());

create policy "maintenance_select_club" on maintenance_logs for select to authenticated
    using (exists (select 1 from machines m where m.id = machine_id and m.club_id = app_club_id()));
create policy "maintenance_admin_write" on maintenance_logs for all to authenticated
    using (is_admin() and exists (select 1 from machines m where m.id = machine_id and m.club_id = app_club_id()))
    with check (is_admin() and exists (select 1 from machines m where m.id = machine_id and m.club_id = app_club_id()));

-- Réservations : calendrier partagé au sein du club. Un membre crée
-- pour lui-même (statut pending), peut annuler tant que ce n'est pas
-- validé. Seul le bureau du club confirme/clôture.
create policy "reservations_select_club" on reservations for select to authenticated
    using (club_id = app_club_id());
create policy "reservations_insert_own" on reservations for insert to authenticated
    with check (club_id = app_club_id() and member_id = app_profile_id() and status = 'pending');
create policy "reservations_update_own_pending" on reservations for update to authenticated
    using (member_id = app_profile_id() and status = 'pending')
    with check (member_id = app_profile_id() and status in ('pending', 'cancelled'));
create policy "reservations_admin_all" on reservations for all to authenticated
    using (is_admin() and club_id = app_club_id())
    with check (is_admin() and club_id = app_club_id());

-- Cotisations : chacun voit les siennes, le bureau gère celles du club.
create policy "cotisations_select_own" on cotisations for select to authenticated
    using (member_id = app_profile_id());
create policy "cotisations_admin_all" on cotisations for all to authenticated
    using (is_admin() and club_id = app_club_id())
    with check (is_admin() and club_id = app_club_id());

-- Baptêmes : le public (non connecté) peut déposer une demande auprès
-- d'un club ; seul le bureau de ce club consulte et gère les demandes.
create policy "baptemes_public_insert" on baptemes for insert to anon, authenticated
    with check (status = 'pending' and pilot_id is null and machine_id is null and payment_ref is null);
create policy "baptemes_admin_all" on baptemes for all to authenticated
    using (is_admin() and club_id = app_club_id())
    with check (is_admin() and club_id = app_club_id());

-- ------------------------------------------------------------
-- DONNÉES INITIALES : le club fondateur
-- ------------------------------------------------------------
-- Source coordonnées : fiche BASULM LF3177 (N 43°52'04" / E 001°25'00")

insert into clubs (name, base_code, base_name, city, latitude, longitude, description)
values (
    'Horizon Libre',
    'LF3177',
    'Toulouse Nord Fronton',
    'Fronton',
    43.8678,
    1.4167,
    'Club ULM basé sur la plateforme Toulouse Nord Fronton (LF3177) : piste en herbe 13/31 de 490 m, radio 123,50, altitude 361 ft.'
);

-- ------------------------------------------------------------
-- APRÈS EXÉCUTION
-- ------------------------------------------------------------
-- 1. Créez le compte du bureau : Dashboard > Authentication > Add user
--    (email + mot de passe, cochez "auto-confirm").
-- 2. Rattachez-le au club fondateur avec le rôle admin :
--      update profiles
--      set role = 'admin',
--          club_id = (select id from clubs where base_code = 'LF3177')
--      where email = 'votre@email.fr';
-- 3. (Conseillé) Authentication > Sign In / Up > Email : désactivez
--    "Confirm email" pour que la création de club en ligne fonctionne
--    sans étape de confirmation.
