const fs = require('fs');
const path = require('path');

const partial = fs.readFileSync(path.join(__dirname, '../partials/agent-sidebar-nav.html'), 'utf8').trim();
const escaped = partial.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const footer = `
window.AGENT_SIDEBAR_NAV_COUNT = 11;

window.renderAgentSidebarNav = function renderAgentSidebarNav() {
  const navRoot = document.querySelector('.sidebar-nav[data-agent-sidebar]');
  if (!navRoot || !window.AGENT_SIDEBAR_NAV_HTML) return false;

  const itemCount = navRoot.querySelectorAll('.nav-item').length;
  const hasReceipt = !!navRoot.querySelector('[data-receipt-nav]');
  const hasGroups = !!navRoot.querySelector('.nav-group');
  const base = document.body?.dataset?.basePath || '';

  if (itemCount >= window.AGENT_SIDEBAR_NAV_COUNT && hasReceipt && hasGroups) {
    return true;
  }

  navRoot.innerHTML = window.AGENT_SIDEBAR_NAV_HTML.replace(/\\{\\{BASE\\}\\}/g, base);
  navRoot.dataset.sidebarRendered = '1';
  return true;
};

(function bootAgentSidebarNav() {
  function run() {
    if (typeof window.renderAgentSidebarNav === 'function') {
      window.renderAgentSidebarNav();
    }
  }
  run();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  }
})();
`;

const out = `/** Embedded agent sidebar — avoids fetch/cache issues */\nwindow.AGENT_SIDEBAR_NAV_HTML = \`${escaped}\`;\n${footer}`;

fs.writeFileSync(path.join(__dirname, '../js/agent-sidebar-nav-template.js'), out);
console.log('built agent-sidebar-nav-template.js');
