let status = 'pending';
let page = 1;
let cache = [];

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      status = btn.dataset.status;
      page = 1;
      load();
    });
  });
  await load();
});

async function load() {
  const tbody = document.getElementById('pendingTableBody');
  App.TableUI.showLoading(tbody, 7);
  cache = await App.PolicyService.getPolicies({ status });
  render();
}

function render() {
  const tbody = document.getElementById('pendingTableBody');
  const pg = App.TableUI.paginate(cache, page);
  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 7, 'ไม่มีรายการ');
    document.getElementById('pendingPagination').innerHTML = '';
    return;
  }
  tbody.innerHTML = pg.items.map((p) => `
    <tr>
      <td>${p.id}</td><td>${p.agentCode}</td><td>${p.plate}</td><td>${p.insurer}</td>
      <td><span class="status-pill ${p.status}">${App.AdminUtils.policyStatusLabel(p.status)}</span></td>
      <td style="font-size:0.8rem;color:var(--text-muted)">${p.apiError || '-'}</td>
      <td><div class="btn-group">
        <button type="button" class="btn-secondary btn-sm" data-retry="${p.id}">Retry</button>
        <button type="button" class="btn-danger btn-sm" data-cancel="${p.id}">ยกเลิก</button>
      </div></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-retry]').forEach((b) => b.addEventListener('click', () => retry(b.dataset.retry)));
  tbody.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', () => cancel(b.dataset.cancel)));
  App.TableUI.renderPagination(document.getElementById('pendingPagination'), { ...pg, onChange: (p) => { page = p; render(); } });
}

async function retry(id) {
  await App.PolicyService.retryPolicy(id);
  await load();
}

async function cancel(id) {
  if (!confirm('ยกเลิกกรมธรรม์นี้?')) return;
  await App.PolicyService.cancelPolicy(id);
  await load();
}
