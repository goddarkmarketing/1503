/**
 * Auto boot agent portal — auth guard, identity gate, shell on every agent page.
 */
(function () {
  let resolveReady;
  window.App = window.App || {};
  App.AgentPortal = App.AgentPortal || {};
  App.AgentPortal.ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  App.AgentPortal.whenReady = function whenReady() {
    return App.AgentPortal.ready;
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const finish = () => {
      try { resolveReady?.(true); } catch { /* ignore */ }
    };

    if (window.__agentPortalBooted) {
      finish();
      return;
    }
    if (document.body?.dataset?.portal === 'admin') {
      finish();
      return;
    }
    if (!document.body?.hasAttribute('data-base-path')) {
      finish();
      return;
    }

    const pagePath = App.RoleGuard?.currentPagePath?.() || '';
    if (pagePath === 'agent/verify-identity') {
      finish();
      return;
    }

    window.__agentPortalBooted = true;
    const basePath = App.Paths.detectBasePath();
    App.Shell?.ensureBrandLogo?.();

    if (App.AuthService?.isAuthenticated?.()) {
      try {
        await App.AuthService.refreshUser();
      } catch (err) {
        // Expired/invalid token — send to login instead of leaving the page half-loaded.
        if (!App.AuthService.isAuthenticated()) {
          const next = encodeURIComponent(App.RoleGuard?.currentPagePath?.() || '');
          window.location.replace(`${App.RoleGuard.loginPath()}?next=${next}`);
          finish();
          return;
        }
      }
    }

    if (!App.RoleGuard.enforce('agent', { basePath })) {
      finish();
      return;
    }

    if (App.Shell && !window.__shellInitialized) {
      window.__shellInitialized = true;
      await App.Shell.init({
        basePath,
        profilePath: App.Paths.agentProfile()
      });
    }

    await App.AgentOnboarding.enforce({ basePath });
    App.QuoteNavBadge?.render?.();
    finish();
  });
})();
