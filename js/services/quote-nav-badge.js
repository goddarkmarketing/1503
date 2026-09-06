/**
 * Unseen quote count badge on agent sidebar "ประวัติใบเสนอราคา".
 * Count lives in localStorage per user — increments on create, clears on history visit.
 */
window.App = window.App || {};

App.QuoteNavBadge = {
  STORAGE_PREFIX: 'kladee_quote_unseen_',

  _userKey() {
    const user = App.Session?.getUser?.() || App.AuthService?.getCurrentUser?.();
    const id = user?.id || user?.username || 'guest';
    return `${this.STORAGE_PREFIX}${id}`;
  },

  getCount() {
    try {
      const n = Number(localStorage.getItem(this._userKey()) || 0);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch {
      return 0;
    }
  },

  setCount(n) {
    const next = Math.max(0, Math.floor(Number(n) || 0));
    try {
      if (next <= 0) localStorage.removeItem(this._userKey());
      else localStorage.setItem(this._userKey(), String(next));
    } catch {
      /* ignore quota */
    }
    this.render();
    return next;
  },

  increment(by = 1) {
    const add = Math.max(1, Math.floor(Number(by) || 1));
    return this.setCount(this.getCount() + add);
  },

  clear() {
    return this.setCount(0);
  },

  /** Ensure quotes nav exists even if page has stale inline sidebar HTML. */
  ensureNavLink(navRoot) {
    const root = navRoot || document.querySelector('.sidebar-nav[data-agent-sidebar]');
    if (!root) return null;

    let link = root.querySelector('[data-nav="quotes"]');
    if (link) return link;

    const reportsZone = root.querySelector('[data-nav-zone="reports"] .nav-group__list')
      || root.querySelector('[data-nav="inquiry"]')?.closest('ul');
    if (!reportsZone) return null;

    const base = document.body?.dataset?.basePath || '../';
    const li = document.createElement('li');
    li.className = 'nav-item';
    const linkEl = document.createElement('a');
    linkEl.href = `${base}agent/quotes`;
    linkEl.className = 'nav-link';
    linkEl.dataset.nav = 'quotes';
    linkEl.setAttribute('data-nav', 'quotes');
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'file-text');
    const text = document.createElement('span');
    text.className = 'nav-link-text';
    text.textContent = 'ประวัติใบเสนอราคา';
    linkEl.appendChild(icon);
    linkEl.appendChild(text);
    li.appendChild(linkEl);
    const inquiryRow = reportsZone.querySelector('[data-nav="inquiry"]')?.closest('li');
    if (inquiryRow?.after) {
      inquiryRow.after(li);
    } else if (inquiryRow?.nextSibling) {
      reportsZone.insertBefore(li, inquiryRow.nextSibling);
    } else if (inquiryRow) {
      inquiryRow.after?.(li);
      if (!li.parent) reportsZone.appendChild(li);
    } else {
      reportsZone.appendChild(li);
    }
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons({ icons: lucide, nodes: [li] }); } catch (_) { /* ignore */ }
    }
    return linkEl;
  },

  render(navRoot) {
    const root = navRoot || document.querySelector('.sidebar-nav[data-agent-sidebar]');
    if (!root) return false;
    const link = this.ensureNavLink(root);
    if (!link) return false;

    const count = this.getCount();
    let badge = link.querySelector('.nav-count-badge[data-quote-badge]');

    if (count <= 0) {
      badge?.remove();
      if (link.getAttribute('aria-label')?.includes('ใบใหม่')) {
        link.removeAttribute('aria-label');
      }
      return true;
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-count-badge';
      badge.dataset.quoteBadge = '1';
      badge.setAttribute('aria-hidden', 'true');
      link.appendChild(badge);
    }
    badge.textContent = count > 99 ? '99+' : String(count);
    link.setAttribute('aria-label', `ประวัติใบเสนอราคา มีใบใหม่ ${count} รายการ`);
    return true;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const paint = () => App.QuoteNavBadge?.render?.();
  paint();
  setTimeout(paint, 0);
  setTimeout(paint, 300);
  setTimeout(paint, 1000);
});
