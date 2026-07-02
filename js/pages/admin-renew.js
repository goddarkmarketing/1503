(function () {
  const tbody = document.getElementById('adminRenewBody');
  if (!tbody) return;

  async function search() {
    const days = Number(document.getElementById('renewDays')?.value || 60);
    App.TableUI.showLoading(tbody, 7);
    const list = await App.AdminReportService.getAllRenewals({ days });
    if (!list.length) {
      App.TableUI.showEmpty(tbody, 7, 'ไม่พบกรมธรรม์ใกล้หมดอายุ');
      return;
    }
    tbody.innerHTML = list.map((p) => `
      <tr>
        <td>${p.policyNo || p.id}</td>
        <td>${p.agentCode}</td>
        <td>${p.insurer}</td>
        <td>${p.insuredName || '-'}</td>
        <td>${p.plate}</td>
        <td class="renew-expiry">${App.AdminUtils.formatThaiDate(p.expiresAt)}</td>
        <td class="col-money">${App.Shell.formatCurrency(p.premium)}</td>
      </tr>
    `).join('');
  }

  document.getElementById('btnRenewSearch')?.addEventListener('click', search);
  search();
})();
