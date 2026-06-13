// ============================================================
// Fonction serveur (Vercel) — création / réinitialisation du compte
// de connexion d'un membre par l'administrateur du club.
// ============================================================
// Variables d'environnement requises :
//   SUPABASE_URL             — URL du projet Supabase
//   SUPABASE_SERVICE_ROLE_KEY — clé service (jamais exposée au navigateur)
//
// Flux :
//   1. L'admin envoie { email, tempPassword, fullName } + son JWT Supabase.
//   2. L'API valide le JWT, vérifie que l'appelant est bien admin du club.
//   3. Si le membre a déjà un user_id dans profiles → mise à jour du mot
//      de passe uniquement (PUT /auth/v1/admin/users/{id}).
//   4. Sinon → création du compte (POST /auth/v1/admin/users) ; le trigger
//      handle_new_user lie automatiquement le compte à la fiche existante.

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    if (!SERVICE_KEY || !SUPABASE_URL) {
        res.status(503).json({ error: 'Configuration serveur incomplète (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)' });
        return;
    }

    // Vérification du JWT de l'appelant
    const authHeader = req.headers['authorization'] || '';
    const userJwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!userJwt) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
    }

    const adminHeaders = {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json'
    };

    // Valider le JWT utilisateur
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${userJwt}`, 'apikey': SERVICE_KEY }
    });
    if (!userResp.ok) {
        res.status(401).json({ error: 'Token invalide' });
        return;
    }
    const authUser = await userResp.json();

    // Vérifier que l'appelant est admin
    const profileResp = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${authUser.id}&select=role,club_id`,
        { headers: adminHeaders }
    );
    if (!profileResp.ok) {
        res.status(401).json({ error: 'Profil introuvable' });
        return;
    }
    const callerProfiles = await profileResp.json();
    const caller = callerProfiles[0];
    if (!caller || caller.role !== 'admin') {
        res.status(403).json({ error: 'Accès réservé au bureau du club' });
        return;
    }

    const { email, tempPassword, fullName } = req.body || {};
    if (!email || !tempPassword) {
        res.status(400).json({ error: 'email et tempPassword sont requis' });
        return;
    }

    // Chercher si le membre (du même club) a déjà un compte auth
    const memberResp = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&club_id=eq.${caller.club_id}&select=user_id,email`,
        { headers: adminHeaders }
    );
    const memberProfiles = memberResp.ok ? await memberResp.json() : [];
    const existingUserId = memberProfiles[0]?.user_id;

    if (existingUserId) {
        // Le membre a déjà un compte : réinitialisation du mot de passe uniquement
        const upResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingUserId}`, {
            method: 'PUT',
            headers: adminHeaders,
            body: JSON.stringify({ password: tempPassword })
        });
        if (!upResp.ok) {
            const err = await upResp.json().catch(() => ({}));
            res.status(400).json({ error: err.message || 'Erreur lors de la mise à jour du mot de passe' });
            return;
        }
        res.status(200).json({ success: true, existed: true });
        return;
    }

    // Créer un nouveau compte auth ; le trigger handle_new_user le lie à la fiche
    const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: fullName || '' }
        })
    });
    if (!createResp.ok) {
        const err = await createResp.json().catch(() => ({}));
        res.status(400).json({ error: err.message || err.msg || 'Erreur lors de la création du compte' });
        return;
    }
    res.status(200).json({ success: true, existed: false });
};
