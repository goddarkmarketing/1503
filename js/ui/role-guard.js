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

  /**
   * @param {'agent'|'admin'|null} requiredRole - null = any authenticated user
   * @param {object} options
   * @param {string} options.basePath - '' for root pages, '../' for subfolders
   */
  enforce(requiredRole, options = {}) {
    const next = encodeURIComponent(this.currentPagePath());
    const loginUrl = `${App.Paths.login()}?next=${next}`;

    if (!App.AuthService.isAuthenticated()) {
      window.location.replace(loginUrl);
      return false;
    }

    const role = App.Session.getRole();
    if (requiredRole && role !== requiredRole) {
      window.location.replace(role === 'admin' ? App.Paths.absolute('admin/') : App.Paths.agentHome());
      return false;
    }

    const basePath = App.Paths.detectBasePath();
    if (requiredRole === 'agent' && App.AgentFeatures) {
      const permOk = App.AgentFeatures.enforceCurrentPage({ basePath });
      if (!permOk) return false;
    }

    return true;
  }
};
