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

// Demo Access
function fillDemo(role) {
    const demoUsers = {
        admin: { username: 'admin@ulm-club.fr', password: 'admin123' },
        instructor: { username: 'instructeur@ulm-club.fr', password: 'inst123' },
        pilot: { username: 'pilote@ulm-club.fr', password: 'pilot123' }
    };

    if (demoUsers[role]) {
        document.getElementById('username').value = demoUsers[role].username;
        document.getElementById('password').value = demoUsers[role].password;
    }
}

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Simulation de connexion
    if (username && password) {
        // Stockage des informations de session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('userRole', getUserRole(username));

        if (rememberMe) {
            setCookie('rememberUser', username, 30);
        }

        // Animation de succès
        const btn = this.querySelector('button[type="submit"]');
        btn.innerHTML = '<i class="fas fa-check"></i> Connexion réussie !';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');

        // Redirection vers le dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }
});

function getUserRole(username) {
    if (username.includes('admin')) return 'admin';
    if (username.includes('instructeur')) return 'instructor';
    return 'pilot';
}

// Auto-fill if remembered
window.addEventListener('load', function() {
    const rememberedUser = getCookie('rememberUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('rememberMe').checked = true;
    }

    // Check cookie consent
    setTimeout(checkCookieConsent, 1000);
});

// Focus on username field
document.getElementById('username').focus();
