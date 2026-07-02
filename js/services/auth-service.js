window.App = window.App || {};

App.AuthService = {
  async login(username, password) {
    let result;
    if (App.Config.USE_MOCK_API) {
      result = await App.MockAPI.login(username, password);
    } else {
      result = await App.API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    }
    App.Session.set(result);
    return result.user;
  },

  logout() {
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
    if (App.Config.USE_MOCK_API) {
      const user = await App.MockAPI.getCurrentUser(session.user.id);
      App.Session.updateUser(user);
      return user;
    }
    const user = await App.API.request('/auth/me');
    App.Session.updateUser(user);
    return user;
  }
};
