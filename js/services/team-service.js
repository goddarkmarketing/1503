window.App = window.App || {};

App.TeamService = {
  async getMembers() {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) return App.MockAPI.getTeamMembers(agentId);
    return App.API.request('/team/members');
  },

  async updateMember(memberId, data) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) return App.MockAPI.updateTeamMember(agentId, memberId, data);
    return App.API.request(`/team/members/${memberId}`, { method: 'PATCH', body: data });
  },

  async addMember(data) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) return App.MockAPI.addTeamMember(agentId, data);
    return App.API.request('/team/members', { method: 'POST', body: data });
  }
};
