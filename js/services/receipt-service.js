window.App = window.App || {};

App.ReceiptService = {
  resolveOwnerId(explicitId) {
    if (explicitId) return explicitId;
    const user = App.AuthService?.getCurrentUser?.() || App.Session?.getUser?.();
    if (!user || user.role === 'admin') return 'default';
    return user.id || 'default';
  },

  async getReceipts(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getReceipts(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/receipts${params ? `?${params}` : ''}`);
  },

  async getPaperSettings(ownerId) {
    const id = this.resolveOwnerId(ownerId);
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getReceiptPaperSettings(id);
    }
    return App.API.request(`/receipts/paper-settings?ownerId=${encodeURIComponent(id)}`);
  },

  async updatePaperSettings(payload, ownerId) {
    const id = this.resolveOwnerId(ownerId);
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.updateReceiptPaperSettings(payload, id);
    }
    return App.API.request('/receipts/paper-settings', {
      method: 'PUT',
      body: JSON.stringify({ ...payload, ownerId: id })
    });
  }
};
