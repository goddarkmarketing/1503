window.App = window.App || {};

App.CreditService = {
  async getBankAccounts(options = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getCreditBankAccounts(options);
    }
    const params = new URLSearchParams();
    if (options.enabledOnly) params.set('enabledOnly', '1');
    const q = params.toString();
    return App.API.request(`/credit/bank-accounts${q ? `?${q}` : ''}`);
  },

  async updateBankAccounts(banks) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.updateCreditBankAccounts(banks);
    }
    // Backend endpoint not yet wired in this demo.
    throw new Error('API ไม่รองรับการอัปเดตบัญชีธนาคารรับโอนในตอนนี้');
  },

  async getRequests(filters = {}) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getCreditRequests(agentId, filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/agents/${agentId}/credit-requests${params ? `?${params}` : ''}`);
  },

  async createRequest(amountOrPayload, note) {
    const payload =
      amountOrPayload && typeof amountOrPayload === 'object'
        ? amountOrPayload
        : { amount: amountOrPayload, note };
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.createCreditRequest(agentId, payload);
    }
    return App.API.request(`/agents/${agentId}/credit-requests`, {
      method: 'POST',
      body: JSON.stringify(payload)
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
