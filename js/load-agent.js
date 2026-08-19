/** Synchronous core stack loader for agent pages — keep before app.js */
(function () {
  const root = document.currentScript.src.replace(/load-agent\.js.*$/, '');
  const cache = '20260819m';
  document.write(`<script src="${root}core/favicon.js?v=${cache}"><\/script>`);
  [
    'vendor/lucide.min.js',
    'core/lucide-boot.js',
    'vendor/chart.umd.min.js',
    'agent-sidebar-nav-template.js',
    'config/app-config.js',
    'mock/data.js',
    'core/paths.js',
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
    'services/agent-service.js',
    'services/receipt-service.js',
    'services/notification-service.js',
    'services/team-service.js',
    'ui/role-guard.js',
    'core/agent-onboarding.js',
    'core/agent-portal-init.js',
    'ui/shell.js',
    'ui/table-ui.js'
  ].forEach((file) => {
    document.write(`<script src="${root}${file}?v=${cache}"><\/script>`);
  });
})();
