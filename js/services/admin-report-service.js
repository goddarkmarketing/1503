window.App = window.App || {};

App.AdminReportService = {
  async getMonthlySalesReport(yearMonth) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAdminMonthlySalesReport(yearMonth);
    }
    const q = yearMonth ? `?period=${yearMonth}` : '';
    return App.API.request(`/admin/reports/monthly-sales${q}`);
  },

  async getTeamSalesReport(yearMonth) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAdminTeamSalesReport(yearMonth);
    }
    const q = yearMonth ? `?period=${yearMonth}` : '';
    return App.API.request(`/admin/reports/team-sales${q}`);
  },

  async getTeamHierarchy() {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getTeamHierarchy();
    }
    return App.API.request('/admin/team-hierarchy');
  },

  async getAllRenewals(filters = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getAllRenewals(filters);
    }
    const params = new URLSearchParams(filters).toString();
    return App.API.request(`/admin/renewals${params ? `?${params}` : ''}`);
  }
};
