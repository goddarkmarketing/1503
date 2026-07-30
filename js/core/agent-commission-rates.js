/**
 * Per-agent commission rates by product category + insurer.
 */
window.App = window.App || {};

App.AgentCommissionRates = {
  _categories: [
    { code: 'compulsory', label: 'พ.ร.บ.', icon: 'shield', defaultRate: 15 },
    { code: 'voluntary', label: '2+ / 3+', icon: 'file-check', defaultRate: 12 },
    { code: 'pa', label: 'ประกันอุบัติเหตุ', icon: 'heart-pulse', defaultRate: 10 },
    { code: 'travel', label: 'ประกันเดินทาง', icon: 'plane', defaultRate: 10 }
  ],

  _insurers: [
    { code: 'indara', name: 'อินทรประกันภัย', defaultRate: 15, logo: 'images/partners/indara.jpg' },
    { code: 'axa', name: 'AXA', defaultRate: 12, logo: 'images/partners/axa.jpg' },
    { code: 'bki', name: 'BKI กรุงเทพประกันภัย', defaultRate: 12, logo: 'images/partners/bangkok-insurance.jpg' },
    { code: 'chubb', name: 'CHUBB', defaultRate: 15, logo: 'images/partners/chubb.jpg' },
    { code: 'ergo', name: 'เออร์โกประกันภัย', defaultRate: 14, logo: 'images/partners/ergo.jpg' }
  ],

  _logoUrl(logo) {
    if (!logo) return '';
    if (/^https?:\/\//i.test(logo)) return logo;
    const base = document.body?.dataset?.basePath || '';
    return `${base}${logo}`;
  },

  productKey(category, insurer) {
    return `${category}-${insurer}`;
  },

  listCategoryGroups() {
    const insurerByCode = Object.fromEntries(this._insurers.map((i) => [i.code, i]));
    const groups = this._categories.map((cat) => ({ ...cat, insurers: [] }));
    const groupByCode = Object.fromEntries(groups.map((g) => [g.code, g]));

    const productsZone = App.AgentFeatures?.zones?.find((z) => z.id === 'products');
    (productsZone?.items || []).forEach((item) => {
      const m = String(item.key).match(/^(compulsory|voluntary|pa|travel)-(indara|ergo|axa|bki|chubb)$/i);
      if (!m) return;
      const category = m[1].toLowerCase();
      const insurerCode = m[2].toLowerCase();
      const group = groupByCode[category];
      const insurer = insurerByCode[insurerCode];
      if (!group || !insurer) return;
      if (group.insurers.some((i) => i.code === insurerCode)) return;
      group.insurers.push({ ...insurer });
    });

    groups.forEach((g) => {
      g.insurers.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    });

    return groups.filter((g) => g.insurers.length > 0);
  },

  defaultRates() {
    const categories = {};
    const products = {};
    this._categories.forEach((c) => {
      categories[c.code] = c.defaultRate;
    });
    this.listCategoryGroups().forEach((group) => {
      group.insurers.forEach((ins) => {
        products[this.productKey(group.code, ins.code)] = ins.defaultRate ?? group.defaultRate;
      });
    });
    return { categories, products };
  },

  _parseRate(value, fallback) {
    if (value == null || value === '') return fallback;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) return fallback;
    return Math.round(n * 100) / 100;
  },

  /** Accepts { categories, products }, legacy { categories, insurers }, or flat { indara: 15 }. */
  normalize(rates) {
    const defaults = this.defaultRates();
    if (!rates || typeof rates !== 'object') return defaults;

    const hasNewShape = rates.categories || rates.products || rates.insurers;
    const isLegacyFlat = !hasNewShape
      && Object.keys(rates).some((k) => this._insurers.some((i) => i.code === k));

    const sourceCategories = isLegacyFlat ? {} : (rates.categories || {});
    const sourceProducts = isLegacyFlat ? {} : (rates.products || {});
    const sourceInsurers = isLegacyFlat ? rates : (rates.insurers || {});

    const categories = { ...defaults.categories };
    Object.keys(categories).forEach((code) => {
      categories[code] = this._parseRate(sourceCategories[code], categories[code]);
    });

    const products = { ...defaults.products };
    Object.keys(products).forEach((key) => {
      if (sourceProducts[key] != null && sourceProducts[key] !== '') {
        products[key] = this._parseRate(sourceProducts[key], products[key]);
        return;
      }
      const insurerCode = key.split('-').pop();
      if (sourceInsurers[insurerCode] != null && sourceInsurers[insurerCode] !== '') {
        products[key] = this._parseRate(sourceInsurers[insurerCode], products[key]);
      }
    });

    return { categories, products };
  },

  readFromForm(form) {
    if (!form) return this.defaultRates();
    const raw = { products: {} };
    this.listCategoryGroups().forEach((group) => {
      group.insurers.forEach((ins) => {
        const key = this.productKey(group.code, ins.code);
        const input = form.querySelector(`[name="commissionProduct_${key}"]`);
        if (input) raw.products[key] = input.value;
      });
    });
    return this.normalize(raw);
  },

  _rateInput({ id, name, value, ariaLabel, extraClass = '' }) {
    return `
      <div class="agent-commission-rates__input-wrap${extraClass ? ` ${extraClass}` : ''}">
        <input
          type="number"
          id="${id}"
          name="${name}"
          class="agent-commission-rates__input"
          min="0"
          max="100"
          step="0.01"
          value="${value}"
          inputmode="decimal"
          aria-label="${this._escape(ariaLabel)}"
        >
        <span class="agent-commission-rates__suffix">%</span>
      </div>
    `;
  },

  renderRatesGrid(rates) {
    const normalized = this.normalize(rates);
    const groups = this.listCategoryGroups();

    const panels = groups.map((group, index) => {
      const open = index === 0 ? ' is-open' : '';
      const insurerRows = group.insurers.map((ins) => {
        const key = this.productKey(group.code, ins.code);
        const logoSrc = this._logoUrl(ins.logo);
        const logoHtml = logoSrc
          ? `<span class="agent-commission-rates__logo" aria-hidden="true"><img src="${this._escape(logoSrc)}" alt="" width="36" height="36" loading="lazy"></span>`
          : `<span class="agent-commission-rates__logo agent-commission-rates__logo--fallback" aria-hidden="true">${this._escape((ins.name || '?').slice(0, 2))}</span>`;

        return `
          <div class="agent-commission-rates__row agent-commission-rates__row--insurer">
            <label class="agent-commission-rates__brand" for="commission-product-${key}">
              ${logoHtml}
              <span class="agent-commission-rates__label">${this._escape(ins.name)}</span>
            </label>
            ${this._rateInput({
              id: `commission-product-${key}`,
              name: `commissionProduct_${key}`,
              value: normalized.products[key],
              ariaLabel: `อัตราคอมมิชชัน ${ins.name} (${group.label})`
            })}
          </div>
        `;
      }).join('');

      return `
        <div class="agent-commission-rates__group${open}" data-commission-group="${group.code}">
          <button type="button" class="agent-commission-rates__category" data-commission-toggle aria-expanded="${index === 0 ? 'true' : 'false'}">
            <span class="agent-commission-rates__category-left">
              <i data-lucide="${group.icon}" class="agent-commission-rates__cat-icon" aria-hidden="true"></i>
              <span class="agent-commission-rates__label">${this._escape(group.label)}</span>
            </span>
            <i data-lucide="chevron-down" class="agent-commission-rates__chevron" aria-hidden="true"></i>
          </button>
          <div class="agent-commission-rates__panel" ${index === 0 ? '' : 'hidden'}>
            ${insurerRows}
          </div>
        </div>
      `;
    }).join('');

    return `<div class="agent-commission-rates" data-commission-rates>${panels}</div>`;
  },

  bindForm(root) {
    if (!root) return;
    const container = root.querySelector('[data-commission-rates]') || root;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    container.querySelectorAll('[data-commission-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.closest('[data-commission-group]');
        if (!group) return;
        const panel = group.querySelector('.agent-commission-rates__panel');
        const willOpen = !group.classList.contains('is-open');
        group.classList.toggle('is-open', willOpen);
        if (panel) panel.hidden = !willOpen;
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    });
  },

  renderFormSection(rates) {
    return `
      <section class="agent-form__section">
        <div class="agent-form__sectionHead">
          <h3 class="agent-form__sectionTitle">อัตราคอมมิชชัน (%)</h3>
          <span class="agent-form__sectionBadge agent-form__sectionBadge--muted">แยกตามบริษัท</span>
        </div>
        <p class="agent-form__sectionHint">เปิดหัวข้อประเภทประกัน แล้วกำหนด % คอมมิชชันของแต่ละบริษัท</p>
        ${this.renderRatesGrid(rates)}
      </section>
    `;
  },

  _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
