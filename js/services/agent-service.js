window.App = window.App || {};

App.AgentService = {
  _useRealAgents() {
    return !!App.Config.USE_REAL_AGENTS || !App.Config.USE_MOCK_API;
  },

  async getAgents() {
    if (this._useRealAgents()) {
      return App.API.request('/agents');
    }
    return App.MockAPI.getAgents();
  },

  async getAgent(agentId) {
    if (this._useRealAgents()) {
      return App.API.request(`/agents/${agentId}`);
    }
    return App.MockAPI.getAgent(agentId);
  },

  async updateAgent(agentId, payload) {
    if (this._useRealAgents()) {
      return App.API.request(`/agents/${agentId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    }
    return App.MockAPI.updateAgent(agentId, payload);
  },

  async adjustBalance(agentId, amount, note) {
    if (this._useRealAgents()) {
      return App.API.request(`/agents/${agentId}/balance`, {
        method: 'POST',
        body: JSON.stringify({ amount, note })
      });
    }
    return App.MockAPI.adjustAgentBalance(agentId, amount, note);
  },

  async createAgent(payload) {
    if (this._useRealAgents()) {
      return App.API.request('/agents', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    return App.MockAPI.createAgent(payload);
  },

  async setAgentStatus(agentId, status) {
    if (this._useRealAgents()) {
      return App.API.request(`/agents/${agentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    }
    return App.MockAPI.setAgentStatus(agentId, status);
  },

  async updateProfile(payload) {
    const userId = App.Session.getUser()?.id;
    if (!userId) throw new Error('Not authenticated');
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.updateProfile(userId, payload);
    }
    return App.API.request('/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async getAgentComparison() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAgentComparison();
    }
    return App.API.request('/admin/reports/agent-comparison');
  },

  async getAdminUsers() {
    if (App.AdminUserService) {
      return App.AdminUserService.list();
    }
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAdminUsers();
    }
    return App.API.request('/admin/users');
  }
};
