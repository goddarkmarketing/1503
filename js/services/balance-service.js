window.App = window.App || {};

App.BalanceService = {
  async getBalance(agentId) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getBalance(agentId);
    }
    return App.API.request(`/agents/${agentId}/balance`);
  },

  async refreshBalance(agentId) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.refreshBalance(agentId);
    }
    return App.API.request(`/agents/${agentId}/balance/refresh`, { method: 'POST' });
  },

  formatAmount(value) {
    return Number(value).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
};
