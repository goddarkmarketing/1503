window.App = window.App || {};

App.TableUI = {
  DEFAULT_PER_PAGE: 10,

  paginate(items, page = 1, perPage = this.DEFAULT_PER_PAGE) {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), pages);
    const start = (safePage - 1) * perPage;
    return {
      items: items.slice(start, start + perPage),
      page: safePage,
      perPage,
      total,
      pages
    };
  },

  renderPagination(container, { page, pages, total, perPage, onChange }) {
    if (!container) return;
    if (total === 0) {
      container.innerHTML = '';
      return;
    }
    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);
    container.innerHTML = `
      <div class="pagination-bar">
        <span class="pagination-info">แสดง ${start}–${end} จาก ${total} รายการ</span>
        <div class="pagination-btns">
          <button type="button" data-page="prev" ${page <= 1 ? 'disabled' : ''}>‹</button>
          ${this._pageButtons(page, pages)}
          <button type="button" data-page="next" ${page >= pages ? 'disabled' : ''}>›</button>
        </div>
      </div>
    `;
    container.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.page;
        let next = page;
        if (val === 'prev') next = page - 1;
        else if (val === 'next') next = page + 1;
        else next = parseInt(val, 10);
        if (next >= 1 && next <= pages) onChange(next);
      });
    });
  },

  _pageButtons(page, pages) {
    const max = 5;
    let start = Math.max(1, page - Math.floor(max / 2));
    let end = Math.min(pages, start + max - 1);
    start = Math.max(1, end - max + 1);
    let html = '';
    for (let i = start; i <= end; i++) {
      html += `<button type="button" data-page="${i}" class="${i === page ? 'active' : ''}">${i}</button>`;
    }
    return html;
  },

  showLoading(tbody, cols) {
    if (!tbody) return;
    tbody.innerHTML = `<tr class="table-loading"><td colspan="${cols}">กำลังโหลด...</td></tr>`;
  },

  showEmpty(tbody, cols, message = 'ไม่มีรายการ') {
    if (!tbody) return;
    tbody.innerHTML = `<tr class="table-empty"><td colspan="${cols}">${message}</td></tr>`;
  }
};

App.AdminUtils = {
  formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('th-TH', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  },
  formatThaiDate(iso) {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  },
  policyStatusLabel(status) {
    return { active: 'มีผล', pending: 'รอดำเนินการ', failed: 'ล้มเหลว', cancelled: 'ยกเลิก' }[status] || status;
  },
  creditLimitBar(balance, limit) {
    if (!limit) return '-';
    const pct = Math.min(100, Math.round((balance / limit) * 100));
    const cls = pct < 20 ? 'danger' : pct < 40 ? 'warn' : '';
    return `<div class="credit-limit-wrap"><div class="credit-limit-text">${App.Shell.formatCurrency(balance)} / ${App.Shell.formatCurrency(limit)}</div><div class="credit-limit-bar"><div class="credit-limit-fill ${cls}" style="width:${pct}%"></div></div></div>`;
  }
};
