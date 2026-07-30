/**
 * Brochure image viewer with optional tabs, pagination, lightbox, and auto-slide.
 */
window.App = window.App || {};

App.BrochurePanel = {
  mount(root, options = {}) {
    if (!root) return null;

    const pagesByTab = options.pagesByTab || { default: options.pages || [] };
    const tabDefs = options.tabs || Object.keys(pagesByTab).map((id) => ({ id, label: id }));
    const intervalMs = options.autoMs || 4000;
    const layoutRoot = options.layoutRoot || root.closest('.product-key');
    const collapsible = !!options.collapsible;
    let collapsed = collapsible ? options.collapsed !== false : false;
    let activeTab = options.initialTab || tabDefs[0]?.id || 'default';
    let index = 0;
    let timer = null;
    let paused = false;

    function applyCollapsedState() {
      if (!collapsible) return;
      root.classList.toggle('is-collapsed', collapsed);
      layoutRoot?.classList.toggle('is-brochure-collapsed', collapsed);
      options.onCollapseChange?.(collapsed);
    }

    function setCollapsed(next) {
      if (!collapsible) return;
      collapsed = !!next;
      applyCollapsedState();
      if (collapsed) stopAuto();
      else if (!paused) startAuto();
      render();
    }

    function currentPages() {
      return pagesByTab[activeTab] || pagesByTab.default || [];
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startAuto() {
      stopAuto();
      if (collapsed || paused || currentPages().length < 2) return;
      timer = setInterval(() => {
        if (isLightboxOpen()) return;
        index = (index + 1) % currentPages().length;
        render({ keepTimer: true });
      }, intervalMs);
    }

    function isLightboxOpen() {
      const lb = document.getElementById('brochureLightbox');
      return !!(lb && !lb.hidden);
    }

    function collapseToggleHtml() {
      const label = collapsed ? 'แสดงโบรชัวร์' : 'พับโบรชัวร์';
      const icon = collapsed ? 'chevrons-down' : 'chevrons-up';
      return `
        <button type="button" class="brochure-panel__collapseBtn" data-brochure-collapse aria-expanded="${collapsed ? 'false' : 'true'}">
          <i data-lucide="${icon}" style="width:16px;height:16px"></i>
          <span>${label}</span>
        </button>`;
    }

    function bindCollapseToggle() {
      root.querySelector('[data-brochure-collapse]')?.addEventListener('click', () => {
        setCollapsed(!collapsed);
        if (window.lucide?.createIcons) lucide.createIcons();
      });
      if (window.lucide?.createIcons) lucide.createIcons();
    }

    function render(opts = {}) {
      const pages = currentPages();
      if (!pages.length) {
        stopAuto();
        root.innerHTML = `
          <div class="brochure-panel__head">
            <div class="brochure-panel__headMain">
              <h2 class="brochure-panel__title">${options.title || 'โบรชัวร์'}</h2>
            </div>
            ${collapsible ? collapseToggleHtml() : ''}
          </div>
          <div class="brochure-panel__stage"><p style="color:#64748b;font-size:0.9rem">ยังไม่มีโบรชัวร์</p></div>`;
        bindCollapseToggle();
        applyCollapsedState();
        return;
      }
      if (index >= pages.length) index = 0;

      const page = pages[index];
      const showTabs = tabDefs.length > 1;
      root.innerHTML = `
        <div class="brochure-panel__head">
          <div class="brochure-panel__headMain">
            <h2 class="brochure-panel__title">${options.title || 'โบรชัวร์'}</h2>
            ${collapsed ? '<span class="brochure-panel__collapsedHint">พับอยู่ — กดเพื่อดูรายละเอียดแผน</span>' : ''}
          </div>
          ${collapsible ? collapseToggleHtml() : ''}
        </div>
        ${showTabs ? `<div class="brochure-panel__tabs" role="tablist">
          ${tabDefs.map((t) => `<button type="button" class="brochure-panel__tab${t.id === activeTab ? ' is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">${t.label}</button>`).join('')}
        </div>` : ''}
        <div class="brochure-panel__stage">
          <img class="brochure-panel__img" src="${page.src}" alt="${page.label || 'โบรชัวร์'}" data-lightbox-src="${page.src}">
        </div>
        <div class="brochure-panel__controls">
          <button type="button" class="brochure-panel__btn" data-brochure-prev aria-label="หน้าก่อน">‹</button>
          <span class="brochure-panel__page">${index + 1} / ${pages.length}</span>
          <button type="button" class="brochure-panel__btn" data-brochure-next aria-label="หน้าถัดไป">›</button>
        </div>
      `;

      bindCollapseToggle();

      root.querySelectorAll('[data-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          index = 0;
          options.onTabChange?.(activeTab);
          render();
        });
      });

      root.querySelector('[data-brochure-prev]')?.addEventListener('click', () => {
        const len = currentPages().length;
        if (!len) return;
        index = (index - 1 + len) % len;
        render();
      });
      root.querySelector('[data-brochure-next]')?.addEventListener('click', () => {
        const len = currentPages().length;
        if (!len) return;
        index = (index + 1) % len;
        render();
      });
      root.querySelector('.brochure-panel__img')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(page.src);
      });

      applyCollapsedState();
      if (!opts.keepTimer) startAuto();
    }

    function openLightbox(src) {
      let lb = document.getElementById('brochureLightbox');
      if (!lb) {
        lb = document.createElement('div');
        lb.id = 'brochureLightbox';
        lb.className = 'brochure-lightbox';
        lb.hidden = true;
        lb.innerHTML = '<img alt="โบรชัวร์ขยาย">';
        lb.addEventListener('click', () => {
          lb.hidden = true;
          if (!paused && !collapsed) startAuto();
        });
        document.body.appendChild(lb);
      }
      const img = lb.querySelector('img');
      img.src = src;
      lb.hidden = false;
      stopAuto();
    }

    root.addEventListener('mouseenter', () => {
      paused = true;
      stopAuto();
    });
    root.addEventListener('mouseleave', () => {
      paused = false;
      if (!isLightboxOpen() && !collapsed) startAuto();
    });

    applyCollapsedState();
    render();
    return {
      setTab(tabId) {
        if (pagesByTab[tabId]) {
          activeTab = tabId;
          index = 0;
          render();
        }
      },
      getTab() {
        return activeTab;
      },
      setCollapsed,
      isCollapsed() {
        return collapsed;
      },
      destroy() {
        stopAuto();
      }
    };
  }
};
