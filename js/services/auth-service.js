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
    const token = App.Session.get()?.token;
    App.Session.clear();
    if (this._useRealAuth() && token) {
      try {
        await fetch(`${App.Config.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      } catch {
        /* ignore network/session errors on logout */
      }
    }
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
  }
};
