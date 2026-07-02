/** Receipt panel shortcut menu (เมนูลัด) */
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.querySelector('.receipt-shortcut-wrap');
  if (!wrap) return;

  const btn = wrap.querySelector('.receipt-panel__menu');
  const menu = wrap.querySelector('.receipt-shortcut-dropdown');
  if (!btn || !menu) return;

  const current = normalizePath(window.location.pathname);

  menu.querySelectorAll('.receipt-shortcut-item[href]').forEach((link) => {
    const linkPath = normalizePath(new URL(link.href, window.location.href).pathname);
    if (current === linkPath || current.endsWith(linkPath)) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !menu.classList.contains('is-open');
    setOpen(open);
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();

  function setOpen(open) {
    menu.classList.toggle('is-open', open);
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
});

function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+$/, '') || '/';
}
