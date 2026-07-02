window.App = window.App || {};

App.AuditService = {
  async getLogs(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAuditLogs(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/audit-logs${params ? `?${params}` : ''}`);
  },

  async getCreditLedger(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getCreditLedger(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/credit-ledger${params ? `?${params}` : ''}`);
  },

  async getAdminStats() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAdminStats();
    }
    return App.API.request('/admin/stats');
  }
};
