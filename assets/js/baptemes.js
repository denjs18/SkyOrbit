// ============================================
// BAPTEMES PAGE JAVASCRIPT
// ============================================

// Mock Baptemes Data
const baptemesData = [
    {
        id: 'BAP-001',
        date: '2025-11-16',
        time: '14:00',
        client: { nom: 'Rousseau', prenom: 'Marie', phone: '06 12 34 56 78', email: 'marie.r@email.fr' },
        passengers: 1,
        weight: 75,
        formule: 'sensation',
        prix: 120,
        pilote: 'Marc Leroy',
        paiement: { statut: 'paid', methode: 'card' },
        statut: 'confirmed',
        remarques: ''
    },
    {
        id: 'BAP-002',
        date: '2025-11-17',
        time: '10:00',
        client: { nom: 'Blanc', prenom: 'Thomas', phone: '06 98 76 54 32', email: 'thomas.blanc@email.fr' },
        passengers: 1,
        weight: 82,
        formule: 'decouverte',
        prix: 70,
        pilote: 'Sophie Martin',
        paiement: { statut: 'pending', methode: null },
        statut: 'pending',
        remarques: ''
    },
    {
        id: 'BAP-003',
        date: '2025-11-18',
        time: '15:30',
        client: { nom: 'Morel', prenom: 'Julie & Pierre', phone: '06 45 67 89 12', email: 'julie.morel@email.fr' },
        passengers: 2,
        weight: 155,
        formule: 'prestige',
        prix: 200,
        pilote: 'Jean Instructor',
        paiement: { statut: 'paid', methode: 'transfer' },
        statut: 'confirmed',
        remarques: 'Cadeau d\'anniversaire'
    }
];

// Formules configuration
const formules = {
    decouverte: { nom: 'Découverte', prix: 70, duree: 15, description: '15 minutes de vol, survol de la région, photo souvenir' },
    sensation: { nom: 'Sensation', prix: 120, duree: 30, description: '30 minutes de vol, prise en main, photos + vidéo' },
    prestige: { nom: 'Prestige', prix: 200, duree: 60, description: '60 minutes de vol, pilotage accompagné, pack photos/vidéos, certificat' }
};

// Statistics
function calculateBaptemeStats() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let monthCount = 0;
    let monthRevenue = 0;
    let pendingCount = 0;
    let yearCount = 0;

    baptemesData.forEach(bapteme => {
        const baptemeDate = new Date(bapteme.date);

        // Current month
        if (baptemeDate.getMonth() === currentMonth && baptemeDate.getFullYear() === currentYear) {
            monthCount++;
            if (bapteme.paiement.statut === 'paid') {
                monthRevenue += bapteme.prix;
            }
        }

        // Current year
        if (baptemeDate.getFullYear() === currentYear) {
            yearCount++;
        }

        // Pending
        if (bapteme.statut === 'pending') {
            pendingCount++;
        }
    });

    return { monthCount, monthRevenue, pendingCount, yearCount };
}

// Update Stats Display
function updateBaptemeStats() {
    const stats = calculateBaptemeStats();

    // Update stat cards if they exist
    console.log('Bapteme statistics:', stats);

    // In a real implementation, update the DOM elements
    // Example:
    // document.querySelector('.stat-month-count').textContent = stats.monthCount;
}

// Get Payment Status Badge
function getPaymentStatusBadge(statut) {
    const badges = {
        paid: '<span class="badge bg-success"><i class="fas fa-check"></i> Payé</span>',
        pending: '<span class="badge bg-warning"><i class="fas fa-clock"></i> En attente</span>',
        partial: '<span class="badge bg-info"><i class="fas fa-hourglass-half"></i> Acompte</span>',
        refunded: '<span class="badge bg-danger"><i class="fas fa-undo"></i> Remboursé</span>'
    };
    return badges[statut] || '<span class="badge bg-secondary">Inconnu</span>';
}

// Get Bapteme Status Badge
function getBaptemeStatusBadge(statut) {
    const badges = {
        confirmed: '<span class="badge bg-success">Confirmé</span>',
        pending: '<span class="badge bg-warning">En attente</span>',
        completed: '<span class="badge bg-info">Effectué</span>',
        cancelled: '<span class="badge bg-danger">Annulé</span>'
    };
    return badges[statut] || '<span class="badge bg-secondary">Inconnu</span>';
}

