/** Synchronous core stack loader for agent pages — keep before app.js */
(function () {
  const root = document.currentScript.src.replace(/load-agent\.js.*$/, '');
  const cache = '20260717k';
  document.write(`<script src="${root}core/favicon.js?v=${cache}"><\/script>`);
  [
    'config/app-config.js',
    'mock/data.js',
    'core/permissions.js',
    'core/agent-features.js',
    'mock/api.js',
    'services/api-client.js',
    'core/session.js',
    'services/auth-service.js',
    'services/balance-service.js',
    'services/policy-service.js',
    'services/report-service.js',
    'services/commission-service.js',
    'services/credit-service.js',
    'services/agent-service.js',
    'services/receipt-service.js',
    'services/notification-service.js',
    'services/team-service.js',
    'ui/role-guard.js',
    'ui/shell.js',
    'ui/table-ui.js'
  ].forEach((file) => {
    document.write(`<script src="${root}${file}?v=${cache}"><\/script>`);
  });
})();
