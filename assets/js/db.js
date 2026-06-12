// ============================================
// COUCHE DE DONNÉES - SkyOrbit (multi-clubs)
// ============================================
// Deux modes de fonctionnement :
//  - 'supabase' : données partagées dans PostgreSQL (production)
//  - 'demo'     : données locales au navigateur (localStorage),
//                 utilisé tant que config.js n'est pas renseigné.
// Toutes les pages passent par cette API : aucune autre couche ne doit
// accéder directement à localStorage ou à Supabase.

(function () {
    const cfg = window.APP_CONFIG || {};
    const hasSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
    const sb = hasSupabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

    // ---------- MODE DÉMO : données d'exemple ----------

    const DEMO_KEY = 'skyorbit_demo_db_v2';

    function demoSeed() {
        const today = new Date();
        const d = (offsetDays, h, m = 0) => {
            const x = new Date(today);
            x.setDate(x.getDate() + offsetDays);
            x.setHours(h, m, 0, 0);
            return x.toISOString();
        };
        return {
            clubs: [
                { id: 'c-1', name: 'Horizon Libre', base_code: 'LF3177', base_name: 'Toulouse Nord Fronton', city: 'Fronton', latitude: 43.8678, longitude: 1.4167, description: 'Club ULM basé sur la plateforme Toulouse Nord Fronton (LF3177), piste en herbe 13/31, radio 123,50.', contact_email: 'contact@horizon-libre.fr', contact_phone: '' }
            ],
            profiles: [
                { id: 'u-admin', club_id: 'c-1', email: 'admin@horizon-libre.fr', password: 'admin123', full_name: 'Alice Bureau', phone: '06 00 00 00 01', role: 'admin', license_number: 'ULM-12345', license_expiry: '2027-03-01', medical_expiry: '2026-09-15', qualifications: 'Multiaxe, Instructeur', active: true },
                { id: 'u-inst', club_id: 'c-1', email: 'instructeur@horizon-libre.fr', password: 'inst123', full_name: 'Jean Moreau', phone: '06 00 00 00 02', role: 'instructor', license_number: 'ULM-23456', license_expiry: '2026-12-01', medical_expiry: '2026-07-20', qualifications: 'Multiaxe, Pendulaire, Instructeur', active: true },
                { id: 'u-pilot', club_id: 'c-1', email: 'pilote@horizon-libre.fr', password: 'pilot123', full_name: 'Marc Leroy', phone: '06 00 00 00 03', role: 'pilot', license_number: 'ULM-34567', license_expiry: '2026-08-10', medical_expiry: '2026-06-25', qualifications: 'Multiaxe', active: true },
                { id: 'u-sophie', club_id: 'c-1', email: 'sophie.martin@example.fr', password: 'demo123', full_name: 'Sophie Martin', phone: '06 00 00 00 04', role: 'member', license_number: 'ULM-45678', license_expiry: '2027-01-15', medical_expiry: '2027-02-01', qualifications: 'Élève pilote', active: true }
            ],
            machines: [
                { id: 'm-1', club_id: 'c-1', registration: 'F-JABC', model: 'Skyranger Nynja', type: 'multiaxe', hours_total: 1240.5, maintenance_interval: 50, last_maintenance_hours: 1220, notes: '', active: true },
                { id: 'm-2', club_id: 'c-1', registration: 'F-JDEF', model: 'Air Création Tanarg', type: 'pendulaire', hours_total: 860, maintenance_interval: 50, last_maintenance_hours: 855, notes: 'Radio neuve', active: true },
                { id: 'm-3', club_id: 'c-1', registration: 'F-JGHI', model: 'Magni M-16', type: 'autogire', hours_total: 432, maintenance_interval: 100, last_maintenance_hours: 400, notes: '', active: true }
            ],
            maintenance_logs: [
                { id: 'l-1', machine_id: 'm-1', date: '2026-05-12', description: 'Visite 50h : vidange, bougies, contrôle câbles', hours_at_log: 1220, performed_by: 'Atelier ULM Centre' },
                { id: 'l-2', machine_id: 'm-3', date: '2026-04-02', description: 'Visite 100h + remplacement courroie pré-rotation', hours_at_log: 400, performed_by: 'Magni Service' }
            ],
            reservations: [
                { id: 'r-1', club_id: 'c-1', machine_id: 'm-1', member_id: 'u-pilot', instructor_id: null, start_at: d(1, 9), end_at: d(1, 11), flight_type: 'libre', status: 'confirmed', actual_hours: null, remarks: '' },
                { id: 'r-2', club_id: 'c-1', machine_id: 'm-2', member_id: 'u-sophie', instructor_id: 'u-inst', start_at: d(1, 14), end_at: d(1, 16), flight_type: 'formation', status: 'pending', actual_hours: null, remarks: 'Premier vol solo en vue' },
                { id: 'r-3', club_id: 'c-1', machine_id: 'm-3', member_id: 'u-inst', instructor_id: null, start_at: d(3, 10), end_at: d(3, 12), flight_type: 'bapteme', status: 'confirmed', actual_hours: null, remarks: 'Baptême offert anniversaire' },
                { id: 'r-4', club_id: 'c-1', machine_id: 'm-1', member_id: 'u-pilot', instructor_id: null, start_at: d(-7, 9), end_at: d(-7, 10, 30), flight_type: 'libre', status: 'completed', actual_hours: 1.5, remarks: '' }
            ],
            cotisations: [
                { id: 'c-1', club_id: 'c-1', member_id: 'u-admin', year: 2026, amount: 250, status: 'paid', paid_at: '2026-01-10' },
                { id: 'c-2', club_id: 'c-1', member_id: 'u-inst', year: 2026, amount: 250, status: 'paid', paid_at: '2026-01-15' },
                { id: 'c-3', club_id: 'c-1', member_id: 'u-pilot', year: 2026, amount: 250, status: 'paid', paid_at: '2026-02-01' },
                { id: 'c-4', club_id: 'c-1', member_id: 'u-sophie', year: 2026, amount: 250, status: 'unpaid', paid_at: null }
            ],
            baptemes: [
                { id: 'b-1', club_id: 'c-1', slot_at: d(3, 10), formula: 'decouverte', price: 60, customer_name: 'Paul Petit', customer_email: 'paul.petit@example.fr', customer_phone: '06 11 22 33 44', pilot_id: 'u-inst', machine_id: 'm-3', status: 'paid', payment_ref: 'DEMO-001', notes: '' },
                { id: 'b-2', club_id: 'c-1', slot_at: d(8, 15), formula: 'sensation', price: 90, customer_name: 'Emma Grand', customer_email: 'emma.grand@example.fr', customer_phone: '06 55 66 77 88', pilot_id: null, machine_id: null, status: 'pending', payment_ref: null, notes: 'Demande créneau fin de journée' }
            ]
        };
    }

    function demoLoad() {
        let db = null;
        try { db = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch (e) { /* réinitialisé ci-dessous */ }
        if (!db || !db.profiles || !db.clubs) {
            db = demoSeed();
            demoSave(db);
        }
        return db;
    }

    function demoSave(db) {
        localStorage.setItem(DEMO_KEY, JSON.stringify(db));
    }

    function demoId(prefix) {
        return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    }

    function stripPassword(p) {
        if (!p) return p;
        const { password, ...rest } = p;
        return rest;
    }

    // Club de l'utilisateur connecté (mode démo)
    function demoCurrentProfile() {
        const id = sessionStorage.getItem('demo_user_id');
        return id ? demoLoad().profiles.find(x => x.id === id) : null;
    }

    function demoClubId() {
        const p = demoCurrentProfile();
        return p ? p.club_id : null;
    }

    // Les écritures sont rattachées au club de l'utilisateur connecté
    // (window.CURRENT_USER est posé par main.js après authentification).
    function withClub(fields) {
        if (fields.club_id) return fields;
        const clubId = (window.CURRENT_USER && window.CURRENT_USER.club_id) || (!sb && demoClubId());
        return clubId ? { club_id: clubId, ...fields } : fields;
    }

    // ---------- Helpers communs ----------

    function overlap(aStart, aEnd, bStart, bEnd) {
        return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
    }

    function decorateReservation(r, machines, profiles) {
        const m = machines.find(x => x.id === r.machine_id);
        const p = profiles.find(x => x.id === r.member_id);
        const i = profiles.find(x => x.id === r.instructor_id);
        return {
            ...r,
            machine_registration: m ? m.registration : '?',
            member_name: p ? p.full_name : '?',
            instructor_name: i ? i.full_name : null
        };
    }

    function sbThrow(error) {
        if (error) throw new Error(error.message || 'Erreur Supabase');
    }

    const RESERVATION_SELECT = '*, machine:machines(registration), member:profiles!reservations_member_id_fkey(full_name), instructor:profiles!reservations_instructor_id_fkey(full_name)';

    function flattenSbReservation(r) {
        return {
            ...r,
            machine_registration: r.machine ? r.machine.registration : '?',
            member_name: r.member ? r.member.full_name : '?',
            instructor_name: r.instructor ? r.instructor.full_name : null,
            machine: undefined, member: undefined, instructor: undefined
        };
    }

    // ---------- API ----------

    const DB = {
        mode: hasSupabase ? 'supabase' : 'demo',

        // ----- Authentification -----

        async signIn(email, password) {
            if (sb) {
                const { error } = await sb.auth.signInWithPassword({ email, password });
                sbThrow(error);
                const session = await this.getSession();
                if (!session) throw new Error("Compte sans fiche membre : contactez le bureau.");
                return session.profile;
            }
            const db = demoLoad();
            const p = db.profiles.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password && x.active);
            if (!p) throw new Error('Email ou mot de passe incorrect');
            sessionStorage.setItem('demo_user_id', p.id);
            return stripPassword(p);
        },

        async signOut() {
            if (sb) await sb.auth.signOut();
            sessionStorage.removeItem('demo_user_id');
        },

        async getSession() {
            if (sb) {
                const { data } = await sb.auth.getUser();
                if (!data || !data.user) return null;
                const { data: rows, error } = await sb.from('profiles').select('*').eq('user_id', data.user.id).limit(1);
                sbThrow(error);
                if (!rows || !rows.length) return null;
                return { userId: data.user.id, profile: rows[0] };
            }
            const id = sessionStorage.getItem('demo_user_id');
            if (!id) return null;
            const p = demoLoad().profiles.find(x => x.id === id);
            return p ? { userId: id, profile: stripPassword(p) } : null;
        },

        // ----- Clubs -----

        // Annuaire public : visible sans connexion (infos de base uniquement)
        async listClubs() {
            if (sb) {
                const { data, error } = await sb.from('clubs').select('*').order('name');
                sbThrow(error);
                return data;
            }
            return demoLoad().clubs.slice().sort((a, b) => a.name.localeCompare(b.name));
        },

        async getClub(id) {
            if (!id) return null;
            if (sb) {
                const { data, error } = await sb.from('clubs').select('*').eq('id', id).limit(1);
                sbThrow(error);
                return data && data.length ? data[0] : null;
            }
            return demoLoad().clubs.find(c => c.id === id) || null;
        },

        async updateClub(id, fields) {
            if (sb) {
                const { data, error } = await sb.from('clubs').update(fields).eq('id', id).select().single();
                sbThrow(error);
                return data;
            }
            const db = demoLoad();
            const c = db.clubs.find(x => x.id === id);
            if (!c) throw new Error('Club introuvable');
            Object.assign(c, fields);
            demoSave(db);
            return c;
        },

        // Crée un compte utilisateur (sans club pour l'instant). Selon la
        // configuration Supabase, une confirmation par email peut être requise.
        async signUp(email, password, fullName) {
            if (sb) {
                const { data, error } = await sb.auth.signUp({
                    email, password,
                    options: { data: { full_name: fullName } }
                });
                sbThrow(error);
                return { needsConfirmation: !data.session };
            }
            const db = demoLoad();
            if (db.profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
                throw new Error('Un compte existe déjà avec cet email');
            }
            const p = { id: demoId('u'), club_id: null, email, password, full_name: fullName, role: 'member', active: true };
            db.profiles.push(p);
            demoSave(db);
            sessionStorage.setItem('demo_user_id', p.id);
            return { needsConfirmation: false };
        },

        // Crée un club et fait de l'utilisateur connecté son administrateur
        async createClub(fields) {
            if (sb) {
                const { data, error } = await sb.rpc('create_club', {
                    p_name: fields.name,
                    p_base_code: fields.base_code || null,
                    p_base_name: fields.base_name || null,
                    p_city: fields.city || null,
                    p_latitude: fields.latitude == null ? null : fields.latitude,
                    p_longitude: fields.longitude == null ? null : fields.longitude,
                    p_description: fields.description || null,
                    p_contact_email: fields.contact_email || null
                });
                sbThrow(error);
                return data;
            }
            const me = demoCurrentProfile();
            if (!me) throw new Error('Connectez-vous ou créez un compte d\'abord');
            if (me.club_id) throw new Error('Vous êtes déjà membre d\'un club');
            const db = demoLoad();
            const club = { id: demoId('cl'), contact_phone: '', ...fields };
            db.clubs.push(club);
            const p = db.profiles.find(x => x.id === me.id);
            p.club_id = club.id;
            p.role = 'admin';
            demoSave(db);
            return club.id;
        },

        // ----- Membres -----

        async listMembers() {
            if (sb) {
                // Le filtrage par club est garanti côté serveur (RLS)
                const { data, error } = await sb.from('profiles').select('*').order('full_name');
                sbThrow(error);
                return data;
            }
            const clubId = demoClubId();
            return demoLoad().profiles
                .filter(p => p.club_id === clubId)
                .map(stripPassword)
                .sort((a, b) => a.full_name.localeCompare(b.full_name));
        },

        async createMember(fields) {
            if (sb) {
                const { data, error } = await sb.from('profiles').insert(withClub(fields)).select().single();
                sbThrow(error);
                return data;
            }
            const db = demoLoad();
            const p = withClub({ id: demoId('u'), active: true, role: 'member', password: 'demo123', ...fields });
            db.profiles.push(p);
            demoSave(db);
            return stripPassword(p);
        },

        async updateMember(id, fields) {
            if (sb) {
                const { data, error } = await sb.from('profiles').update(fields).eq('id', id).select().single();
                sbThrow(error);
                return data;
            }
            const db = demoLoad();
            const p = db.profiles.find(x => x.id === id);
            if (!p) throw new Error('Membre introuvable');
            Object.assign(p, fields);
            demoSave(db);
            return stripPassword(p);
        },

        // ----- Cotisations -----

        async listCotisations(year) {
            if (sb) {
                let q = sb.from('cotisations').select('*');
                if (year) q = q.eq('year', year);
                const { data, error } = await q;
                sbThrow(error);
                return data;
            }
            const clubId = demoClubId();
            const all = demoLoad().cotisations.filter(c => c.club_id === clubId);
            return year ? all.filter(c => c.year === year) : all;
        },

        async setCotisation(fields) {
            if (sb) {
                const { data, error } = await sb.from('cotisations')
                    .upsert(withClub(fields), { onConflict: 'member_id,year' }).select().single();
                sbThrow(error);
                return data;
            }
            const db = demoLoad();
            let c = db.cotisations.find(x => x.member_id === fields.member_id && x.year === fields.year);
            if (c) {
                Object.assign(c, fields);
            } else {
                c = withClub({ id: demoId('c'), ...fields });
                db.cotisations.push(c);
            }
            demoSave(db);
            return c;
        },

        // ----- Machines & maintenance -----

        async listMachines() {
            if (sb) {
                const { data, error } = await sb.from('machines').select('*').order('registration');
                sbThrow(error);
                return data;
            }
            const clubId = demoClubId();
            return demoLoad().machines
                .filter(m => m.club_id === clubId)
                .sort((a, b) => a.registration.localeCompare(b.registration));
        },

        async createMachine(fields) {
            if (sb) {
                const { data, error } = await sb.from('machines').insert(withClub(fields)).select().single();
                sbThrow(error);
                return data;
            }
            const db = demoLoad();
            const m = withClub({ id: demoId('m'), hours_total: 0, last_maintenance_hours: 0, maintenance_interval: 50, active: true, notes: '', ...fields });
            db.machines.push(m);
            demoSave(db);
            return m;
        },

        async updateMachine(id, fields) {
            if (sb) {
                const { data, error } = await sb.from('machines').update(fields).eq('id', id).select().single();
                sbThrow(error);
                return data;
            }
            const db = demoLoad();
            const m = db.machines.find(x => x.id === id);
            if (!m) throw new Error('Machine introuvable');
            Object.assign(m, fields);
            demoSave(db);
            return m;
        },

        async listMaintenance(machineId) {
            if (sb) {
                const { data, error } = await sb.from('maintenance_logs').select('*').eq('machine_id', machineId).order('date', { ascending: false });
                sbThrow(error);
                return data;
            }
            return demoLoad().maintenance_logs
                .filter(l => l.machine_id === machineId)
                .sort((a, b) => b.date.localeCompare(a.date));
        },

        async addMaintenance(fields) {
            if (sb) {
                const { data, error } = await sb.from('maintenance_logs').insert(fields).select().single();
                sbThrow(error);
                await sb.from('machines').update({ last_maintenance_hours: fields.hours_at_log }).eq('id', fields.machine_id);
                return data;
            }
            const db = demoLoad();
            const l = { id: demoId('l'), ...fields };
            db.maintenance_logs.push(l);
            const m = db.machines.find(x => x.id === fields.machine_id);
            if (m) m.last_maintenance_hours = fields.hours_at_log;
            demoSave(db);
            return l;
        },

        // ----- Réservations -----

        async listReservations() {
            if (sb) {
                const { data, error } = await sb.from('reservations').select(RESERVATION_SELECT).order('start_at');
                sbThrow(error);
                return data.map(flattenSbReservation);
            }
            const db = demoLoad();
            const clubId = demoClubId();
            return db.reservations
                .filter(r => r.club_id === clubId)
                .map(r => decorateReservation(r, db.machines, db.profiles))
                .sort((a, b) => a.start_at.localeCompare(b.start_at));
        },

        async hasConflict(machineId, startAt, endAt, excludeId) {
            const all = await this.listReservations();
            return all.some(r =>
                r.machine_id === machineId &&
                r.id !== excludeId &&
                r.status !== 'cancelled' &&
                overlap(startAt, endAt, r.start_at, r.end_at)
            );
        },

        async createReservation(fields) {
            if (await this.hasConflict(fields.machine_id, fields.start_at, fields.end_at)) {
                throw new Error('Conflit : la machine est déjà réservée sur ce créneau.');
            }
            if (sb) {
                const { data, error } = await sb.from('reservations')
                    .insert(withClub({ status: 'pending', ...fields })).select(RESERVATION_SELECT).single();
                sbThrow(error);
                return flattenSbReservation(data);
            }
            const db = demoLoad();
            const r = withClub({ id: demoId('r'), status: 'pending', actual_hours: null, remarks: '', instructor_id: null, ...fields });
            db.reservations.push(r);
            demoSave(db);
            return decorateReservation(r, db.machines, db.profiles);
        },

        async updateReservation(id, fields) {
            if (sb) {
                const { data, error } = await sb.from('reservations').update(fields).eq('id', id).select(RESERVATION_SELECT).single();
                sbThrow(error);
                return flattenSbReservation(data);
            }
            const db = demoLoad();
            const r = db.reservations.find(x => x.id === id);
            if (!r) throw new Error('Réservation introuvable');
            Object.assign(r, fields);
            demoSave(db);
            return decorateReservation(r, db.machines, db.profiles);
        },

        // Clôture d'un vol : heures réelles saisies, compteur machine incrémenté.
        // En mode Supabase l'incrément est fait par un trigger SQL (voir schema.sql).
        async closeReservation(id, actualHours) {
            const updated = await this.updateReservation(id, { status: 'completed', actual_hours: actualHours });
            if (!sb) {
                const db = demoLoad();
                const m = db.machines.find(x => x.id === updated.machine_id);
                if (m) {
                    m.hours_total = Math.round((Number(m.hours_total) + Number(actualHours)) * 10) / 10;
                    demoSave(db);
                }
            }
            return updated;
        },

        // ----- Baptêmes -----

        async listBaptemes() {
            if (sb) {
                const { data, error } = await sb.from('baptemes').select('*').order('slot_at');
                sbThrow(error);
                return data;
            }
            const clubId = demoClubId();
            return demoLoad().baptemes
                .filter(b => b.club_id === clubId)
                .sort((a, b) => a.slot_at.localeCompare(b.slot_at));
        },

        // Appelé depuis la page publique : autorisé sans connexion.
        // `fields.club_id` désigne le club auquel la demande est adressée.
        async createBapteme(fields) {
            if (sb) {
                const { data, error } = await sb.from('baptemes').insert(withClub({ status: 'pending', ...fields })).select().single();
                sbThrow(error);
                return data;
            }
            const db = demoLoad();
            const b = withClub({ id: demoId('b'), status: 'pending', pilot_id: null, machine_id: null, payment_ref: null, notes: '', ...fields });
            db.baptemes.push(b);
            demoSave(db);
            return b;
        },

        async updateBapteme(id, fields) {
            if (sb) {
                const { data, error } = await sb.from('baptemes').update(fields).eq('id', id).select().single();
                sbThrow(error);
                return data;
            }
            const db = demoLoad();
            const b = db.baptemes.find(x => x.id === id);
            if (!b) throw new Error('Baptême introuvable');
            Object.assign(b, fields);
            demoSave(db);
            return b;
        },

        // Réinitialise les données de démonstration (mode démo uniquement)
        resetDemo() {
            localStorage.removeItem(DEMO_KEY);
        }
    };

    window.DB = DB;
})();
