// ============================================
// MEMBRES - Gestion des membres du club
// ============================================
// Toutes les données proviennent de window.DB (aucune donnée en dur).
// Les actions d'administration (ajout, édition, cotisation, activation)
// sont réservées au bureau (data-role="admin").

(function () {
    'use strict';

    const CURRENT_YEAR = new Date().getFullYear();
    const DEFAULT_COTISATION = 250;
    const EXPIRY_WARNING_DAYS = 60;

    const ROLE_BADGES = {
        admin: { label: 'Bureau (admin)', className: 'bg-danger' },
        instructor: { label: 'Instructeur', className: 'bg-info' },
        pilot: { label: 'Pilote', className: 'bg-primary' },
        member: { label: 'Membre', className: 'bg-secondary' }
    };

    let members = [];
    let cotisations = [];
    let memberModal = null;
    let cotisationModal = null;
    let resetCredentialsModal = null;
    let credentialsResultModal = null;
    let searchTerm = '';
    let _lastCreatedCredentials = null;

    // ---------- Helpers ----------

    function isAdmin() {
        return !!(window.CURRENT_USER && window.CURRENT_USER.role === 'admin');
    }

    // escapeHtml() n'échappe pas les guillemets : nécessaire pour les attributs HTML.
    function escapeAttr(value) {
        return escapeHtml(value).replace(/"/g, '&quot;');
    }

    function findMember(id) {
        return members.find(m => m.id === id) || null;
    }

    function cotisationFor(memberId) {
        return cotisations.find(c => c.member_id === memberId) || null;
    }

    function upsertLocalCotisation(saved) {
        const idx = cotisations.findIndex(c => c.member_id === saved.member_id && c.year === saved.year);
        if (idx >= 0) {
            cotisations[idx] = saved;
        } else {
            cotisations.push(saved);
        }
    }

    function sortMembers() {
        members.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    }

    function isExpired(dateStr) {
        return !!dateStr && new Date(dateStr) < new Date();
    }

    function expiresSoon(dateStr, days) {
        if (!dateStr) return false;
        const limit = new Date();
        limit.setDate(limit.getDate() + days);
        return new Date(dateStr) <= limit;
    }

    // ---------- Rendu ----------

    function roleBadge(role) {
        const b = ROLE_BADGES[role] || ROLE_BADGES.member;
        return `<span class="badge ${b.className}">${escapeHtml(b.label)}</span>`;
    }

    function expiryCell(dateStr) {
        if (!dateStr) return '<span class="text-muted">—</span>';
        const text = escapeHtml(formatDate(dateStr));
        if (isExpired(dateStr)) {
            return `<span class="text-danger fw-bold" title="Expirée">${text} <i class="fas fa-exclamation-circle"></i></span>`;
        }
        if (expiresSoon(dateStr, EXPIRY_WARNING_DAYS)) {
            return `<span class="text-warning fw-bold" title="Expire sous ${EXPIRY_WARNING_DAYS} jours">${text} <i class="fas fa-exclamation-triangle"></i></span>`;
        }
        return text;
    }

    function renderStats() {
        const actifs = members.filter(m => m.active);
        const paid = cotisations.filter(c => c.status === 'paid').length;
        const expiring = actifs.filter(m =>
            expiresSoon(m.license_expiry, EXPIRY_WARNING_DAYS) || expiresSoon(m.medical_expiry, EXPIRY_WARNING_DAYS)
        ).length;

        document.getElementById('statActiveMembers').textContent = actifs.length;
        document.getElementById('statCotisationsPaid').textContent = paid;
        document.getElementById('statExpiring').textContent = expiring;
    }

    function renderTable() {
        const tbody = document.getElementById('membersTableBody');
        const admin = isAdmin();

        const filtered = members.filter(m => {
            if (!searchTerm) return true;
            const name = (m.full_name || '').toLowerCase();
            const email = (m.email || '').toLowerCase();
            return name.includes(searchTerm) || email.includes(searchTerm);
        });

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-muted text-center">Aucun membre trouvé.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(m => {
            const cot = cotisationFor(m.id);
            const paid = !!(cot && cot.status === 'paid');
            const cotBadge = paid
                ? `<span class="badge bg-success">Payée${cot.amount != null ? ' (' + escapeHtml(cot.amount) + ' €)' : ''}</span>`
                : '<span class="badge bg-warning text-dark">Impayée</span>';
            const activeBadge = m.active
                ? '<span class="badge bg-success">Actif</span>'
                : '<span class="badge bg-secondary">Inactif</span>';
            const id = escapeAttr(m.id);

            const usernameBadge = m.username
                ? `<span class="badge bg-light text-dark border font-monospace">${escapeHtml(m.username)}</span>`
                    + (m.must_change_password ? ' <span class="badge bg-warning text-dark" title="Doit changer de mot de passe"><i class="fas fa-key"></i></span>' : '')
                : '<span class="text-muted">—</span>';

            const actions = `
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" data-action="edit" data-id="${id}" title="Éditer">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button type="button" class="btn btn-outline-${paid ? 'warning' : 'success'}" data-action="cotisation" data-id="${id}"
                        title="${paid ? 'Marquer la cotisation impayée' : 'Marquer la cotisation payée'}">
                        <i class="fas fa-euro-sign"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" data-action="reset-credentials" data-id="${id}"
                        title="Réinitialiser les accès (nouveau mot de passe temporaire)">
                        <i class="fas fa-key"></i>
                    </button>
                    <button type="button" class="btn btn-outline-${m.active ? 'danger' : 'success'}" data-action="toggle-active" data-id="${id}"
                        title="${m.active ? 'Désactiver le membre' : 'Activer le membre'}">
                        <i class="fas fa-${m.active ? 'user-slash' : 'user-check'}"></i>
                    </button>
                </div>`;

            const emailDisplay = isPlaceholderEmail(m.email)
                ? '<span class="text-muted small fst-italic">—</span>'
                : escapeHtml(m.email || '');

            return `
                <tr class="${m.active ? '' : 'table-secondary'}">
                    <td>${escapeHtml(m.full_name)}</td>
                    <td>${usernameBadge}</td>
                    <td>${emailDisplay}</td>
                    <td>${roleBadge(m.role)}</td>
                    <td>${expiryCell(m.license_expiry)}</td>
                    <td>${expiryCell(m.medical_expiry)}</td>
                    <td>${cotBadge}</td>
                    <td>${activeBadge}</td>
                    <td data-role="admin" class="text-nowrap${admin ? '' : ' d-none'}">${actions}</td>
                </tr>`;
        }).join('');
    }

    function renderAll() {
        renderStats();
        renderTable();
    }

    // ---------- Modal membre (ajout / édition) ----------

    function openAddMemberModal() {
        const form = document.getElementById('memberForm');
        form.reset();
        document.getElementById('memberId').value = '';
        document.getElementById('memberModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Ajouter un membre';
        const tempSection = document.getElementById('tempPasswordSection');
        if (tempSection) tempSection.style.display = '';
        const credSection = document.getElementById('credentialsSection');
        if (credSection) credSection.style.display = '';
        // Pré-générer un mot de passe temporaire
        const pwdEl = document.getElementById('memberTempPassword');
        if (pwdEl && !pwdEl.value) pwdEl.value = makeTemp();
        // Réinitialiser l'auto-suggestion de l'identifiant
        const uEl = document.getElementById('memberUsername');
        if (uEl) uEl.removeAttribute('data-manual');
        memberModal.show();
    }

    function openEditMemberModal(id) {
        const m = findMember(id);
        if (!m) {
            showErrorToast('Membre introuvable');
            return;
        }
        document.getElementById('memberForm').reset();
        document.getElementById('memberId').value = m.id;
        document.getElementById('memberFullName').value = m.full_name || '';
        document.getElementById('memberEmail').value = m.email || '';
        document.getElementById('memberPhone').value = m.phone || '';
        document.getElementById('memberRole').value = ROLE_BADGES[m.role] ? m.role : 'member';
        document.getElementById('memberLicenseNumber').value = m.license_number || '';
        document.getElementById('memberLicenseExpiry').value = m.license_expiry || '';
        document.getElementById('memberMedicalExpiry').value = m.medical_expiry || '';
        document.getElementById('memberQualifications').value = m.qualifications || '';
        document.getElementById('memberUsername').value = m.username || '';
        // En édition, masquer le champ de mot de passe temporaire
        // (utiliser le bouton "Réinitialiser les accès" à la place)
        const tempSection = document.getElementById('tempPasswordSection');
        if (tempSection) tempSection.style.display = 'none';
        document.getElementById('memberTempPassword').value = '';
        document.getElementById('memberModalTitle').innerHTML = '<i class="fas fa-user-pen"></i> Modifier le membre';
        memberModal.show();
    }

    // Génère un email interne non visible si le membre n'en a pas
    function makePlaceholderEmail(username, fullName) {
        const base = (username || fullName.toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/\s+/g, '.').replace(/[^a-z0-9._-]/g, ''));
        const rand = Math.random().toString(36).slice(2, 7);
        return `${base}.${rand}@noemail.skyorbit.internal`;
    }

    function isPlaceholderEmail(email) {
        return email && email.endsWith('@noemail.skyorbit.internal');
    }

    async function saveMember() {
        const form = document.getElementById('memberForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('memberId').value;
        const username = document.getElementById('memberUsername').value.trim().toLowerCase();
        const tempPassword = document.getElementById('memberTempPassword').value.trim();
        const fullName = document.getElementById('memberFullName').value.trim();
        let email = document.getElementById('memberEmail').value.trim().toLowerCase();

        // Email optionnel : générer un placeholder interne si vide
        if (!email) {
            if (!username && !id) {
                showErrorToast('Renseignez au moins un identifiant ou un email.');
                return;
            }
            email = makePlaceholderEmail(username, fullName);
        }

        const fields = {
            full_name: fullName,
            email,
            phone: document.getElementById('memberPhone').value.trim(),
            role: document.getElementById('memberRole').value,
            license_number: document.getElementById('memberLicenseNumber').value.trim(),
            license_expiry: document.getElementById('memberLicenseExpiry').value || null,
            medical_expiry: document.getElementById('memberMedicalExpiry').value || null,
            qualifications: document.getElementById('memberQualifications').value.trim(),
            username: username || null
        };

        try {
            showLoading();
            if (id) {
                const updated = await DB.updateMember(id, fields);
                const idx = members.findIndex(m => m.id === id);
                if (idx >= 0) members[idx] = updated;
                showSuccessToast('Membre mis à jour avec succès');
                sortMembers();
                memberModal.hide();
                renderAll();
            } else {
                const created = await DB.createMemberWithAccount({ ...fields, temp_password: tempPassword || null });
                members.push(created);
                sortMembers();
                memberModal.hide();
                renderAll();
                if (tempPassword && username) {
                    // Afficher la modale de confirmation des identifiants
                    showCredentialsResult(fullName, username, tempPassword);
                } else {
                    showSuccessToast('Membre ajouté avec succès');
                }
            }
        } catch (e) {
            showErrorToast(e.message);
        } finally {
            hideLoading();
        }
    }

    // ---------- Cotisations ----------

    function toggleCotisation(id) {
        const m = findMember(id);
        if (!m) {
            showErrorToast('Membre introuvable');
            return;
        }
        const cot = cotisationFor(id);
        const paid = !!(cot && cot.status === 'paid');

        if (paid) {
            confirmDialog(`Marquer la cotisation ${CURRENT_YEAR} de ${m.full_name} comme impayée ?`, async () => {
                try {
                    showLoading();
                    const saved = await DB.setCotisation({
                        member_id: id,
                        year: CURRENT_YEAR,
                        amount: cot.amount != null ? cot.amount : DEFAULT_COTISATION,
                        status: 'unpaid',
                        paid_at: null
                    });
                    upsertLocalCotisation(saved);
                    renderAll();
                    showSuccessToast('Cotisation marquée comme impayée');
                } catch (e) {
                    showErrorToast(e.message);
                } finally {
                    hideLoading();
                }
            });
        } else {
            document.getElementById('cotisationMemberId').value = m.id;
            document.getElementById('cotisationMemberName').textContent = m.full_name || '';
            document.getElementById('cotisationAmount').value =
                cot && cot.amount != null ? cot.amount : DEFAULT_COTISATION;
            cotisationModal.show();
        }
    }

    async function saveCotisation() {
        const form = document.getElementById('cotisationForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const memberId = document.getElementById('cotisationMemberId').value;
        const amount = parseFloat(document.getElementById('cotisationAmount').value);

        try {
            showLoading();
            const saved = await DB.setCotisation({
                member_id: memberId,
                year: CURRENT_YEAR,
                amount: isNaN(amount) ? DEFAULT_COTISATION : amount,
                status: 'paid',
                paid_at: new Date().toISOString().slice(0, 10)
            });
            upsertLocalCotisation(saved);
            cotisationModal.hide();
            renderAll();
            showSuccessToast(`Cotisation ${CURRENT_YEAR} marquée comme payée`);
        } catch (e) {
            showErrorToast(e.message);
        } finally {
            hideLoading();
        }
    }

    // ---------- Confirmation des identifiants après création ----------

    function showCredentialsResult(fullName, username, password) {
        _lastCreatedCredentials = { fullName, username, password };
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('crMemberName', fullName);
        set('crUsername', username);
        set('crPassword', password);
        set('crUrl', window.location.origin || 'sky-orbit.vercel.app');
        if (credentialsResultModal) credentialsResultModal.show();
    }

    window.copyMemberCredentials = function () {
        if (!_lastCreatedCredentials) return;
        const { fullName, username, password } = _lastCreatedCredentials;
        const url = window.location.origin || 'sky-orbit.vercel.app';
        const text = `SkyOrbit — accès de ${fullName}\nIdentifiant : ${username}\nMot de passe : ${password}\nURL : ${url}`;
        navigator.clipboard.writeText(text).then(() => showSuccessToast('Identifiants copiés dans le presse-papier'));
    };

    // ---------- Réinitialisation des accès ----------

    function openResetCredentialsModal(id) {
        const m = findMember(id);
        if (!m) {
            showErrorToast('Membre introuvable');
            return;
        }
        document.getElementById('resetMemberId').value = m.id;
        document.getElementById('resetMemberName').textContent = m.full_name || '';
        document.getElementById('resetTempPassword').value = '';
        resetCredentialsModal.show();
    }

    async function saveResetCredentials() {
        const form = document.getElementById('resetCredentialsForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        const memberId = document.getElementById('resetMemberId').value;
        const tempPassword = document.getElementById('resetTempPassword').value.trim();

        try {
            showLoading();
            await DB.adminResetCredentials(memberId, tempPassword);
            const m = findMember(memberId);
            if (m) m.must_change_password = true;
            resetCredentialsModal.hide();
            renderAll();
            showSuccessToast(`Accès réinitialisés. Mot de passe temporaire : ${tempPassword}`);
        } catch (e) {
            showErrorToast(e.message);
        } finally {
            hideLoading();
        }
    }

    // ---------- Activation / désactivation ----------

    function toggleActive(id) {
        const m = findMember(id);
        if (!m) {
            showErrorToast('Membre introuvable');
            return;
        }
        const question = m.active
            ? `Désactiver ${m.full_name} ? Il ne pourra plus se connecter.`
            : `Réactiver ${m.full_name} ?`;

        confirmDialog(question, async () => {
            try {
                showLoading();
                const updated = await DB.updateMember(id, { active: !m.active });
                const idx = members.findIndex(x => x.id === id);
                if (idx >= 0) members[idx] = updated;
                renderAll();
                showSuccessToast(updated.active ? 'Membre réactivé' : 'Membre désactivé');
            } catch (e) {
                showErrorToast(e.message);
            } finally {
                hideLoading();
            }
        });
    }

    // ---------- Événements ----------

    function onTableClick(event) {
        const btn = event.target.closest('button[data-action]');
        if (!btn || !isAdmin()) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'edit') openEditMemberModal(id);
        else if (action === 'cotisation') toggleCotisation(id);
        else if (action === 'reset-credentials') openResetCredentialsModal(id);
        else if (action === 'toggle-active') toggleActive(id);
    }

    // ---------- Initialisation ----------

    async function init() {
        const session = await window.appReady;
        if (!session) return;

        memberModal = new bootstrap.Modal(document.getElementById('memberModal'));
        cotisationModal = new bootstrap.Modal(document.getElementById('cotisationModal'));
        resetCredentialsModal = new bootstrap.Modal(document.getElementById('resetCredentialsModal'));
        credentialsResultModal = new bootstrap.Modal(document.getElementById('credentialsResultModal'));

        // Auto-suggestion de l'identifiant depuis le nom complet
        document.getElementById('memberFullName').addEventListener('input', function () {
            const uEl = document.getElementById('memberUsername');
            if (uEl && !uEl.dataset.manual) {
                uEl.value = this.value.trim()
                    .toLowerCase()
                    .normalize('NFD').replace(/[̀-ͯ]/g, '')
                    .replace(/\s+/g, '.')
                    .replace(/[^a-z0-9._-]/g, '')
                    .slice(0, 32);
            }
        });
        document.getElementById('memberUsername').addEventListener('input', function () {
            this.dataset.manual = 'true';
        });

        document.querySelectorAll('.cotisation-year').forEach(el => {
            el.textContent = CURRENT_YEAR;
        });

        document.getElementById('memberSearch').addEventListener('input', function () {
            searchTerm = this.value.trim().toLowerCase();
            renderTable();
        });

        document.getElementById('membersTableBody').addEventListener('click', onTableClick);

        try {
            showLoading();
            const [memberList, cotisationList] = await Promise.all([
                DB.listMembers(),
                DB.listCotisations(CURRENT_YEAR)
            ]);
            members = memberList;
            cotisations = cotisationList;
            sortMembers();
            renderAll();
        } catch (e) {
            showErrorToast(e.message);
        } finally {
            hideLoading();
        }

        // Ouverture directe de la modal d'ajout via members.html?action=add (admin uniquement)
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'add' && isAdmin()) {
            openAddMemberModal();
        }
    }

    // Génère un mot de passe temporaire de 8 caractères
    function makeTemp() {
        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        let pwd = '';
        const arr = new Uint8Array(8);
        crypto.getRandomValues(arr);
        arr.forEach(b => { pwd += chars[b % chars.length]; });
        return pwd;
    }

    window.generateTempPassword = function () {
        document.getElementById('memberTempPassword').value = makeTemp();
    };

    window.generateResetPassword = function () {
        document.getElementById('resetTempPassword').value = makeTemp();
    };

    // Fonctions appelées depuis le HTML (onclick)
    window.openAddMemberModal = openAddMemberModal;
    window.saveMember = saveMember;
    window.saveCotisation = saveCotisation;
    window.saveResetCredentials = saveResetCredentials;

    init();
})();
