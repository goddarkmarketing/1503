(function () {
  const tbody = document.getElementById('receiptTableBody');
  if (!tbody) return;

  const mode = document.body.dataset.receiptMode || 'inquiry';
  const cols = tbody.closest('table')?.querySelectorAll('thead th').length || 7;
  const dateInput = document.getElementById('receiptDate');
  const agentSelect = document.getElementById('receiptAgent');

  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  async function initAgents() {
    if (!agentSelect) return;
    const agents = await App.AgentService.getAgents();
    agentSelect.innerHTML = '<option value="">ทุกนายหน้า</option>' +
      agents.map((a) => `<option value="${a.id}">${a.code} — ${a.name}</option>`).join('');
  }

  function groupSummary(list) {
    const map = {};
    list.forEach((r) => {
      const key = r.agentId;
      if (!map[key]) map[key] = { agentCode: r.agentCode, agentName: r.agentName, count: 0, total: 0, date: r.issuedAt.slice(0, 10) };
      map[key].count += 1;
      map[key].total += r.amount;
    });
    return Object.values(map);
  }

  async function search() {
    App.TableUI.showLoading(tbody, cols);
    const filters = {};
    if (dateInput?.value) filters.date = dateInput.value;
    if (agentSelect?.value) filters.agentId = agentSelect.value;
    const list = await App.ReceiptService.getReceipts(filters);

    if (!list.length) {
      App.TableUI.showEmpty(tbody, cols, 'ไม่พบข้อมูล');
      return;
    }

    if (mode === 'summary') {
      const groups = groupSummary(list);
      tbody.innerHTML = groups.map((g) => `
        <tr>
          <td>${g.agentCode} — ${g.agentName}</td>
          <td class="col-center">${g.count}</td>
          <td class="col-money">${App.Shell.formatCurrency(g.total)}</td>
          <td>${App.AdminUtils.formatThaiDate(g.date)}</td>
        </tr>
      `).join('');
    } else if (mode === 'detail') {
      tbody.innerHTML = list.map((r) => `
        <tr>
          <td>${r.receiptNo}</td>
          <td>${r.agentCode}</td>
          <td>${r.customerName}</td>
          <td>${r.policyNo}</td>
          <td class="col-money">${App.Shell.formatCurrency(r.amount)}</td>
          <td>${App.AdminUtils.formatDateTime(r.issuedAt)}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = list.map((r) => `
        <tr>
          <td>${r.receiptNo}</td>
          <td>${r.agentCode}</td>
          <td>${r.customerName}</td>
          <td>${r.policyNo}</td>
          <td class="col-money">${App.Shell.formatCurrency(r.amount)}</td>
          <td>${App.AdminUtils.formatThaiDate(r.issuedAt.slice(0, 10))}</td>
          <td><span class="status-pill ${r.status}">${r.status === 'active' ? 'ปกติ' : r.status}</span></td>
        </tr>
      `).join('');
    }
  }

  initAgents();
  document.getElementById('btnReceiptSearch')?.addEventListener('click', search);
  search();
})();
