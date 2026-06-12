// ============================================
// CRÉATION DE CLUB - SkyOrbit
// ============================================
// Page publique en deux étapes :
//  1. création de compte (ou connexion à un compte existant)
//  2. création du club, dont l'utilisateur devient l'administrateur

(function () {
    'use strict';

    // ---------- Helpers ----------

    function $(id) {
        return document.getElementById(id);
    }

    // Échappe les valeurs utilisateur avant injection dans innerHTML
    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Affiche une alerte Bootstrap (type : success, danger, info, warning)
    function showAlert(type, html) {
        $('alertBox').innerHTML =
            '<div class="alert alert-' + type + '" role="alert">' + html + '</div>';
    }

    function clearAlert() {
        $('alertBox').innerHTML = '';
    }

    // Désactive un bouton et affiche un spinner pendant une requête
    function setLoading(btn, loading) {
        if (loading) {
            btn.dataset.originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Veuillez patienter…';
        } else {
            btn.disabled = false;
            if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
        }
    }

    // ---------- Aiguillage entre les étapes ----------

    function showAlreadyMember() {
        $('stepAccount').classList.add('d-none');
        $('stepClub').classList.add('d-none');
        $('alreadyMember').classList.remove('d-none');
        showAlert('info', '<i class="fas fa-circle-info"></i> Vous êtes déjà membre d\'un club.');
    }

    function showStepClub(fullName) {
        $('stepAccount').classList.add('d-none');
        $('alreadyMember').classList.add('d-none');
        $('stepClub').classList.remove('d-none');
        if (fullName) {
            $('connectedBanner').innerHTML =
                '<div class="alert alert-success"><i class="fas fa-circle-check"></i> Connecté en tant que <strong>' +
                escapeHtml(fullName) + '</strong></div>';
        } else {
            $('connectedBanner').innerHTML = '';
        }
        const clubName = $('clubName');
        if (clubName) clubName.focus();
    }

    function showStepAccount() {
        $('stepClub').classList.add('d-none');
        $('alreadyMember').classList.add('d-none');
        $('stepAccount').classList.remove('d-none');
    }

    // Après connexion ou inscription : club déjà existant ? → message ; sinon étape 2
    function routeAfterAuth(profile) {
        if (profile && profile.club_id) {
            showAlreadyMember();
        } else {
            showStepClub(profile ? profile.full_name : null);
        }
    }

    // ---------- Initialisation ----------

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const session = await DB.getSession();
            if (session && session.profile && session.profile.club_id) {
                showAlreadyMember();
            } else if (session && session.profile) {
                showStepClub(session.profile.full_name);
            } else {
                showStepAccount();
            }
        } catch (err) {
            showStepAccount();
            showAlert('danger', '<i class="fas fa-triangle-exclamation"></i> ' + escapeHtml(err.message || 'Erreur inattendue'));
        }

        // Lien "J'ai déjà un compte → me connecter"
        $('toggleLogin').addEventListener('click', (e) => {
            e.preventDefault();
            const form = $('loginForm');
            form.classList.toggle('d-none');
            if (!form.classList.contains('d-none')) $('loginEmail').focus();
        });

        // ----- Étape 1 : création de compte -----

        $('accountForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert();
            const btn = $('signupBtn');
            const fullName = $('signupFullName').value.trim();
            const email = $('signupEmail').value.trim();
            const password = $('signupPassword').value;

            if (password.length < 8) {
                showAlert('danger', '<i class="fas fa-triangle-exclamation"></i> Le mot de passe doit contenir au moins 8 caractères.');
                return;
            }

            setLoading(btn, true);
            try {
                const result = await DB.signUp(email, password, fullName);
                if (result && result.needsConfirmation) {
                    showAlert('success',
                        '<i class="fas fa-envelope-circle-check"></i> Compte créé ! Confirmez votre email via le lien reçu, ' +
                        'puis revenez sur cette page et connectez-vous pour créer votre club.');
                } else {
                    showAlert('success', '<i class="fas fa-circle-check"></i> Compte créé ! Vous pouvez maintenant créer votre club.');
                    showStepClub(fullName);
                }
            } catch (err) {
                showAlert('danger', '<i class="fas fa-triangle-exclamation"></i> ' + escapeHtml(err.message || 'Erreur lors de la création du compte'));
            } finally {
                setLoading(btn, false);
            }
        });

        // ----- Étape 1 bis : connexion à un compte existant -----

        $('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert();
            const btn = $('loginBtn');
            const email = $('loginEmail').value.trim();
            const password = $('loginPassword').value;

            setLoading(btn, true);
            try {
                const profile = await DB.signIn(email, password);
                routeAfterAuth(profile);
            } catch (err) {
                showAlert('danger', '<i class="fas fa-triangle-exclamation"></i> ' + escapeHtml(err.message || 'Erreur de connexion'));
            } finally {
                setLoading(btn, false);
            }
        });

        // ----- Étape 2 : création du club -----

        $('clubForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert();
            const btn = $('clubBtn');

            const latRaw = $('latitude').value.trim();
            const lonRaw = $('longitude').value.trim();

            const fields = {
                name: $('clubName').value.trim(),
                base_code: $('baseCode').value.trim(),
                base_name: $('baseName').value.trim(),
                city: $('city').value.trim(),
                latitude: latRaw === '' ? null : Number(latRaw),
                longitude: lonRaw === '' ? null : Number(lonRaw),
                description: $('description').value.trim(),
                contact_email: $('contactEmail').value.trim()
            };

            setLoading(btn, true);
            try {
                await DB.createClub(fields);
                showAlert('success',
                    '<i class="fas fa-circle-check"></i> Club créé avec succès ! Redirection vers votre tableau de bord…');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
            } catch (err) {
                setLoading(btn, false);
                showAlert('danger', '<i class="fas fa-triangle-exclamation"></i> ' + escapeHtml(err.message || 'Erreur lors de la création du club'));
            }
        });
    });
})();
