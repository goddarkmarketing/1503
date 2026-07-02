(function () {
  const tbody = document.getElementById('monthlyTableBody');
  if (!tbody) return;

  const periodSelect = document.getElementById('reportPeriod');
  const viewSelect = document.getElementById('reportView');

  function formatMoney(n) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fillPeriodOptions() {
    if (!periodSelect) return;
    const options = ['2026-06', '2026-05', '2026-04'].map((val) => {
      const [y, m] = val.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      const label = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
      return `<option value="${val}">${label}</option>`;
    });
    periodSelect.innerHTML = options.join('');
  }

  function renderSummary(summary) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('statPrbCount', summary.prb.count);
    set('statPrbPremium', formatMoney(summary.prb.premium));
    set('statVolCount', summary.voluntary.count);
    set('statVolPremium', formatMoney(summary.voluntary.premium));
    set('statTotalCount', summary.total.count);
    set('statTotalPremium', formatMoney(summary.total.premium));
  }

  function renderByInsurer(rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr class="report-empty"><td colspan="3">ไม่พบข้อมูล</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>${r.insurer}</td>
        <td class="col-center">${r.count}</td>
        <td class="col-money">${formatMoney(r.premium)}</td>
      </tr>
    `).join('');
  }

  function renderByDay(rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr class="report-empty"><td colspan="3">ไม่พบข้อมูล</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td class="col-center">${App.AdminUtils.formatThaiDate(r.date)}</td>
        <td class="col-center">${r.count}</td>
        <td class="col-money">${formatMoney(r.premium)}</td>
      </tr>
    `).join('');
  }

  function updateTableHeader(view) {
    const head = document.getElementById('monthlyTableHead');
    if (!head) return;
    if (view === 'day') {
      head.innerHTML = '<tr><th>วันที่</th><th class="col-center">จำนวน กธ.</th><th class="col-money">เบี้ยรวม</th></tr>';
    } else {
      head.innerHTML = '<tr><th>บริษัทประกัน</th><th class="col-center">จำนวน กธ.</th><th class="col-money">เบี้ยรวม</th></tr>';
    }
  }

  let reportCache = null;

  async function loadReport() {
    const period = periodSelect?.value || '';
    const view = viewSelect?.value || 'insurer';
    App.TableUI.showLoading(tbody, 3);
    reportCache = await App.ReportService.getMonthlySalesReport(period);
    renderSummary(reportCache.summary);
    updateTableHeader(view);
    if (view === 'day') {
      renderByDay(reportCache.byDay);
    } else {
      renderByInsurer(reportCache.byInsurer);
    }
  }

  fillPeriodOptions();
  document.getElementById('btnMonthlySearch')?.addEventListener('click', loadReport);
  periodSelect?.addEventListener('change', loadReport);
  viewSelect?.addEventListener('change', () => {
    if (!reportCache) return;
    const view = viewSelect.value;
    updateTableHeader(view);
    if (view === 'day') renderByDay(reportCache.byDay);
    else renderByInsurer(reportCache.byInsurer);
  });
  document.getElementById('btnMonthlyExcel')?.addEventListener('click', () => {
    alert('ส่งออก Excel (เชื่อมต่อ API ภายหลัง)');
  });

  loadReport();
})();
