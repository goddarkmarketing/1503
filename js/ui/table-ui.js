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
    let raw = iso;
    if (iso instanceof Date) {
      if (Number.isNaN(iso.getTime())) return '-';
      raw = iso.toISOString().slice(0, 10);
    } else {
      raw = String(iso).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) raw = raw.slice(0, 10);
      else return raw;
    }
    const parts = raw.split('-');
    if (parts.length < 3) return raw;
    const [y, m, d] = parts;
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
  },
  creditLimitGauge(balance, limit) {
    if (!limit) return '-';
    const pct = Math.min(100, Math.round((balance / limit) * 100));
    const cls = pct < 20 ? 'danger' : pct < 40 ? 'warn' : '';
    return `<span class="credit-gauge"><span class="credit-gauge__limit">${App.Shell.formatCurrency(limit)}</span><span class="credit-gauge__bar"><span class="credit-limit-fill ${cls}" style="width:${pct}%"></span></span><span class="credit-gauge__pct">${pct}%</span></span>`;
  },

  showToast(message, type = 'success') {
    document.querySelectorAll('.admin-toast').forEach((el) => el.remove());
    const el = document.createElement('div');
    el.className = `admin-toast admin-toast--${type}`;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-show'));
    window.setTimeout(() => {
      el.classList.remove('is-show');
      window.setTimeout(() => el.remove(), 320);
    }, 3200);
  }
};

App.ButtonUI = {
  setLoading(btn, loading, label) {
    if (!btn) return;
    if (loading) {
      if (btn.dataset.loadingOriginal == null) {
        btn.dataset.loadingOriginal = btn.innerHTML;
      }
      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      const text = label || btn.dataset.loadingText || 'กำลังดำเนินการ...';
      btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${text}</span>`;
      return;
    }
    btn.disabled = false;
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    if (btn.dataset.loadingOriginal != null) {
      btn.innerHTML = btn.dataset.loadingOriginal;
      delete btn.dataset.loadingOriginal;
    }
  },

  async withLoading(btn, fn, options = {}) {
    if (!btn || typeof fn !== 'function') return fn?.();
    if (btn.classList.contains('is-loading') || btn.disabled) return;
    const label = typeof options === 'string' ? options : options.label;
    const minMs = typeof options === 'object' && options.minMs != null ? options.minMs : 400;
    this.setLoading(btn, true, label);
    const started = Date.now();
    try {
      return await fn();
    } finally {
      const wait = Math.max(0, minMs - (Date.now() - started));
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
      this.setLoading(btn, false);
    }
  }
};
