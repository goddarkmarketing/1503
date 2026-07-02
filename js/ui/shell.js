/**
 * Enhanced shell — user menu, notifications, balance.
 */
window.App = window.App || {};

App.Shell = {
  init(options = {}) {
    const user = App.AuthService.getCurrentUser();
    if (!user) return;

    this._options = options;
    this._basePath = options.basePath || '';

    this._bindUser(user);
    this._bindUserMenu(user, options);
    this._bindNotifications();
    this._bindLogout(this._basePath);

    if (user.role === 'agent') {
      this._loadAgentBalance(user.id);
    } else if (options.hideBalance) {
      document.querySelector('.balance-pill')?.style.setProperty('display', 'none');
    }
  },

  _bindUser(user) {
    const avatar = document.querySelector('.user-avatar');
    const name = document.querySelector('.user-name');
    if (avatar) avatar.textContent = user.initials || user.name?.slice(0, 2) || '??';
    if (name) {
      name.textContent = user.role === 'agent' ? user.agentCode || user.username : user.name;
    }
    document.querySelectorAll('[data-shell="user-name"]').forEach((el) => {
      el.textContent = user.name;
    });
    document.querySelectorAll('[data-shell="user-role"]').forEach((el) => {
      el.textContent = user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'นายหน้า';
    });
  },

  _bindUserMenu(user, options) {
    const profile = document.querySelector('.user-profile');
    if (!profile) return;

    if (profile.dataset.menuBound) return;
    profile.dataset.menuBound = '1';

    const wrap = document.createElement('div');
    wrap.className = 'header-dropdown-wrap';
    profile.parentNode.insertBefore(wrap, profile);
    wrap.appendChild(profile);

    const menu = document.createElement('div');
    menu.className = 'header-dropdown';
    menu.id = 'userMenuDropdown';
    wrap.appendChild(menu);

    const base = options.basePath || '';
    const profilePath = user.role === 'agent'
      ? (options.profilePath || `${base}agent/profile.html`)
      : '#';

    menu.innerHTML = `
      <div class="header-dropdown-head">${user.name}</div>
      ${user.role === 'agent' ? `<a href="${profilePath}" class="user-menu-item"><i data-lucide="user" style="width:16px;height:16px"></i> โปรไฟล์</a>` : ''}
      <button type="button" class="user-menu-item" data-action="logout"><i data-lucide="log-out" style="width:16px;height:16px"></i> ออกจากระบบ</button>
    `;

    profile.style.cursor = 'pointer';
    profile.addEventListener('click', (e) => {
      e.stopPropagation();
      this._closeDropdowns('userMenuDropdown');
      menu.classList.toggle('open');
    });

    menu.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
      App.AuthService.logout();
      window.location.href = `${base}${App.Permissions.loginPath()}`;
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  async _bindNotifications() {
    const btn = document.querySelector('.header-icon-btn[aria-label="การแจ้งเตือน"]');
    if (!btn || !App.NotificationService) return;
    if (btn.dataset.notifBound) return;
    btn.dataset.notifBound = '1';

    const wrap = document.createElement('div');
    wrap.className = 'header-dropdown-wrap';
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'header-dropdown';
    panel.id = 'notifDropdown';
    panel.innerHTML = '<div class="header-dropdown-head">การแจ้งเตือน</div><div id="notifList"></div>';
    wrap.appendChild(panel);

    const render = async () => {
      const list = await App.NotificationService.getNotifications();
      const unread = list.filter((n) => !n.read).length;
      const badge = btn.querySelector('.notif-badge');
      if (badge) {
        badge.textContent = unread > 99 ? '99+' : String(unread);
        badge.style.display = unread > 0 ? 'flex' : 'none';
      }
      const listEl = panel.querySelector('#notifList');
      if (!list.length) {
        listEl.innerHTML = '<div class="table-empty" style="padding:20px;text-align:center;color:var(--text-muted)">ไม่มีการแจ้งเตือน</div>';
        return;
      }
      listEl.innerHTML = list.map((n) => {
        const href = n.href ? `${this._basePath}${n.href.replace(/^\//, '')}` : '';
        return `
        <div class="header-dropdown-item ${n.read ? '' : 'unread'}${href ? ' header-dropdown-item--link' : ''}" data-id="${n.id}"${href ? ` data-href="${href}"` : ''}>
          <div>
            <div class="notif-item-title">${n.title}</div>
            <div class="notif-item-msg">${n.message}</div>
            <div class="notif-item-time">${App.AdminUtils?.formatDateTime(n.createdAt) || n.createdAt}</div>
          </div>
        </div>
      `;
      }).join('');
      listEl.querySelectorAll('[data-id]').forEach((el) => {
        el.addEventListener('click', async () => {
          const id = el.dataset.id;
          const href = el.dataset.href;
          await App.NotificationService.markRead(id);
          if (href) {
            window.location.href = href;
            return;
          }
          await render();
        });
      });
    };

    this.refreshNotifications = render;

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      this._closeDropdowns('notifDropdown');
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) await render();
    });

    document.addEventListener('click', () => this._closeDropdowns());
    await render();
  },

  _closeDropdowns(exceptId) {
    document.querySelectorAll('.header-dropdown.open').forEach((el) => {
      if (el.id !== exceptId) el.classList.remove('open');
    });
  },

  _bindLogout(basePath) {
    const logout = document.querySelector('.sidebar-footer .nav-link');
    if (!logout) return;
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      App.AuthService.logout();
      window.location.href = `${basePath}${App.Permissions.loginPath()}`;
    });
  },

  async _loadAgentBalance(agentId) {
    const amountEl = document.getElementById('balanceAmount');
    if (!amountEl) return;
    try {
      const { balance } = await App.BalanceService.getBalance(agentId);
      amountEl.textContent = App.BalanceService.formatAmount(balance);
    } catch {
      const user = App.AuthService.getCurrentUser();
      if (user?.balance != null) {
        amountEl.textContent = App.BalanceService.formatAmount(user.balance);
      }
    }
  },

  formatCurrency(value) {
    return App.BalanceService.formatAmount(value);
  }
};
