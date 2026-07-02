let auditCache = [];
let auditPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('auditTableBody');
  if (!tbody) return;

  ['filterAction', 'filterDateFrom', 'filterDateTo'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', loadLogs);
  });

  document.getElementById('btnResetAudit')?.addEventListener('click', () => {
    document.getElementById('filterAction').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    loadLogs();
  });

  await loadLogs();
});

async function loadLogs() {
  const tbody = document.getElementById('auditTableBody');
  App.TableUI.showLoading(tbody, 4);
  auditCache = await App.AuditService.getLogs({
    action: document.getElementById('filterAction')?.value || undefined,
    dateFrom: document.getElementById('filterDateFrom')?.value || undefined,
    dateTo: document.getElementById('filterDateTo')?.value || undefined
  });
  auditPage = 1;

  document.getElementById('auditCount').textContent = `${auditCache.length} รายการ`;
  renderAuditTable();
}

function renderAuditTable() {
  const tbody = document.getElementById('auditTableBody');
  const pg = App.TableUI.paginate(auditCache, auditPage);

  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 4);
    document.getElementById('auditPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pg.items.map((log) => `
    <tr>
      <td>${App.AdminUtils.formatDateTime(log.createdAt)}</td>
      <td><span class="status-pill active">${log.actionLabel}</span></td>
      <td>${log.actorName}</td>
      <td>${log.detail}</td>
    </tr>
  `).join('');

  App.TableUI.renderPagination(document.getElementById('auditPagination'), {
    ...pg,
    onChange: (p) => { auditPage = p; renderAuditTable(); }
  });
}
