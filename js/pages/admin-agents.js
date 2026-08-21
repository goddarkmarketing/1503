let agentsCache = [];
let agentsPage = 1;
let agentsTeamPage = 1;
const AGENTS_VIEW_KEY = 'kladeebroker_agents_view';
let agentsView = 'team';

let agentSearchCode = '';
let agentSearchName = '';
let agentStatusFilter = '';
let agentRoleFilter = '';
let agentFiltersDebounce = null;

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('agentsTableBody');
  if (!tbody) return;

  try {
    agentsView = localStorage.getItem(AGENTS_VIEW_KEY) || 'team';
  } catch {
    agentsView = 'team';
  }

  document.querySelectorAll('[data-agents-view]').forEach((btn) => {
    btn.addEventListener('click', () => setAgentsView(btn.dataset.agentsView));
  });

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

  const scheduleAgentFiltersRender = () => {
    agentsPage = 1;
    agentsTeamPage = 1;
    if (agentFiltersDebounce) clearTimeout(agentFiltersDebounce);
    agentFiltersDebounce = setTimeout(() => {
      renderAgentsView();
    }, 180);
  };

  const bindAgentFilter = (el, setter) => {
    if (!el) return;
    const onChange = () => {
      setter(el.value);
      scheduleAgentFiltersRender();
    };
    el.addEventListener('input', onChange);
    el.addEventListener('change', onChange);
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
    document.getElementById('agentSearchCode').value = '';
    document.getElementById('agentSearchName').value = '';
    document.getElementById('agentStatusFilter').value = '';
    document.getElementById('agentRoleFilter').value = '';
    agentsPage = 1;
    agentsTeamPage = 1;
    renderAgentsView();
  });

  document.getElementById('ledgerAgentFilter')?.addEventListener('change', renderMiniLedger);
  try {
    await renderMiniLedger();
  } catch (err) {
    console.error(err);
  }
});

async function renderAgents() {
  const tbody = document.getElementById('agentsTableBody');
  const grid = document.getElementById('agentsTeamGrid');
  if (agentsView === 'team' && grid) {
    grid.innerHTML = '<p class="admin-hint agents-team-empty">กำลังโหลด...</p>';
  } else if (tbody) {
    App.TableUI.showLoading(tbody, 8);
  }
  agentsCache = await App.AgentService.getAgents();
  renderAgentsView();
  populateAgentFilter();
}

function setAgentsView(view) {
  if (view !== 'team' && view !== 'table') return;
  agentsView = view;
  try {
    localStorage.setItem(AGENTS_VIEW_KEY, view);
  } catch {
    /* ignore */
  }
  renderAgentsView();
}

