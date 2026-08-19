window.App = window.App || {};

App.AuditService = {
  _useRealCreditLedger() {
    return !!App.Config.USE_REAL_AGENTS || !App.Config.USE_MOCK_API;
  },

  async getLogs(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAuditLogs(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/audit-logs${params ? `?${params}` : ''}`);
  },

  async getCreditLedger(filters = {}) {
    if (this._useRealCreditLedger()) {
      const params = new URLSearchParams();
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const q = params.toString();
      return App.API.request(`/credit-ledger${q ? `?${q}` : ''}`);
    }
    return App.MockAPI.getCreditLedger(filters);
  },

  async getAdminStats() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAdminStats();
    }
    return App.API.request('/admin/stats');
  }
};
