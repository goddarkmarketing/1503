/**
 * Application configuration — swap USE_MOCK_API to false when backend is ready.
 */
window.App = window.App || {};

App.Config = {
  USE_MOCK_API: true,
  API_BASE_URL: '/api/v1',
  SESSION_KEY: 'kladeebroker_session',
  AGENT_PERMISSIONS_KEY: 'kladeebroker_agent_permissions',
  MOCK_DELAY_MS: 300
};