function renderAgentsView() {
  const teamView = document.getElementById('agentsTeamView');
  const tableView = document.getElementById('agentsTableView');

  document.querySelectorAll('[data-agents-view]').forEach((btn) => {
    const active = btn.dataset.agentsView === agentsView;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  if (teamView) teamView.hidden = agentsView !== 'team';
  if (tableView) tableView.hidden = agentsView !== 'table';

  if (agentsView === 'team') {
    renderAgentsTeamCards();
  } else {
    renderAgentsTable();
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getTeamLeaders() {
  return (agentsCache || [])
    .filter((a) => !a.parentId)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th'));
}

function teamMemberLimit() {
  return Number(App.Config?.TEAM_MEMBER_LIMIT) || 2;
}

function teamMemberCountLabel(count) {
  return `${count}/${teamMemberLimit()}`;
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

function getTeamMembers(leaderId) {
  return (agentsCache || [])
    .filter((a) => a.parentId === leaderId)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th'));
}

function agentPageHref(agentId, view) {
  return `agent?id=${encodeURIComponent(agentId)}&view=${encodeURIComponent(view)}`;
}

function agentActionsHtml(agentId, status) {
  const agent = findAgent(agentId);
  return `
    <div class="btn-group agent-team-card__actions">
      <a class="btn-secondary btn-sm" href="${agentPageHref(agentId, 'perms')}">สิทธิ์</a>
      <a class="btn-secondary btn-sm" href="${agentPageHref(agentId, 'edit')}">แก้ไข</a>
      <button type="button" class="btn-sm ${status === 'active' ? 'btn-danger' : 'btn-success-outline'} btn-toggle" data-id="${agentId}" data-status="${status}">
        ${status === 'active' ? 'ระงับ' : 'เปิดใช้'}
      </button>
    </div>
  `;
}

function bindAgentActions(root) {
  if (!root) return;
  root.querySelectorAll('.btn-adjust').forEach((btn) => {
    btn.addEventListener('click', () => openAdjustModal(btn.dataset.id));
  });
  root.querySelectorAll('.btn-toggle').forEach((btn) => {
    btn.addEventListener('click', () => toggleStatus(btn.dataset.id, btn.dataset.status, btn));
  });
}

function renderAgentsTeamCards() {
  const grid = document.getElementById('agentsTeamGrid');
  const pagination = document.getElementById('agentsTeamPagination');
  if (!grid) return;

  const leaders = getTeamLeaders().filter((leader) => {
    const leaderMatch = matchAgentByFilters(leader);
    const membersMatch = getTeamMembers(leader.id).some((m) => matchAgentByFilters(m));
    return leaderMatch || membersMatch;
  });
  const pg = App.TableUI.paginate(leaders, agentsTeamPage, 12);

  if (!pg.items.length) {
    grid.innerHTML = '<p class="admin-hint agents-team-empty">ยังไม่มีนายหน้าในระบบ</p>';
    if (pagination) pagination.innerHTML = '';
    return;
  }

  grid.innerHTML = pg.items.map((leader) => {
    const members = getTeamMembers(leader.id).filter((m) => matchAgentByFilters(m));
    const membersHtml = members.length
      ? members.map((m) => `
          <li class="agent-team-card__member">
            <span class="agent-team-card__memberIcon" aria-hidden="true"><i data-lucide="user"></i></span>
            <span class="agent-team-card__memberName">${escapeHtml(m.name)}</span>
            <span class="agent-team-card__memberCode">${escapeHtml(m.code)}</span>
            <span class="status-pill ${m.status}">${m.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span>
          </li>
        `).join('')
      : '<li class="agent-team-card__member agent-team-card__member--empty">ยังไม่มีลูกทีม</li>';

    return `
      <article class="agent-team-card" data-agent-id="${leader.id}">
        <header class="agent-team-card__head">
          <span class="agent-team-card__icon" aria-hidden="true"><i data-lucide="users-round"></i></span>
          <div class="agent-team-card__leader">
            <span class="agent-team-card__role">หัวทีม</span>
            <h3 class="agent-team-card__name">${escapeHtml(leader.name)}</h3>
            <p class="agent-team-card__code">${escapeHtml(leader.code)}</p>
          </div>
          <span class="status-pill ${leader.status}">${leader.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span>
        </header>
        <dl class="agent-team-card__stats">
          <div class="agent-team-card__stat agent-team-card__stat--members">
            <dt>ลูกทีม</dt>
            <dd>${teamMemberCountLabel(members.length)}</dd>
          </div>
          <div class="agent-team-card__stat agent-team-card__stat--balance">
            <dt>วงเงินคงเหลือ</dt>
            <dd>${App.Shell.formatCurrency(leader.balance)}</dd>
          </div>
        </dl>
        <div class="agent-team-card__membersWrap">
          <p class="agent-team-card__membersTitle">ลูกทีม (${teamMemberCountLabel(members.length)})</p>
          <ul class="agent-team-card__members">${membersHtml}</ul>
        </div>
        ${agentActionsHtml(leader.id, leader.status)}
      </article>
    `;
  }).join('');

  bindAgentActions(grid);

  if (pagination) {
    App.TableUI.renderPagination(pagination, {
      ...pg,
      onChange: (p) => {
        agentsTeamPage = p;
        renderAgentsTeamCards();
      }
    });
  }
}

function findAgent(id) {
  return (agentsCache || []).find((a) => a.id === id) || null;
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

function memberCount(agentId) {
  return (agentsCache || []).filter((a) => a.parentId === agentId).length;
}

function renderAgentsTable() {
  const tbody = document.getElementById('agentsTableBody');
  const filteredAgents = (agentsCache || []).filter((a) => matchAgentByFilters(a));
  const pg = App.TableUI.paginate(filteredAgents, agentsPage);

  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 8);
    document.getElementById('agentsPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pg.items.map((a) => `
    <tr data-agent-id="${a.id}">
      <td class="col-code">${a.code}</td>
      <td class="col-name" title="${a.name}">${a.name}</td>
      <td class="col-team">${teamCellHtml(a)}</td>
      <td class="col-phone">${a.phone || '-'}</td>
      <td class="col-balance agent-balance">${App.Shell.formatCurrency(a.balance)}</td>
      <td class="col-credit agent-credit">${App.AdminUtils.creditLimitGauge(a.balance, a.creditLimit)}</td>
      <td class="col-status"><span class="status-pill ${a.status}">${a.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span></td>
      <td class="col-actions">
        ${agentActionsHtml(a.id, a.status)}
      </td>
    </tr>
  `).join('');

  bindAgentActions(tbody);

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
