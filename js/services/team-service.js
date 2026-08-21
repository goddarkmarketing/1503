window.App = window.App || {};

App.TeamService = {
  _useRealAgentRequests() {
    return !!App.Config.USE_REAL_AGENT_REQUESTS || !App.Config.USE_MOCK_API;
  },

  async getMembers() {
    const agentId = App.Session.getAgentId();
    if (this._useRealAgentRequests()) {
      const [agents, requests] = await Promise.all([
        App.AgentRegistrationService.getTeamMembers(),
        App.AgentRegistrationService.getRequests()
      ]);
      const agentRows = (agents || []).map((a) => ({
        ...a,
        kind: 'agent',
        userId: a.userId || a.code || '-'
      }));
      const requestRows = (requests || [])
        .filter((r) => r.status !== 'approved')
        .map((r) => ({
          ...r,
          kind: 'request',
          code: r.status === 'pending' ? 'รออนุมัติ' : (r.createdAgentCode || '-'),
          userId: r.id,
          balance: 0
        }));
      return [...requestRows, ...agentRows];
    }
    if (App.Config.USE_MOCK_API) return App.MockAPI.getTeamMembers(agentId);
    return App.API.request('/team/members');
  },

  async updateMember(memberId, data) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) return App.MockAPI.updateTeamMember(agentId, memberId, data);
    return App.API.request(`/team/members/${memberId}`, { method: 'PATCH', body: data });
  },

  async addMember(data) {
    if (this._useRealAgentRequests()) {
      return App.AgentRegistrationService.create(data);
    }
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) return App.MockAPI.addTeamMember(agentId, data);
    return App.API.request('/team/members', { method: 'POST', body: data });
  },

  async hasPendingRequest() {
    if (!this._useRealAgentRequests()) return false;
    const list = await App.AgentRegistrationService.getRequests({ status: 'pending' });
    return list.length > 0;
  },

  teamMemberLimit() {
    return Number(App.Config?.TEAM_MEMBER_LIMIT) || 2;
  },

  isTeamFull(members) {
    const count = (members || []).filter((m) => m.kind !== 'request').length;
    return count >= this.teamMemberLimit();
  }
};
