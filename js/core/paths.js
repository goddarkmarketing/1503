/**
 * Web-safe path helpers — never emit server filesystem paths in hrefs.
 */
window.App = window.App || {};

App.Paths = {
  isBadBase(value) {
    const s = String(value || '');
    return /vhosts|httpdocs|:\\/i.test(s) || /^\/var\//i.test(s);
  },

  normalizeBasePath(raw) {
    let base = String(raw || '').trim();
    if (this.isBadBase(base)) {
      base = '';
    }
    if (base && !base.endsWith('/')) {
      base += '/';
    }
    return base;
  },

  detectBasePath() {
    const fromData = document.body?.dataset?.basePath;
    if (fromData && !this.isBadBase(fromData)) {
      return this.normalizeBasePath(fromData);
    }

    const path = (window.location.pathname || '').replace(/\\/g, '/');
    if (/\/agent\/(?:receipt|reports)\//.test(path)) {
      return '../../';
    }
    if (path.includes('/agent/') || /\/agent\/?$/.test(path)) {
      return '../';
    }
    if (path.includes('/compulsory/') || path.includes('/voluntary/')
      || path.includes('/pa/') || path.includes('/travel/')) {
      return '../';
    }
    return '';
  },

  agentProfile(base) {
    const b = this.normalizeBasePath(base || this.detectBasePath());
    return `${b}agent/profile`;
  },

  verifyIdentity(base) {
    const b = this.normalizeBasePath(base || this.detectBasePath());
    return `${b}agent/verify-identity`;
  },

  login(base) {
    const b = this.normalizeBasePath(base || this.detectBasePath());
    return `${b}login`;
  }
};
