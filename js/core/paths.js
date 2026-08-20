/**
 * Web-safe path helpers — always use absolute site paths for navigation.
 */
window.App = window.App || {};

App.Paths = {
  isBadBase(value) {
    const s = String(value || '');
    return /vhosts|httpdocs|:\\/i.test(s) || /^\/var\//i.test(s);
  },

  siteRoot() {
    const path = window.location.pathname || '';
    if (path === '/kladeebroker' || path.indexOf('/kladeebroker/') === 0) {
      return '/kladeebroker/';
    }
    return '/';
  },

  siteRootSegment() {
    const root = this.siteRoot().replace(/^\/+|\/+$/g, '');
    return root || '';
  },

  /** Remove duplicated /kladeebroker prefix from a stored or relative path. */
  stripSitePrefix(path) {
    let clean = String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
    const root = this.siteRootSegment();
    while (root && (clean === root || clean.startsWith(`${root}/`))) {
      clean = clean.slice(root.length).replace(/^\/+/, '');
    }
    return clean;
  },

  /** Absolute URL path from site root, e.g. /login or /kladeebroker/login */
  absolute(relativePath) {
    const clean = this.stripSitePrefix(relativePath);
    return `${this.siteRoot()}${clean}`;
  },

  /** Normalize portal redirects (login next, post-login) without doubling site prefix. */
  portalPath(path) {
    let clean = this.stripSitePrefix(path);
    clean = clean.replace(/\.html$/i, '').replace(/\/index$/i, '');
    if (clean === 'agent' || clean === 'admin') clean += '/';
    return this.absolute(clean);
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

  go(path) {
    window.location.href = this.absolute(path);
  },

  agentHome() {
    return this.absolute('agent/');
  },

  agentProfile() {
    return this.absolute('agent/profile');
  },

  verifyIdentity() {
    return this.absolute('agent/verify-identity');
  },

  login() {
    return this.absolute('login');
  }
};
