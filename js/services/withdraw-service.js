window.App = window.App || {};

App.WithdrawService = {
  async getPayoutBank() {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getPayoutBank(agentId);
    }
    return App.API.request(`/agents/${encodeURIComponent(agentId)}/payout-bank`);
  },

  async getBalance() {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getWithdrawBalance(agentId);
    }
    return App.API.request(`/agents/${encodeURIComponent(agentId)}/withdraw-balance`);
  },

  async getRequests(filters = {}) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getWithdrawRequests(agentId, filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/agents/${encodeURIComponent(agentId)}/withdraw-requests${params ? `?${params}` : ''}`);
  },

  async create(payload) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.createWithdrawRequest(agentId, payload);
    }
    return App.API.request(`/agents/${encodeURIComponent(agentId)}/withdraw-requests`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getAll(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAllWithdrawRequests(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/admin/withdraw-requests${params ? `?${params}` : ''}`);
  },

  async review(requestId, action, extra = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.reviewWithdrawRequest(requestId, action, extra);
    }
    return App.API.request(`/admin/withdraw-requests/${requestId}/${action}`, {
      method: 'POST',
      body: JSON.stringify(extra)
    });
  }
};
