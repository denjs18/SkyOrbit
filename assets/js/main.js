// ============================================
// MAIN JAVASCRIPT - FONCTIONS COMMUNES
// ============================================
// Toutes les pages internes incluent (dans cet ordre) :
// config.js, le CDN supabase-js, db.js, puis main.js.
// Les scripts de page attendent window.appReady pour avoir la session.

// Résolu avec { userId, profile } une fois l'utilisateur identifié.
// Pose aussi window.CURRENT_USER et window.CURRENT_CLUB (club du membre).
window.appReady = (async function () {
    const path = window.location.pathname;
    const isPublicPage = path.endsWith('index.html')
        || path.endsWith('/')
        || path.endsWith('login.html')
        || path.includes('register-club')
        || path.includes('baptemes-public');

    let session = null;
    try {
        session = await DB.getSession();
    } catch (e) {
        console.error('Erreur de session:', e);
    }

    if (!session && !isPublicPage) {
        window.location.href = 'login.html';
        return null;
    }

    window.CURRENT_USER = session ? session.profile : null;

    // Première connexion : l'utilisateur doit configurer ses identifiants
    if (session && session.profile.must_change_password && !path.endsWith('setup-credentials.html')) {
        window.location.href = 'setup-credentials.html';
        return null;
    }

    window.CURRENT_CLUB = null;
    if (session && session.profile.club_id) {
        try {
            window.CURRENT_CLUB = await DB.getClub(session.profile.club_id);
        } catch (e) {
            console.error('Erreur de chargement du club:', e);
        }
    }
    return session;
})();

async function logout() {
    await DB.signOut();
    window.location.href = 'login.html';
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

// Affiche le nom de l'utilisateur connecté et applique les droits :
// les éléments marqués data-role="admin" ne sont visibles que pour le bureau.
function applySession(profile) {
    if (!profile) return;
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = profile.full_name;
    });
    if (profile.role !== 'admin') {
        document.querySelectorAll('[data-role="admin"]').forEach(el => {
            el.classList.add('d-none');
        });
    }
    // Le nom du club du membre s'affiche dans la barre latérale
    if (window.CURRENT_CLUB) {
        document.querySelectorAll('.sidebar-header h3').forEach(el => {
            el.innerHTML = 'SkyOrbit<br><small style="font-size:0.6em;font-weight:normal;opacity:0.8">'
                + escapeHtml(window.CURRENT_CLUB.name) + '</small>';
        });
    }
    // Compte sans club : tout est vide tant qu'un club ne l'a pas rattaché
    if (!profile.club_id) {
        const banner = document.createElement('div');
        banner.className = 'alert alert-info text-center mb-0 rounded-0 py-2';
        banner.innerHTML = '<i class="fas fa-info-circle"></i> Votre compte n\'est rattaché à aucun club : '
            + 'demandez à l\'administrateur de votre club de vous ajouter (avec cet email), '
            + 'ou <a href="register-club.html">créez votre club</a>.';
        document.body.prepend(banner);
    }
}

// Bandeau d'avertissement en mode démonstration (Supabase non configuré)
function showDemoBannerIfNeeded() {
    if (DB.mode !== 'demo') return;
    const banner = document.createElement('div');
    banner.className = 'alert alert-warning text-center mb-0 rounded-0 py-1';
    banner.style.fontSize = '0.85rem';
    banner.innerHTML = '<i class="fas fa-flask"></i> Mode démonstration : les données restent dans ce navigateur. '
        + 'Configurez Supabase dans <code>assets/js/config.js</code> pour passer en réel.';
    document.body.prepend(banner);
}

// Initialize tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Format Date
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format Time
function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Échappe le HTML des valeurs saisies par l'utilisateur avant insertion
// dans le DOM via innerHTML.
function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

// Show Success Toast
function showSuccessToast(message) {
    showToast(message, 'success');
}

// Show Error Toast
function showErrorToast(message) {
    showToast(message, 'danger');
}

// Show Info Toast
function showInfoToast(message) {
    showToast(message, 'info');
}

// Generic Toast Function
function showToast(message, type = 'info') {
    const toastContainer = getOrCreateToastContainer();

    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

function getOrCreateToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    return container;
}

// Confirm Dialog
function confirmDialog(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Loading Spinner
function showLoading() {
    const loadingHTML = `
        <div id="loadingOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Chargement...</span>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Handle responsive sidebar
function handleResize() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('show');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.btn-toggle');

    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('show')) {
        if (!sidebar.contains(event.target) && toggleBtn && !toggleBtn.contains(event.target)) {
            sidebar.classList.remove('show');
        }
    }
});

// Initialize on page load
window.addEventListener('load', async function() {
    const session = await window.appReady;
    applySession(session ? session.profile : null);
    showDemoBannerIfNeeded();
    initTooltips();
    handleResize();
});

window.addEventListener('resize', handleResize);

// Export functions globally
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showInfoToast = showInfoToast;
window.confirmDialog = confirmDialog;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.formatTime = formatTime;
