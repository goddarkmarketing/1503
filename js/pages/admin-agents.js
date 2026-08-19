let agentsCache = [];
let agentsPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('agentsTableBody');
  if (!tbody) return;

  document.getElementById('btnAddAgent')?.addEventListener('click', openAddAgentModal);
  try {
    await renderAgents();
  } catch (err) {
    console.error(err);
    App.TableUI.showEmpty(
      tbody,
      8,
      `โหลดข้อมูลไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาด'}`
    );
    return;
  }
  document.getElementById('ledgerAgentFilter')?.addEventListener('change', renderMiniLedger);
  try {
    await renderMiniLedger();
  } catch (err) {
    console.error(err);
  }
});

function generateNextAgentCode() {
  const usedCodes = new Set((agentsCache || []).map((a) => a?.code).filter(Boolean));
  const codeRe = /^([A-Za-z]+)(\d+)-(\d+)$/;

  let maxGroup = 0;
  let maxSeq = 0;
  const prefixCounts = {};

  for (const code of usedCodes) {
    const m = String(code).match(codeRe);
    if (!m) continue;
    const prefix = m[1];
    const group = Number(m[2]);
    const seq = Number(m[3]);
    prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
    if (Number.isFinite(group)) maxGroup = Math.max(maxGroup, group);
    if (Number.isFinite(seq)) maxSeq = Math.max(maxSeq, seq);
  }

  // Prefer the most common prefix in existing data (e.g. 'Ag' over 'Ck').
  const prefix = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ag';
  const nextGroup = (maxGroup || 0) + 1;
  const baseSeq = (maxSeq || 0) + 1;
  const pad3 = (n) => String(n).padStart(3, '0');

  for (let i = 0; i < 100; i++) {
    const candidateSeq = baseSeq + i;
    const candidate = `${prefix}${nextGroup}-${pad3(candidateSeq)}`;
    if (!usedCodes.has(candidate)) return candidate;
  }

  // Fallback (should be rare): keep the same format but use a time-based seq.
  const fallbackSeq = baseSeq + (Date.now() % 1000);
  return `${prefix}${nextGroup}-${pad3(fallbackSeq)}`;
}

async function renderAgents() {
  const tbody = document.getElementById('agentsTableBody');
  App.TableUI.showLoading(tbody, 8);
  agentsCache = await App.AgentService.getAgents();
  renderAgentsTable();
  populateAgentFilter();
}

function findAgent(id) {
  return (agentsCache || []).find((a) => a.id === id) || null;
}

function parentLabel(agent) {
  if (!agent?.parentId) return 'หัวทีม';
  const parent = findAgent(agent.parentId);
  return parent ? `${parent.code}` : '-';
}

function memberCount(agentId) {
  return (agentsCache || []).filter((a) => a.parentId === agentId).length;
}

function parentOptionsHtml(agentId, selectedParentId) {
  const blocked = new Set([agentId]);
  const collectDescendants = (id) => {
    (agentsCache || []).forEach((a) => {
      if (a.parentId === id && !blocked.has(a.id)) {
        blocked.add(a.id);
        collectDescendants(a.id);
      }
    });
  };
  if (agentId) collectDescendants(agentId);

  const options = (agentsCache || [])
    .filter((a) => !blocked.has(a.id) && a.status !== 'inactive')
    .map((a) => {
      const selected = a.id === selectedParentId ? ' selected' : '';
      return `<option value="${a.id}"${selected}>${escapeHtml(a.code)} — ${escapeHtml(a.name)}</option>`;
    })
    .join('');

  return `
    <option value="">ไม่ขึ้นกับใคร — เป็นหัวทีม</option>
    ${options}
  `;
}

