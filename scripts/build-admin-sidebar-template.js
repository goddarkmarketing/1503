const fs = require('fs');
const path = require('path');

const partial = fs.readFileSync(path.join(__dirname, '../partials/admin-sidebar-nav.html'), 'utf8').trim();
const escaped = partial.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const footer = `
window.ADMIN_SIDEBAR_NAV_COUNT = 15;

window.renderAdminSidebarNav = function renderAdminSidebarNav() {
  const navRoot = document.querySelector('.sidebar-nav[data-admin-sidebar]');
  if (!navRoot || !window.ADMIN_SIDEBAR_NAV_HTML) return false;

  const itemCount = navRoot.querySelectorAll('.nav-item').length;
  const hasGroups = !!navRoot.querySelector('.nav-group');
  const base = document.body?.dataset?.basePath || '';

  if (itemCount >= window.ADMIN_SIDEBAR_NAV_COUNT && hasGroups) {
    return true;
  }

  navRoot.innerHTML = window.ADMIN_SIDEBAR_NAV_HTML.replace(/\\{\\{BASE\\}\\}/g, base);
  navRoot.dataset.sidebarRendered = '1';
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
