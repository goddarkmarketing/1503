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

  /** All Form 50 ทวิ for the logged-in agent (permanent archive). */
  async listMine(filters = {}) {
    const agentId = App.Session.getAgentId();
    if (!agentId) return [];
    return this.list({ ...filters, agentId });
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

  async markPrinted(id) {
    if (!id) return null;
    let doc;
    if (App.Config.USE_MOCK_API) {
      doc = await App.MockAPI.markWht50Printed(id);
    } else {
      doc = await App.API.request(`/wht50-documents/${id}/print`, { method: 'POST' });
    }
    window.dispatchEvent(new CustomEvent('wht50:printed', { detail: { id, doc } }));
    return doc;
  },

  async getSettings() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getWht50Settings();
    }
    return App.API.request('/wht50-settings');
  },

  async saveSettings(payload = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.updateWht50Settings(payload);
    }
    return App.API.request('/wht50-settings', { method: 'POST', body: payload });
  },

  printDirect(doc) {
    if (!App.Wht50Document) throw new Error('Wht50Document module not loaded');
    App.Wht50Document.printCopies(doc);
    if (doc?.id) this.markPrinted(doc.id).catch(() => {});
  }
};