function teamSectionHtml(agent) {
  const members = agent
    ? (agentsCache || []).filter((a) => a.parentId === agent.id)
    : [];
  const parent = agent?.parentId ? findAgent(agent.parentId) : null;
  const roleText = parent
    ? `ตอนนี้เป็นลูกทีมของ ${parent.name} (${parent.code})`
    : 'ตอนนี้เป็นหัวทีม';
  const memberList = members.length
    ? `<ul class="agent-team-chips">${members.map((m) => `<li>${escapeHtml(m.name)} <em>${escapeHtml(m.code)}</em></li>`).join('')}</ul>`
    : '<p class="form-field__hint">ยังไม่มีลูกทีม ถ้าต้องการให้คนอื่นขึ้นกับบัญชีนี้ ให้ไปเปิดบัญชีนั้นแล้วเลือกหัวหน้าเป็นคนนี้</p>';

  return `
    <section class="agent-form__section">
      <div class="agent-form__sectionHead">
        <h3 class="agent-form__sectionTitle">1. ทีม</h3>
        <span class="agent-form__sectionBadge">${escapeHtml(parent ? 'ลูกทีม' : 'หัวทีม')}</span>
      </div>
      <p class="agent-form__sectionHint">${escapeHtml(roleText)}</p>
      <div class="agent-form__grid">
        <div class="form-field full">
          <label for="teamParentId">ขึ้นกับหัวหน้าคนไหน?</label>
          <select id="teamParentId" name="parentId">
            ${parentOptionsHtml(agent?.id, agent?.parentId || '')}
          </select>
          <span class="form-field__hint">ไม่เลือก = นายหน้าคนนี้เป็นหัวทีมเอง</span>
        </div>
        <div class="form-field full">
          <label>ลูกทีมที่ขึ้นกับคนนี้ (${members.length})</label>
          ${memberList}
        </div>
      </div>
    </section>
  `;
}

