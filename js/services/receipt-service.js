window.App = window.App || {};

App.ReceiptService = {
  async getReceipts(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getReceipts(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/receipts${params ? `?${params}` : ''}`);
  }
};
