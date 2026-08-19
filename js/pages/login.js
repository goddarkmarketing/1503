document.addEventListener('DOMContentLoaded', () => {
  const REMEMBER_KEY = App.Config?.LOGIN_REMEMBER_KEY || 'kladeebroker_login_remember';
  const LOCKOUT_KEY = App.Config?.LOGIN_LOCKOUT_KEY || 'kladeebroker_login_lockout';
  const MAX_ATTEMPTS = Number(App.Config?.LOGIN_MAX_ATTEMPTS) || 5;
  const LOCKOUT_MS = Number(App.Config?.LOGIN_LOCKOUT_MS) || 15 * 60 * 1000;

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
      return App.AgentOnboarding?.postLoginPath?.(user, App.Permissions.homePath(user.role))
        ?? App.Permissions.homePath(user.role);
    }

    let safe = next.replace(/^\/+/, '').replace(/\.\./g, '');
    if (!safe || /^https?:/i.test(safe) || safe.indexOf('javascript:') === 0) {
      return App.Permissions.homePath(user.role);
    }

    if (user.role === 'admin' && /^compulsory\//i.test(safe)) {
      return App.Permissions.homePath(user.role);
    }

    safe = safe.replace(/\.html$/i, '').replace(/\/index$/i, '');
    if (safe === 'agent' || safe === 'admin') safe += '/';
    return safe;
  }

  function readRemember() {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      return {
        username: String(data.username || '').trim(),
        remember: !!data.remember
      };
    } catch {
      return null;
    }
  }

  function saveRemember(username, remember) {
    try {
      if (!remember) {
        localStorage.removeItem(REMEMBER_KEY);
        return;
      }
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({
        remember: true,
        username: String(username || '').trim()
      }));
    } catch {
      /* ignore */
    }
  }

  function readLockout() {
    try {
      const raw = localStorage.getItem(LOCKOUT_KEY);
      if (!raw) return { attempts: 0, lockedUntil: 0 };
      const data = JSON.parse(raw);
      return {
        attempts: Number(data.attempts) || 0,
        lockedUntil: Number(data.lockedUntil) || 0
      };
    } catch {
      return { attempts: 0, lockedUntil: 0 };
    }
  }

  function writeLockout(state) {
    try {
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  function clearLockout() {
    try {
      localStorage.removeItem(LOCKOUT_KEY);
    } catch {
      /* ignore */
    }
  }

  function remainingLockMs() {
    const { lockedUntil } = readLockout();
    return Math.max(0, lockedUntil - Date.now());
  }

  function formatRemain(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min <= 0) return `${sec} วินาที`;
    return `${min} นาที ${String(sec).padStart(2, '0')} วินาที`;
  }

  if (App.AuthService.isAuthenticated()) {
    const role = App.Session.getRole();
    window.location.replace(resolveRedirect({ role }));
    return;
  }

  storeQuickProduct();

  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const lockoutEl = document.getElementById('loginLockout');
  const submitBtn = document.getElementById('loginSubmit');
  const passwordInput = document.getElementById('password');
  const usernameInput = document.getElementById('username');
  const rememberMe = document.getElementById('rememberMe');
  const togglePass = document.getElementById('togglePassword');
  const forgotBtn = document.getElementById('forgotPasswordBtn');
  const forgotModal = document.getElementById('forgotPasswordModal');
  const forgotForm = document.getElementById('forgotPasswordForm');
  const forgotCancelBtn = document.getElementById('forgotCancelBtn');
  const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');

  let lockTimer = null;

  function setFormEnabled(enabled) {
    if (usernameInput) usernameInput.disabled = !enabled;
    if (passwordInput) passwordInput.disabled = !enabled;
    if (rememberMe) rememberMe.disabled = !enabled;
    if (submitBtn) {
      submitBtn.disabled = !enabled;
      if (!enabled && !submitBtn.classList.contains('is-loading')) {
        submitBtn.textContent = 'ถูกระงับชั่วคราว';
      }
      if (enabled && !submitBtn.classList.contains('is-loading')) {
        submitBtn.textContent = 'เข้าสู่ระบบ';
      }
    }
  }

  function showLockout() {
    const remain = remainingLockMs();
    if (remain <= 0) {
      if (lockoutEl) {
        lockoutEl.hidden = true;
        lockoutEl.textContent = '';
      }
      setFormEnabled(true);
      if (lockTimer) {
        clearInterval(lockTimer);
        lockTimer = null;
      }
      const state = readLockout();
      if (state.lockedUntil && state.lockedUntil <= Date.now()) {
        writeLockout({ attempts: 0, lockedUntil: 0 });
      }
      return false;
    }

    if (lockoutEl) {
      lockoutEl.hidden = false;
      lockoutEl.textContent = `ล็อกอินผิดหลายครั้ง ระบบระงับชั่วคราวอีก ${formatRemain(remain)}`;
    }
    if (errorEl) errorEl.classList.remove('visible');
    setFormEnabled(false);
    return true;
  }

  function startLockoutWatch() {
    if (lockTimer) clearInterval(lockTimer);
    if (!showLockout()) return;
    lockTimer = setInterval(() => {
      if (!showLockout()) {
        clearInterval(lockTimer);
        lockTimer = null;
      }
    }, 1000);
  }

  function registerFailedAttempt() {
    const state = readLockout();
    const attempts = (state.attempts || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      writeLockout({
        attempts,
        lockedUntil: Date.now() + LOCKOUT_MS
      });
      startLockoutWatch();
      return {
        locked: true,
        attempts,
        message: `ล็อกอินผิดครบ ${MAX_ATTEMPTS} ครั้ง ระบบระงับชั่วคราว ${Math.round(LOCKOUT_MS / 60000)} นาที`
      };
    }
    writeLockout({ attempts, lockedUntil: 0 });
    const left = MAX_ATTEMPTS - attempts;
    return {
      locked: false,
      attempts,
      message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือ ${left} ครั้ง)`
    };
  }

  // Restore remembered username
  const remembered = readRemember();
  if (remembered?.remember && remembered.username && usernameInput) {
    usernameInput.value = remembered.username;
    if (rememberMe) rememberMe.checked = true;
    passwordInput?.focus();
  }

  startLockoutWatch();

  togglePass?.addEventListener('click', () => {
    if (!passwordInput || passwordInput.disabled) return;
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    togglePass.textContent = show ? 'ซ่อน' : 'แสดง';
    togglePass.setAttribute('aria-pressed', show ? 'true' : 'false');
    togglePass.setAttribute('aria-label', show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
  });

  forgotBtn?.addEventListener('click', () => {
    if (errorEl) errorEl.classList.remove('visible');
    if (forgotModal) forgotModal.hidden = false;
    document.getElementById('forgotUsername')?.focus();
  });

  forgotCancelBtn?.addEventListener('click', () => {
    if (forgotModal) forgotModal.hidden = true;
  });

  forgotModal?.addEventListener('click', (e) => {
    if (e.target === forgotModal) forgotModal.hidden = true;
  });

  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = forgotForm.username.value.trim();
    if (!username) return;

    if (forgotSubmitBtn) {
      forgotSubmitBtn.disabled = true;
      forgotSubmitBtn.textContent = 'กำลังส่ง...';
    }

    try {
      const result = await App.AuthService.requestPasswordReset(username);
      if (forgotModal) forgotModal.hidden = true;
      window.alert(result.message || 'ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบอีเมล');
      forgotForm.reset();
    } catch (err) {
      window.alert(err.message || 'ส่งลิงก์ไม่สำเร็จ');
    } finally {
      if (forgotSubmitBtn) {
        forgotSubmitBtn.disabled = false;
        forgotSubmitBtn.textContent = 'ส่งลิงก์รีเซ็ต';
      }
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('visible');

    if (remainingLockMs() > 0) {
      startLockoutWatch();
      return;
    }

    const username = form.username.value.trim();
    const password = form.password.value;
    const remember = !!rememberMe?.checked;

    if (submitBtn) {
      submitBtn.classList.add('is-loading');
      submitBtn.textContent = 'กำลังเข้าสู่ระบบ...';
      submitBtn.disabled = true;
    }

    try {
      const user = await App.AuthService.login(username, password);
      clearLockout();
      saveRemember(username, remember);
      let target = resolveRedirect(user);
      if (App.AgentOnboarding?.needsVerification?.(user)) {
        window.location.replace(App.Paths.agentHome());
        return;
      }
      const rel = target.replace(/^\/+/, '');
      window.location.replace(App.Paths.absolute(rel));
    } catch (err) {
      const fail = registerFailedAttempt();
      errorEl.textContent = fail.locked
        ? fail.message
        : (err.message || fail.message || 'เข้าสู่ระบบไม่สำเร็จ');
      errorEl.classList.add('visible');
      if (submitBtn) {
        submitBtn.classList.remove('is-loading');
        submitBtn.textContent = fail.locked ? 'ถูกระงับชั่วคราว' : 'เข้าสู่ระบบ';
        submitBtn.disabled = fail.locked;
      }
      if (!fail.locked) {
        setFormEnabled(true);
        passwordInput?.focus();
        passwordInput?.select();
      }
    }
  });
});
