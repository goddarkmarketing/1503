window.App = window.App || {};

App.CreditService = {
  async getRequests() {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getCreditRequests(agentId);
    }
    return App.API.request(`/agents/${agentId}/credit-requests`);
  },

  async createRequest(amount, note) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.createCreditRequest(agentId, { amount, note });
    }
    return App.API.request(`/agents/${agentId}/credit-requests`, {
      method: 'POST',
      body: JSON.stringify({ amount, note })
    });
  },

  async getLedger() {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getOwnCreditLedger(agentId);
    }
    return App.API.request(`/agents/${agentId}/credit-ledger`);
  },

  async getAllRequests(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAllCreditRequests(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/admin/credit-requests${params ? `?${params}` : ''}`);
  },

  async reviewRequest(requestId, action) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.reviewCreditRequest(requestId, action);
    }
    return App.API.request(`/admin/credit-requests/${requestId}/${action}`, { method: 'POST' });
  }
};
