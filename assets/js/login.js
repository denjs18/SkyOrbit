// ============================================
// LOGIN PAGE JAVASCRIPT
// ============================================

// Cookie Management
function checkCookieConsent() {
    const consent = getCookie('cookieConsent');
    if (!consent) {
        const cookieModal = new bootstrap.Modal(document.getElementById('cookieModal'));
        cookieModal.show();
    }
}

function acceptCookies() {
    setCookie('cookieConsent', 'accepted', 365);
    bootstrap.Modal.getInstance(document.getElementById('cookieModal')).hide();
}

function refuseCookies() {
    setCookie('cookieConsent', 'refused', 365);
    bootstrap.Modal.getInstance(document.getElementById('cookieModal')).hide();
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Comptes de démonstration (mode démo uniquement)
function fillDemo(role) {
    const demoUsers = {
        admin:      { username: 'admin',        password: 'admin123' },
        instructor: { username: 'jean.moreau',  password: 'inst123'  },
        pilot:      { username: 'marc.leroy',   password: 'pilot123' }
    };

    if (demoUsers[role]) {
        document.getElementById('username').value = demoUsers[role].username;
        document.getElementById('password').value = demoUsers[role].password;
    }
}

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const btn = this.querySelector('button[type="submit"]');

    if (!username || !password) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Connexion...';

    try {
        await DB.signIn(username, password);

        if (rememberMe) {
            setCookie('rememberUser', username, 30);
        }

        btn.innerHTML = '<i class="fas fa-check"></i> Connexion réussie !';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        showErrorToast(err.message || 'Connexion impossible');
    }
});

// Auto-fill if remembered
window.addEventListener('load', function() {
    const rememberedUser = getCookie('rememberUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('rememberMe').checked = true;
    }

    // Les comptes de démonstration n'existent qu'en mode démo
    if (DB.mode !== 'demo') {
        document.querySelectorAll('.demo-access, [data-demo-only]').forEach(el => el.classList.add('d-none'));
    }

    // Check cookie consent
    setTimeout(checkCookieConsent, 1000);
});

// Focus on username field
document.getElementById('username').focus();
