/**
 * ThemedSelect — replace native OS dropdown styling with brand-green list UI.
 * Keeps the underlying <select> in sync for existing form/filter scripts.
 */
(function (global) {
  const App = (global.App = global.App || {});
  const OPEN_CLASS = 'is-open';
  const CHEVRON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

  function shouldSkip(select) {
    if (!select || select.tagName !== 'SELECT') return true;
    if (select.dataset.kbSelect === '1' || select._kbSelect) return true;
    if (select.multiple || Number(select.getAttribute('size') || 0) > 1) return true;
    if (select.classList.contains('search-select-native')) return true;
    if (select.closest('.search-select') || select.closest('.kb-select') || select.closest('.credit-bank-select')) return true;
    return false;
  }

  function optionLabel(opt) {
    return String(opt?.textContent || opt?.label || '').trim();
  }

  function create(select) {
    if (shouldSkip(select)) return null;

    const wrap = document.createElement('div');
    wrap.className = 'kb-select';
    if (select.classList.contains('admin-select')) wrap.classList.add('kb-select--admin');
    if (select.disabled) wrap.classList.add('is-disabled');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'kb-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const valueEl = document.createElement('span');
    valueEl.className = 'kb-select__value';

    const chevron = document.createElement('span');
    chevron.className = 'kb-select__chevron';
    chevron.innerHTML = CHEVRON;
    chevron.setAttribute('aria-hidden', 'true');

    trigger.appendChild(valueEl);
    trigger.appendChild(chevron);

    const menu = document.createElement('ul');
    menu.className = 'kb-select__menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;

    const parent = select.parentNode;
    parent.insertBefore(wrap, select);
    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    wrap.appendChild(select);

    select.classList.add('kb-select__native');
    select.dataset.kbSelect = '1';
    select.tabIndex = -1;

    const api = {
      select,
      wrap,
      trigger,
      valueEl,
      menu,
      open: false,
      syncFromSelect() {
        const selected = select.options[select.selectedIndex];
        valueEl.textContent = selected ? optionLabel(selected) : 'เลือก...';
        valueEl.classList.toggle('is-placeholder', !selected || selected.value === '');
        wrap.classList.toggle('is-disabled', !!select.disabled);
        trigger.disabled = !!select.disabled;
        renderMenu();
      },
      rebuild() {
        renderMenu();
        api.syncFromSelect();
      },
      destroy() {
        document.removeEventListener('click', onDocClick, true);
        observer.disconnect();
        parent.insertBefore(select, wrap);
        select.classList.remove('kb-select__native');
        delete select.dataset.kbSelect;
        select.tabIndex = 0;
        select._kbSelect = null;
        wrap.remove();
      }
    };

    function renderMenu() {
      menu.innerHTML = '';
      [...select.options].forEach((opt, index) => {
        if (opt.hidden) return;
        const li = document.createElement('li');
        li.className = 'kb-select__option';
        li.setAttribute('role', 'option');
        li.dataset.index = String(index);
        li.dataset.value = opt.value;
        li.textContent = optionLabel(opt);
        if (opt.disabled) {
          li.classList.add('is-disabled');
          li.setAttribute('aria-disabled', 'true');
        }
        if (opt.selected) {
          li.classList.add('is-selected');
          li.setAttribute('aria-selected', 'true');
        }
        li.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (opt.disabled) return;
          select.selectedIndex = index;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          select.dispatchEvent(new Event('input', { bubbles: true }));
          api.syncFromSelect();
          close();
        });
        menu.appendChild(li);
      });
    }

    function open() {
      if (select.disabled) return;
      closeAll(wrap);
      api.open = true;
      wrap.classList.add(OPEN_CLASS);
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const selected = menu.querySelector('.kb-select__option.is-selected');
      selected?.scrollIntoView({ block: 'nearest' });
    }

    function close() {
      api.open = false;
      wrap.classList.remove(OPEN_CLASS);
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }

    function toggle() {
      api.open ? close() : open();
    }

    function onDocClick(e) {
      if (!wrap.contains(e.target)) close();
    }

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      } else if (e.key === 'Escape') {
        close();
      }
    });

    select.addEventListener('change', () => api.syncFromSelect());

    const observer = new MutationObserver(() => api.rebuild());
    observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected'] });

    document.addEventListener('click', onDocClick, true);

    select._kbSelect = api;
    api.syncFromSelect();
    return api;
  }

  function closeAll(exceptWrap) {
    document.querySelectorAll(`.kb-select.${OPEN_CLASS}`).forEach((el) => {
      if (exceptWrap && el === exceptWrap) return;
      const sel = el.querySelector('select');
      sel?._kbSelect && (sel._kbSelect.open = false);
      el.classList.remove(OPEN_CLASS);
      const menu = el.querySelector('.kb-select__menu');
      if (menu) menu.hidden = true;
      const trigger = el.querySelector('.kb-select__trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function enhance(root = document) {
    const scope = root.querySelectorAll
      ? root
      : document;
    const nodes = scope.querySelectorAll
      ? scope.querySelectorAll('select')
      : [];
    nodes.forEach((select) => create(select));
  }

  let observerStarted = false;
  function startObserver() {
    if (observerStarted || !document.body) return;
    observerStarted = true;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!node || node.nodeType !== 1) return;
          if (node.matches?.('select')) create(node);
          else if (node.querySelectorAll) enhance(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    if (!document.body) return;
    enhance(document);
    startObserver();
  }

  App.ThemedSelect = { enhance, create, closeAll, boot, startObserver };

  // Boot as soon as DOM is ready — do not wait for portal async init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window);
