window.App = window.App || {};

App.AgentRegistrationService = {
  _useReal() {
    return !!App.Config.USE_REAL_AGENT_REQUESTS || !App.Config.USE_MOCK_API;
  },

  _query(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && String(value).trim() !== '') {
        params.set(key, String(value));
      }
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  },

  _asList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  async getTeamMembers() {
    const agentId = App.Session.getAgentId();
    if (this._useReal()) {
      const data = await App.API.request(`/agents/${encodeURIComponent(agentId)}/team-members`);
      return this._asList(data);
    }
    return App.MockAPI.getTeamMembers(agentId);
  },

  async getRequests(filters = {}) {
    const agentId = App.Session.getAgentId();
    if (this._useReal()) {
      const data = await App.API.request(
        `/agents/${encodeURIComponent(agentId)}/agent-registration-requests${this._query(filters)}`
      );
      return this._asList(data);
    }
    return App.MockAPI.getAgentRegistrationRequests(agentId, filters);
  },

  async create(payload) {
    const agentId = App.Session.getAgentId();
    if (this._useReal()) {
      return App.API.request(`/agents/${encodeURIComponent(agentId)}/agent-registration-requests`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    return App.MockAPI.createAgentRegistrationRequest(agentId, payload);
  },

  async getAll(filters = {}) {
    if (this._useReal()) {
      const data = await App.API.request(`/admin/agent-registration-requests${this._query(filters)}`);
      return this._asList(data);
    }
    return App.MockAPI.getAllAgentRegistrationRequests(filters);
  },

  async review(requestId, action, extra = {}) {
    if (this._useReal()) {
      return App.API.request(
        `/admin/agent-registration-requests/${encodeURIComponent(requestId)}/${action}`,
        { method: 'POST', body: JSON.stringify(extra) }
      );
    }
    return App.MockAPI.reviewAgentRegistrationRequest(requestId, action, extra);
  }
};
