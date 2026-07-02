(function () {
  const tbody = document.getElementById('reportTableBody');
  if (!tbody) return;

  const reportType = document.body.dataset.reportType || 'policies';
  const dateInput = document.getElementById('reportDate');

  if (dateInput && !dateInput.value) {
    const d = new Date();
    dateInput.value = d.toISOString().slice(0, 10);
  }

  function renderEmpty() {
    const cols = tbody.closest('table')?.querySelectorAll('thead th').length || 5;
    tbody.innerHTML = `<tr class="report-empty"><td colspan="${cols}">ไม่พบข้อมูล</td></tr>`;
  }

  async function search() {
    const date = dateInput?.value;
    if (reportType === 'summary') {
      const agents = await App.AgentService.getAgents();
      const rows = await Promise.all(agents.map(async (a) => {
        const policies = await App.PolicyService.getPolicies({ agentId: a.id, date });
        const premium = policies.reduce((s, p) => s + p.premium, 0);
        return {
          agentCode: a.code,
          detail: a.name,
          policyCount: policies.length,
          netAmount: premium,
          totalTax: premium * 1.07
        };
      }));
      const filtered = rows.filter((r) => r.policyCount > 0);
      if (!filtered.length) { renderEmpty(); return; }
      tbody.innerHTML = filtered.map((r) => `
        <tr>
          <td>${r.agentCode}</td><td>${r.detail}</td>
          <td class="col-center">${r.policyCount}</td>
          <td class="col-money">${App.Shell.formatCurrency(r.netAmount)}</td>
          <td class="col-money">${App.Shell.formatCurrency(r.totalTax)}</td>
        </tr>
      `).join('');
    } else {
      const policies = await App.PolicyService.getPolicies({ date });
      if (!policies.length) { renderEmpty(); return; }
      tbody.innerHTML = policies.map((p) => `
        <tr>
          <td>${p.id}</td><td>${p.agentCode}</td><td>${p.insuredName || '-'}</td><td>${p.plate}</td>
          <td class="col-money">${App.Shell.formatCurrency(p.premium)}</td>
          <td class="col-money">${App.Shell.formatCurrency(p.premium * 1.07)}</td>
          <td class="col-center">${App.AdminUtils.formatThaiDate(p.issuedAt)}</td>
        </tr>
      `).join('');
    }
  }

  renderEmpty();
  document.getElementById('btnReportSearch')?.addEventListener('click', search);
})();
