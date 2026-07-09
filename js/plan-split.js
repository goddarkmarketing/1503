/**
 * Plan page: left card nav + right detail panel tabs.
 */
(function () {
  function initSplit(root) {
    const tabs = root.querySelectorAll('[data-plan-tab]');
    const panels = root.querySelectorAll('[data-plan-panel]');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const idx = tab.getAttribute('data-plan-tab');
        tabs.forEach((t) => {
          const active = t.getAttribute('data-plan-tab') === idx;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach((panel) => {
          const active = panel.getAttribute('data-plan-panel') === idx;
          panel.classList.toggle('is-active', active);
          if (active) panel.removeAttribute('hidden');
          else panel.setAttribute('hidden', '');
        });
      });
    });
  }

  function boot() {
    document.querySelectorAll('[data-plan-split]').forEach(initSplit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
