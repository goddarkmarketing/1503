window.App = window.App || {};

App.Wht50Service = {
  async list(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getWht50Documents(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/wht50-documents${params ? `?${params}` : ''}`);
  },

  async getById(id) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getWht50Document(id);
    }
    return App.API.request(`/wht50-documents/${id}`);
  },

  async getByCommissionId(commissionId) {
    const list = await this.list({ commissionId });
    return list[0] || null;
  },

  /** Open on-screen preview; user can print from the modal. */
  preview(doc) {
    if (!App.Wht50Document) throw new Error('Wht50Document module not loaded');
    App.Wht50Document.openPreview(doc);
  },

  /** Alias — always show preview before print. */
  print(doc) {
    this.preview(doc);
  },

  printDirect(doc) {
    if (!App.Wht50Document) throw new Error('Wht50Document module not loaded');
    App.Wht50Document.printCopies(doc);
  }
};
