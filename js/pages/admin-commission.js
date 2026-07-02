(function () {
  const tbody = document.getElementById('adminCommissionBody');
  if (!tbody) return;

  const periodSelect = document.getElementById('commissionPeriod');
  const statusSelect = document.getElementById('commissionStatus');

  function fillPeriods() {
    if (!periodSelect) return;
    const now = new Date();
    periodSelect.innerHTML = '<option value="">ทุกเดือน</option>';
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
      periodSelect.innerHTML += `<option value="${val}">${label}</option>`;
    }
  }

  function statusLabel(s) {
    return { paid: 'จ่ายแล้ว', pending: 'ค้างจ่าย' }[s] || s;
  }

  async function load() {
    App.TableUI.showLoading(tbody, 7);
    const filters = {};
    if (periodSelect?.value) filters.period = periodSelect.value;
    if (statusSelect?.value) filters.status = statusSelect.value;
    const list = await App.CommissionService.getAllCommissions(filters);
    if (!list.length) {
      App.TableUI.showEmpty(tbody, 7);
      return;
    }
    tbody.innerHTML = list.map((c) => `
      <tr data-id="${c.id}">
        <td>${c.agentCode}</td>
        <td>${c.policyNo}</td>
        <td>${c.policyTypeLabel}</td>
        <td class="col-money">${App.Shell.formatCurrency(c.premium)}</td>
        <td class="col-money">${App.Shell.formatCurrency(c.amount)}</td>
        <td><span class="status-pill ${c.status}">${statusLabel(c.status)}</span></td>
        <td>${c.status === 'pending' ? '<button type="button" class="btn-primary btn-sm btn-pay">บันทึกจ่ายแล้ว</button>' : '-'}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-pay').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('tr').dataset.id;
        await App.CommissionService.updateStatus(id, 'paid');
        await load();
        App.Shell.refreshNotifications?.();
      });
    });
  }

  fillPeriods();
  periodSelect?.addEventListener('change', load);
  statusSelect?.addEventListener('change', load);
  load();
})();
