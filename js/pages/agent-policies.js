document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('policiesTableBody');
  if (!tbody || !window.App?.PolicyService) return;

  App.TableUI.showLoading(tbody, 7);
  const policies = await App.PolicyService.getOwnPolicies();

  if (!policies.length) {
    App.TableUI.showEmpty(tbody, 7);
    return;
  }

  tbody.innerHTML = policies.map((p) => `
    <tr>
      <td>${p.id}</td>
      <td>${p.typeLabel}</td>
      <td>${p.insurer}</td>
      <td>${p.plate}</td>
      <td>${App.Shell.formatCurrency(p.premium)}</td>
      <td><span class="status-pill ${p.status}">${App.AdminUtils.policyStatusLabel(p.status)}</span></td>
      <td>${App.AdminUtils.formatThaiDate(p.issuedAt)}</td>
    </tr>
  `).join('');
});
