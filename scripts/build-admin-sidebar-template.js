const fs = require('fs');
const path = require('path');

const partial = fs.readFileSync(path.join(__dirname, '../partials/admin-sidebar-nav.html'), 'utf8').trim();
const escaped = partial.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const footer = `
window.ADMIN_SIDEBAR_NAV_VERSION = '20260816f';

window.renderAdminSidebarNav = function renderAdminSidebarNav() {
  const navRoot = document.querySelector('.sidebar-nav[data-admin-sidebar]');
  if (!navRoot || !window.ADMIN_SIDEBAR_NAV_HTML) return false;

  const base = document.body?.dataset?.basePath || '';
  const alreadyCurrent = navRoot.dataset.sidebarVersion === window.ADMIN_SIDEBAR_NAV_VERSION
    && navRoot.querySelector('[data-nav="withdraw-requests"]');
  if (alreadyCurrent) return true;

  navRoot.innerHTML = window.ADMIN_SIDEBAR_NAV_HTML.replace(/\\{\\{BASE\\}\\}/g, base);
  navRoot.dataset.sidebarVersion = window.ADMIN_SIDEBAR_NAV_VERSION;
  return true;
};

(function bootAdminSidebarNav() {
  function run() {
    if (typeof window.renderAdminSidebarNav === 'function') {
      window.renderAdminSidebarNav();
    }
  }
  run();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  }
})();
`;

const out = `/** Embedded admin sidebar */\nwindow.ADMIN_SIDEBAR_NAV_HTML = \`${escaped}\`;\n${footer}`;
fs.writeFileSync(path.join(__dirname, '../js/admin-sidebar-nav-template.js'), out);
console.log('built admin-sidebar-nav-template.js');
