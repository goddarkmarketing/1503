window.App = window.App || {};

App.AuthService = {
  _useRealAuth() {
    return !!App.Config.USE_REAL_AUTH || !App.Config.USE_MOCK_API;
  },

  _enrichAgentUser(user) {
    if (!user || user.role !== 'agent' || !App.AgentFeatures) return user;
    const featurePermissions = App.AgentFeatures.getUserPermissions({
      role: 'agent',
      featurePermissions: user.featurePermissions
    });
    return { ...user, featurePermissions };
  },

  async login(username, password) {
    let result;
    if (this._useRealAuth()) {
      result = await App.API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      result = {
        ...result,
        user: this._enrichAgentUser(result.user)
      };
    } else {
      result = await App.MockAPI.login(username, password);
    }
    App.Session.set(result);
    return result.user;
  },

  async logout() {
    // Clear client session first; future API calls will no longer include Authorization.
    // We skip the /auth/logout API call to avoid host-specific 403 noise during navigation.
    App.Session.clear();
  },

  getCurrentUser() {
    return App.Session.getUser();
  },

  isAuthenticated() {
    return !!App.Session.get();
  },

  async refreshUser() {
    const session = App.Session.get();
    if (!session) return null;
    if (this._useRealAuth()) {
      const user = this._enrichAgentUser(await App.API.request('/auth/me'));
      App.Session.updateUser(user);
      return user;
    }
    const user = await App.MockAPI.getCurrentUser(session.user.id);
    App.Session.updateUser(user);
    return user;
  },

  async requestPasswordReset(username) {
    if (this._useRealAuth() || !App.Config.USE_MOCK_API) {
      return App.API.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username })
      });
    }
    return App.MockAPI.requestPasswordReset(username);
  },

  async resetPassword(token, newPassword) {
    if (this._useRealAuth() || !App.Config.USE_MOCK_API) {
      return App.API.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      });
    }
    return App.MockAPI.resetPassword(token, newPassword);
  }
};
