(function () {
  let cache = [];
  let page = 1;

  const tbody = document.getElementById('creditHistoryTableBody');
  if (!tbody) return;

  const periodInput = document.getElementById('creditHistoryPeriod');
  const periodTypeSelect = document.getElementById('creditHistoryPeriodType');
  const statusSelect = document.getElementById('creditHistoryStatus');

  function formatMoney(n) {
    return App.Shell.formatCurrency(n);
  }

  function statusLabel(status) {
    return { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' }[status] || status;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function localDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function updatePeriodControl() {
    if (!periodInput) return;
    const now = new Date();
    const today = localDateValue(now);
    const type = periodTypeSelect?.value || 'month';

    periodInput.removeAttribute('min');
    periodInput.removeAttribute('max');
    periodInput.removeAttribute('step');

    if (type === 'day') {
      periodInput.type = 'date';
      periodInput.max = today;
      periodInput.value = today;
    } else if (type === 'year') {
      periodInput.type = 'number';
      periodInput.min = '2020';
      periodInput.max = String(now.getFullYear());
      periodInput.step = '1';
      periodInput.value = String(now.getFullYear());
    } else {
      periodInput.type = 'month';
      periodInput.max = today.slice(0, 7);
      periodInput.value = today.slice(0, 7);
    }
  }

  function renderSummary(list) {
    const sum = (arr) => arr.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const approved = list.filter((r) => r.status === 'approved');
    const pending = list.filter((r) => r.status === 'pending');
    const rejected = list.filter((r) => r.status === 'rejected');
    const el = (id) => document.getElementById(id);
    if (el('statCreditTotal')) el('statCreditTotal').textContent = formatMoney(sum(list));
    if (el('statCreditApproved')) el('statCreditApproved').textContent = formatMoney(sum(approved));
    if (el('statCreditPending')) el('statCreditPending').textContent = formatMoney(sum(pending));
    if (el('statCreditRejected')) el('statCreditRejected').textContent = formatMoney(sum(rejected));
  }

  function openSlip(src, name) {
    const isPdf = /\.pdf$/i.test(name) || src.startsWith('data:application/pdf');
    const win = window.open('', '_blank');
    if (!win) return;
    if (isPdf) {
      win.document.write(`<title>${escapeHtml(name)}</title><embed src="${src}" type="application/pdf" width="100%" height="100%">`);
    } else {
      win.document.write(`<title>${escapeHtml(name)}</title><img src="${src}" alt="${escapeHtml(name)}" style="max-width:100%;height:auto;display:block;margin:0 auto">`);
    }
    win.document.close();
  }

  function formatTransferAt(r) {
    if (!r.transferDate) return '-';
    const dateLabel = App.AdminUtils?.formatThaiDate
      ? App.AdminUtils.formatThaiDate(r.transferDate)
      : r.transferDate;
    return r.transferTime ? `${dateLabel} ${r.transferTime} น.` : dateLabel;
  }

  function renderTable() {
    const pg = App.TableUI.paginate(cache, page);
    if (!pg.items.length) {
      App.TableUI.showEmpty(tbody, 8, 'ไม่พบประวัติการเติมเงิน');
      document.getElementById('creditHistoryPagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = pg.items.map((r) => `
      <tr>
        <td>${App.AdminUtils.formatDateTime(r.createdAt)}</td>
        <td class="col-money">${formatMoney(r.amount)}</td>
        <td>
          <div class="credit-pay-cell">
            <strong>${escapeHtml(r.bankName || 'โอนธนาคาร')}</strong>
            <span>${escapeHtml(r.accountNo || '-')}</span>
          </div>
        </td>
        <td>${escapeHtml(formatTransferAt(r))}</td>
        <td>
          ${r.slipDataUrl
            ? `<button type="button" class="btn-text btn-view-slip" data-slip="${encodeURIComponent(r.slipDataUrl)}" data-name="${escapeHtml(r.slipFileName || 'slip')}">ดูสลิป</button>`
            : '-'}
        </td>
        <td><span class="status-pill ${r.status}">${statusLabel(r.status)}</span></td>
        <td>${r.reviewedAt ? App.AdminUtils.formatDateTime(r.reviewedAt) : '-'}</td>
        <td>${escapeHtml(r.note || '-')}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-view-slip').forEach((btn) => {
      btn.addEventListener('click', () => {
        openSlip(decodeURIComponent(btn.dataset.slip || ''), btn.dataset.name || 'slip');
      });
    });

    App.TableUI.renderPagination(document.getElementById('creditHistoryPagination'), {
      ...pg,
      onChange: (p) => { page = p; renderTable(); }
    });
  }

  async function search() {
    App.TableUI.showLoading(tbody, 8);
    const period = periodInput?.value || '';
    const periodType = periodTypeSelect?.value || 'month';
    const status = statusSelect?.value || '';
    const filters = { periodType };
    if (period) filters.period = period;
    if (status) filters.status = status;

    cache = await App.CreditService.getRequests(filters);
    page = 1;
    renderSummary(cache);
    renderTable();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  updatePeriodControl();
  document.getElementById('btnCreditHistorySearch')?.addEventListener('click', search);
  periodTypeSelect?.addEventListener('change', () => {
    updatePeriodControl();
    search();
  });
  periodInput?.addEventListener('change', search);
  statusSelect?.addEventListener('change', search);
  search();
})();