// Get Formule Badge
function getFormuleBadge(formule) {
    const config = formules[formule];
    if (!config) return '<span class="badge bg-secondary">Inconnu</span>';

    const colors = {
        decouverte: 'info',
        sensation: 'warning',
        prestige: 'danger'
    };

    return `<span class="badge bg-${colors[formule]}">${config.nom} (${config.prix}€)</span>`;
}

// Save New Bapteme
function saveBapteme() {
    const form = document.getElementById('newBaptemeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    showLoading();

    // Collect form data
    const formData = new FormData(form);
    const baptemeData = {
        // Process form data here
        // For demo purposes, we'll just show success
    };

    // Simulate API call
    setTimeout(() => {
        hideLoading();
        showSuccessToast('Baptême enregistré avec succès');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('newBaptemeModal'));
        modal.hide();

        // Reset form
        form.reset();

        // Refresh stats
        updateBaptemeStats();
    }, 1000);
}

// Confirm Bapteme
function confirmBapteme(baptemeId) {
    confirmDialog('Confirmer ce baptême ?', () => {
        showLoading();

        setTimeout(() => {
            hideLoading();
            showSuccessToast(`Baptême ${baptemeId} confirmé`);

            // Update bapteme status
            const bapteme = baptemesData.find(b => b.id === baptemeId);
            if (bapteme) {
                bapteme.statut = 'confirmed';
            }

            // Refresh display
            updateBaptemeStats();
        }, 1000);
    });
}

// Mark Bapteme as Completed
function completeBapteme(baptemeId) {
    confirmDialog('Marquer ce baptême comme effectué ?', () => {
        showLoading();

        setTimeout(() => {
            hideLoading();
            showSuccessToast(`Baptême ${baptemeId} marqué comme effectué`);

            // Update bapteme status
            const bapteme = baptemesData.find(b => b.id === baptemeId);
            if (bapteme) {
                bapteme.statut = 'completed';
            }

            // Refresh display
            updateBaptemeStats();
        }, 1000);
    });
}

// Cancel Bapteme
function cancelBapteme(baptemeId) {
    confirmDialog('Annuler ce baptême ? Cette action est définitive.', () => {
        showLoading();

        setTimeout(() => {
            hideLoading();
            showSuccessToast(`Baptême ${baptemeId} annulé`);

            // Update bapteme status
            const bapteme = baptemesData.find(b => b.id === baptemeId);
            if (bapteme) {
                bapteme.statut = 'cancelled';
            }

            // Refresh display
            updateBaptemeStats();
        }, 1000);
    });
}

// Copy Widget Code
function copyWidget() {
    const code = document.querySelector('.code-block code').textContent;

    navigator.clipboard.writeText(code).then(() => {
        showSuccessToast('Code copié dans le presse-papiers');
    }).catch(() => {
        showErrorToast('Erreur lors de la copie');
    });
}

// Send Confirmation Email
function sendConfirmationEmail(baptemeId) {
    showLoading();

    setTimeout(() => {
        hideLoading();
        showSuccessToast('Email de confirmation envoyé');
    }, 1000);
}

// Send Reminder
function sendReminder(baptemeId) {
    showLoading();

    setTimeout(() => {
        hideLoading();
        showSuccessToast('Rappel envoyé au client');
    }, 1000);
}

// Generate Invoice
function generateInvoice(baptemeId) {
    showLoading();

    setTimeout(() => {
        hideLoading();
        showSuccessToast('Facture générée');
        // In a real app, this would download a PDF
    }, 1000);
}

// Update formule price when selected
function updateFormulePrice() {
    const formuleSelect = document.querySelector('#newBaptemeForm select[name="formule"]');
    if (!formuleSelect) return;

    formuleSelect.addEventListener('change', function() {
        const formuleKey = this.value;
        const formule = formules[formuleKey];

        if (formule) {
            showInfoToast(`Formule ${formule.nom} : ${formule.prix}€ - ${formule.duree} minutes`);
        }
    });
}

// Export functions
window.saveBapteme = saveBapteme;
window.confirmBapteme = confirmBapteme;
window.completeBapteme = completeBapteme;
window.cancelBapteme = cancelBapteme;
window.copyWidget = copyWidget;
window.sendConfirmationEmail = sendConfirmationEmail;
window.sendReminder = sendReminder;
window.generateInvoice = generateInvoice;

// Initialize on page load
window.addEventListener('load', function() {
    updateBaptemeStats();
    updateFormulePrice();

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('newBaptemeModal'));
            modal.show();
        }, 500);
    }
});
