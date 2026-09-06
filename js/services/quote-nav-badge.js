/**
 * Unseen quote count badge on agent sidebar "ประวัติใบเสนอราคา".
 * Count lives in localStorage per user — increments on create, clears on history visit.
 */
window.App = window.App || {};

App.QuoteNavBadge = {
  STORAGE_PREFIX: 'kladee_quote_unseen_',

  _userKey() {
    const user = App.Session?.getUser?.();
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

  render(navRoot) {
    const root = navRoot || document.querySelector('.sidebar-nav[data-agent-sidebar]');
    if (!root) return;
    const link = root.querySelector('[data-nav="quotes"]');
    if (!link) return;

    const count = this.getCount();
    let badge = link.querySelector('.nav-count-badge[data-quote-badge]');

    if (count <= 0) {
      badge?.remove();
      link.removeAttribute('aria-label');
      return;
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
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar may render sync before this; refresh after portal boot too.
  const paint = () => App.QuoteNavBadge?.render?.();
  paint();
  setTimeout(paint, 0);
  setTimeout(paint, 400);
});
