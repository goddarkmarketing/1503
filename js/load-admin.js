/** Synchronous core stack loader for admin pages — keep before admin-app.js */
(function () {
  const root = document.currentScript.src.replace(/load-admin\.js.*$/, '');
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
    'services/admin-report-service.js',
    'services/receipt-service.js',
    'services/product-service.js',
    'services/agent-service.js',
    'services/insurer-service.js',
    'services/audit-service.js',
    'services/admin-notification-service.js',
    'services/notification-service.js',
    'ui/role-guard.js',
    'ui/shell.js',
    'ui/table-ui.js',
    'ui/admin-modal.js'
  ].forEach((file) => {
    document.write(`<script src="${root}${file}"><\/script>`);
  });
})();
