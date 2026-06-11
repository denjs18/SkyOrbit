// ============================================
// BAPTEMES (ADMINISTRATION) - réservé au bureau
// ============================================
// Les demandes publiques arrivent en statut "pending" ; le bureau vérifie
// le paiement HelloAsso, affecte pilote/machine puis fait vivre le statut :
// pending -> paid -> done (ou cancelled).

const FORMULES = window.APP_CONFIG.FORMULES;

let baptemes = [];
let pilots = [];
let machinesList = [];

function formulaInfo(key) {
    return FORMULES[key] || { label: key, price: 0, duration: 0 };
}

function getBaptemeStatusBadge(status) {
    const badges = {
        pending: '<span class="badge bg-warning"><i class="fas fa-clock"></i> En attente</span>',
        paid: '<span class="badge bg-success"><i class="fas fa-check"></i> Payé</span>',
        done: '<span class="badge bg-info"><i class="fas fa-flag-checkered"></i> Effectué</span>',
        cancelled: '<span class="badge bg-danger"><i class="fas fa-times"></i> Annulé</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Inconnu</span>';
}

function getFormuleBadge(key) {
    const f = formulaInfo(key);
    const colors = { decouverte: 'info', sensation: 'warning', prestige: 'danger' };
    return `<span class="badge bg-${colors[key] || 'secondary'}">${escapeHtml(f.label)} (${f.price}€)</span>`;
}

// ---------- Chargement ----------

async function loadBaptemes() {
    const members = await DB.listMembers();
    pilots = members.filter(m => m.active && ['admin', 'instructor', 'pilot'].includes(m.role));
    machinesList = (await DB.listMachines()).filter(m => m.active);
    baptemes = await DB.listBaptemes();

    renderFormuleCards();
    populateBaptemeSelects();
    renderBaptemes();
    updateBaptemeStats();
}

function renderFormuleCards() {
    Object.entries(FORMULES).forEach(([key, f]) => {
        const priceEl = document.querySelector(`[data-price="${key}"]`);
        if (priceEl) priceEl.textContent = f.price + '€';
        const durationEl = document.querySelector(`[data-duration="${key}"]`);
        if (durationEl) durationEl.textContent = f.duration + ' minutes de vol';
    });
}

function populateBaptemeSelects() {
    document.getElementById('bapPilot').innerHTML = '<option value="">À affecter</option>'
        + pilots.map(p => `<option value="${p.id}">${escapeHtml(p.full_name)}</option>`).join('');
    document.getElementById('bapMachine').innerHTML = '<option value="">À affecter</option>'
        + machinesList.map(m => `<option value="${m.id}">${escapeHtml(m.registration)}</option>`).join('');
    document.getElementById('bapFormula').innerHTML = Object.entries(FORMULES).map(([key, f]) =>
        `<option value="${key}">${escapeHtml(f.label)} - ${f.price}€ (${f.duration} min)</option>`).join('');
}

// ---------- Statistiques ----------

function updateBaptemeStats() {
    const now = new Date();
    let monthCount = 0, monthRevenue = 0, pendingCount = 0, yearCount = 0;

    baptemes.forEach(b => {
        if (b.status === 'cancelled') return;
        const d = new Date(b.slot_at);
        if (d.getFullYear() === now.getFullYear()) {
            yearCount++;
            if (d.getMonth() === now.getMonth()) {
                monthCount++;
                if (b.status === 'paid' || b.status === 'done') monthRevenue += Number(b.price);
            }
        }
        if (b.status === 'pending') pendingCount++;
    });

    document.getElementById('statMonthCount').textContent = monthCount;
    document.getElementById('statPendingCount').textContent = pendingCount;
    document.getElementById('statMonthRevenue').textContent = monthRevenue.toLocaleString('fr-FR') + '€';
    document.getElementById('statYearCount').textContent = yearCount;
}

// ---------- Liste ----------

function pilotName(id) {
    const p = pilots.find(x => x.id === id);
    return p ? p.full_name : null;
}

function machineRegistration(id) {
    const m = machinesList.find(x => x.id === id);
    return m ? m.registration : null;
}

function renderBaptemes() {
    const filter = document.getElementById('filterBaptemeStatus').value;
    const tbody = document.getElementById('baptemesList');
    const rows = baptemes.filter(b => !filter || b.status === filter);

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-muted text-center">Aucun baptême</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(b => `
        <tr>
            <td>${formatDate(b.slot_at)} ${formatTime(b.slot_at)}</td>
            <td>${escapeHtml(b.customer_name)}</td>
            <td>
                ${b.customer_phone ? `<i class="fas fa-phone"></i> ${escapeHtml(b.customer_phone)}<br>` : ''}
                <i class="fas fa-envelope"></i> ${escapeHtml(b.customer_email)}
            </td>
            <td>${getFormuleBadge(b.formula)}</td>
            <td>${escapeHtml(pilotName(b.pilot_id) || '—')}</td>
            <td>${escapeHtml(machineRegistration(b.machine_id) || '—')}</td>
            <td>${getBaptemeStatusBadge(b.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-warning" title="Modifier" onclick="editBapteme('${b.id}')"><i class="fas fa-edit"></i></button>
                ${b.status === 'pending' ? `<button class="btn btn-sm btn-outline-success" title="Marquer payé" onclick="markBaptemePaid('${b.id}')"><i class="fas fa-euro-sign"></i></button>` : ''}
                ${b.status === 'paid' ? `<button class="btn btn-sm btn-outline-info" title="Marquer effectué" onclick="markBaptemeDone('${b.id}')"><i class="fas fa-flag-checkered"></i></button>` : ''}
                ${(b.status === 'pending' || b.status === 'paid') ? `<button class="btn btn-sm btn-outline-danger" title="Annuler" onclick="cancelBapteme('${b.id}')"><i class="fas fa-times"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

// ---------- Actions ----------

let editingBaptemeId = null;

function openBaptemeModal() {
    editingBaptemeId = null;
    document.getElementById('newBaptemeForm').reset();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('newBaptemeModal')).show();
}

function editBapteme(id) {
    const b = baptemes.find(x => x.id === id);
    if (!b) return;
    editingBaptemeId = id;

    document.getElementById('bapName').value = b.customer_name;
    document.getElementById('bapEmail').value = b.customer_email;
    document.getElementById('bapPhone').value = b.customer_phone || '';
    document.getElementById('bapFormula').value = b.formula;
    const d = new Date(b.slot_at);
    document.getElementById('bapDate').value = d.toISOString().split('T')[0];
    document.getElementById('bapTime').value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    document.getElementById('bapPilot').value = b.pilot_id || '';
    document.getElementById('bapMachine').value = b.machine_id || '';
    document.getElementById('bapStatus').value = b.status === 'pending' ? 'pending' : 'paid';
    document.getElementById('bapPaymentRef').value = b.payment_ref || '';
    document.getElementById('bapNotes').value = b.notes || '';

    bootstrap.Modal.getOrCreateInstance(document.getElementById('newBaptemeModal')).show();
}

async function saveBapteme() {
    const form = document.getElementById('newBaptemeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formula = document.getElementById('bapFormula').value;
    const fields = {
        customer_name: document.getElementById('bapName').value.trim(),
        customer_email: document.getElementById('bapEmail').value.trim(),
        customer_phone: document.getElementById('bapPhone').value.trim(),
        formula: formula,
        price: formulaInfo(formula).price,
        slot_at: new Date(`${document.getElementById('bapDate').value}T${document.getElementById('bapTime').value}`).toISOString(),
        pilot_id: document.getElementById('bapPilot').value || null,
        machine_id: document.getElementById('bapMachine').value || null,
        status: document.getElementById('bapStatus').value,
        payment_ref: document.getElementById('bapPaymentRef').value.trim() || null,
        notes: document.getElementById('bapNotes').value.trim()
    };

    try {
        showLoading();
        if (editingBaptemeId) {
            await DB.updateBapteme(editingBaptemeId, fields);
        } else {
            // Création par le bureau : on passe outre les restrictions
            // de la page publique via updateBapteme après insertion.
            const created = await DB.createBapteme({
                customer_name: fields.customer_name,
                customer_email: fields.customer_email,
                customer_phone: fields.customer_phone,
                formula: fields.formula,
                price: fields.price,
                slot_at: fields.slot_at,
                notes: fields.notes
            });
            if (fields.pilot_id || fields.machine_id || fields.status !== 'pending' || fields.payment_ref) {
                await DB.updateBapteme(created.id, fields);
            }
        }
        baptemes = await DB.listBaptemes();
        renderBaptemes();
        updateBaptemeStats();
        bootstrap.Modal.getInstance(document.getElementById('newBaptemeModal')).hide();
        form.reset();
        editingBaptemeId = null;
        showSuccessToast('Baptême enregistré');
    } catch (e) {
        showErrorToast(e.message);
    } finally {
        hideLoading();
    }
}

async function setBaptemeStatus(id, status, confirmMessage) {
    confirmDialog(confirmMessage, async () => {
        try {
            showLoading();
            await DB.updateBapteme(id, { status });
            baptemes = await DB.listBaptemes();
            renderBaptemes();
            updateBaptemeStats();
            showSuccessToast('Statut mis à jour');
        } catch (e) {
            showErrorToast(e.message);
        } finally {
            hideLoading();
        }
    });
}

function markBaptemePaid(id) {
    setBaptemeStatus(id, 'paid', 'Confirmer la réception du paiement (HelloAsso ou autre) ?');
}

function markBaptemeDone(id) {
    setBaptemeStatus(id, 'done', 'Marquer ce baptême comme effectué ?');
}

function cancelBapteme(id) {
    setBaptemeStatus(id, 'cancelled', 'Annuler ce baptême ? Cette action est définitive.');
}

// Copy Widget Code
function copyWidget() {
    const code = document.querySelector('.code-block code').textContent.trim();
    navigator.clipboard.writeText(code).then(() => {
        showSuccessToast('Code copié dans le presse-papiers');
    }).catch(() => {
        showErrorToast('Erreur lors de la copie');
    });
}

// Export functions
window.saveBapteme = saveBapteme;
window.editBapteme = editBapteme;
window.markBaptemePaid = markBaptemePaid;
window.markBaptemeDone = markBaptemeDone;
window.cancelBapteme = cancelBapteme;
window.copyWidget = copyWidget;
window.openBaptemeModal = openBaptemeModal;

// Initialize on page load
window.addEventListener('load', async function() {
    const session = await window.appReady;
    if (!session) return;

    // Page réservée au bureau
    if (session.profile.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('filterBaptemeStatus').addEventListener('change', renderBaptemes);

    try {
        await loadBaptemes();
    } catch (e) {
        console.error(e);
        showErrorToast('Impossible de charger les baptêmes : ' + e.message);
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        setTimeout(() => openBaptemeModal(), 300);
    }
});
