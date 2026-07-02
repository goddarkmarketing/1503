window.App = window.App || {};

App.PolicyService = {
  async getPolicies(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getPolicies(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/policies${params ? `?${params}` : ''}`);
  },

  async getOwnPolicies(date) {
    const agentId = App.Session.getAgentId();
    return this.getPolicies({ agentId, date });
  },

  async getAllPolicies(filters = {}) {
    return this.getPolicies(filters);
  },

  async getPolicy(policyId) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getPolicy(policyId);
    }
    return App.API.request(`/policies/${policyId}`);
  },

  async createPolicy(payload) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.createPolicy(payload);
    }
    return App.API.request('/policies', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getRenewals() {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getRenewals(agentId);
    }
    return App.API.request(`/agents/${agentId}/renewals`);
  },

  async retryPolicy(policyId) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.retryPolicy(policyId);
    }
    return App.API.request(`/policies/${policyId}/retry`, { method: 'POST' });
  },

  async cancelPolicy(policyId) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.cancelPolicy(policyId);
    }
    return App.API.request(`/policies/${policyId}/cancel`, { method: 'POST' });
  },

  async getPendingPolicies() {
    return this.getPolicies({ status: 'pending' });
  },

  async getFailedPolicies() {
    return this.getPolicies({ status: 'failed' });
  },

  exportCsv(policies, filename = 'policies.csv') {
    const headers = ['เลขที่', 'นายหน้า', 'ประเภท', 'บริษัท', 'ทะเบียน', 'เบี้ย', 'สถานะ', 'วันที่'];
    const rows = policies.map((p) => [
      p.id, p.agentCode, p.typeLabel, p.insurer, p.plate, p.premium, p.status, p.issuedAt
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
};
