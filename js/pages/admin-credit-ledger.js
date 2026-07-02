let ledgerCache = [];
let ledgerPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('fullLedgerBody');
  if (!tbody) return;

  const agents = await App.AgentService.getAgents();
  const select = document.getElementById('filterAgent');
  select.innerHTML = '<option value="">ทุกนายหน้า</option>' +
    agents.map((a) => `<option value="${a.id}">${a.code} — ${a.name}</option>`).join('');

  ['filterAgent', 'filterDateFrom', 'filterDateTo'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', loadLedger);
  });

  document.getElementById('btnExportLedger')?.addEventListener('click', exportLedger);
  await loadLedger();
});

async function loadLedger() {
  const tbody = document.getElementById('fullLedgerBody');
  App.TableUI.showLoading(tbody, 8);
  ledgerCache = await App.AuditService.getCreditLedger({
    agentId: document.getElementById('filterAgent')?.value || undefined,
    dateFrom: document.getElementById('filterDateFrom')?.value || undefined,
    dateTo: document.getElementById('filterDateTo')?.value || undefined
  });
  ledgerPage = 1;

  document.getElementById('ledgerCount').textContent = `${ledgerCache.length} รายการ`;
  renderLedgerTable();
  window._ledgerExport = ledgerCache;
}

function renderLedgerTable() {
  const tbody = document.getElementById('fullLedgerBody');
  const pg = App.TableUI.paginate(ledgerCache, ledgerPage);

  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 8);
    document.getElementById('ledgerPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pg.items.map((e) => `
    <tr>
      <td>${e.id}</td>
      <td>${App.AdminUtils.formatDateTime(e.createdAt)}</td>
      <td>${e.agentCode}<br><small style="color:var(--text-muted)">${e.agentName}</small></td>
      <td>${e.type === 'credit' ? 'เพิ่ม' : 'ลด'}</td>
      <td class="${e.amount >= 0 ? 'amount-positive' : 'amount-negative'}">${e.amount >= 0 ? '+' : ''}${App.Shell.formatCurrency(e.amount)}</td>
      <td>${App.Shell.formatCurrency(e.balanceAfter)}</td>
      <td>${e.note || '-'}</td>
      <td>${e.createdByName}</td>
    </tr>
  `).join('');

  App.TableUI.renderPagination(document.getElementById('ledgerPagination'), {
    ...pg,
    onChange: (p) => { ledgerPage = p; renderLedgerTable(); }
  });
}

function exportLedger() {
  const entries = window._ledgerExport || [];
  const headers = ['รหัส', 'วันที่', 'นายหน้า', 'ประเภท', 'จำนวน', 'ยอดหลังปรับ', 'หมายเหตุ', 'ผู้ทำรายการ'];
  const rows = entries.map((e) => [
    e.id, e.createdAt, e.agentCode, e.type, e.amount, e.balanceAfter, e.note, e.createdByName
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `credit-ledger-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
