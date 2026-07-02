document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('agentCompareBody');
  if (!tbody) return;
  App.TableUI.showLoading(tbody, 6);
  const rows = await App.AgentService.getAgentComparison();
  if (!rows.length) {
    App.TableUI.showEmpty(tbody, 6);
    return;
  }
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${r.code}</td>
      <td>${r.name}</td>
      <td>${r.policyCount}</td>
      <td>${App.Shell.formatCurrency(r.totalPremium)}</td>
      <td>${App.Shell.formatCurrency(r.balance)}</td>
      <td>${App.AdminUtils.creditLimitBar(r.balance, r.creditLimit)}</td>
    </tr>
  `).join('');
});
