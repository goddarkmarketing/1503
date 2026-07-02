let policiesCache = [];
let policiesPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('policiesTableBody')) return;

  await loadAgentOptions();
  bindFilters();
  await loadPolicies();

  document.getElementById('btnExportCsv')?.addEventListener('click', () => {
    App.PolicyService.exportCsv(policiesCache, `policies-${Date.now()}.csv`);
  });
});

async function loadAgentOptions() {
  const select = document.getElementById('filterAgent');
  if (!select) return;
  const agents = await App.AgentService.getAgents();
  select.innerHTML = '<option value="">ทุกนายหน้า</option>' +
    agents.map((a) => `<option value="${a.id}">${a.code}</option>`).join('');
}

function bindFilters() {
  ['filterSearch', 'filterAgent', 'filterType', 'filterStatus', 'filterDateFrom', 'filterDateTo'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', debounce(loadPolicies, 300));
    document.getElementById(id)?.addEventListener('change', loadPolicies);
  });
  document.getElementById('btnResetFilter')?.addEventListener('click', () => {
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterAgent').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    loadPolicies();
  });
}

function getFilters() {
  return {
    q: document.getElementById('filterSearch')?.value.trim() || undefined,
    agentId: document.getElementById('filterAgent')?.value || undefined,
    type: document.getElementById('filterType')?.value || undefined,
    status: document.getElementById('filterStatus')?.value || undefined,
    dateFrom: document.getElementById('filterDateFrom')?.value || undefined,
    dateTo: document.getElementById('filterDateTo')?.value || undefined
  };
}

async function loadPolicies() {
  const tbody = document.getElementById('policiesTableBody');
  const countEl = document.getElementById('policyCount');
  App.TableUI.showLoading(tbody, 8);
  policiesCache = await App.PolicyService.getAllPolicies(getFilters());
  policiesPage = 1;

  if (countEl) countEl.textContent = `${policiesCache.length} รายการ`;
  renderPoliciesTable();
}

function renderPoliciesTable() {
  const tbody = document.getElementById('policiesTableBody');
  const pg = App.TableUI.paginate(policiesCache, policiesPage);

  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 8);
    document.getElementById('policiesPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pg.items.map((p) => `
    <tr class="clickable" data-policy-id="${p.id}">
      <td>${p.id}</td>
      <td>${p.agentCode}</td>
      <td>${p.typeLabel}</td>
      <td>${p.insurer}</td>
      <td>${p.plate}</td>
      <td>${App.Shell.formatCurrency(p.premium)}</td>
      <td><span class="status-pill ${p.status}">${App.AdminUtils.policyStatusLabel(p.status)}</span></td>
      <td>${App.AdminUtils.formatThaiDate(p.issuedAt)}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr[data-policy-id]').forEach((row) => {
    row.addEventListener('click', () => openPolicyDetail(row.dataset.policyId));
  });

  App.TableUI.renderPagination(document.getElementById('policiesPagination'), {
    ...pg,
    onChange: (p) => { policiesPage = p; renderPoliciesTable(); }
  });
}

function openPolicyDetail(policyId) {
  const p = policiesCache.find((x) => x.id === policyId);
  if (!p) return;

  App.Modal.open({
    title: `รายละเอียดกรมธรรม์ ${p.id}`,
    size: 'wide',
    body: `
      <dl class="detail-grid">
        <dt>เลขที่</dt><dd>${p.id}</dd>
        <dt>นายหน้า</dt><dd>${p.agentCode}</dd>
        <dt>ประเภท</dt><dd>${p.typeLabel}</dd>
        <dt>บริษัทประกัน</dt><dd>${p.insurer}</dd>
        <dt>ทะเบียน</dt><dd>${p.plate}</dd>
        <dt>ผู้เอาประกัน</dt><dd>${p.insuredName || '-'}</dd>
        <dt>รถ</dt><dd>${p.vehicleBrand || '-'} ${p.vehicleModel || ''}</dd>
        <dt>เบี้ยประกัน</dt><dd>${App.Shell.formatCurrency(p.premium)} บาท</dd>
        <dt>สถานะ</dt><dd><span class="status-pill ${p.status}">${App.AdminUtils.policyStatusLabel(p.status)}</span></dd>
        <dt>วันที่ออก</dt><dd>${App.AdminUtils.formatThaiDate(p.issuedAt)}</dd>
      </dl>
    `,
    footer: '<button type="button" class="btn-secondary" data-dismiss>ปิด</button>'
  });

  App.Modal.getEl()?.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
