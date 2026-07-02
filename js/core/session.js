/**
 * Session storage — replace with httpOnly cookie when API auth is ready.
 */
window.App = window.App || {};

App.Session = {
  get() {
    try {
      const raw = localStorage.getItem(App.Config.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(session) {
    localStorage.setItem(App.Config.SESSION_KEY, JSON.stringify(session));
  },

  clear() {
    localStorage.removeItem(App.Config.SESSION_KEY);
  },

  getUser() {
    return this.get()?.user || null;
  },

  getRole() {
    return this.getUser()?.role || null;
  },

  getAgentId() {
    const user = this.getUser();
    return user?.role === 'agent' ? user.id : null;
  },

  updateUser(partial) {
    const session = this.get();
    if (!session) return;
    session.user = { ...session.user, ...partial };
    this.set(session);
  }
};
