window.App = window.App || {};

App.InsurerService = {
  async getInsurers() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getInsurers();
    }
    return App.API.request('/insurers');
  },

  async updateInsurer(insurerId, payload) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.updateInsurer(insurerId, payload);
    }
    return App.API.request(`/insurers/${insurerId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async testConnection(insurerId) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.testInsurerConnection(insurerId);
    }
    return App.API.request(`/insurers/${insurerId}/test`, { method: 'POST' });
  }
};
