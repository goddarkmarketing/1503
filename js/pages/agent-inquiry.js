document.addEventListener('DOMContentLoaded', async () => {
  let page = 1;
  let cache = [];

  const search = async () => {
    const q = document.getElementById('inquirySearch')?.value.trim();
    const tbody = document.getElementById('inquiryTableBody');
    App.TableUI.showLoading(tbody, 8);
    cache = await App.PolicyService.getOwnPolicies();
    if (q) {
      const term = q.toLowerCase();
      cache = cache.filter((p) =>
        p.id.toLowerCase().includes(term) ||
        p.plate.toLowerCase().includes(term) ||
        (p.insuredName && p.insuredName.toLowerCase().includes(term))
      );
    }
    page = 1;
    render();
  };

  const render = () => {
    const tbody = document.getElementById('inquiryTableBody');
    const pg = App.TableUI.paginate(cache, page);
    if (!pg.items.length) {
      App.TableUI.showEmpty(tbody, 8, 'ไม่พบกรมธรรม์');
      document.getElementById('inquiryPagination').innerHTML = '';
      return;
    }
    tbody.innerHTML = pg.items.map((p) => `
      <tr>
        <td>${p.id}</td><td>${p.typeLabel}</td><td>${p.insurer}</td><td>${p.plate}</td>
        <td>${p.insuredName || '-'}</td><td>${App.Shell.formatCurrency(p.premium)}</td>
        <td><span class="status-pill ${p.status}">${App.AdminUtils.policyStatusLabel(p.status)}</span></td>
        <td>${App.AdminUtils.formatThaiDate(p.issuedAt)}</td>
      </tr>
    `).join('');
    App.TableUI.renderPagination(document.getElementById('inquiryPagination'), {
      ...pg, onChange: (p) => { page = p; render(); }
    });
  };

  document.getElementById('btnSearch')?.addEventListener('click', search);
  document.getElementById('inquirySearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') search();
  });
  await search();
});
