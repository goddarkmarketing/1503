window.App = window.App || {};

App.ProductService = {
  async getSettings() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getProductSettings();
    }
    return App.API.request('/admin/product-settings');
  },

  async updateSettings(code, payload) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.updateProductSettings(code, payload);
    }
    return App.API.request(`/admin/product-settings/${code}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};
