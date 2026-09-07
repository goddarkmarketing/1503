/**
 * Enhanced shell — user menu, notifications, balance.
 */
window.App = window.App || {};

App.Shell = {
  async init(options = {}) {
    this._options = options;
    this._basePath = App.Paths.normalizeBasePath(options.basePath || App.Paths.detectBasePath());
    this.ensureBrandLogo();

    const user = App.AuthService.getCurrentUser();
    if (!user) return;

    this._bindUser(user);
    this._bindUserMenu(user, options);
    await this._bindNotifications();
    this._bindLogout(this._basePath);

    if (user.role === 'agent') {
      this._ensureBalanceCoin();
      this._loadAgentBalance(user.id);
      this._bindCommissionPill();
    } else if (options.hideBalance) {
      document.querySelector('.balance-pill')?.style.setProperty('display', 'none');
    }
  },

  ensureBrandLogo() {
    const wrap = document.querySelector('.sidebar-logo');
    if (!wrap) return;

    const base = App.Paths.normalizeBasePath(
      this._basePath || App.Paths.detectBasePath?.() || document.body?.dataset?.basePath || '../'
    );
    const src = `${base}assets/logos/kladee-broker.png?v=20260906j`;
    wrap.classList.add('sidebar-logo--brand');

    const existing = wrap.querySelector('.sidebar-logo-img');
    if (existing) {
      existing.src = src;
      existing.width = 200;
      existing.height = 44;
      return;
    }

    let el = wrap.querySelector('.sidebar-logo-text');
    const homeHref = el?.tagName === 'A' && el.getAttribute('href')
      ? el.getAttribute('href')
      : `${base}agent/`;

    if (!el) {
      el = document.createElement('a');
      el.href = homeHref;
      el.className = 'sidebar-logo-text sidebar-logo-link';
      wrap.appendChild(el);
    } else if (el.tagName !== 'A') {
      const a = document.createElement('a');
      a.href = homeHref;
      a.className = `${el.className} sidebar-logo-link`.trim();
      el.replaceWith(a);
      el = a;
    } else {
      el.classList.add('sidebar-logo-link');
    }

    el.setAttribute('aria-label', 'KLADEE BROKER');
    el.innerHTML = `<img class="sidebar-logo-img" src="${src}?v=20260906j" alt="KLADEE BROKER" width="200" height="44">`;
  },

  _ensureBalanceCoin() {
    if (!document.getElementById('balance-coin-anim-style')) {
      const style = document.createElement('style');
      style.id = 'balance-coin-anim-style';
      style.textContent = `
        .balance-pill--coin::before{display:none!important}
        .balance-coin{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;flex-shrink:0;perspective:120px;line-height:0}
        .balance-coin__spin{display:block;width:28px;height:28px;transform-style:preserve-3d;animation:balance-coin-spin 2.4s linear infinite}
        .balance-coin svg{display:block;width:28px;height:28px}
        @keyframes balance-coin-spin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
        @media (prefers-reduced-motion:reduce){.balance-coin__spin{animation:none!important}}
        @media (max-width:480px){.balance-coin{display:none}}
      `;
      document.head.appendChild(style);
    }

    document.querySelectorAll('.balance-pill').forEach((pill) => {
      // Replace any previous/broken coin markup so upgrades apply after refresh
      pill.querySelectorAll('.balance-coin').forEach((el) => el.remove());

      const gid = `balCoinGrad-${Math.random().toString(36).slice(2, 9)}`;
      const coin = document.createElement('span');
      coin.className = 'balance-coin';
      coin.setAttribute('aria-hidden', 'true');
      coin.innerHTML = `
        <span class="balance-coin__spin">
          <svg viewBox="0 0 32 32" width="28" height="28" role="img" focusable="false">
            <defs>
              <radialGradient id="${gid}" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#fff6d0"/>
                <stop offset="45%" stop-color="#ffd666"/>
                <stop offset="75%" stop-color="#e0a820"/>
                <stop offset="100%" stop-color="#b57a0c"/>
              </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="13.5" fill="url(#${gid})" stroke="#a87410" stroke-width="1.4"/>
            <circle cx="16" cy="16" r="11.2" fill="none" stroke="#ffe9a8" stroke-width="1.1" opacity="0.9"/>
            <text x="16" y="21" text-anchor="middle"
              font-size="12" font-weight="800" font-family="Segoe UI, Tahoma, sans-serif" fill="#6b4508">฿</text>
          </svg>
        </span>
      `;
      pill.classList.add('balance-pill--coin');
      pill.prepend(coin);
    });
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

    const base = App.Paths.normalizeBasePath(options.basePath || App.Paths.detectBasePath());
    const profilePath = user.role === 'agent'
      ? (options.profilePath && !App.Paths.isBadBase(options.profilePath)
        ? options.profilePath
        : App.Paths.agentProfile())
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
      App.Paths.go('login');
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
      App.Paths.go('login');
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

  async _bindCommissionPill() {
    const user = App.AuthService.getCurrentUser();
    if (App.AgentOnboarding?.needsVerification?.(user)) {
      document.querySelector('.commission-pill')?.remove();
      return;
    }

    const header = document.querySelector('.top-header');
    if (!header || header.querySelector('.commission-pill')) return;

    const pill = document.createElement('a');
    pill.className = 'commission-pill';
    pill.href = `${this._basePath}agent/commission`;
    pill.setAttribute('aria-label', 'ดูรายละเอียดค่าคอมมิชชันเดือนนี้');
    pill.innerHTML = `
      <span class="commission-pill__icon"><i data-lucide="coins"></i></span>
      <span class="commission-pill__text">
        <span class="commission-pill__label">ค่าคอมเดือนนี้</span>
        <span class="commission-pill__value"><span data-commission-amount>0.00</span> บ.</span>
      </span>
    `;

    const balancePill = header.querySelector('.balance-pill');
    if (balancePill) balancePill.insertAdjacentElement('afterend', pill);
    else header.prepend(pill);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const summary = await App.CommissionService.getSummary({ period, periodType: 'month' });
      pill.querySelector('[data-commission-amount]').textContent = this.formatCurrency(summary.total);
    } catch {
      pill.querySelector('[data-commission-amount]').textContent = '-';
    }
  },

  formatCurrency(value) {
    return App.BalanceService.formatAmount(value);
  }
};
