window.App = window.App || {};

App.WithdrawService = {
  _useRealWithdraw() {
    return !!App.Config.USE_REAL_WITHDRAW || !App.Config.USE_MOCK_API;
  },

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
    if (this._useRealWithdraw()) {
      const params = new URLSearchParams(filters).toString();
      return App.API.request(`/agents/${encodeURIComponent(agentId)}/withdraw-requests${params ? `?${params}` : ''}`);
    }
    return App.MockAPI.getWithdrawRequests(agentId, filters);
  },

  async create(payload) {
    const agentId = App.Session.getAgentId();
    if (this._useRealWithdraw()) {
      const created = await App.API.request(`/agents/${encodeURIComponent(agentId)}/withdraw-requests`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (App.Config.USE_MOCK_API && typeof App.MockAPI?._writePayoutBank === 'function') {
        App.MockAPI._writePayoutBank(agentId, {
          bankCode: payload.bankCode,
          accountNo: payload.accountNo,
          accountName: payload.accountName
        });
      }
      return created;
    }
    return App.MockAPI.createWithdrawRequest(agentId, payload);
  },

  async getAll(filters = {}) {
    if (this._useRealWithdraw()) {
      const params = new URLSearchParams(filters).toString();
      return App.API.request(`/admin/withdraw-requests${params ? `?${params}` : ''}`);
    }
    return App.MockAPI.getAllWithdrawRequests(filters);
  },

  async review(requestId, action, extra = {}) {
    if (this._useRealWithdraw()) {
      return App.API.request(`/admin/withdraw-requests/${encodeURIComponent(requestId)}/${action}`, {
        method: 'POST',
        body: JSON.stringify(extra)
      });
    }
    return App.MockAPI.reviewWithdrawRequest(requestId, action, extra);
  }
};
