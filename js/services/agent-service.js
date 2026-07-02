window.App = window.App || {};

App.AgentService = {
  async getAgents() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAgents();
    }
    return App.API.request('/agents');
  },

  async getAgent(agentId) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAgent(agentId);
    }
    return App.API.request(`/agents/${agentId}`);
  },

  async updateAgent(agentId, payload) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.updateAgent(agentId, payload);
    }
    return App.API.request(`/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async adjustBalance(agentId, amount, note) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.adjustAgentBalance(agentId, amount, note);
    }
    return App.API.request(`/agents/${agentId}/balance`, {
      method: 'POST',
      body: JSON.stringify({ amount, note })
    });
  },

  async createAgent(payload) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.createAgent(payload);
    }
    return App.API.request('/agents', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async setAgentStatus(agentId, status) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.setAgentStatus(agentId, status);
    }
    return App.API.request(`/agents/${agentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
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

  async changePassword(currentPassword, newPassword) {
    const userId = App.Session.getUser()?.id;
    if (!userId) throw new Error('Not authenticated');
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.changePassword(userId, currentPassword, newPassword);
    }
    return App.API.request('/profile/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async getAgentComparison() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAgentComparison();
    }
    return App.API.request('/admin/reports/agent-comparison');
  },

  async getAdminUsers() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAdminUsers();
    }
    return App.API.request('/admin/users');
  }
};
