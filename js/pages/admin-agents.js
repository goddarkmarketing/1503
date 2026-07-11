let agentsCache = [];
let agentsPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('agentsTableBody');
  if (!tbody) return;

  document.getElementById('btnAddAgent')?.addEventListener('click', openAddAgentModal);
  try {
    await renderAgents();
    document.getElementById('ledgerAgentFilter')?.addEventListener('change', renderMiniLedger);
    await renderMiniLedger();
  } catch (err) {
    console.error(err);
    App.TableUI.showEmpty(
      tbody,
      7,
      `โหลดข้อมูลไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาด'}`
    );
  }
});

async function renderAgents() {
  const tbody = document.getElementById('agentsTableBody');
  App.TableUI.showLoading(tbody, 7);
  agentsCache = await App.AgentService.getAgents();
  renderAgentsTable();
  populateAgentFilter();
}

function renderAgentsTable() {
  const tbody = document.getElementById('agentsTableBody');
  const pg = App.TableUI.paginate(agentsCache, agentsPage);

  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 7);
    document.getElementById('agentsPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pg.items.map((a) => `
    <tr data-agent-id="${a.id}">
      <td>${a.code}</td>
      <td title="${a.name}">${a.name}</td>
      <td>${a.phone || '-'}</td>
      <td class="agent-balance">${App.Shell.formatCurrency(a.balance)}</td>
      <td class="agent-credit">${App.AdminUtils.creditLimitGauge(a.balance, a.creditLimit)}</td>
      <td><span class="status-pill ${a.status}">${a.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span></td>
      <td>
        <div class="btn-group">
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
    btn.addEventListener('click', () => toggleStatus(btn.dataset.id, btn.dataset.status));
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
      <td>${e.createdByName}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">ไม่มีรายการ</td></tr>';
}

function openAdjustModal(agentId) {
  const agent = agentsCache.find((a) => a.id === agentId);
  if (!agent) return;

  const overlay = App.Modal.open({
    title: `ปรับวงเงิน — ${agent.name}`,
    body: `
      <p class="admin-hint" style="margin-top:0">ยอดปัจจุบัน: <strong>${App.Shell.formatCurrency(agent.balance)}</strong> บาท</p>
      <form id="adjustForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr">
        <div class="form-field">
          <label>ประเภท</label>
          <select name="adjustType" required>
            <option value="credit">เพิ่มวงเงิน</option>
            <option value="debit">ลดวงเงิน</option>
          </select>
        </div>
        <div class="form-field">
          <label>จำนวนเงิน (บาท)</label>
          <input type="number" name="amount" min="0" step="0.01" value="1000" required>
        </div>
        <div class="form-field">
          <label>หมายเหตุ</label>
          <textarea name="note" rows="2" placeholder="ระบุเหตุผล"></textarea>
        </div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmAdjust">บันทึก</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#confirmAdjust')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#adjustForm');
    let amount = parseFloat(form.amount.value);
    if (Number.isNaN(amount) || amount <= 0) return alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
    if (form.adjustType.value === 'debit') amount = -amount;

    try {
      const res = await App.AgentService.adjustBalance(agentId, amount, form.note.value.trim());
      const row = document.querySelector(`tr[data-agent-id="${agentId}"]`);
      row?.querySelector('.agent-balance')?.replaceChildren(document.createTextNode(App.Shell.formatCurrency(res.balance)));
      const idx = agentsCache.findIndex((a) => a.id === agentId);
      if (idx >= 0) agentsCache[idx].balance = res.balance;
      await renderMiniLedger();
      App.Modal.close();
    } catch (err) {
      alert(err.message);
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

    if (saveBtn.disabled) return;

    saveBtn.disabled = true;
    const originalLabel = saveBtn.textContent;
    saveBtn.textContent = 'กำลังบันทึก...';

    try {
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
      saveBtn.textContent = 'บันทึกแล้ว';

      await new Promise((resolve) => window.setTimeout(resolve, 700));
      App.Modal.close();
      renderAgentsTable();
      App.AdminUtils.showToast(
        noneEnabled
          ? `บันทึกสิทธิ์ของ ${agent.code} แล้ว (ปิดทุกฟังก์ชัน — นายหน้าเข้าระบบไม่ได้)`
          : `บันทึกสิทธิ์ของ ${agent.code} เรียบร้อยแล้ว`
      );
    } catch (err) {
      console.error(err);
      App.AdminUtils.showToast(err?.message || 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel;
    }
  });
}

function openEditModal(agentId) {
  const agent = agentsCache.find((a) => a.id === agentId);
  if (!agent) return;

  const overlay = App.Modal.open({
    title: `แก้ไขนายหน้า — ${agent.code}`,
    body: `
      <form id="editAgentForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr">
        <div class="form-field"><label>ชื่อ-นามสกุล</label><input name="name" value="${agent.name}" required></div>
        <div class="form-field"><label>อีเมล</label><input name="email" type="email" value="${agent.email || ''}"></div>
        <div class="form-field"><label>โทรศัพท์</label><input name="phone" value="${agent.phone || ''}"></div>
        <div class="form-field"><label>วงเงินสูงสุด (Credit Limit)</label><input name="creditLimit" type="number" min="0" step="0.01" value="${agent.creditLimit || 0}"></div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmEdit">บันทึก</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#confirmEdit')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#editAgentForm');
    try {
      await App.AgentService.updateAgent(agentId, {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        creditLimit: parseFloat(form.creditLimit.value) || 0
      });
      await renderAgents();
      App.Modal.close();
    } catch (err) {
      alert(err.message);
    }
  });
}

function openAddAgentModal() {
  const overlay = App.Modal.open({
    title: 'เพิ่มนายหน้าใหม่',
    body: `
      <form id="addAgentForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr">
        <div class="form-field"><label>รหัสนายหน้า</label><input name="code" required placeholder="เช่น Ag4-301"></div>
        <div class="form-field"><label>ชื่อ-นามสกุล</label><input name="name" required></div>
        <div class="form-field"><label>อีเมล</label><input name="email" type="email"></div>
        <div class="form-field"><label>โทรศัพท์</label><input name="phone"></div>
        <div class="form-field"><label>วงเงินเริ่มต้น (บาท)</label><input name="initialBalance" type="number" min="0" step="0.01" value="0"></div>
        <div class="form-field"><label>วงเงินสูงสุด (Credit Limit)</label><input name="creditLimit" type="number" min="0" step="0.01" value="50000"></div>
        <div class="form-field"><label>รหัสผ่านเริ่มต้น</label><input name="password" value="demo"></div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmAdd">สร้างบัญชี</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#confirmAdd')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#addAgentForm');
    try {
      await App.AgentService.createAgent({
        code: form.code.value.trim(),
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        initialBalance: parseFloat(form.initialBalance.value) || 0,
        creditLimit: parseFloat(form.creditLimit.value) || 50000,
        password: form.password.value || 'demo'
      });
      await renderAgents();
      await renderMiniLedger();
      App.Modal.close();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function toggleStatus(agentId, currentStatus) {
  const agent = agentsCache.find((a) => a.id === agentId);
  const next = currentStatus === 'active' ? 'inactive' : 'active';
  const label = next === 'active' ? 'เปิดใช้งาน' : 'ระงับ';
  if (!confirm(`${label}บัญชี ${agent?.code}?`)) return;

  try {
    await App.AgentService.setAgentStatus(agentId, next);
    await renderAgents();
  } catch (err) {
    alert(err.message);
  }
}
