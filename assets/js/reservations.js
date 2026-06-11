// ============================================
// RESERVATIONS PAGE JAVASCRIPT
// ============================================
// Règles (cf. CAHIER_DES_CHARGES.md) :
//  - tout membre crée une réservation pour lui-même, en statut "en attente"
//  - seul le bureau (admin) valide, clôture ou réserve pour un tiers
//  - un membre peut annuler sa réservation tant qu'elle est en attente

let calendar;
let machines = [];
let members = [];
let reservations = [];

function isAdmin() {
    return window.CURRENT_USER && window.CURRENT_USER.role === 'admin';
}

// ---------- Chargement ----------

async function loadData() {
    [machines, members, reservations] = await Promise.all([
        DB.listMachines(),
        DB.listMembers(),
        DB.listReservations()
    ]);
    populateSelects();
    renderAll();
}

async function refreshReservations() {
    reservations = await DB.listReservations();
    renderAll();
}

function renderAll() {
    if (calendar) {
        calendar.removeAllEvents();
        calendar.addEventSource(getCalendarEvents());
    }
    renderList();
    renderTimeline();
}

function populateSelects() {
    const activeMachines = machines.filter(m => m.active);
    const machineOptions = activeMachines.map(m =>
        `<option value="${m.id}">${escapeHtml(m.registration)} (${escapeHtml(m.model)})</option>`).join('');
    document.getElementById('resMachine').innerHTML = '<option value="">Sélectionner une machine</option>' + machineOptions;
    document.getElementById('filterMachine').innerHTML = '<option value="">Toutes les machines</option>' + machineOptions;

    const memberSelect = document.getElementById('resMember');
    if (isAdmin()) {
        memberSelect.innerHTML = members.filter(m => m.active).map(m =>
            `<option value="${m.id}">${escapeHtml(m.full_name)}</option>`).join('');
        memberSelect.value = window.CURRENT_USER.id;
    } else {
        // Un membre ne réserve que pour lui-même
        memberSelect.innerHTML = `<option value="${window.CURRENT_USER.id}">${escapeHtml(window.CURRENT_USER.full_name)}</option>`;
        memberSelect.disabled = true;
    }

    const instructors = members.filter(m => m.active && (m.role === 'instructor' || m.role === 'admin'));
    document.getElementById('resInstructor').innerHTML = '<option value="">Pas d\'instructeur</option>'
        + instructors.map(m => `<option value="${m.id}">${escapeHtml(m.full_name)}</option>`).join('');
}

// ---------- Vue calendrier ----------

function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
        },
        events: [],
        eventClick: function(info) {
            showReservationDetails(info.event.id);
        },
        dateClick: function(info) {
            openNewReservationModal(info.date);
        },
        height: 'auto'
    });

    calendar.render();
}

function getCalendarEvents() {
    return reservations
        .filter(r => r.status !== 'cancelled')
        .map(r => ({
            id: r.id,
            title: `${r.machine_registration} - ${r.member_name}`,
            start: r.start_at,
            end: r.end_at,
            backgroundColor: getStatusColor(r.status),
            borderColor: getStatusColor(r.status)
        }));
}

function getStatusColor(status) {
    const colors = {
        confirmed: '#10b981',
        pending: '#f59e0b',
        cancelled: '#ef4444',
        completed: '#64748b'
    };
    return colors[status] || '#64748b';
}

