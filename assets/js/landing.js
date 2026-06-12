// ============================================
// PAGE D'ACCUEIL PUBLIQUE - SkyOrbit
// ============================================
// Affiche l'annuaire public des clubs via DB.listClubs()
// (accessible sans connexion). Aucune donnée privée ici.

(function () {
    'use strict';

    // Échappe une valeur avant insertion dans innerHTML
    function escapeHtml(value) {
        if (value == null) return '';
        const div = document.createElement('div');
        div.textContent = String(value);
        return div.innerHTML;
    }

    function clubCard(club) {
        const base = [club.base_code, club.base_name].filter(Boolean).join(' — ');
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card club-card">
                    <div class="card-body p-4">
                        <h3 class="h5 card-title mb-3">
                            <i class="fas fa-plane-departure me-1"></i> ${escapeHtml(club.name)}
                        </h3>
                        ${base ? `
                        <p class="mb-2 text-muted">
                            <i class="fas fa-tower-observation me-1"></i> ${escapeHtml(base)}
                        </p>` : ''}
                        ${club.city ? `
                        <p class="mb-2 text-muted">
                            <i class="fas fa-location-dot me-1"></i> ${escapeHtml(club.city)}
                        </p>` : ''}
                        ${club.description ? `
                        <p class="card-text">${escapeHtml(club.description)}</p>` : ''}
                        ${club.contact_email ? `
                        <p class="mb-0">
                            <i class="fas fa-envelope me-1"></i>
                            <a href="mailto:${escapeHtml(club.contact_email)}">${escapeHtml(club.contact_email)}</a>
                        </p>` : ''}
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
                    <div class="col-12 text-center text-muted">
                        <p class="lead mb-0">Aucun club enregistré pour l'instant. Soyez le premier !</p>
                    </div>`;
                return;
            }
            container.innerHTML = clubs.map(clubCard).join('');
        } catch (err) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted">
                    <p class="mb-0">
                        <i class="fas fa-circle-exclamation me-1"></i>
                        Impossible de charger la liste des clubs pour le moment.
                    </p>
                </div>`;
        }
    }

    document.addEventListener('DOMContentLoaded', loadClubs);
})();
