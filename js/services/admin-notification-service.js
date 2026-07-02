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
      href: 'admin/pending.html'
    },
    {
      id: 'admin-renew',
      key: 'renew',
      type: 'renew',
      title: 'ต่ออายุกรมธรรม์',
      message: (n) => `มีกรมธรรม์ใกล้หมดอายุ ${n} รายการ`,
      href: 'admin/renew.html'
    },
    {
      id: 'admin-credit-requests',
      key: 'credit-requests',
      type: 'credit',
      title: 'ขอเติมวงเงิน',
      message: (n) => `มีคำขอเติมวงเงินรออนุมัติ ${n} รายการ`,
      href: 'admin/credit-requests.html'
    },
    {
      id: 'admin-commission',
      key: 'commission',
      type: 'commission',
      title: 'ค่าคอมมิชชัน',
      message: (n) => `มีค่าคอมมิชชันค้างจ่าย ${n} รายการ`,
      href: 'admin/commission.html'
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
      const counts = await this._fetchCounts();
      const ack = this._readAck();
      ack[item.key] = counts[item.key] ?? 0;
      this._writeAck(ack);
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

// Back-compat alias (removed sidebar badges)
App.AdminNavBadgeService = App.AdminNotificationService;
