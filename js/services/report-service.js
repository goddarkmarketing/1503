window.App = window.App || {};

App.ReportService = {
  async getDailySummary({ agentId, date } = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getDailySummary({ agentId, date });
    }
    const scope = agentId ? `/agents/${agentId}` : '';
    const q = date ? `?date=${date}` : '';
    return App.API.request(`${scope}/reports/daily${q}`);
  },

  async getMonthlyRevenue({ agentId, type } = {}) {
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getMonthlyRevenue({ agentId, type });
    }
    const scope = agentId ? `/agents/${agentId}` : '';
    const q = type ? `?type=${type}` : '';
    return App.API.request(`${scope}/reports/monthly${q}`);
  },

  async getAgentDashboard(date) {
    const agentId = App.Session.getAgentId();
    const [summary, prb, voluntary] = await Promise.all([
      this.getDailySummary({ agentId, date }),
      this.getMonthlyRevenue({ agentId, type: 'prb' }),
      this.getMonthlyRevenue({ agentId, type: 'voluntary' })
    ]);
    return { summary, charts: { prb, voluntary } };
  },

  async getAdminDashboard(date) {
    const [summary, prb, voluntary] = await Promise.all([
      this.getDailySummary({ date }),
      this.getMonthlyRevenue({ type: 'prb' }),
      this.getMonthlyRevenue({ type: 'voluntary' })
    ]);
    return { summary, charts: { prb, voluntary } };
  },

  async getMonthlySalesReport(yearMonth) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getMonthlySalesReport(agentId, yearMonth);
    }
    const q = yearMonth ? `?period=${yearMonth}` : '';
    return App.API.request(`/agents/${agentId}/reports/monthly-sales${q}`);
  },

  async getTeamSalesReport(yearMonth) {
    const agentId = App.Session.getAgentId();
    if (App.Config.USE_MOCK_API) {
      return App.MockAPI.getTeamSalesReport(agentId, yearMonth);
    }
    const q = yearMonth ? `?period=${yearMonth}` : '';
    return App.API.request(`/agents/${agentId}/reports/team-sales${q}`);
  }
};
