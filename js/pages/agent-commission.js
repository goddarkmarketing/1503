(function () {
  let cache = [];
  let page = 1;

  const tbody = document.getElementById('commissionTableBody');
  if (!tbody) return;

  const periodSelect = document.getElementById('commissionPeriod');
  const statusSelect = document.getElementById('commissionStatus');

  function formatMoney(n) {
    return App.Shell.formatCurrency(n);
  }

  function statusLabel(status) {
    return { paid: 'จ่ายแล้ว', pending: 'ค้างจ่าย' }[status] || status;
  }

  function fillPeriodOptions() {
    if (!periodSelect) return;
    const now = new Date();
    const options = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
      options.push(`<option value="${val}">${label}</option>`);
    }
    periodSelect.innerHTML = options.join('');
  }

  async function loadSummary(period) {
    const summary = await App.CommissionService.getSummary(period);
    const el = (id) => document.getElementById(id);
    if (el('statCommissionTotal')) el('statCommissionTotal').textContent = formatMoney(summary.total);
    if (el('statCommissionPaid')) el('statCommissionPaid').textContent = formatMoney(summary.paid);
    if (el('statCommissionPending')) el('statCommissionPending').textContent = formatMoney(summary.pending);
    if (el('statCommissionCount')) el('statCommissionCount').textContent = String(summary.count);
  }

  function renderTable() {
    const pg = App.TableUI.paginate(cache, page);
    if (!pg.items.length) {
      App.TableUI.showEmpty(tbody, 9, 'ไม่พบรายการค่าคอมมิชชัน');
      document.getElementById('commissionPagination').innerHTML = '';
      return;
    }
    tbody.innerHTML = pg.items.map((c) => `
      <tr>
        <td>${c.policyNo}</td>
        <td>${c.policyTypeLabel}</td>
        <td>${c.insurer}</td>
        <td>${c.plate}</td>
        <td class="col-money">${formatMoney(c.premium)}</td>
        <td class="col-center">${c.rate}%</td>
        <td class="col-money">${formatMoney(c.amount)}</td>
        <td><span class="status-pill ${c.status}">${statusLabel(c.status)}</span></td>
        <td class="col-center">${c.paidAt ? App.AdminUtils.formatThaiDate(c.paidAt) : '-'}</td>
      </tr>
    `).join('');
    App.TableUI.renderPagination(document.getElementById('commissionPagination'), {
      ...pg,
      onChange: (p) => { page = p; renderTable(); }
    });
  }

  async function search() {
    App.TableUI.showLoading(tbody, 9);
    const period = periodSelect?.value || '';
    const status = statusSelect?.value || '';
    const filters = {};
    if (period) filters.period = period;
    if (status) filters.status = status;
    cache = await App.CommissionService.getCommissions(filters);
    page = 1;
    await loadSummary(period);
    renderTable();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  fillPeriodOptions();
  document.getElementById('btnCommissionSearch')?.addEventListener('click', search);
  periodSelect?.addEventListener('change', search);
  statusSelect?.addEventListener('change', search);
  search();
})();
