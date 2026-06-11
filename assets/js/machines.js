// ============================================
// PAGE MACHINES - Horizon Libre
// ============================================
// Gestion du parc de machines : liste en cartes, ajout/édition,
// suivi d'entretien (interventions + historique), mise hors service.
// Toutes les données proviennent de la couche window.DB.

(function () {
    let machines = [];

    let machineModal = null;
    let maintenanceModal = null;
    let historyModal = null;

    const TYPE_LABELS = {
        multiaxe: 'Multiaxe',
        pendulaire: 'Pendulaire',
        autogire: 'Autogire',
        paramoteur: 'Paramoteur',
        autre: 'Autre'
    };

    const TYPE_BADGES = {
        multiaxe: 'bg-primary',
        pendulaire: 'bg-info text-dark',
        autogire: 'bg-warning text-dark',
        paramoteur: 'bg-success',
        autre: 'bg-secondary'
    };

    // Ré-applique le masquage des éléments réservés au bureau sur le
    // contenu inséré dynamiquement (main.js ne le fait qu'au chargement).
    function applyAdminVisibility(root) {
        const profile = window.CURRENT_USER;
        if (!profile || profile.role === 'admin') return;
        root.querySelectorAll('[data-role="admin"]').forEach(el => {
            el.classList.add('d-none');
        });
    }

    function formatHours(value) {
        const n = Number(value) || 0;
        return n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    }

    // ----- Rendu des cartes -----

    function maintenanceBarHtml(machine) {
        const interval = Number(machine.maintenance_interval) || 50;
        const hoursSince = Math.max(0, (Number(machine.hours_total) || 0) - (Number(machine.last_maintenance_hours) || 0));
        const pct = (hoursSince / interval) * 100;
        const width = Math.min(100, Math.round(pct));

        let barClass = 'bg-success';
        if (pct >= 100) barClass = 'bg-danger';
        else if (pct >= 70) barClass = 'bg-warning';

        const overdue = pct >= 100
            ? '<div class="text-danger fw-bold mt-1"><i class="fas fa-exclamation-triangle"></i> Visite dépassée</div>'
            : '';

        return `
            <div class="mt-3">
                <div class="d-flex justify-content-between small text-muted mb-1">
                    <span><i class="fas fa-wrench"></i> Prochaine visite</span>
                    <span>${formatHours(hoursSince)} h / ${formatHours(interval)} h</span>
                </div>
                <div class="progress" style="height: 8px;" role="progressbar"
                     aria-valuenow="${width}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar ${barClass}" style="width: ${width}%;"></div>
                </div>
                ${overdue}
            </div>
        `;
    }

    function machineCardHtml(machine) {
        const typeLabel = TYPE_LABELS[machine.type] || TYPE_LABELS.autre;
        const typeBadge = TYPE_BADGES[machine.type] || TYPE_BADGES.autre;
        const inactive = machine.active === false;

        const notesHtml = machine.notes
            ? `<p class="text-muted small mb-0 mt-2"><i class="fas fa-sticky-note"></i> ${escapeHtml(machine.notes)}</p>`
            : '';

        const inactiveBadge = inactive
            ? '<span class="badge bg-danger ms-2">Hors service</span>'
            : '';

        const toggleBtn = inactive
            ? `<button class="btn btn-sm btn-outline-success" data-role="admin" data-action="toggle" data-id="${escapeHtml(machine.id)}">
                   <i class="fas fa-power-off"></i> Remettre en service
               </button>`
            : `<button class="btn btn-sm btn-outline-danger" data-role="admin" data-action="toggle" data-id="${escapeHtml(machine.id)}">
                   <i class="fas fa-power-off"></i> Mettre hors service
               </button>`;

        return `
            <div class="col-md-6 col-xl-4">
                <div class="card h-100 ${inactive ? 'opacity-75' : ''}">
                    <div class="card-header">
                        <h5><i class="fas fa-helicopter"></i> ${escapeHtml(machine.registration)}${inactiveBadge}</h5>
                        <span class="badge ${typeBadge}">${escapeHtml(typeLabel)}</span>
                    </div>
                    <div class="card-body">
                        <p class="mb-1"><strong>${escapeHtml(machine.model)}</strong></p>
                        <p class="mb-0 text-muted">
                            <i class="fas fa-clock"></i> ${formatHours(machine.hours_total)} h totales
                        </p>
                        ${maintenanceBarHtml(machine)}
                        ${notesHtml}
                        <div class="d-flex flex-wrap gap-2 mt-3">
                            <button class="btn btn-sm btn-outline-primary" data-action="history" data-id="${escapeHtml(machine.id)}">
                                <i class="fas fa-history"></i> Historique
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" data-role="admin" data-action="edit" data-id="${escapeHtml(machine.id)}">
                                <i class="fas fa-edit"></i> Éditer
                            </button>
                            <button class="btn btn-sm btn-outline-warning" data-role="admin" data-action="maintenance" data-id="${escapeHtml(machine.id)}">
                                <i class="fas fa-wrench"></i> Entretien
                            </button>
                            ${toggleBtn}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderMachines() {
        const container = document.getElementById('machinesList');
        if (!machines.length) {
            container.innerHTML = '<div class="col-12"><p class="text-muted">Aucune machine enregistrée.</p></div>';
            return;
        }
        container.innerHTML = machines.map(machineCardHtml).join('');
        applyAdminVisibility(container);
    }

    async function loadMachines() {
        try {
            machines = await DB.listMachines();
            renderMachines();
        } catch (e) {
            showErrorToast(e.message);
        }
    }

    // ----- Modal ajout / édition -----

    function openMachineModal(machine) {
        document.getElementById('machineForm').reset();
        document.getElementById('machineId').value = machine ? machine.id : '';
        document.getElementById('machineModalTitle').textContent = machine ? 'Modifier la machine' : 'Ajouter une machine';

        document.getElementById('machineRegistration').value = machine ? (machine.registration || '') : '';
        document.getElementById('machineModel').value = machine ? (machine.model || '') : '';
        document.getElementById('machineType').value = machine && TYPE_LABELS[machine.type] ? machine.type : 'multiaxe';
        document.getElementById('machineHoursTotal').value = machine ? (machine.hours_total ?? 0) : 0;
        document.getElementById('machineInterval').value = machine ? (machine.maintenance_interval ?? 50) : 50;
        document.getElementById('machineLastMaintenance').value = machine ? (machine.last_maintenance_hours ?? 0) : 0;
        document.getElementById('machineNotes').value = machine ? (machine.notes || '') : '';

        machineModal.show();
    }

    async function handleMachineSubmit(event) {
        event.preventDefault();
        const id = document.getElementById('machineId').value;
        const fields = {
            registration: document.getElementById('machineRegistration').value.trim(),
            model: document.getElementById('machineModel').value.trim(),
            type: document.getElementById('machineType').value,
            hours_total: parseFloat(document.getElementById('machineHoursTotal').value) || 0,
            maintenance_interval: parseFloat(document.getElementById('machineInterval').value) || 50,
            last_maintenance_hours: parseFloat(document.getElementById('machineLastMaintenance').value) || 0,
            notes: document.getElementById('machineNotes').value.trim()
        };

        if (!fields.registration || !fields.model) {
            showErrorToast('L\'immatriculation et le modèle sont obligatoires.');
            return;
        }

        showLoading();
        try {
            if (id) {
                await DB.updateMachine(id, fields);
                showSuccessToast('Machine modifiée avec succès.');
            } else {
                await DB.createMachine(fields);
                showSuccessToast('Machine ajoutée avec succès.');
            }
            machineModal.hide();
            await loadMachines();
        } catch (e) {
            showErrorToast(e.message);
        } finally {
            hideLoading();
        }
    }

    // ----- Modal entretien -----

    function openMaintenanceModal(machine) {
        document.getElementById('maintenanceForm').reset();
        document.getElementById('maintenanceMachineId').value = machine.id;
        document.getElementById('maintenanceModalTitle').textContent =
            'Intervention — ' + machine.registration;
        document.getElementById('maintenanceDate').value = new Date().toISOString().slice(0, 10);
        document.getElementById('maintenanceHours').value = machine.hours_total ?? 0;
        maintenanceModal.show();
    }

    async function handleMaintenanceSubmit(event) {
        event.preventDefault();
        const fields = {
            machine_id: document.getElementById('maintenanceMachineId').value,
            date: document.getElementById('maintenanceDate').value,
            description: document.getElementById('maintenanceDescription').value.trim(),
            hours_at_log: parseFloat(document.getElementById('maintenanceHours').value),
            performed_by: document.getElementById('maintenancePerformedBy').value.trim()
        };

        if (!fields.date || !fields.description || isNaN(fields.hours_at_log)) {
            showErrorToast('La date, la description et le compteur sont obligatoires.');
            return;
        }

        showLoading();
        try {
            await DB.addMaintenance(fields);
            showSuccessToast('Intervention enregistrée.');
            maintenanceModal.hide();
            await loadMachines();
        } catch (e) {
            showErrorToast(e.message);
        } finally {
            hideLoading();
        }
    }

    // ----- Modal historique -----

    async function openHistoryModal(machine) {
        const content = document.getElementById('historyContent');
        document.getElementById('historyModalTitle').textContent =
            'Historique — ' + machine.registration;
        content.innerHTML = '<p class="text-muted">Chargement…</p>';
        historyModal.show();

        try {
            const logs = await DB.listMaintenance(machine.id);
            if (!logs.length) {
                content.innerHTML = '<p class="text-muted mb-0">Aucune intervention enregistrée pour cette machine.</p>';
                return;
            }
            const rows = logs.map(log => `
                <tr>
                    <td>${escapeHtml(formatDate(log.date))}</td>
                    <td>${escapeHtml(log.description)}</td>
                    <td>${formatHours(log.hours_at_log)} h</td>
                    <td>${escapeHtml(log.performed_by || '—')}</td>
                </tr>
            `).join('');
            content.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-striped align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Compteur</th>
                                <th>Réalisé par</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            content.innerHTML = '<p class="text-danger mb-0">Erreur lors du chargement de l\'historique.</p>';
            showErrorToast(e.message);
        }
    }

    // ----- Activation / désactivation -----

    function toggleMachine(machine) {
        const deactivating = machine.active !== false;
        const message = deactivating
            ? 'Mettre la machine ' + machine.registration + ' hors service ?'
            : 'Remettre la machine ' + machine.registration + ' en service ?';

        confirmDialog(message, async function () {
            showLoading();
            try {
                await DB.updateMachine(machine.id, { active: !deactivating });
                showSuccessToast(deactivating
                    ? 'Machine mise hors service.'
                    : 'Machine remise en service.');
                await loadMachines();
            } catch (e) {
                showErrorToast(e.message);
            } finally {
                hideLoading();
            }
        });
    }

    // ----- Initialisation -----

    document.addEventListener('DOMContentLoaded', async function () {
        const session = await window.appReady;
        if (!session) return;

        machineModal = new bootstrap.Modal(document.getElementById('machineModal'));
        maintenanceModal = new bootstrap.Modal(document.getElementById('maintenanceModal'));
        historyModal = new bootstrap.Modal(document.getElementById('historyModal'));

        document.getElementById('btnAddMachine').addEventListener('click', function () {
            openMachineModal(null);
        });
        document.getElementById('machineForm').addEventListener('submit', handleMachineSubmit);
        document.getElementById('maintenanceForm').addEventListener('submit', handleMaintenanceSubmit);

        document.getElementById('machinesList').addEventListener('click', function (event) {
            const btn = event.target.closest('button[data-action]');
            if (!btn) return;
            const machine = machines.find(m => String(m.id) === btn.dataset.id);
            if (!machine) return;

            switch (btn.dataset.action) {
                case 'edit':
                    openMachineModal(machine);
                    break;
                case 'maintenance':
                    openMaintenanceModal(machine);
                    break;
                case 'history':
                    openHistoryModal(machine);
                    break;
                case 'toggle':
                    toggleMachine(machine);
                    break;
            }
        });

        await loadMachines();
    });
})();
