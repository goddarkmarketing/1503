(function () {
  const tbody = document.getElementById('monthlyTableBody');
  if (!tbody) return;

  const periodSelect = document.getElementById('reportPeriod');
  const viewSelect = document.getElementById('reportView');
  let reportCache = null;

  function formatMoney(n) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fillPeriodOptions() {
    if (!periodSelect) return;
    periodSelect.innerHTML = ['2026-06', '2026-05'].map((val) => {
      const [y, m] = val.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return `<option value="${val}">${d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</option>`;
    }).join('');
  }

  function renderSummary(summary) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statPrbCount', summary.prb.count);
    set('statPrbPremium', formatMoney(summary.prb.premium));
    set('statVolCount', summary.voluntary.count);
    set('statVolPremium', formatMoney(summary.voluntary.premium));
    set('statTotalCount', summary.total.count);
    set('statTotalPremium', formatMoney(summary.total.premium));
  }

  function updateHead(view) {
    const head = document.getElementById('monthlyTableHead');
    if (!head) return;
    head.innerHTML = view === 'day'
      ? '<tr><th>วันที่</th><th class="col-center">จำนวน กธ.</th><th class="col-money">เบี้ยรวม</th></tr>'
      : '<tr><th>บริษัทประกัน</th><th class="col-center">จำนวน กธ.</th><th class="col-money">เบี้ยรวม</th></tr>';
  }

  function renderTable(view) {
    const rows = view === 'day' ? reportCache.byDay : reportCache.byInsurer;
    if (!rows.length) {
      tbody.innerHTML = '<tr class="report-empty"><td colspan="3">ไม่พบข้อมูล</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r) => view === 'day'
      ? `<tr><td class="col-center">${App.AdminUtils.formatThaiDate(r.date)}</td><td class="col-center">${r.count}</td><td class="col-money">${formatMoney(r.premium)}</td></tr>`
      : `<tr><td>${r.insurer}</td><td class="col-center">${r.count}</td><td class="col-money">${formatMoney(r.premium)}</td></tr>`
    ).join('');
  }

  async function load() {
    const period = periodSelect?.value || '';
    const view = viewSelect?.value || 'insurer';
    App.TableUI.showLoading(tbody, 3);
    reportCache = await App.AdminReportService.getMonthlySalesReport(period);
    renderSummary(reportCache.summary);
    updateHead(view);
    renderTable(view);
  }

  fillPeriodOptions();
  document.getElementById('btnMonthlySearch')?.addEventListener('click', load);
  periodSelect?.addEventListener('change', load);
  viewSelect?.addEventListener('change', () => {
    if (!reportCache) return;
    updateHead(viewSelect.value);
    renderTable(viewSelect.value);
  });
  load();
})();
