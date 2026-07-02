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
    periodSelect.innerHTML = ['2026-06', '2026-05'].map((val) => {
      const [y, m] = val.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return `<option value="${val}">${d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</option>`;
    }).join('');
  }

  async function load() {
    const period = periodSelect?.value || '';
    App.TableUI.showLoading(tbody, 6);
    const data = await App.AdminReportService.getTeamSalesReport(period);
    if (!data.rows.length) {
      App.TableUI.showEmpty(tbody, 6, 'ไม่พบข้อมูล');
      if (tfoot) tfoot.innerHTML = '';
      return;
    }
    tbody.innerHTML = data.rows.map((r) => `
      <tr>
        <td>${r.leaderCode || '-'} ${r.leaderName || ''}</td>
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
          <td colspan="3"><strong>รวมทั้งระบบ</strong></td>
          <td class="col-center"><strong>${data.totals.policyCount}</strong></td>
          <td class="col-money"><strong>${formatMoney(data.totals.premium)}</strong></td>
          <td class="col-money"><strong>${formatMoney(data.totals.commission)}</strong></td>
        </tr>`;
    }
  }

  fillPeriodOptions();
  document.getElementById('btnTeamReportSearch')?.addEventListener('click', load);
  periodSelect?.addEventListener('change', load);
  load();
})();