function renderAgentsTable() {
  const tbody = document.getElementById('agentsTableBody');
  const pg = App.TableUI.paginate(agentsCache, agentsPage);

  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 8);
    document.getElementById('agentsPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pg.items.map((a) => `
    <tr data-agent-id="${a.id}">
      <td>${a.code}</td>
      <td title="${a.name}">${a.name}</td>
      <td>
        <div class="admin-agent-cell">
          <span class="admin-agent-cell__code">${parentLabel(a)}</span>
          <span class="admin-agent-cell__name">ลูกทีม ${memberCount(a.id)} คน</span>
        </div>
      </td>
      <td>${a.phone || '-'}</td>
      <td class="agent-balance">${App.Shell.formatCurrency(a.balance)}</td>
      <td class="agent-credit">${App.AdminUtils.creditLimitGauge(a.balance, a.creditLimit)}</td>
      <td><span class="status-pill ${a.status}">${a.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span></td>
      <td>
        <div class="btn-group">
          <button type="button" class="btn-secondary btn-sm btn-team" data-id="${a.id}">ทีม/คอม</button>
          <button type="button" class="btn-secondary btn-sm btn-perms" data-id="${a.id}">สิทธิ์</button>
          <button type="button" class="btn-secondary btn-sm btn-adjust" data-id="${a.id}">ปรับวงเงิน</button>
          <button type="button" class="btn-secondary btn-sm btn-edit" data-id="${a.id}">แก้ไข</button>
          <button type="button" class="btn-sm ${a.status === 'active' ? 'btn-danger' : 'btn-success-outline'} btn-toggle" data-id="${a.id}" data-status="${a.status}">
            ${a.status === 'active' ? 'ระงับ' : 'เปิดใช้'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-team').forEach((btn) => {
    btn.addEventListener('click', () => openTeamSettingsModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.btn-perms').forEach((btn) => {
    btn.addEventListener('click', () => openPermissionsModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.btn-adjust').forEach((btn) => {
    btn.addEventListener('click', () => openAdjustModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.btn-toggle').forEach((btn) => {
    btn.addEventListener('click', () => toggleStatus(btn.dataset.id, btn.dataset.status, btn));
  });

  App.TableUI.renderPagination(document.getElementById('agentsPagination'), {
    ...pg,
    onChange: (p) => { agentsPage = p; renderAgentsTable(); }
  });
}

function populateAgentFilter() {
  const select = document.getElementById('ledgerAgentFilter');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">ทุกนายหน้า</option>' +
    agentsCache.map((a) => `<option value="${a.id}">${a.code} — ${a.name}</option>`).join('');
  select.value = current;
}

async function renderMiniLedger() {
  const tbody = document.getElementById('ledgerTableBody');
  if (!tbody) return;

  const agentId = document.getElementById('ledgerAgentFilter')?.value || '';
  const entries = await App.AuditService.getCreditLedger({ agentId });

  tbody.innerHTML = entries.slice(0, 10).map((e) => `
    <tr>
      <td>${App.AdminUtils.formatDateTime(e.createdAt)}</td>
      <td>${e.agentCode}</td>
      <td class="${e.amount >= 0 ? 'amount-positive' : 'amount-negative'}">${e.amount >= 0 ? '+' : ''}${App.Shell.formatCurrency(e.amount)}</td>
      <td>${App.Shell.formatCurrency(e.balanceAfter)}</td>
      <td>${e.note || '-'}</td>
      <td>${App.CreditSlip ? App.CreditSlip.buttonHtml(e) : '-'}</td>
      <td>${e.createdByName}</td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">ไม่มีรายการ</td></tr>';
  App.CreditSlip?.bindButtons(tbody, entries.slice(0, 10));
}

function openAdjustModal(agentId) {
  const agent = agentsCache.find((a) => a.id === agentId);
  if (!agent) return;

  let selectedSlip = null;

  const overlay = App.Modal.open({
    title: `ปรับวงเงิน — ${agent.name}`,
    body: `
      <p class="admin-hint" style="margin-top:0">ยอดปัจจุบัน: <strong>${App.Shell.formatCurrency(agent.balance)}</strong> บาท</p>
      <form id="adjustForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr">
        <div class="form-field">
          <label>ประเภท</label>
          <select name="adjustType" required>
            <option value="credit">เพิ่มวงเงิน</option>
            <option value="debit">จ่ายเงินให้นายหน้า (ลดวงเงิน)</option>
          </select>
        </div>
        <div class="form-field">
          <label>จำนวนเงิน (บาท)</label>
          <input type="number" name="amount" min="0" step="0.01" value="1000" required>
        </div>
        <div class="form-field">
          <label>หมายเหตุ</label>
          <textarea name="note" rows="2" placeholder="เช่น โอนคอมมิชชันงวด..."></textarea>
        </div>
        <div class="form-field" id="adjustSlipField" hidden>
          <label for="adjustSlipInput">หลักฐานการโอนเงิน <span class="req">*</span></label>
          <p class="admin-hint" style="margin:0 0 8px">แนบสลิปหลังโอนแล้ว นายหน้าจะเห็นหลักฐานนี้ในประวัติวงเงิน</p>
          <label class="adjust-slip-upload" id="adjustSlipUpload" for="adjustSlipInput">
            <input type="file" id="adjustSlipInput" accept="image/jpeg,image/png,image/webp,application/pdf" hidden>
            <span>คลิกเพื่ออัปโหลดสลิป (JPG, PNG, WEBP, PDF สูงสุด 5 MB)</span>
          </label>
          <div class="adjust-slip-preview" id="adjustSlipPreview" hidden>
            <img id="adjustSlipPreviewImg" alt="ตัวอย่างสลิป">
            <div class="adjust-slip-preview__meta">
              <span id="adjustSlipFileName">-</span>
              <button type="button" class="btn-text" id="adjustSlipClear">ลบไฟล์</button>
            </div>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmAdjust">บันทึก</button>
    `
  });

  const typeSelect = overlay.querySelector('[name="adjustType"]');
  const slipField = overlay.querySelector('#adjustSlipField');
  const slipInput = overlay.querySelector('#adjustSlipInput');
  const slipUpload = overlay.querySelector('#adjustSlipUpload');
  const slipPreview = overlay.querySelector('#adjustSlipPreview');
  const slipPreviewImg = overlay.querySelector('#adjustSlipPreviewImg');
  const slipFileNameEl = overlay.querySelector('#adjustSlipFileName');

  function clearSlip() {
    selectedSlip = null;
    if (slipInput) slipInput.value = '';
    if (slipPreview) slipPreview.hidden = true;
    if (slipPreviewImg) {
      slipPreviewImg.removeAttribute('src');
      slipPreviewImg.hidden = false;
    }
    if (slipFileNameEl) slipFileNameEl.textContent = '-';
    slipUpload?.classList.remove('has-file');
  }

  function syncSlipField() {
    const isDebit = typeSelect?.value === 'debit';
    if (slipField) slipField.hidden = !isDebit;
    if (!isDebit) clearSlip();
  }

  async function onSlipSelected(file) {
    try {
      selectedSlip = await App.CreditSlip.readFile(file);
      if (slipPreview) slipPreview.hidden = false;
      if (slipFileNameEl) slipFileNameEl.textContent = selectedSlip.fileName;
      if (slipPreviewImg) {
        if (selectedSlip.mimeType === 'application/pdf') {
          slipPreviewImg.hidden = true;
          slipPreviewImg.removeAttribute('src');
        } else {
          slipPreviewImg.hidden = false;
          slipPreviewImg.src = selectedSlip.dataUrl;
        }
      }
      slipUpload?.classList.add('has-file');
    } catch (err) {
      clearSlip();
      App.AdminUtils.showToast(err.message || 'อัปโหลดสลิปไม่สำเร็จ', 'error');
    }
  }

  typeSelect?.addEventListener('change', syncSlipField);
  syncSlipField();
  slipInput?.addEventListener('change', () => {
    const file = slipInput.files?.[0];
    if (file) onSlipSelected(file);
  });
  overlay.querySelector('#adjustSlipClear')?.addEventListener('click', clearSlip);

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#confirmAdjust')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#adjustForm');
    const btn = overlay.querySelector('#confirmAdjust');
    let amount = parseFloat(form.amount.value);
    if (Number.isNaN(amount) || amount <= 0) return alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
    const isDebit = form.adjustType.value === 'debit';
    if (isDebit && !selectedSlip) {
      App.AdminUtils.showToast('กรุณาแนบหลักฐานการโอนเงิน', 'error');
      return;
    }
    if (isDebit) amount = -amount;

    try {
      await App.ButtonUI.withLoading(btn, async () => {
        const res = await App.AgentService.adjustBalance(agentId, amount, form.note.value.trim(), {
          slip: selectedSlip
        });
        const row = document.querySelector(`tr[data-agent-id="${agentId}"]`);
        row?.querySelector('.agent-balance')?.replaceChildren(document.createTextNode(App.Shell.formatCurrency(res.balance)));
        const idx = agentsCache.findIndex((a) => a.id === agentId);
        if (idx >= 0) agentsCache[idx].balance = res.balance;
        await renderMiniLedger();
        App.Modal.close();
        App.AdminUtils.showToast(
          isDebit ? `บันทึกการโอนเงิน ${agent.code} แล้ว นายหน้าเห็นสลิปได้ในประวัติวงเงิน` : `ปรับวงเงิน ${agent.code} เรียบร้อยแล้ว`
        );
      }, { label: 'กำลังบันทึก...' });
    } catch (err) {
      App.AdminUtils.showToast(err.message || 'ปรับวงเงินไม่สำเร็จ', 'error');
    }
  });
}

function openPermissionsModal(agentId) {
  const agent = agentsCache.find((a) => a.id === agentId);
  if (!agent) {
    alert('ไม่พบข้อมูลนายหน้า');
    return;
  }
  if (!App.AgentFeatures) {
    alert('ระบบสิทธิ์ยังไม่พร้อม กรุณารีเฟรชหน้า (Ctrl+F5)');
    return;
  }

  const overlay = App.Modal.open({
    title: `กำหนดสิทธิ์ฟังก์ชัน — ${agent.code}`,
    size: 'wide',
    body: `
      <form id="agentPermForm" novalidate>
        ${App.AgentFeatures.renderPermissionsTable(agent.featurePermissions)}
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmPerms">บันทึกสิทธิ์</button>
    `
  });

  const form = overlay.querySelector('#agentPermForm');
  if (!form) {
    alert('ไม่สามารถเปิดฟอร์มสิทธิ์ได้');
    App.Modal.close();
    return;
  }

  form.addEventListener('submit', (e) => e.preventDefault());

  try {
    App.AgentFeatures.bindPermissionsForm(form);
  } catch (err) {
    console.error(err);
  }

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());

  overlay.addEventListener('click', async (e) => {
    const saveBtn = e.target.closest('#confirmPerms');
    if (!saveBtn) return;
    e.preventDefault();

    if (saveBtn.classList.contains('is-loading') || saveBtn.disabled) return;

    try {
      await App.ButtonUI.withLoading(saveBtn, async () => {
        const featurePermissions = App.AgentFeatures.readPermissionsFromForm(form);
        const noneEnabled = App.AgentFeatures.countEnabled(featurePermissions) === 0;

        const updated = await App.AgentService.updateAgent(agentId, { featurePermissions });
        const idx = agentsCache.findIndex((a) => a.id === agentId);
        if (idx >= 0) agentsCache[idx] = { ...agentsCache[idx], ...updated };

        let statusEl = form.querySelector('.agent-perm__status');
        if (!statusEl) {
          statusEl = document.createElement('div');
          statusEl.className = 'agent-perm__status agent-perm__status--success';
          form.prepend(statusEl);
        }
        statusEl.textContent = noneEnabled
          ? 'บันทึกแล้ว — นายหน้าจะเข้าระบบไม่ได้จนกว่าจะเปิดสิทธิ์อย่างน้อย 1 รายการ'
          : 'บันทึกสิทธิ์เรียบร้อยแล้ว';

        await new Promise((resolve) => window.setTimeout(resolve, 500));
        App.Modal.close();
        renderAgentsTable();
        App.AdminUtils.showToast(
          noneEnabled
            ? `บันทึกสิทธิ์ของ ${agent.code} แล้ว (ปิดทุกฟังก์ชัน — นายหน้าเข้าระบบไม่ได้)`
            : `บันทึกสิทธิ์ของ ${agent.code} เรียบร้อยแล้ว`
        );
      }, { label: 'กำลังบันทึก...', minMs: 350 });
    } catch (err) {
      console.error(err);
      App.AdminUtils.showToast(err?.message || 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง', 'error');
    }
  });
}

function openEditModal(agentId) {
  const agent = agentsCache.find((a) => a.id === agentId);
  if (!agent) return;

  const overlay = App.Modal.open({
    title: `แก้ไขนายหน้า — ${agent.code}`,
    size: 'wide',
    body: `
      <form id="editAgentForm" class="agent-form" novalidate>
        <p class="agent-form__intro">อัปเดตข้อมูลติดต่อและวงเงินสูงสุดของบัญชี <strong>${agent.code}</strong></p>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">ข้อมูลติดต่อ</h3>
          </div>
          <div class="agent-form__grid">
            <div class="form-field full">
              <label for="editName">ชื่อ-นามสกุล <span class="form-req" aria-hidden="true">*</span></label>
              <input id="editName" name="name" value="${escapeHtml(agent.name)}" required autocomplete="name" placeholder="ชื่อจริง นามสกุล">
            </div>
            <div class="form-field">
              <label for="editEmail">อีเมล</label>
              <input id="editEmail" name="email" type="email" value="${escapeHtml(agent.email || '')}" autocomplete="email" placeholder="name@example.com">
            </div>
            <div class="form-field">
              <label for="editPhone">โทรศัพท์</label>
              <input id="editPhone" name="phone" value="${escapeHtml(agent.phone || '')}" inputmode="tel" autocomplete="tel" placeholder="08x-xxx-xxxx">
            </div>
          </div>
        </section>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">วงเงิน</h3>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="editCreditLimit">วงเงินสูงสุด (บาท)</label>
              <input id="editCreditLimit" name="creditLimit" type="number" min="0" step="0.01" value="${agent.creditLimit || 0}">
              <span class="form-field__hint">Credit Limit ของบัญชีนี้</span>
            </div>
            <div class="form-field">
              <label>วงเงินคงเหลือ</label>
              <div class="agent-form__readonly">${App.Shell.formatCurrency(agent.balance)}</div>
              <span class="form-field__hint">ปรับได้จากปุ่ม “ปรับวงเงิน”</span>
            </div>
          </div>
        </section>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">รหัสผ่าน</h3>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="editPassword">ตั้งรหัสผ่านใหม่</label>
              <input id="editPassword" name="password" type="text" autocomplete="new-password" spellcheck="false" placeholder="เว้นว่างหากไม่เปลี่ยน">
              <span class="form-field__hint">แอดมินเป็นผู้ตั้งรหัสผ่านทั้งหมด นายหน้าเปลี่ยนเองไม่ได้</span>
            </div>
          </div>
        </section>

        ${teamSectionHtml(agent)}

        ${App.AgentCommissionRates ? App.AgentCommissionRates.renderFormSection(agent.commissionRates) : ''}
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmEdit">บันทึกการแก้ไข</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  App.AgentCommissionRates?.bindForm(overlay);
  overlay.querySelector('#confirmEdit')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#editAgentForm');
    const btn = overlay.querySelector('#confirmEdit');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    try {
      await App.ButtonUI.withLoading(btn, async () => {
        const payload = {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
          creditLimit: parseFloat(form.creditLimit.value) || 0,
          parentId: form.parentId?.value || null,
          commissionRates: App.AgentCommissionRates?.readFromForm(form)
        };
        const nextPassword = String(form.password?.value || '').trim();
        if (nextPassword) payload.password = nextPassword;
        await App.AgentService.updateAgent(agentId, payload);
        await renderAgents();
        App.Modal.close();
        App.AdminUtils.showToast(`อัปเดต ${agent.code} เรียบร้อยแล้ว`);
      }, { label: 'กำลังบันทึก...' });
    } catch (err) {
      App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  });
}

function openTeamSettingsModal(agentId) {
  const agent = agentsCache.find((a) => a.id === agentId);
  if (!agent) return;

  const overlay = App.Modal.open({
    title: `ตั้งค่าทีมและค่าคอม — ${agent.name}`,
    size: 'wide',
    body: `
      <form id="teamSettingsForm" class="agent-form" novalidate>
        <p class="agent-form__intro">ตั้งให้ <strong>${escapeHtml(agent.name)}</strong> (${escapeHtml(agent.code)}) ขึ้นกับใคร และได้คอมเท่าไหร่ในแต่ละบริษัท</p>
        ${teamSectionHtml(agent)}
        ${App.AgentCommissionRates ? App.AgentCommissionRates.renderFormSection(agent.commissionRates) : ''}
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmTeamSettings">บันทึก</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  App.AgentCommissionRates?.bindForm(overlay);
  overlay.querySelector('#confirmTeamSettings')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#teamSettingsForm');
    const btn = overlay.querySelector('#confirmTeamSettings');
    try {
      await App.ButtonUI.withLoading(btn, async () => {
        await App.AgentService.updateAgent(agentId, {
          parentId: form.parentId?.value || null,
          commissionRates: App.AgentCommissionRates?.readFromForm(form)
        });
        await renderAgents();
        App.Modal.close();
        App.AdminUtils.showToast(`บันทึกทีม/คอมของ ${agent.code} แล้ว`);
      }, { label: 'กำลังบันทึก...' });
    } catch (err) {
      App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  });
}

function openAddAgentModal() {
  const overlay = App.Modal.open({
    title: 'เพิ่มนายหน้าใหม่',
    size: 'wide',
    body: `
      <form id="addAgentForm" class="agent-form" novalidate>
        <p class="agent-form__intro">สร้างบัญชีสำหรับเข้าใช้งานพอร์ทัลนายหน้า รหัสนายหน้าจะใช้เป็นชื่อผู้ใช้เข้าสู่ระบบ</p>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">ข้อมูลบัญชี</h3>
            <span class="agent-form__sectionBadge">จำเป็น</span>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="addCode">รหัสนายหน้า <span class="form-req" aria-hidden="true">*</span></label>
              <input id="addCode" name="code" required autocomplete="off" placeholder="เช่น Ag4-301" spellcheck="false">
              <span class="form-field__hint">ระบบจะสร้างรหัสให้โดยอัตโนมัติ ใช้เป็น Username เข้าสู่ระบบ</span>
            </div>
            <div class="form-field">
              <label for="addPassword">รหัสผ่านเริ่มต้น <span class="form-req" aria-hidden="true">*</span></label>
              <input id="addPassword" name="password" required value="demo" autocomplete="new-password" spellcheck="false">
              <span class="form-field__hint">แอดมินเป็นผู้ตั้งรหัสผ่าน — นายหน้าเปลี่ยนเองไม่ได้</span>
            </div>
            <div class="form-field full">
              <label for="addName">ชื่อ-นามสกุล <span class="form-req" aria-hidden="true">*</span></label>
              <input id="addName" name="name" required autocomplete="name" placeholder="ชื่อจริง นามสกุล">
            </div>
          </div>
        </section>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">ข้อมูลติดต่อ</h3>
            <span class="agent-form__sectionBadge agent-form__sectionBadge--muted">ไม่บังคับ</span>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="addEmail">อีเมล</label>
              <input id="addEmail" name="email" type="email" autocomplete="email" placeholder="name@example.com">
            </div>
            <div class="form-field">
              <label for="addPhone">โทรศัพท์</label>
              <input id="addPhone" name="phone" inputmode="tel" autocomplete="tel" placeholder="08x-xxx-xxxx">
            </div>
          </div>
        </section>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">วงเงิน</h3>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="addInitialBalance">วงเงินเริ่มต้น (บาท)</label>
              <input id="addInitialBalance" name="initialBalance" type="number" min="0" step="0.01" value="0">
              <span class="form-field__hint">ยอดคงเหลือตอนเปิดบัญชี</span>
            </div>
            <div class="form-field">
              <label for="addCreditLimit">วงเงินสูงสุด (บาท)</label>
              <input id="addCreditLimit" name="creditLimit" type="number" min="0" step="0.01" value="50000">
              <span class="form-field__hint">Credit Limit ของบัญชีนี้</span>
            </div>
          </div>
        </section>

        ${teamSectionHtml(null)}

        ${App.AgentCommissionRates ? App.AgentCommissionRates.renderFormSection() : ''}
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmAdd">สร้างบัญชี</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  const codeInput = overlay.querySelector('#addCode');
  if (codeInput) {
    // Ensure a unique code every time the modal opens.
    codeInput.value = generateNextAgentCode();
    codeInput.readOnly = true;
    codeInput.setAttribute('aria-readonly', 'true');
    codeInput.focus();
  }
  App.AgentCommissionRates?.bindForm(overlay);

  overlay.querySelector('#confirmAdd')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#addAgentForm');
    const btn = overlay.querySelector('#confirmAdd');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      await App.ButtonUI.withLoading(btn, async () => {
        const codeEl = overlay.querySelector('#addCode');
        const buildPayload = () => ({
          code: String(codeEl?.value || form.code.value || '').trim(),
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
          initialBalance: parseFloat(form.initialBalance.value) || 0,
          creditLimit: parseFloat(form.creditLimit.value) || 50000,
          password: form.password.value || 'demo',
          parentId: form.parentId?.value || null,
          commissionRates: App.AgentCommissionRates?.readFromForm(form)
        });

        let created;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            created = await App.AgentService.createAgent(buildPayload());
            break;
          } catch (err) {
            const msg = err?.message || '';
            if (msg.includes('รหัสนายหน้านี้มีอยู่แล้ว') && codeEl && attempt === 0) {
              // Try again with a different code (very unlikely, but safe for parallel admin usage).
              codeEl.value = generateNextAgentCode();
              continue;
            }
            throw err;
          }
        }

        await renderAgents();
        await renderMiniLedger();
        App.Modal.close();
        App.AdminUtils.showToast(`สร้างบัญชี ${created?.code || form.code.value.trim()} เรียบร้อยแล้ว`);
      }, { label: 'กำลังสร้าง...' });
    } catch (err) {
      const msg = err?.message || '';
      App.AdminUtils.showToast(msg || 'สร้างบัญชีไม่สำเร็จ', 'error');
    }
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function toggleStatus(agentId, currentStatus, btn) {
  const agent = agentsCache.find((a) => a.id === agentId);
  const next = currentStatus === 'active' ? 'inactive' : 'active';
  const label = next === 'active' ? 'เปิดใช้งาน' : 'ระงับ';
  if (!confirm(`${label}บัญชี ${agent?.code}?`)) return;

  try {
    await App.ButtonUI.withLoading(btn, async () => {
      await App.AgentService.setAgentStatus(agentId, next);
      await renderAgents();
      App.AdminUtils.showToast(`${label} ${agent?.code || ''} เรียบร้อยแล้ว`);
    }, { label: next === 'active' ? 'กำลังเปิดใช้...' : 'กำลังระงับ...' });
  } catch (err) {
    App.AdminUtils.showToast(err.message || 'เปลี่ยนสถานะไม่สำเร็จ', 'error');
  }
}
