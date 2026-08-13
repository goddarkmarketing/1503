/**
 * API client — routes to MockAPI or real fetch based on config.
 */
window.App = window.App || {};

App.API = {
  async request(endpoint, options = {}) {
    const allowFetch = !App.Config.USE_MOCK_API
      || !!App.Config.USE_REAL_AUTH
      || !!App.Config.USE_REAL_AGENTS;
    if (!allowFetch) {
      throw new Error(`Mock mode: use service methods instead of ${endpoint}`);
    }

    const session = App.Session?.get();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (session?.token) headers.Authorization = `Bearer ${session.token}`;

    const res = await fetch(`${App.Config.API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.message || res.statusText);
      err.code = body.code;
      err.status = res.status;
      throw err;
    }

    return res.json();
  },

  mock() {
    return App.MockAPI;
  }
};
