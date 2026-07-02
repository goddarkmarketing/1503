document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  function storeQuickProduct() {
    const product = new URLSearchParams(window.location.search).get('product');
    if (!product) return;
    try {
      sessionStorage.setItem('kladeebroker_quick_product', product);
    } catch (e) {
      /* ignore */
    }
  }

  function resolveRedirect(user) {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const product = params.get('product');

    if (product) {
      try {
        sessionStorage.setItem('kladeebroker_quick_product', product);
      } catch (e) {
        /* ignore */
      }
    }

    if (!next) {
      return App.Permissions.homePath(user.role);
    }

    const safe = next.replace(/^\/+/, '').replace(/\.\./g, '');
    if (!safe || /^https?:/i.test(safe) || safe.indexOf('javascript:') === 0) {
      return App.Permissions.homePath(user.role);
    }

    if (user.role === 'admin' && /^compulsory\//i.test(safe)) {
      return App.Permissions.homePath(user.role);
    }

    return safe;
  }

  if (App.AuthService.isAuthenticated()) {
    const role = App.Session.getRole();
    window.location.replace(resolveRedirect({ role }));
    return;
  }

  storeQuickProduct();

  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');

  document.querySelectorAll('.login-mock__item').forEach((btn) => {
    btn.addEventListener('click', () => {
      form.username.value = btn.dataset.username || '';
      form.password.value = btn.dataset.password || '';
      errorEl.classList.remove('visible');
      form.password.focus();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('visible');

    const username = form.username.value.trim();
    const password = form.password.value;

    try {
      const user = await App.AuthService.login(username, password);
      window.location.replace(resolveRedirect(user));
    } catch (err) {
      errorEl.textContent = err.message || 'เข้าสู่ระบบไม่สำเร็จ';
      errorEl.classList.add('visible');
    }
  });
});
