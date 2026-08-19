window.App = window.App || {};

App.AgentIdentityService = {
  _useReal() {
    return !!App.Config.USE_REAL_IDENTITY || !App.Config.USE_MOCK_API;
  },

  async getStatus(agentId) {
    if (this._useReal()) {
      return App.API.request(`/agents/${encodeURIComponent(agentId)}/identity-verification`);
    }
    return App.MockAPI.getAgentIdentity(agentId);
  },

  async submit(agentId, payload) {
    if (this._useReal()) {
      return App.API.request(`/agents/${encodeURIComponent(agentId)}/identity-verification`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    return App.MockAPI.submitAgentIdentity(agentId, payload);
  },

  async getAll(filters = {}) {
    if (this._useReal()) {
      const qs = new URLSearchParams();
      if (filters.status) qs.set('status', filters.status);
      const q = qs.toString();
      return App.API.request(`/admin/agent-identity-verifications${q ? `?${q}` : ''}`);
    }
    return App.MockAPI.getAllAgentIdentities(filters);
  },

  async approve(id) {
    if (this._useReal()) {
      return App.API.request(`/admin/agent-identity-verifications/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        body: JSON.stringify({})
      });
    }
    return App.MockAPI.reviewAgentIdentity(id, 'approve');
  },

  async reject(id, note) {
    if (this._useReal()) {
      return App.API.request(`/admin/agent-identity-verifications/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
    }
    return App.MockAPI.reviewAgentIdentity(id, 'reject', note);
  },

  docUrl(path) {
    return path || null;
  }
};
