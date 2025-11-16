// ============================================
// RESERVATIONS PAGE JAVASCRIPT
// ============================================

// Mock Reservations Data
const reservationsData = [
    {
        id: 1,
        date: '2025-11-16',
        startTime: '09:00',
        endTime: '11:00',
        machine: 'ULM-001',
        pilot: 'Marc Leroy',
        type: 'libre',
        status: 'confirmed',
        instructor: null,
        remarks: ''
    },
    {
        id: 2,
        date: '2025-11-16',
        startTime: '11:30',
        endTime: '13:30',
        machine: 'ULM-003',
        pilot: 'Sophie Martin',
        type: 'formation',
        status: 'pending',
        instructor: 'Jean Instructor',
        remarks: 'Premier vol solo'
    },
    {
        id: 3,
        date: '2025-11-16',
        startTime: '14:00',
        endTime: '16:00',
        machine: 'ULM-002',
        pilot: 'Baptême - Client X',
        type: 'bapteme',
        status: 'confirmed',
        instructor: null,
        remarks: 'Client anniversaire'
    }
];

// Initialize Calendar
let calendar;

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
        events: getCalendarEvents(),
        eventClick: function(info) {
            showReservationDetails(info.event.id);
        },
        dateClick: function(info) {
            // Open new reservation modal with pre-filled date
            openNewReservationModal(info.date);
        },
        eventColor: '#0ea5e9',
        height: 'auto'
    });

    calendar.render();
}

// Get Calendar Events from Reservations
function getCalendarEvents() {
    return reservationsData.map(res => ({
        id: res.id,
        title: `${res.machine} - ${res.pilot}`,
        start: `${res.date}T${res.startTime}`,
        end: `${res.date}T${res.endTime}`,
        backgroundColor: getStatusColor(res.status),
        borderColor: getStatusColor(res.status)
    }));
}

// Get Status Color
function getStatusColor(status) {
    const colors = {
        confirmed: '#10b981',
        pending: '#f59e0b',
        cancelled: '#ef4444',
        bapteme: '#06b6d4'
    };
    return colors[status] || '#64748b';
}

// Get Status Badge HTML
function getStatusBadge(status) {
    const badges = {
        confirmed: '<span class="badge bg-success">Confirmée</span>',
        pending: '<span class="badge bg-warning">En attente</span>',
        cancelled: '<span class="badge bg-danger">Annulée</span>',
        bapteme: '<span class="badge bg-info">Baptême</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Inconnu</span>';
}

// Get Type Badge HTML
function getTypeBadge(type) {
    const badges = {
        libre: '<span class="badge bg-primary">Vol libre</span>',
        formation: '<span class="badge bg-info">Formation</span>',
        bapteme: '<span class="badge bg-warning">Baptême</span>',
        maintenance: '<span class="badge bg-secondary">Maintenance</span>'
    };
    return badges[type] || '<span class="badge bg-secondary">Autre</span>';
}

// Show Reservation Details
function showReservationDetails(reservationId) {
    const reservation = reservationsData.find(r => r.id == reservationId);
    if (!reservation) return;

    // Create modal content
    const modalContent = `
        <div class="modal fade" id="reservationDetailsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Détails de la Réservation #${reservation.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-4">Date</dt>
                            <dd class="col-sm-8">${formatDate(reservation.date)}</dd>

                            <dt class="col-sm-4">Horaire</dt>
                            <dd class="col-sm-8">${reservation.startTime} - ${reservation.endTime}</dd>

                            <dt class="col-sm-4">Machine</dt>
                            <dd class="col-sm-8">${reservation.machine}</dd>

                            <dt class="col-sm-4">Pilote</dt>
                            <dd class="col-sm-8">${reservation.pilot}</dd>

                            <dt class="col-sm-4">Type</dt>
                            <dd class="col-sm-8">${getTypeBadge(reservation.type)}</dd>

                            ${reservation.instructor ? `
                                <dt class="col-sm-4">Instructeur</dt>
                                <dd class="col-sm-8">${reservation.instructor}</dd>
                            ` : ''}

                            <dt class="col-sm-4">Statut</dt>
                            <dd class="col-sm-8">${getStatusBadge(reservation.status)}</dd>

                            ${reservation.remarks ? `
                                <dt class="col-sm-4">Remarques</dt>
                                <dd class="col-sm-8">${reservation.remarks}</dd>
                            ` : ''}
                        </dl>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        <button type="button" class="btn btn-warning" onclick="editReservation(${reservation.id})">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        ${reservation.status !== 'cancelled' ? `
                            <button type="button" class="btn btn-danger" onclick="cancelReservation(${reservation.id})">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('reservationDetailsModal');
    if (existingModal) existingModal.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('reservationDetailsModal'));
    modal.show();
}

// Open New Reservation Modal
function openNewReservationModal(date = null) {
    const modal = document.getElementById('newReservationModal');
    if (!modal) return;

    // Pre-fill date if provided
    if (date) {
        const dateInput = modal.querySelector('input[type="date"]');
        if (dateInput) {
            dateInput.value = date.toISOString().split('T')[0];
        }
    }

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Save Reservation
function saveReservation() {
    const form = document.getElementById('newReservationForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    showLoading();

    // Simulate API call
    setTimeout(() => {
        hideLoading();
        showSuccessToast('Réservation créée avec succès');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('newReservationModal'));
        modal.hide();

        // Reset form
        form.reset();

        // Refresh calendar
        if (calendar) {
            calendar.refetchEvents();
        }
    }, 1000);
}

// Edit Reservation
function editReservation(reservationId) {
    showInfoToast('Édition de la réservation #' + reservationId);
    // Close details modal
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('reservationDetailsModal'));
    if (detailsModal) detailsModal.hide();

    // Open edit modal (similar to new reservation modal)
    // For now, just show a message
}

// Cancel Reservation
function cancelReservation(reservationId) {
    confirmDialog('Êtes-vous sûr de vouloir annuler cette réservation ?', () => {
        showLoading();

        setTimeout(() => {
            hideLoading();
            showSuccessToast('Réservation annulée');

            // Update reservation status
            const reservation = reservationsData.find(r => r.id == reservationId);
            if (reservation) {
                reservation.status = 'cancelled';
            }

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('reservationDetailsModal'));
            if (modal) modal.hide();

            // Refresh calendar
            if (calendar) {
                calendar.refetchEvents();
            }
        }, 1000);
    });
}

// Apply Filters
function applyFilters() {
    const machine = document.getElementById('filterMachine')?.value;
    const status = document.getElementById('filterStatus')?.value;
    const pilot = document.getElementById('filterPilot')?.value;

    showInfoToast('Filtres appliqués');

    // In a real app, this would filter the data and update the display
    console.log('Filters:', { machine, status, pilot });
}

// Export functions
window.saveReservation = saveReservation;
window.editReservation = editReservation;
window.cancelReservation = cancelReservation;
window.applyFilters = applyFilters;

// Initialize on page load
window.addEventListener('load', function() {
    initCalendar();

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        setTimeout(() => {
            openNewReservationModal();
        }, 500);
    }
});
