/**
 * API client — routes to MockAPI or real fetch based on config.
 */
window.App = window.App || {};

App.API = {
  _canFetch() {
    return !App.Config.USE_MOCK_API
      || !!App.Config.USE_REAL_AUTH
      || !!App.Config.USE_REAL_AGENTS
      || !!App.Config.USE_REAL_ADMIN_USERS
      || !!App.Config.USE_REAL_CREDIT
      || !!App.Config.USE_REAL_WITHDRAW
      || !!App.Config.USE_REAL_AGENT_REQUESTS
      || !!App.Config.USE_REAL_IDENTITY;
  },

  _headers(options = {}, { json = true } = {}) {
    const session = App.Session?.get();
    const headers = { ...(options.headers || {}) };
    if (json && headers['Content-Type'] == null) {
      headers['Content-Type'] = 'application/json';
    }
    if (session?.token) headers.Authorization = `Bearer ${session.token}`;
    return headers;
  },

  async request(endpoint, options = {}) {
    if (!this._canFetch()) {
      throw new Error(`Mock mode: use service methods instead of ${endpoint}`);
    }

    const res = await fetch(`${App.Config.API_BASE_URL}${endpoint}`, {
      ...options,
      headers: this._headers(options, { json: true })
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

  async requestBlob(endpoint, options = {}) {
    if (!this._canFetch()) {
      throw new Error(`Mock mode: use service methods instead of ${endpoint}`);
    }

    const res = await fetch(`${App.Config.API_BASE_URL}${endpoint}`, {
      ...options,
      headers: this._headers(options, { json: false })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.message || res.statusText);
      err.code = body.code;
      err.status = res.status;
      throw err;
    }

    return res.blob();
  },

  mock() {
    return App.MockAPI;
  }
};
