/**
 * Per-agent feature permissions for the agent portal sidebar.
 */
window.App = window.App || {};

App.AgentFeatures = {
  INSURERS: {
    ergo: { name: 'เออร์โกประกันภัย', logo: 'assets/logos/ergo.png' },
    axa: { name: 'AXA', logo: 'images/partners/axa.jpg' },
    bki: { name: 'BKI กรุงเทพ', logo: 'images/partners/bangkok-insurance.jpg' },
    chubb: { name: 'CHUBB', logo: 'images/partners/chubb.jpg' },
    indara: { name: 'อินทรประกันภัย', logo: 'assets/logos/indara.png' }
  },

  PRODUCT_GROUPS: [
    { id: 'compulsory', label: 'พ.ร.บ.' },
    { id: 'voluntary', label: '2+ / 3+' },
    { id: 'pa', label: 'ประกันอุบัติเหตุ' },
    { id: 'travel', label: 'ประกันเดินทาง' }
  ],

  zones: [
    {
      id: 'main',
      label: 'หลัก',
      items: [
        { key: 'home', label: 'หน้าแรก', page: 'agent/' }
      ]
    },
    {
      id: 'finance',
      label: 'การเงิน',
      items: [
        { key: 'commission', label: 'ค่าคอมมิชชัน', page: 'agent/commission' },
        { key: 'withdraw', label: 'แจ้งถอนเงิน', page: 'agent/withdraw' },
        { key: 'wht50', label: 'หนังสือ 50 ทวิ', page: 'agent/wht50' },
        { key: 'credit', label: 'ขอเติมวงเงิน', page: 'agent/credit' },
        { key: 'credit-history', label: 'ประวัติการเติมเงิน', page: 'agent/credit-history' }
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

  _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  _logoUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = document.body?.dataset?.basePath || '';
    return `${base}${path}`;
  },

  _parseProductItem(item) {
    const m = String(item.key).match(/^(compulsory|voluntary|pa|travel)-([a-z]+)$/i);
    if (!m) return { ...item, kind: 'action' };
    const insurer = this.INSURERS[m[2].toLowerCase()] || { name: item.label, logo: '' };
    return {
      ...item,
      kind: 'insurer',
      product: m[1].toLowerCase(),
      insurerCode: m[2].toLowerCase(),
      insurerName: insurer.name,
      logo: insurer.logo
    };
  },

  _checkControl(item, checked, extraAttrs = '') {
    return `
      <label class="agent-perm__tick">
        <input type="checkbox" data-feature-key="${this._escape(item.key)}" data-feature-zone="${this._escape(item.zone || '')}" ${checked ? 'checked' : ''} ${extraAttrs}>
        <span></span>
      </label>
    `;
  },

  renderPermissionsTable(permissions) {
    const perms = this.permissionsForAdminForm(permissions);
    const productsZone = this.zones.find((z) => z.id === 'products');
    const otherZones = this.zones.filter((z) => z.id !== 'products');
    const productItems = (productsZone?.items || []).map((item) => this._parseProductItem({ ...item, zone: 'products' }));
    const insurerItems = productItems.filter((item) => item.kind === 'insurer');
    const productExtras = productItems.filter((item) => item.kind !== 'insurer');
    const insurerCodes = Object.keys(this.INSURERS);

    const insurerHeads = insurerCodes.map((code) => {
      const ins = this.INSURERS[code];
      const logoSrc = this._logoUrl(ins.logo);
      return `
        <th>
          <button type="button" class="agent-perm__headBtn" data-insurer-all="${code}" title="เปิด/ปิดทั้งบริษัท">
            ${logoSrc ? `<img src="${this._escape(logoSrc)}" alt="" width="40" height="40" loading="lazy">` : ''}
            <span>${this._escape(ins.name)}</span>
          </button>
        </th>
      `;
    }).join('');

    const productRows = this.PRODUCT_GROUPS.map((group) => {
      const rowItems = insurerItems.filter((item) => item.product === group.id);
      const cells = insurerCodes.map((code) => {
        const item = rowItems.find((entry) => entry.insurerCode === code);
        if (!item) return '<td class="agent-perm__na"></td>';
        return `<td>${this._checkControl(item, !!perms[item.key], `data-insurer-code="${code}" data-product-code="${group.id}"`)}</td>`;
      }).join('');
      return `
        <tr>
          <th>
            <button type="button" class="agent-perm__rowBtn" data-product-all="${group.id}" title="เปิด/ปิดทั้งแถว">${this._escape(group.label)}</button>
          </th>
          ${cells}
        </tr>
      `;
    }).join('');

    const extraRows = productExtras.map((item) => `
      <tr>
        <th>${this._escape(item.label)}</th>
        <td colspan="${insurerCodes.length}">${this._checkControl(item, !!perms[item.key])}</td>
      </tr>
    `).join('');

    const otherRows = otherZones.map((zone) => {
      const items = zone.items.map((item) => ({ ...item, zone: zone.id }));
      return items.map((item, index) => `
        <tr>
          ${index === 0 ? `<th class="agent-perm__group" rowspan="${items.length}">
            <button type="button" class="agent-perm__rowBtn" data-zone-all="${zone.id}" title="เปิด/ปิดทั้งกลุ่ม">${this._escape(zone.label)}</button>
          </th>` : ''}
          <td class="agent-perm__label">${this._escape(item.label)}</td>
          <td class="agent-perm__tickCell">${this._checkControl(item, !!perms[item.key])}</td>
        </tr>
      `).join('');
    }).join('');

    return `
      <div class="agent-perm">
        <div class="agent-perm__toolbar">
          <p class="admin-hint" style="margin:0">ติ๊กช่องที่ต้องการให้ใช้ได้ · คลิกชื่อบริษัทหรือประเภทเพื่อเลือกทั้งคอลัมน์/แถว</p>
          <div class="agent-perm__toolbarActions">
            <button type="button" class="btn-secondary btn-sm" data-perm-all="on">อนุญาตทั้งหมด</button>
            <button type="button" class="btn-secondary btn-sm" data-perm-all="off">ปิดทั้งหมด</button>
          </div>
        </div>
        <div class="agent-perm__tableWrap">
          <table class="agent-perm__table agent-perm__table--matrix">
            <thead>
              <tr>
                <th class="agent-perm__corner">
                  <button type="button" class="agent-perm__rowBtn" data-zone-all="products">ออกกรมธรรม์</button>
                </th>
                ${insurerHeads}
              </tr>
            </thead>
            <tbody>
              ${productRows}
              ${extraRows}
            </tbody>
          </table>
        </div>
        <div class="agent-perm__tableWrap">
          <table class="agent-perm__table agent-perm__table--list">
            <thead>
              <tr>
                <th>กลุ่ม</th>
                <th>ฟังก์ชัน</th>
                <th>สิทธิ์</th>
              </tr>
            </thead>
            <tbody>${otherRows}</tbody>
          </table>
        </div>
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

    const setBoxes = (boxes, on) => {
      boxes.forEach((box) => {
        box.checked = on;
      });
    };

    const toggleBoxes = (selector) => {
      const boxes = [...root.querySelectorAll(selector)];
      if (!boxes.length) return;
      setBoxes(boxes, !boxes.every((box) => box.checked));
    };

    root.querySelectorAll('[data-zone-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        toggleBoxes(`[data-feature-key][data-feature-zone="${btn.dataset.zoneAll}"]`);
      });
    });

    root.querySelectorAll('[data-insurer-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        toggleBoxes(`[data-feature-key][data-insurer-code="${btn.dataset.insurerAll}"]`);
      });
    });

    root.querySelectorAll('[data-product-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        toggleBoxes(`[data-feature-key][data-product-code="${btn.dataset.productAll}"]`);
      });
    });

    root.querySelectorAll('[data-perm-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setBoxes([...root.querySelectorAll('[data-feature-key]')], btn.dataset.permAll === 'on');
      });
    });
  }
};
