/**
 * Page access control — redirect unauthenticated or wrong-role users.
 */
window.App = window.App || {};

App.RoleGuard = {
  normalizePagePath(path) {
    let p = String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
    p = p.replace(/\.html$/i, '');
    p = p.replace(/\/index$/i, '');
    p = p.replace(/\/+$/, '');
    return p;
  },

  currentPagePath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const roots = ['kladeebroker', '1503'];
    let start = 0;
    for (let i = 0; i < parts.length; i += 1) {
      if (roots.includes(parts[i])) {
        start = i + 1;
        break;
      }
    }
    return this.normalizePagePath(parts.slice(start).join('/'));
  },

  loginPath() {
    if (App.Paths?.login) return App.Paths.login();
    const path = window.location.pathname || '';
    return path.indexOf('/kladeebroker/') === 0 ? '/kladeebroker/login' : '/login';
  },

  adminHome() {
    if (App.Paths?.absolute) return App.Paths.absolute('admin/');
    const path = window.location.pathname || '';
    return path.indexOf('/kladeebroker/') === 0 ? '/kladeebroker/admin/' : '/admin/';
  },

  agentHome() {
    if (App.Paths?.agentHome) return App.Paths.agentHome();
    const path = window.location.pathname || '';
    return path.indexOf('/kladeebroker/') === 0 ? '/kladeebroker/agent/' : '/agent/';
  },

  /**
   * @param {'agent'|'admin'|null} requiredRole - null = any authenticated user
   * @param {object} options
   * @param {string} options.basePath - '' for root pages, '../' for subfolders
   */
  enforce(requiredRole, options = {}) {
    const next = encodeURIComponent(this.currentPagePath());
    const loginUrl = `${this.loginPath()}?next=${next}`;

    if (!App.AuthService?.isAuthenticated?.()) {
      document.documentElement.style.visibility = 'hidden';
      window.location.replace(loginUrl);
      return false;
    }

    const role = App.Session.getRole();
    if (requiredRole && role !== requiredRole) {
      document.documentElement.style.visibility = 'hidden';
      window.location.replace(role === 'admin' ? this.adminHome() : this.agentHome());
      return false;
    }

    const basePath = App.Paths?.detectBasePath?.() || options.basePath || '../';
    if (requiredRole === 'agent' && App.AgentFeatures) {
      const permOk = App.AgentFeatures.enforceCurrentPage({ basePath });
      if (!permOk) return false;
    }

    return true;
  }
};
