window.App = window.App || {};

App.CreditService = {
  _useRealCreditLedger() {
    return !!App.Config.USE_REAL_AGENTS || !App.Config.USE_MOCK_API;
  },

  _useRealCredit() {
    return !!App.Config.USE_REAL_CREDIT || !App.Config.USE_MOCK_API;
  },

  async getBankAccounts(options = {}) {
    if (this._useRealCredit()) {
      const params = new URLSearchParams();
      if (options.enabledOnly) params.set('enabledOnly', '1');
      const q = params.toString();
      const data = await App.API.request(`/credit/bank-accounts${q ? `?${q}` : ''}`);
      return Array.isArray(data) ? data : (data?.banks || []);
    }
    return App.MockAPI.getCreditBankAccounts(options);
  },

  async updateBankAccounts(banks) {
    if (this._useRealCredit()) {
      return App.API.request('/credit/bank-accounts', {
        method: 'PUT',
        body: JSON.stringify({ banks })
      });
    }
    return App.MockAPI.updateCreditBankAccounts(banks);
  },

  async getRequests(filters = {}) {
    const agentId = App.Session.getAgentId();
    if (this._useRealCredit()) {
      const params = new URLSearchParams(filters).toString();
      return App.API.request(`/agents/${encodeURIComponent(agentId)}/credit-requests${params ? `?${params}` : ''}`);
    }
    return App.MockAPI.getCreditRequests(agentId, filters);
  },

  async createRequest(amountOrPayload, note) {
    const payload =
      amountOrPayload && typeof amountOrPayload === 'object'
        ? amountOrPayload
        : { amount: amountOrPayload, note };
    const agentId = App.Session.getAgentId();
    if (this._useRealCredit()) {
      return App.API.request(`/agents/${encodeURIComponent(agentId)}/credit-requests`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    return App.MockAPI.createCreditRequest(agentId, payload);
  },

  async getLedger() {
    const agentId = App.Session.getAgentId();
    if (this._useRealCreditLedger()) {
      return App.API.request(`/agents/${encodeURIComponent(agentId)}/credit-ledger`);
    }
    return App.MockAPI.getOwnCreditLedger(agentId);
  },

  async getAllRequests(filters = {}) {
    if (this._useRealCredit()) {
      const params = new URLSearchParams(filters).toString();
      return App.API.request(`/admin/credit-requests${params ? `?${params}` : ''}`);
    }
    return App.MockAPI.getAllCreditRequests(filters);
  },

  async reviewRequest(requestId, action) {
    if (this._useRealCredit()) {
      return App.API.request(`/admin/credit-requests/${encodeURIComponent(requestId)}/${action}`, {
        method: 'POST'
      });
    }
    return App.MockAPI.reviewCreditRequest(requestId, action);
  }
};
