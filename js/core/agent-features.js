/**
 * Per-agent feature permissions for the agent portal sidebar.
 */
window.App = window.App || {};

App.AgentFeatures = {
  zones: [
    {
      id: 'main',
      label: 'หลัก',
      items: [
        { key: 'home', label: 'หน้าแรก', page: 'agent/' }
      ]
    },
    {
      id: 'products',
      label: 'ออกกรมธรรม์',
      items: [
        { key: 'compulsory-ergo', label: 'พ.ร.บ. — เออร์โก', page: 'compulsory/ergo' },
        { key: 'compulsory-axa', label: 'พ.ร.บ. — AXA' },
        { key: 'compulsory-bki', label: 'พ.ร.บ. — BKI กรุงเทพ' },
        { key: 'compulsory-chubb', label: 'พ.ร.บ. — CHUBB' },
        { key: 'compulsory-indara', label: 'พ.ร.บ. — อินทรประกันภัย' },
        { key: 'voluntary-axa', label: '2+/3+ — AXA', page: 'voluntary/axa' },
        { key: 'voluntary-bki', label: '2+/3+ — BKI กรุงเทพ' },
        { key: 'voluntary-chubb', label: '2+/3+ — CHUBB' },
        { key: 'voluntary-indara', label: '2+/3+ — อินทรประกันภัย' },
        { key: 'pa-axa', label: 'อุบัติเหตุ — AXA' },
        { key: 'pa-bki', label: 'อุบัติเหตุ — BKI กรุงเทพ' },
        { key: 'travel-axa', label: 'เดินทาง — AXA' },
        { key: 'travel-bki', label: 'เดินทาง — BKI กรุงเทพ' },
        { key: 'renew', label: 'ต่ออายุกรมธรรม์', page: 'agent/renew' }
      ]
    },
    {
      id: 'reports',
      label: 'รายงาน & ข้อมูล',
      items: [
        { key: 'reports-daily-policies', label: 'ขายกรมธรรม์ประจำวัน', page: 'agent/reports/daily-policies' },
        { key: 'reports-daily-summary', label: 'สรุปการขายประจำวัน', page: 'agent/reports/daily-summary' },
        { key: 'reports-monthly', label: 'รายงานรายเดือน', page: 'agent/reports/monthly' },
        { key: 'reports-team', label: 'รายงานลูกทีม', page: 'agent/reports/team' },
        { key: 'inquiry', label: 'สอบถามกรมธรรม์', page: 'agent/inquiry' }
      ]
    },
    {
      id: 'finance',
      label: 'การเงิน',
      items: [
        { key: 'commission', label: 'ค่าคอมมิชชัน', page: 'agent/commission' },
        { key: 'wht50', label: 'หนังสือ 50 ทวิ', page: 'agent/wht50' },
        { key: 'credit', label: 'ขอเติมวงเงิน', page: 'agent/credit' },
        { key: 'credit-history', label: 'ประวัติการเติมเงิน', page: 'agent/credit-history' }
      ]
    },
    {
      id: 'receipt',
      label: 'ใบเสร็จ',
      items: [
        { key: 'receipt-issue', label: 'ออกใบเสร็จ', page: 'agent/receipt/issue' },
        { key: 'receipt-inquiry', label: 'สอบถามข้อมูลใบเสร็จ', page: 'agent/receipt/inquiry' },
        { key: 'receipt-summary', label: 'สรุปประจำวัน', page: 'agent/receipt/daily-summary' },
        { key: 'receipt-detail', label: 'รายละเอียดประจำวัน', page: 'agent/receipt/daily-detail' },
        { key: 'receipt-settings', label: 'ตั้งค่าใบเสร็จ', page: 'agent/receipt/settings' }
      ]
    },
    {
      id: 'team',
      label: 'ทีมงาน',
      items: [
        { key: 'team', label: 'ลูกทีม', page: 'agent/team' }
      ]
    }
  ],

  allItems() {
    return this.zones.flatMap((zone) => zone.items.map((item) => ({ ...item, zone: zone.id, zoneLabel: zone.label })));
  },

  defaultPermissions() {
    const perms = {};
    this.allItems().forEach((item) => {
      perms[item.key] = true;
    });
    return perms;
  },

  normalize(perms) {
    const base = this.defaultPermissions();
    if (!perms || typeof perms !== 'object') return base;
    Object.keys(base).forEach((key) => {
      if (typeof perms[key] === 'boolean') base[key] = perms[key];
    });
    return base;
  },

  getUserPermissions(user) {
    if (!user || user.role !== 'agent') return this.defaultPermissions();
    return this.normalize(user.featurePermissions);
  },

  can(user, featureKey) {
    if (!user || user.role !== 'agent') return true;
    const perms = this.getUserPermissions(user);
    return perms[featureKey] !== false;
  },

  firstAllowedPage(user) {
    if (!user || user.role !== 'agent') return null;
    return this.allItems().find((item) => item.page && this.can(user, item.key)) || null;
  },

  countEnabled(perms) {
    return Object.values(perms).filter(Boolean).length;
  },

  /** Full explicit map for admin forms — missing keys are off, not default-on. */
  explicitPermissions(perms) {
    const out = {};
    this.allItems().forEach((item) => {
      out[item.key] = perms?.[item.key] === true;
    });
    return out;
  },

  hasFullPermissions(perms) {
    if (!perms || typeof perms !== 'object') return false;
    return this.allItems().every((item) => typeof perms[item.key] === 'boolean');
  },

  permissionsForAdminForm(perms) {
    if (this.hasFullPermissions(perms)) return this.explicitPermissions(perms);
    return this.normalize(perms);
  },

  pageToFeature(pagePath) {
    const normalized = App.RoleGuard.normalizePagePath(pagePath);
    const item = this.allItems().find(
      (entry) => App.RoleGuard.normalizePagePath(entry.page) === normalized
    );
    return item ? item.key : null;
  },

  enforceCurrentPage(options = {}) {
    const user = App.AuthService?.getCurrentUser();
    if (!user || user.role !== 'agent') return true;

    const page = App.RoleGuard.currentPagePath();
    if (page === 'agent/access-denied') return true;

    const featureKey = this.pageToFeature(page);
    if (!featureKey) return true;
    if (this.can(user, featureKey)) return true;

    const base = options.basePath || '';
    const allowed = this.firstAllowedPage(user);
    const allowedPath = allowed?.page
      ? App.RoleGuard.normalizePagePath(allowed.page)
      : '';
    if (allowedPath && allowedPath !== page) {
      window.location.replace(`${base}${allowed.page}`);
      return false;
    }

    if (page !== 'agent/access-denied') {
      window.location.replace(`${base}agent/access-denied`);
    }
    return false;
  },

  applyNav(navRoot, user) {
    if (!navRoot || !user || user.role !== 'agent') return;
    const perms = this.getUserPermissions(user);

    navRoot.querySelectorAll('.is-hidden-by-perm').forEach((el) => {
      el.classList.remove('is-hidden-by-perm');
    });
    navRoot.querySelectorAll('[data-nav]').forEach((link) => {
      link.removeAttribute('aria-disabled');
    });

    navRoot.querySelectorAll('[data-nav]').forEach((link) => {
      const key = link.dataset.nav;
      if (!key) return;

      const allowed = perms[key] !== false;
      const subRow = link.closest('.nav-submenu > li');
      const topRow = link.closest('.nav-group__list > li.nav-item');
      const row = subRow || topRow || link.closest('li');

      if (!allowed) {
        row?.classList.add('is-hidden-by-perm');
        link.setAttribute('aria-disabled', 'true');
      }
    });

    navRoot.querySelectorAll('.nav-item.has-submenu').forEach((item) => {
      const visibleChildren = [...item.querySelectorAll(':scope > .nav-submenu > li')].filter(
        (li) => !li.classList.contains('is-hidden-by-perm')
      );
      const hideParent = visibleChildren.length === 0;
      item.classList.toggle('is-hidden-by-perm', hideParent);
      if (hideParent) item.classList.remove('submenu-open');
    });

    navRoot.querySelectorAll('[data-nav-zone]').forEach((zone) => {
      const visibleItems = [...zone.querySelectorAll(':scope .nav-group__list > .nav-item')].filter(
        (item) => !item.classList.contains('is-hidden-by-perm')
      );
      zone.classList.toggle('is-hidden-by-perm', visibleItems.length === 0);
    });

    const shell = navRoot.closest('.sidebar');
    const anyVisible = [...navRoot.querySelectorAll('[data-nav-zone]')].some(
      (zone) => !zone.classList.contains('is-hidden-by-perm')
    );
    shell?.classList.toggle('sidebar--no-nav', !anyVisible);
  },

  renderPermissionsTable(permissions) {
    const perms = this.permissionsForAdminForm(permissions);
    const rows = this.zones.map((zone) => {
      const zoneAllChecked = zone.items.every((item) => perms[item.key]);
      const zoneRows = zone.items.map((item, index) => `
        <tr data-feature-row data-feature-zone="${zone.id}">
          <td class="agent-perm__zone">${index === 0 ? zone.label : ''}</td>
          <td class="agent-perm__label">${item.label}</td>
          <td class="agent-perm__check">
            <label class="agent-perm__checkbox">
              <input type="checkbox" data-feature-key="${item.key}" data-feature-zone="${zone.id}" ${perms[item.key] ? 'checked' : ''}>
              <span>อนุญาต</span>
            </label>
          </td>
        </tr>
      `).join('');

      return `
        <tr class="agent-perm__zoneHead" data-zone-head="${zone.id}">
          <td colspan="2">
            <button type="button" class="agent-perm__zoneToggle" data-zone-toggle="${zone.id}">เลือกทั้งหมด — ${zone.label}</button>
          </td>
          <td class="agent-perm__check">
            <label class="agent-perm__checkbox agent-perm__checkbox--zone">
              <input type="checkbox" data-zone-all="${zone.id}"${zoneAllChecked ? ' checked' : ''}>
              <span>ทั้งกลุ่ม</span>
            </label>
          </td>
        </tr>
        ${zoneRows}
      `;
    }).join('');

    return `
      <p class="admin-hint" style="margin-top:0">เลือกฟังก์ชันที่นายหน้ารายนี้สามารถใช้งานได้ในระบบ</p>
      <div class="agent-perm__tableWrap">
        <table class="agent-perm__table">
          <thead>
            <tr>
              <th>กลุ่ม</th>
              <th>ฟังก์ชัน</th>
              <th>สิทธิ์</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  readPermissionsFromForm(root) {
    const perms = {};
    this.allItems().forEach((item) => {
      perms[item.key] = false;
    });
    if (!root) return perms;
    root.querySelectorAll('[data-feature-key]').forEach((input) => {
      perms[input.dataset.featureKey] = input.checked;
    });
    return perms;
  },

  bindPermissionsForm(root) {
    if (!root) return;
    const syncZoneAll = (zoneId) => {
      const boxes = [...root.querySelectorAll(`[data-feature-key][data-feature-zone="${zoneId}"]`)];
      const zoneAll = root.querySelector(`[data-zone-all="${zoneId}"]`);
      if (!zoneAll || !boxes.length) return;
      const checkedCount = boxes.filter((box) => box.checked).length;
      zoneAll.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
      zoneAll.checked = checkedCount === boxes.length;
    };

    root.querySelectorAll('[data-zone-all]').forEach((zoneAll) => {
      zoneAll.addEventListener('change', () => {
        const zoneId = zoneAll.dataset.zoneAll;
        root.querySelectorAll(`[data-feature-key][data-feature-zone="${zoneId}"]`).forEach((box) => {
          box.checked = zoneAll.checked;
        });
        zoneAll.indeterminate = false;
      });
    });

    root.querySelectorAll('[data-zone-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const zoneId = btn.dataset.zoneToggle;
        const boxes = [...root.querySelectorAll(`[data-feature-key][data-feature-zone="${zoneId}"]`)];
        const allChecked = boxes.every((box) => box.checked);
        boxes.forEach((box) => {
          box.checked = !allChecked;
        });
        syncZoneAll(zoneId);
      });
    });

    root.querySelectorAll('[data-feature-key]').forEach((box) => {
      box.addEventListener('change', () => syncZoneAll(box.dataset.featureZone));
    });

    this.zones.forEach((zone) => syncZoneAll(zone.id));
  }
};
