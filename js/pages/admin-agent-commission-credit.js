let agentsCache = [];
let agentsPage = 1;
let commissionPageReady = false;

let agentSearchCode = '';
let agentSearchName = '';
let agentStatusFilter = '';
let agentRoleFilter = '';
let agentFiltersDebounce = null;

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('agentsCommissionTableBody');
  if (!tbody) return;

  try {
    await renderAgents();
    commissionPageReady = true;
  } catch (err) {
    console.error(err);
    App.TableUI.showEmpty(
      tbody,
      8,
      `โหลดข้อมูลไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาด'}`
    );
    return;
  }

  const bindAgentFilter = (el, setter) => {
    if (!el) return;
    const onChange = () => {
      setter(el.value);
      scheduleRender();
    };
    el.addEventListener('input', onChange);
    el.addEventListener('change', onChange);
  };

  const scheduleRender = () => {
    agentsPage = 1;
    if (agentFiltersDebounce) clearTimeout(agentFiltersDebounce);
    agentFiltersDebounce = setTimeout(() => {
      renderAgentsTable();
    }, 180);
  };

  bindAgentFilter(document.getElementById('agentSearchCode'), (v) => { agentSearchCode = v.trim(); });
  bindAgentFilter(document.getElementById('agentSearchName'), (v) => { agentSearchName = v.trim(); });
  bindAgentFilter(document.getElementById('agentStatusFilter'), (v) => { agentStatusFilter = v; });
  bindAgentFilter(document.getElementById('agentRoleFilter'), (v) => { agentRoleFilter = v; });

  document.getElementById('btnClearAgentFilters')?.addEventListener('click', () => {
    agentSearchCode = '';
    agentSearchName = '';
    agentStatusFilter = '';
    agentRoleFilter = '';

    const codeEl = document.getElementById('agentSearchCode');
    const nameEl = document.getElementById('agentSearchName');
    const statusEl = document.getElementById('agentStatusFilter');
    const roleEl = document.getElementById('agentRoleFilter');

    if (codeEl) codeEl.value = '';
    if (nameEl) nameEl.value = '';
    if (statusEl) statusEl.value = '';
    if (roleEl) roleEl.value = '';

    agentsPage = 1;
    renderAgentsTable();
  });
});

function teamMemberLimit() {
  return Number(App.Config?.TEAM_MEMBER_LIMIT) || 2;
}

function teamMemberCountLabel(count) {
  return `${count}/${teamMemberLimit()}`;
}

function findAgent(id) {
  return (agentsCache || []).find((a) => a.id === id) || null;
}

function memberCount(agentId) {
  return (agentsCache || []).filter((a) => a.parentId === agentId).length;
}

function teamCellHtml(agent) {
  const isLeader = !agent?.parentId;
  if (isLeader) {
    return `
      <div class="admin-agent-cell admin-agent-cell--team">
        <span class="admin-agent-cell__code">หัวทีม</span>
        <span class="admin-agent-cell__name">สมาชิก ${teamMemberCountLabel(memberCount(agent.id))}</span>
      </div>
    `;
  }

  const parent = findAgent(agent.parentId);
  return `
    <div class="admin-agent-cell admin-agent-cell--team">
      <span class="admin-agent-cell__code">${parent ? parent.code : '-'}</span>
      <span class="admin-agent-cell__name">ลูกทีม</span>
    </div>
  `;
}

function matchAgentByFilters(agent) {
  const a = agent || {};
  const code = String(a.code || '').toLowerCase();
  const name = String(a.name || '').toLowerCase();

  if (agentSearchCode) {
    if (!code.includes(agentSearchCode.toLowerCase())) return false;
  }
  if (agentSearchName) {
    if (!name.includes(agentSearchName.toLowerCase())) return false;
  }
  if (agentStatusFilter) {
    if (String(a.status || '') !== String(agentStatusFilter)) return false;
  }
  if (agentRoleFilter) {
    const isLeader = !a.parentId;
    if (agentRoleFilter === 'leader' && !isLeader) return false;
    if (agentRoleFilter === 'member' && isLeader) return false;
  }

  return true;
}

