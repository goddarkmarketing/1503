window.App = window.App || {};

App.CommissionService = {
  async getCommissions(filters = {}) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getCommissions(agentId, filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/agents/${agentId}/commissions${params ? `?${params}` : ''}`);
  },

  async getSummary(filters = {}) {
    const agentId = App.Session.getAgentId();
    if (typeof filters === 'string') filters = { period: filters, periodType: 'month' };
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getCommissionSummary(agentId, filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/agents/${agentId}/commissions/summary${params ? `?${params}` : ''}`);
  },

  async getAllCommissions(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAllCommissions(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/admin/commissions${params ? `?${params}` : ''}`);
  },

  async updateStatus(commissionId, status) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.updateCommissionStatus(commissionId, status);
    }
    return App.API.request(`/admin/commissions/${commissionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};
