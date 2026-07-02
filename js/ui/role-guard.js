/**
 * Page access control — redirect unauthenticated or wrong-role users.
 */
window.App = window.App || {};

App.RoleGuard = {
  currentPagePath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const roots = ['kladeebroker', '1503'];
    let rootIdx = -1;
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      if (roots.includes(parts[i])) {
        rootIdx = i;
        break;
      }
    }
    if (rootIdx >= 0 && rootIdx < parts.length - 1) {
      return parts.slice(rootIdx + 1).join('/');
    }
    if (parts.length >= 2 && ['compulsory', 'agent', 'admin'].includes(parts[parts.length - 2])) {
      return parts.slice(-2).join('/');
    }
    return parts[parts.length - 1] || '';
  },

  /**
   * @param {'agent'|'admin'|null} requiredRole - null = any authenticated user
   * @param {object} options
   * @param {string} options.basePath - '' for root pages, '../' for subfolders
   */
  enforce(requiredRole, options = {}) {
    const base = options.basePath || '';
    const next = encodeURIComponent(this.currentPagePath());
    const loginUrl = `${base}${App.Permissions.loginPath()}?next=${next}`;

    if (!App.AuthService.isAuthenticated()) {
      window.location.replace(loginUrl);
      return false;
    }

    const role = App.Session.getRole();
    if (requiredRole && role !== requiredRole) {
      window.location.replace(`${base}${App.Permissions.homePath(role)}`);
      return false;
    }

    return true;
  }
};
