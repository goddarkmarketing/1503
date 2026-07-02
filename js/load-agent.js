/** Synchronous core stack loader for agent pages — keep before app.js */
(function () {
  const root = document.currentScript.src.replace(/load-agent\.js.*$/, '');
  [
    'config/app-config.js',
    'mock/data.js',
    'mock/api.js',
    'services/api-client.js',
    'core/session.js',
    'core/permissions.js',
    'services/auth-service.js',
    'services/balance-service.js',
    'services/policy-service.js',
    'services/report-service.js',
    'services/commission-service.js',
    'services/credit-service.js',
    'services/agent-service.js',
    'services/notification-service.js',
    'services/team-service.js',
    'ui/role-guard.js',
    'ui/shell.js',
    'ui/table-ui.js'
  ].forEach((file) => {
    document.write(`<script src="${root}${file}"><\/script>`);
  });
})();