function getStatusBadge(status) {
    const badges = {
        confirmed: '<span class="badge bg-success">Confirmée</span>',
        pending: '<span class="badge bg-warning">En attente</span>',
        cancelled: '<span class="badge bg-danger">Annulée</span>',
        completed: '<span class="badge bg-secondary">Effectuée</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Inconnu</span>';
}

function getTypeBadge(type) {
    const badges = {
        libre: '<span class="badge bg-primary">Vol libre</span>',
        formation: '<span class="badge bg-info">Formation</span>',
        bapteme: '<span class="badge bg-warning">Baptême</span>',
        maintenance: '<span class="badge bg-secondary">Maintenance</span>'
    };
    return badges[type] || '<span class="badge bg-secondary">Autre</span>';
}

// ---------- Vue liste ----------

function filteredReservations() {
    const machine = document.getElementById('filterMachine').value;
    const status = document.getElementById('filterStatus').value;
    const pilot = document.getElementById('filterPilot').value.trim().toLowerCase();

    return reservations.filter(r =>
        (!machine || r.machine_id === machine) &&
        (!status || r.status === status) &&
        (!pilot || r.member_name.toLowerCase().includes(pilot))
    );
}

function renderList() {
    const tbody = document.getElementById('reservationsList');
    const rows = filteredReservations();

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-muted text-center">Aucune réservation</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${formatDate(r.start_at)}</td>
            <td>${formatTime(r.start_at)} - ${formatTime(r.end_at)}</td>
            <td>${escapeHtml(r.machine_registration)}</td>
            <td>${escapeHtml(r.member_name)}</td>
            <td>${getTypeBadge(r.flight_type)}</td>
            <td>${getStatusBadge(r.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="showReservationDetails('${r.id}')" title="Détails">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ---------- Vue planning du jour ----------

function renderTimeline() {
    const dateInput = document.getElementById('timelineDate');
    const container = document.getElementById('timelineContent');
    if (!dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    const day = dateInput.value;

    const dayReservations = reservations.filter(r =>
        r.status !== 'cancelled' && r.start_at.startsWith(day)
    );

    const activeMachines = machines.filter(m => m.active);
    if (!activeMachines.length) {
        container.innerHTML = '<p class="text-muted">Aucune machine enregistrée.</p>';
        return;
    }

    container.innerHTML = activeMachines.map(m => {
        const slots = dayReservations
            .filter(r => r.machine_id === m.id)
            .sort((a, b) => a.start_at.localeCompare(b.start_at))
            .map(r => `
                <button class="btn btn-sm me-2 mb-1 text-white" style="background:${getStatusColor(r.status)}"
                        onclick="showReservationDetails('${r.id}')">
                    ${formatTime(r.start_at)}-${formatTime(r.end_at)} ${escapeHtml(r.member_name)}
                </button>
            `).join('');
        return `
            <div class="d-flex align-items-start border-bottom py-2">
                <strong style="min-width: 110px;">${escapeHtml(m.registration)}</strong>
                <div>${slots || '<span class="text-muted">Disponible toute la journée</span>'}</div>
            </div>
        `;
    }).join('');
}

// ---------- Détails / actions ----------

function showReservationDetails(reservationId) {
    const r = reservations.find(x => x.id == reservationId);
    if (!r) return;

    const mine = window.CURRENT_USER && r.member_id === window.CURRENT_USER.id;
    const canValidate = isAdmin() && r.status === 'pending';
    const canCancel = r.status === 'pending' && (mine || isAdmin()) || (isAdmin() && r.status === 'confirmed');
    const canClose = isAdmin() && r.status === 'confirmed';

    const modalContent = `
        <div class="modal fade" id="reservationDetailsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Détails de la réservation</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-4">Date</dt>
                            <dd class="col-sm-8">${formatDate(r.start_at)}</dd>
                            <dt class="col-sm-4">Horaire</dt>
                            <dd class="col-sm-8">${formatTime(r.start_at)} - ${formatTime(r.end_at)}</dd>
                            <dt class="col-sm-4">Machine</dt>
                            <dd class="col-sm-8">${escapeHtml(r.machine_registration)}</dd>
                            <dt class="col-sm-4">Pilote</dt>
                            <dd class="col-sm-8">${escapeHtml(r.member_name)}</dd>
                            <dt class="col-sm-4">Type</dt>
                            <dd class="col-sm-8">${getTypeBadge(r.flight_type)}</dd>
                            ${r.instructor_name ? `
                                <dt class="col-sm-4">Instructeur</dt>
                                <dd class="col-sm-8">${escapeHtml(r.instructor_name)}</dd>
                            ` : ''}
                            <dt class="col-sm-4">Statut</dt>
                            <dd class="col-sm-8">${getStatusBadge(r.status)}</dd>
                            ${r.actual_hours ? `
                                <dt class="col-sm-4">Heures de vol</dt>
                                <dd class="col-sm-8">${r.actual_hours} h</dd>
                            ` : ''}
                            ${r.remarks ? `
                                <dt class="col-sm-4">Remarques</dt>
                                <dd class="col-sm-8">${escapeHtml(r.remarks)}</dd>
                            ` : ''}
                        </dl>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        ${canValidate ? `
                            <button type="button" class="btn btn-success" onclick="validateReservation('${r.id}')">
                                <i class="fas fa-check"></i> Valider
                            </button>
                        ` : ''}
                        ${canClose ? `
                            <button type="button" class="btn btn-primary" onclick="closeReservation('${r.id}')">
                                <i class="fas fa-flag-checkered"></i> Clôturer le vol
                            </button>
                        ` : ''}
                        ${canCancel ? `
                            <button type="button" class="btn btn-danger" onclick="cancelReservation('${r.id}')">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('reservationDetailsModal');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    new bootstrap.Modal(document.getElementById('reservationDetailsModal')).show();
}

function hideDetailsModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('reservationDetailsModal'));
    if (modal) modal.hide();
}

async function validateReservation(id) {
    try {
        showLoading();
        await DB.updateReservation(id, { status: 'confirmed' });
        await refreshReservations();
        hideDetailsModal();
        showSuccessToast('Réservation validée');
    } catch (e) {
        showErrorToast(e.message);
    } finally {
        hideLoading();
    }
}

async function cancelReservation(id) {
    confirmDialog('Êtes-vous sûr de vouloir annuler cette réservation ?', async () => {
        try {
            showLoading();
            await DB.updateReservation(id, { status: 'cancelled' });
            await refreshReservations();
            hideDetailsModal();
            showSuccessToast('Réservation annulée');
        } catch (e) {
            showErrorToast(e.message);
        } finally {
            hideLoading();
        }
    });
}

async function closeReservation(id) {
    const input = prompt('Heures de vol réellement effectuées (ex: 1.5) :');
    if (input === null) return;
    const hours = parseFloat(String(input).replace(',', '.'));
    if (isNaN(hours) || hours <= 0 || hours > 24) {
        showErrorToast('Nombre d\'heures invalide');
        return;
    }
    try {
        showLoading();
        await DB.closeReservation(id, hours);
        await refreshReservations();
        hideDetailsModal();
        showSuccessToast('Vol clôturé, compteur machine mis à jour');
    } catch (e) {
        showErrorToast(e.message);
    } finally {
        hideLoading();
    }
}

// ---------- Création ----------

function openNewReservationModal(date = null) {
    const modal = document.getElementById('newReservationModal');
    if (!modal) return;

    if (date) {
        document.getElementById('resDate').value = date.toISOString().split('T')[0];
    }

    bootstrap.Modal.getOrCreateInstance(modal).show();
}

async function saveReservation() {
    const form = document.getElementById('newReservationForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const date = document.getElementById('resDate').value;
    const start = document.getElementById('resStart').value;
    const end = document.getElementById('resEnd').value;

    if (end <= start) {
        showErrorToast('L\'heure de fin doit être après l\'heure de début');
        return;
    }

    const fields = {
        machine_id: document.getElementById('resMachine').value,
        member_id: document.getElementById('resMember').value,
        instructor_id: document.getElementById('resInstructor').value || null,
        start_at: new Date(`${date}T${start}`).toISOString(),
        end_at: new Date(`${date}T${end}`).toISOString(),
        flight_type: document.getElementById('resType').value,
        remarks: document.getElementById('resRemarks').value.trim()
    };

    try {
        showLoading();
        await DB.createReservation(fields);
        await refreshReservations();
        bootstrap.Modal.getInstance(document.getElementById('newReservationModal')).hide();
        form.reset();
        if (!isAdmin()) {
            document.getElementById('resMember').value = window.CURRENT_USER.id;
        }
        showSuccessToast('Réservation enregistrée, en attente de validation par le bureau');
    } catch (e) {
        showErrorToast(e.message);
    } finally {
        hideLoading();
    }
}

function applyFilters() {
    renderList();
}

// Export functions
window.saveReservation = saveReservation;
window.validateReservation = validateReservation;
window.cancelReservation = cancelReservation;
window.closeReservation = closeReservation;
window.showReservationDetails = showReservationDetails;
window.applyFilters = applyFilters;

// Initialize on page load
window.addEventListener('load', async function() {
    const session = await window.appReady;
    if (!session) return;

    initCalendar();

    document.getElementById('timelineDate').addEventListener('change', renderTimeline);
    document.getElementById('filterPilot').addEventListener('input', renderList);
    document.getElementById('filterMachine').addEventListener('change', renderList);
    document.getElementById('filterStatus').addEventListener('change', renderList);

    try {
        await loadData();
    } catch (e) {
        console.error(e);
        showErrorToast('Impossible de charger les réservations : ' + e.message);
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        setTimeout(() => openNewReservationModal(), 300);
    }
});
