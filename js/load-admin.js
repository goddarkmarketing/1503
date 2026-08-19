/** Synchronous core stack loader for admin pages — keep before admin-app.js */
(function () {
  const root = document.currentScript.src.replace(/load-admin\.js.*$/, '');
  const cache = '20260820c';
  document.write(`<script src="${root}core/favicon.js?v=${cache}"><\/script>`);
  [
    'vendor/lucide.min.js',
    'core/lucide-boot.js',
    'vendor/chart.umd.min.js',
    'admin-sidebar-nav-template.js',
    'config/app-config.js',
    'core/paths.js',
    'mock/data.js',
    'core/permissions.js',
    'core/agent-features.js',
    'core/agent-commission-rates.js',
    'core/thai-banks.js',
    'mock/api.js',
    'services/api-client.js',
    'core/session.js',
    'services/auth-service.js',
    'services/balance-service.js',
    'services/policy-service.js',
    'services/report-service.js',
    'services/commission-service.js',
    'services/credit-service.js',
    'services/withdraw-service.js',
    'services/agent-registration-service.js',
    'services/agent-identity-service.js',
    'services/wht50-service.js',
    'utils/wht50-document.js',
    'utils/credit-slip.js',
    'services/admin-report-service.js',
    'services/receipt-service.js',
    'services/product-service.js',
    'services/agent-service.js',
    'services/admin-user-service.js',
    'services/insurer-service.js',
    'services/audit-service.js',
    'services/admin-notification-service.js',
    'services/notification-service.js',
    'ui/role-guard.js',
    'ui/shell.js',
    'ui/table-ui.js',
    'ui/admin-modal.js'
  ].forEach((file) => {
    document.write(`<script src="${root}${file}?v=${cache}"><\/script>`);
  });
})();
