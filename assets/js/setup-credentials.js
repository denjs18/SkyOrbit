// ============================================
// SETUP CREDENTIALS — Première connexion
// ============================================

window.addEventListener('load', async function () {
    const session = await window.appReady;
    if (!session) return; // main.js a redirigé vers login si pas de session

    const profile = session.profile;

    // Pré-remplissage de l'identifiant avec le nom du membre si pas déjà configuré
    const usernameInput = document.getElementById('newUsername');
    if (profile.username) {
        usernameInput.value = profile.username;
    } else if (profile.full_name) {
        // Suggestion : prénom.nom en minuscules, sans accents ni espaces
        const suggestion = profile.full_name
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '') // retirer accents
            .replace(/\s+/g, '.')
            .replace(/[^a-z0-9._-]/g, '');
        usernameInput.value = suggestion;
    }

    // Message de bienvenue personnalisé
    if (profile.full_name) {
        document.getElementById('welcomeMessage').textContent =
            `Bonjour ${profile.full_name} ! Choisissez vos identifiants de connexion.`;
    }

    // Afficher / masquer le mot de passe
    document.getElementById('togglePwd').addEventListener('click', function () {
        const pwd = document.getElementById('newPassword');
        const isText = pwd.type === 'text';
        pwd.type = isText ? 'password' : 'text';
        this.querySelector('i').className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    // Soumission du formulaire
    document.getElementById('setupForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('newUsername').value.trim().toLowerCase();
        const password = document.getElementById('newPassword').value;
        const confirm  = document.getElementById('confirmPassword').value;
        const confirmEl = document.getElementById('confirmPassword');
        const btn = this.querySelector('button[type="submit"]');

        // Validation
        if (!this.checkValidity()) {
            this.classList.add('was-validated');
            return;
        }

        if (password !== confirm) {
            confirmEl.classList.add('is-invalid');
            document.getElementById('confirmError').style.display = 'block';
            return;
        }
        confirmEl.classList.remove('is-invalid');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enregistrement…';

        try {
            await DB.changeCredentials(username, password);
            btn.innerHTML = '<i class="fas fa-check"></i> Succès !';
            btn.classList.replace('btn-primary', 'btn-success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Enregistrer et accéder au tableau de bord';

            const container = document.querySelector('.login-card');
            const existing = container.querySelector('.alert-danger');
            if (existing) existing.remove();
            const alert = document.createElement('div');
            alert.className = 'alert alert-danger py-2 mb-3';
            alert.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (err.message || 'Erreur lors de l\'enregistrement');
            document.getElementById('setupForm').before(alert);
        }
    });

    // Effacer l'erreur de confirmation au changement
    document.getElementById('confirmPassword').addEventListener('input', function () {
        this.classList.remove('is-invalid');
    });
});
