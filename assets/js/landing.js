// ============================================
// PAGE D'ACCUEIL PUBLIQUE - SkyOrbit
// ============================================
// Affiche l'annuaire public des clubs via DB.listClubs()
// (accessible sans connexion). Aucune donnée privée ici.
// Chaque club est rendu sous forme de « plaque technique » :
// code base en mono, nom de plateforme, ville, description, contact.

(function () {
    'use strict';

    // Échappe une valeur avant insertion dans innerHTML
    function escapeHtml(value) {
        if (value == null) return '';
        const div = document.createElement('div');
        div.textContent = String(value);
        return div.innerHTML;
    }

    // Bandeau technique « LF3177 · Toulouse Nord Fronton »
    function plateStrip(club) {
        const code = escapeHtml(club.base_code);
        const name = escapeHtml(club.base_name);
        let label;
        if (code && name) {
            label = `${code} · ${name}`;
        } else if (code || name) {
            label = code || name;
        } else {
            label = 'Plateforme non renseignée';
        }
        return `
            <div class="plate-strip">
                <i class="fas fa-tower-observation"></i>
                <span>${label}</span>
            </div>`;
    }

    function clubCard(club) {
        return `
            <div class="col-md-6 col-lg-4">
                <div class="club-plate">
                    ${plateStrip(club)}
                    <div class="plate-body">
                        <h3>${escapeHtml(club.name)}</h3>
                        ${club.city ? `
                        <p class="club-city">
                            <i class="fas fa-location-dot"></i>${escapeHtml(club.city)}
                        </p>` : ''}
                        ${club.description ? `
                        <p class="club-desc">${escapeHtml(club.description)}</p>` : ''}
                        <div class="plate-foot">
                            ${club.contact_email ? `
                            <span class="club-contact">
                                <i class="fas fa-envelope"></i>
                                <a href="mailto:${escapeHtml(club.contact_email)}">${escapeHtml(club.contact_email)}</a>
                            </span>` : '<span></span>'}
                            <a href="login.html" class="btn btn-outline-secondary btn-sm">
                                <i class="fas fa-right-to-bracket me-1"></i> Se connecter
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    async function loadClubs() {
        const container = document.getElementById('clubsList');
        if (!container) return;
        try {
            const clubs = await DB.listClubs();
            if (!clubs || !clubs.length) {
                container.innerHTML = `
                    <div class="col-12 clubs-note">
                        <p class="mb-0">Aucun club enregistré pour l'instant. Soyez le premier !</p>
                    </div>`;
                return;
            }
            container.innerHTML = clubs.map(clubCard).join('');
        } catch (err) {
            container.innerHTML = `
                <div class="col-12 clubs-note">
                    <p class="mb-0">
                        <i class="fas fa-circle-exclamation me-1"></i>
                        Impossible de charger la liste des clubs pour le moment.
                    </p>
                </div>`;
        }
    }

    document.addEventListener('DOMContentLoaded', loadClubs);
})();
