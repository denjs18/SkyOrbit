// ============================================
// DASHBOARD PAGE JAVASCRIPT
// ============================================

function isSameDay(iso, ref) {
    const a = new Date(iso);
    return a.getFullYear() === ref.getFullYear()
        && a.getMonth() === ref.getMonth()
        && a.getDate() === ref.getDate();
}

function statusBadge(status) {
    const map = {
        confirmed: '<span class="badge bg-success">Confirmée</span>',
        pending: '<span class="badge bg-warning">En attente</span>',
        cancelled: '<span class="badge bg-danger">Annulée</span>',
        completed: '<span class="badge bg-secondary">Effectuée</span>'
    };
    return map[status] || '';
}

async function loadDashboard() {
    const [reservations, machines, members, baptemes] = await Promise.all([
        DB.listReservations(),
        DB.listMachines(),
        DB.listMembers(),
        DB.listBaptemes()
    ]);

    const now = new Date();
    const todays = reservations.filter(r => r.status !== 'cancelled' && isSameDay(r.start_at, now));
    const upcomingBaptemes = baptemes.filter(b => b.status !== 'cancelled' && b.status !== 'done' && new Date(b.slot_at) >= now);

    document.getElementById('statReservationsToday').textContent = todays.length;
    document.getElementById('statMachines').textContent = machines.filter(m => m.active).length;
    document.getElementById('statMembers').textContent = members.filter(m => m.active).length;
    document.getElementById('statBaptemes').textContent = upcomingBaptemes.length;

    renderTodayReservations(todays);
    renderAlerts({ machines, members, baptemes });
}

function renderTodayReservations(todays) {
    const container = document.getElementById('todayReservations');
    if (!todays.length) {
        container.innerHTML = '<p class="text-muted mb-0">Aucune réservation aujourd\'hui.</p>';
        return;
    }
    container.innerHTML = todays.map(r => `
        <div class="reservation-item">
            <div class="time">${formatTime(r.start_at)} - ${formatTime(r.end_at)}</div>
            <div class="details">
                <strong>${escapeHtml(r.machine_registration)}</strong> - ${escapeHtml(r.member_name)}
            </div>
            ${statusBadge(r.status)}
        </div>
    `).join('');
}

// Alertes : licences/visites médicales qui expirent, maintenances dues,
// baptêmes en attente de traitement.
function renderAlerts({ machines, members, baptemes }) {
    const alerts = [];
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 60);

    const isAdmin = window.CURRENT_USER && window.CURRENT_USER.role === 'admin';
    const visibleMembers = isAdmin ? members : members.filter(m => window.CURRENT_USER && m.id === window.CURRENT_USER.id);

    visibleMembers.forEach(m => {
        if (!m.active) return;
        [['license_expiry', 'Licence'], ['medical_expiry', 'Visite médicale']].forEach(([field, label]) => {
            if (!m[field]) return;
            const exp = new Date(m[field]);
            if (exp < now) {
                alerts.push({ type: 'danger', icon: 'id-card', text: `${label} de ${m.full_name} expirée depuis le ${formatDate(exp)}` });
            } else if (exp < soon) {
                alerts.push({ type: 'warning', icon: 'id-card', text: `${label} de ${m.full_name} expire le ${formatDate(exp)}` });
            }
        });
    });

    machines.forEach(m => {
        if (!m.active) return;
        const sinceMaintenance = Number(m.hours_total) - Number(m.last_maintenance_hours);
        const remaining = Number(m.maintenance_interval) - sinceMaintenance;
        if (remaining <= 0) {
            alerts.push({ type: 'danger', icon: 'wrench', text: `${m.registration} : visite d'entretien dépassée (${Math.abs(remaining).toFixed(1)} h au-delà du potentiel)` });
        } else if (remaining <= 10) {
            alerts.push({ type: 'warning', icon: 'wrench', text: `${m.registration} : visite d'entretien dans ${remaining.toFixed(1)} h de vol` });
        }
    });

    if (isAdmin) {
        const pending = baptemes.filter(b => b.status === 'pending');
        if (pending.length) {
            alerts.push({ type: 'info', icon: 'ticket-alt', text: `${pending.length} demande(s) de baptême en attente de traitement` });
        }
    }

    const container = document.getElementById('alertsList');
    if (!alerts.length) {
        container.innerHTML = '<p class="text-success mb-0"><i class="fas fa-check-circle"></i> Aucune alerte, tout est en ordre.</p>';
        return;
    }
    container.innerHTML = alerts.map(a => `
        <div class="alert alert-${a.type} py-2 mb-2">
            <i class="fas fa-${a.icon}"></i> ${escapeHtml(a.text)}
        </div>
    `).join('');

    const badge = document.querySelector('.btn-notification .badge');
    if (badge) {
        badge.textContent = alerts.length;
        badge.style.display = alerts.length ? 'block' : 'none';
    }
    const menu = document.getElementById('notificationsMenu');
    if (menu) {
        menu.innerHTML = '<li><h6 class="dropdown-header">Notifications</h6></li>'
            + alerts.slice(0, 6).map(a => `<li><span class="dropdown-item small">${escapeHtml(a.text)}</span></li>`).join('');
    }
}

// Animate stat cards on load
function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Initialize on page load
window.addEventListener('load', async function() {
    const session = await window.appReady;
    if (!session) return;

    animateStatCards();

    try {
        await loadDashboard();
    } catch (e) {
        console.error(e);
        showErrorToast('Impossible de charger le tableau de bord : ' + e.message);
    }
});
