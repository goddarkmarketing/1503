/**
 * Homepage mobile — drawer layout hook (logic in mobile-menu.js)
 */
(function () {
  const MQ = window.matchMedia('(max-width: 768px)');

  function layout() {
    if (window.KladeeMobileMenu && typeof window.KladeeMobileMenu.layoutDrawer === 'function') {
      window.KladeeMobileMenu.layoutDrawer();
    }
  }

  function init() {
    layout();
    MQ.addEventListener('change', layout);
    document.addEventListener('kbMobileMenuReady', layout);
    document.addEventListener('siteChromeReady', layout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