function agentPageHref(agentId, view) {
  return `agent?id=${encodeURIComponent(agentId)}&view=${encodeURIComponent(view)}`;
}

function agentCommissionLabel(agent) {
  const isLeader = !agent?.parentId;
  return isLeader ? 'ทีม/คอม' : 'ตั้งค่าคอม';
}

function agentCommissionActionsHtml(agent) {
  const isLeader = !agent?.parentId;
  const label = isLeader ? 'ทีม/คอม' : 'ตั้งค่าคอม';

  return `
    <div class="btn-group agent-team-card__actions">
      <a class="btn-primary btn-sm" href="${agentPageHref(agent.id, 'team')}">${label}</a>
      <button type="button" class="btn-secondary btn-sm btn-adjust" data-id="${agent.id}">ปรับวงเงิน</button>
    </div>
  `;
}

async function renderAgents() {
  const tbody = document.getElementById('agentsCommissionTableBody');
  if (tbody) App.TableUI.showLoading(tbody, 8);

  agentsCache = await App.AgentService.getAgents();
  renderAgentsTable();
}

function renderAgentsTable() {
  const tbody = document.getElementById('agentsCommissionTableBody');
  if (!tbody) return;

  const filteredAgents = (agentsCache || []).filter((a) => matchAgentByFilters(a));
  const pg = App.TableUI.paginate(filteredAgents, agentsPage, 8);

  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 8);
    document.getElementById('agentsCommissionPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pg.items.map((a) => `
    <tr data-agent-id="${a.id}">
      <td>${escapeHtml(a.code)}</td>
      <td title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</td>
      <td>${teamCellHtml(a)}</td>
      <td>${escapeHtml(a.phone || '-')}</td>
      <td class="col-balance agent-balance">${App.Shell.formatCurrency(a.balance)}</td>
      <td class="col-credit agent-credit">${App.AdminUtils.creditLimitGauge(a.balance, a.creditLimit)}</td>
      <td class="col-status"><span class="status-pill ${a.status}">${a.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span></td>
      <td class="col-actions">
        ${agentCommissionActionsHtml(a)}
      </td>
    </tr>
  `).join('');

  bindCommissionActions(tbody);

  App.TableUI.renderPagination(document.getElementById('agentsCommissionPagination'), {
    ...pg,
    onChange: (p) => {
      agentsPage = p;
      renderAgentsTable();
    }
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function bindCommissionActions(root) {
  if (!root) return;
  root.querySelectorAll('.btn-adjust').forEach((btn) => {
    btn.addEventListener('click', () => openAdjustModal(btn.dataset.id));
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

    const amount = parseFloat(form.amount.value);
    if (Number.isNaN(amount) || amount <= 0) return alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');

    const isDebit = form.adjustType.value === 'debit';
    if (isDebit && !selectedSlip) {
      App.AdminUtils.showToast('กรุณาแนบหลักฐานการโอนเงิน', 'error');
      return;
    }

    const note = form.note.value.trim();
    const finalAmount = isDebit ? -amount : amount;

    try {
      await App.ButtonUI.withLoading(btn, async () => {
        const res = await App.AgentService.adjustBalance(agentId, finalAmount, note, {
          slip: selectedSlip
        });

        // Sync row UI (balance + gauge)
        const row = document.querySelector(`tr[data-agent-id="${agentId}"]`);
        if (row) {
          const idx = agentsCache.findIndex((x) => x.id === agentId);
          if (idx >= 0) agentsCache[idx].balance = res.balance;

          row.querySelector('.agent-balance')?.replaceChildren(document.createTextNode(App.Shell.formatCurrency(res.balance)));
          row.querySelector('.agent-credit')?.replaceChildren(
            (() => {
              const nextAgent = agentsCache.find((x) => x.id === agentId);
              const limit = nextAgent?.creditLimit ?? agent.creditLimit;
              const html = App.AdminUtils.creditLimitGauge(res.balance, limit);
              const wrap = document.createElement('div');
              wrap.innerHTML = html;
              return wrap.firstElementChild || document.createTextNode('-');
            })()
          );
        }

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

