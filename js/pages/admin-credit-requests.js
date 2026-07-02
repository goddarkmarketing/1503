(function () {
  const tbody = document.getElementById('creditRequestsBody');
  if (!tbody) return;

  const filter = document.getElementById('creditRequestFilter');

  function statusLabel(s) {
    return { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' }[s] || s;
  }

  async function load() {
    App.TableUI.showLoading(tbody, 6);
    const status = filter?.value || '';
    const list = await App.CreditService.getAllRequests(status ? { status } : {});
    if (!list.length) {
      App.TableUI.showEmpty(tbody, 6, 'ไม่มีคำขอ');
      App.Shell.refreshNotifications?.();
      return;
    }
    tbody.innerHTML = list.map((r) => `
      <tr data-id="${r.id}">
        <td>${App.AdminUtils.formatDateTime(r.createdAt)}</td>
        <td>${r.agentCode}</td>
        <td class="col-money">${App.Shell.formatCurrency(r.amount)}</td>
        <td>${r.note || '-'}</td>
        <td><span class="status-pill ${r.status}">${statusLabel(r.status)}</span></td>
        <td>${r.status === 'pending' ? `
          <div class="btn-group">
            <button type="button" class="btn-success-outline btn-sm btn-approve">อนุมัติ</button>
            <button type="button" class="btn-danger btn-sm btn-reject">ปฏิเสธ</button>
          </div>` : (r.reviewedAt ? App.AdminUtils.formatDateTime(r.reviewedAt) : '-')}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-approve').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('tr').dataset.id;
        if (!confirm('อนุมัติคำขอนี้?')) return;
        await App.CreditService.reviewRequest(id, 'approve');
        await load();
        App.Shell.refreshNotifications?.();
      });
    });
    tbody.querySelectorAll('.btn-reject').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('tr').dataset.id;
        if (!confirm('ปฏิเสธคำขอนี้?')) return;
        await App.CreditService.reviewRequest(id, 'reject');
        await load();
        App.Shell.refreshNotifications?.();
      });
    });
  }

  filter?.addEventListener('change', load);
  load();
})();
