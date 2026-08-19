/**
 * Auto boot agent portal — auth guard, identity gate, shell on every agent page.
 */
(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    if (window.__agentPortalBooted) return;
    if (document.body?.dataset?.portal === 'admin') return;
    if (!document.body?.hasAttribute('data-base-path')) return;

    const pagePath = App.RoleGuard?.currentPagePath?.() || '';
    if (pagePath === 'agent/verify-identity') return;

    window.__agentPortalBooted = true;
    const basePath = App.Paths.detectBasePath();

    if (App.AuthService?.isAuthenticated?.()) {
      try {
        await App.AuthService.refreshUser();
      } catch {
        /* RoleGuard sends to login */
      }
    }

    if (!App.RoleGuard.enforce('agent', { basePath })) return;

    const canProceed = App.AgentOnboarding.enforce({ basePath });
    if (!canProceed) return;

    if (App.Shell && !window.__shellInitialized) {
      window.__shellInitialized = true;
      await App.Shell.init({
        basePath,
        profilePath: App.Paths.agentProfile(basePath)
      });
    }
  });
})();
