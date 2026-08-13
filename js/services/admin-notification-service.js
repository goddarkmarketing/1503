window.App = window.App || {};

App.AdminNotificationService = {
  STORAGE_KEY: 'kladee_admin_nav_badge_ack',

  ITEMS: [
    {
      id: 'admin-pending',
      key: 'pending',
      type: 'policy',
      title: 'กรมธรรม์ค้าง',
      message: (n) => `มีกรมธรรม์ค้าง ${n} รายการรอดำเนินการ`,
      href: 'admin/pending'
    },
    {
      id: 'admin-renew',
      key: 'renew',
      type: 'renew',
      title: 'ต่ออายุกรมธรรม์',
      message: (n) => `มีกรมธรรม์ใกล้หมดอายุ ${n} รายการ`,
      href: 'admin/renew'
    },
    {
      id: 'admin-credit-requests',
      key: 'credit-requests',
      type: 'credit',
      title: 'ขอเติมวงเงิน',
      message: (n) => `มีคำขอเติมวงเงินรออนุมัติ ${n} รายการ`,
      href: 'admin/credit-requests'
    },
    {
      id: 'admin-commission',
      key: 'commission',
      type: 'commission',
      title: 'ค่าคอมมิชชัน',
      message: (n) => `มีค่าคอมมิชชันค้างจ่าย ${n} รายการ`,
      href: 'admin/commission'
    }
  ],

  _readAck() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  _writeAck(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  _displayCount(key, currentCount, ack) {
    if (!(key in ack)) return currentCount;
    return Math.max(0, currentCount - ack[key]);
  },

  async _fetchCounts() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAdminNavBadgeCounts();
    }
    return App.API.request('/admin/nav-badge-counts');
  },

  async getBadgeMap() {
    const counts = await this._fetchCounts();
    const ack = this._readAck();
    const map = {};
    this.ITEMS.forEach((item) => {
      const total = counts[item.key] || 0;
      map[item.key] = {
        total,
        unread: this._displayCount(item.key, total, ack)
      };
    });
    return map;
  },

  async acknowledge(key) {
    if (!key) return;
    const counts = await this._fetchCounts();
    const ack = this._readAck();
    ack[key] = counts[key] ?? 0;
    this._writeAck(ack);
  },

  async acknowledgeCurrentPage(pagePath) {
    const normalized = String(pagePath || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
    const item = this.ITEMS.find((entry) => entry.href === normalized);
    if (!item) return false;
    await this.acknowledge(item.key);
    return true;
  },

  async applySidebarBadges(navRoot) {
    if (!navRoot) return;
    const badges = await this.getBadgeMap();

    navRoot.querySelectorAll('[data-nav]').forEach((link) => {
      const key = link.dataset.nav;
      if (!key || !(key in badges)) return;

      let badge = link.querySelector('.nav-count-badge');
      const count = badges[key].unread;

      if (!count) {
        badge?.remove();
        return;
      }

      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-count-badge';
        badge.setAttribute('aria-hidden', 'true');
        link.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : String(count);
    });
  },

  async getList(userId) {
    const counts = await this._fetchCounts();
    const ack = this._readAck();
    const now = new Date().toISOString();

    const dynamic = this.ITEMS
      .filter((item) => (counts[item.key] || 0) > 0)
      .map((item) => {
        const total = counts[item.key] || 0;
        const unread = this._displayCount(item.key, total, ack);
        return {
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message(total),
          href: item.href,
          read: unread === 0,
          createdAt: now
        };
      });

    let staticList = [];
    if (App.Config.USE_MOCK_API) {
      staticList = await App.MockAPI.getNotifications(userId);
    }

    return [...dynamic, ...staticList].sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
  },

  async markRead(userId, notifId) {
    const item = this.ITEMS.find((i) => i.id === notifId);
    if (item) {
      await this.acknowledge(item.key);
      return { id: notifId, read: true };
    }
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.markNotificationRead(userId, notifId);
    }
    return App.API.request(`/notifications/${notifId}/read`, { method: 'POST' });
  },

  async getUnreadCount(userId) {
    const list = await this.getList(userId);
    return list.filter((n) => !n.read).length;
  }
};

// Back-compat alias
App.AdminNavBadgeService = App.AdminNotificationService;
