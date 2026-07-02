(function () {
  const tbody = document.getElementById('teamReportBody');
  const tfoot = document.getElementById('teamReportFoot');
  if (!tbody) return;

  const periodSelect = document.getElementById('teamReportPeriod');

  function formatMoney(n) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fillPeriodOptions() {
    if (!periodSelect) return;
    const options = ['2026-06', '2026-05'].map((val) => {
      const [y, m] = val.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      const label = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
      return `<option value="${val}">${label}</option>`;
    });
    periodSelect.innerHTML = options.join('');
  }

  async function loadReport() {
    const period = periodSelect?.value || '';
    App.TableUI.showLoading(tbody, 5);
    const data = await App.ReportService.getTeamSalesReport(period);

    if (!data.rows.length) {
      App.TableUI.showEmpty(tbody, 5, 'ไม่พบข้อมูลลูกทีมในเดือนนี้');
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    tbody.innerHTML = data.rows.map((r) => `
      <tr>
        <td>${r.memberCode}</td>
        <td>${r.memberName}</td>
        <td class="col-center">${r.policyCount}</td>
        <td class="col-money">${formatMoney(r.premium)}</td>
        <td class="col-money">${formatMoney(r.commission)}</td>
      </tr>
    `).join('');

    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="report-total-row">
          <td colspan="2"><strong>รวมทั้งทีม</strong></td>
          <td class="col-center"><strong>${data.totals.policyCount}</strong></td>
          <td class="col-money"><strong>${formatMoney(data.totals.premium)}</strong></td>
          <td class="col-money"><strong>${formatMoney(data.totals.commission)}</strong></td>
        </tr>
      `;
    }
  }

  fillPeriodOptions();
  document.getElementById('btnTeamReportSearch')?.addEventListener('click', loadReport);
  periodSelect?.addEventListener('change', loadReport);
  document.getElementById('btnTeamReportExcel')?.addEventListener('click', () => {
    alert('ส่งออก Excel (เชื่อมต่อ API ภายหลัง)');
  });

  loadReport();
})();
