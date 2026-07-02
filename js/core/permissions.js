/**
 * Role-based permissions map.
 */
window.App = window.App || {};

App.Permissions = {
  agent: [
    'view_own_balance',
    'issue_policy',
    'view_own_policies',
    'view_own_reports',
    'edit_own_profile'
  ],

  admin: [
    'view_all_agents',
    'manage_agents',
    'adjust_balance',
    'view_all_policies',
    'view_all_reports',
    'manage_insurers'
  ],

  has(role, permission) {
    return (this[role] || []).includes(permission);
  },

  homePath(role) {
    return role === 'admin' ? 'admin/index.html' : 'agent/index.html';
  },

  loginPath() {
    return 'login.html';
  }
};
