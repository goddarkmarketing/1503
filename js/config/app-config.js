/**
 * Application configuration — swap USE_MOCK_API to false when backend is ready.
 */
window.App = window.App || {};

App.Config = {
  USE_MOCK_API: true,
  API_BASE_URL: '/api/v1',
  SESSION_KEY: 'kladeebroker_session',
  AGENT_PERMISSIONS_KEY: 'kladeebroker_agent_permissions',
  AGENT_COMMISSION_RATES_KEY: 'kladeebroker_agent_commission_rates',
  RECEIPT_PAPER_KEY: 'kladeebroker_receipt_paper',
  CREDIT_DATA_KEY: 'kladeebroker_credit_data',
  MOCK_DELAY_MS: 300
};
