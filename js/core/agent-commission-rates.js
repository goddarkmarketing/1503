/**
 * Per-agent commission rates by product category + insurer.
 *
 * Business rules:
 * - ค่าคอม = เบี้ยสุทธิ × %คอม แล้วหักภาษี (% จากค่าคอม) ถ้าเปิดหักภาษี
 * - ยอดเก็บตัวแทน = เบี้ยเต็ม − ค่าคอมสุทธิ
 * - ปิดหักภาษี → ออกหนังสือรับรอง 50 ทวิ อัตโนมัติ
 * - เปิดหักภาษี → ไม่ต้องออก 50 ทวิ
 */
window.App = window.App || {};

App.AgentCommissionRates = {
  DEFAULT_TAX_WITHHOLD: 3,

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
    const taxWithhold = {};
    const taxWithholdEnabled = {};
    this._categories.forEach((c) => {
      categories[c.code] = c.defaultRate;
    });
    this.listCategoryGroups().forEach((group) => {
      group.insurers.forEach((ins) => {
        const key = this.productKey(group.code, ins.code);
        products[key] = ins.defaultRate ?? group.defaultRate;
        taxWithhold[key] = this.DEFAULT_TAX_WITHHOLD;
        taxWithholdEnabled[key] = true;
      });
    });
    return {
      categories,
      products,
      taxWithhold,
      taxWithholdEnabled,
      overrideEnabled: false,
      override: this.emptyOverrideRates()
    };
  },

  emptyOverrideRates() {
    const products = {};
    const taxWithhold = {};
    const taxWithholdEnabled = {};
    this.listCategoryGroups().forEach((group) => {
      group.insurers.forEach((ins) => {
        const key = this.productKey(group.code, ins.code);
        products[key] = 0;
        taxWithhold[key] = this.DEFAULT_TAX_WITHHOLD;
        taxWithholdEnabled[key] = true;
      });
    });
    return { products, taxWithhold, taxWithholdEnabled };
  },

  _parseRate(value, fallback) {
    if (value == null || value === '') return fallback;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) return fallback;
    return Math.round(n * 100) / 100;
  },

  _parseEnabled(value, fallback = true) {
    if (value == null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true' || value === 'on') return true;
    if (value === 0 || value === '0' || value === 'false' || value === 'off') return false;
    return fallback;
  },

  /** Accepts { categories, products, taxWithhold, taxWithholdEnabled }, legacy shapes. */
  normalize(rates) {
    const defaults = this.defaultRates();
    if (!rates || typeof rates !== 'object') return defaults;

    const hasNewShape = rates.categories || rates.products || rates.insurers
      || rates.taxWithhold || rates.taxWithholdEnabled;
    const isLegacyFlat = !hasNewShape
      && Object.keys(rates).some((k) => this._insurers.some((i) => i.code === k));

    const sourceCategories = isLegacyFlat ? {} : (rates.categories || {});
    const sourceProducts = isLegacyFlat ? {} : (rates.products || {});
    const sourceInsurers = isLegacyFlat ? rates : (rates.insurers || {});
    const sourceTax = isLegacyFlat ? {} : (rates.taxWithhold || {});
    const sourceTaxEnabled = isLegacyFlat ? {} : (rates.taxWithholdEnabled || {});
    const globalTax = this._parseRate(rates.taxWithholdPercent, null);
    const globalTaxEnabled = rates.taxWithholdEnabledGlobal != null
      ? this._parseEnabled(rates.taxWithholdEnabledGlobal, true)
      : null;

    const categories = { ...defaults.categories };
    Object.keys(categories).forEach((code) => {
      categories[code] = this._parseRate(sourceCategories[code], categories[code]);
    });

    const products = { ...defaults.products };
    const taxWithhold = { ...defaults.taxWithhold };
    const taxWithholdEnabled = { ...defaults.taxWithholdEnabled };
    Object.keys(products).forEach((key) => {
      if (sourceProducts[key] != null && sourceProducts[key] !== '') {
        products[key] = this._parseRate(sourceProducts[key], products[key]);
      } else {
        const insurerCode = key.split('-').pop();
        if (sourceInsurers[insurerCode] != null && sourceInsurers[insurerCode] !== '') {
          products[key] = this._parseRate(sourceInsurers[insurerCode], products[key]);
        }
      }

      if (sourceTax[key] != null && sourceTax[key] !== '') {
        taxWithhold[key] = this._parseRate(sourceTax[key], taxWithhold[key]);
      } else if (globalTax != null) {
        taxWithhold[key] = globalTax;
      }

      if (sourceTaxEnabled[key] != null && sourceTaxEnabled[key] !== '') {
        taxWithholdEnabled[key] = this._parseEnabled(sourceTaxEnabled[key], true);
      } else if (globalTaxEnabled != null) {
        taxWithholdEnabled[key] = globalTaxEnabled;
      }
    });

    return {
      categories,
      products,
      taxWithhold,
      taxWithholdEnabled,
      overrideEnabled: this._parseEnabled(rates.overrideEnabled, false),
      override: this._normalizeOverride(rates.override)
    };
  },

  _normalizeOverride(override) {
    const defaults = this.emptyOverrideRates();
    if (!override || typeof override !== 'object') return defaults;
    const products = { ...defaults.products };
    const taxWithhold = { ...defaults.taxWithhold };
    const taxWithholdEnabled = { ...defaults.taxWithholdEnabled };
    Object.keys(defaults.products).forEach((key) => {
      products[key] = this._parseRate(override.products?.[key] ?? override[key], products[key]);
      taxWithhold[key] = this._parseRate(override.taxWithhold?.[key], taxWithhold[key]);
      if (override.taxWithholdEnabled && Object.prototype.hasOwnProperty.call(override.taxWithholdEnabled, key)) {
        taxWithholdEnabled[key] = this._parseEnabled(override.taxWithholdEnabled[key], true);
      }
    });
    return { products, taxWithhold, taxWithholdEnabled };
  },

  readFromForm(form) {
    if (!form) return this.defaultRates();
    const raw = { products: {}, taxWithhold: {}, taxWithholdEnabled: {} };
    this.listCategoryGroups().forEach((group) => {
      group.insurers.forEach((ins) => {
        const key = this.productKey(group.code, ins.code);
        const rateInput = form.querySelector(`[name="commissionProduct_${key}"]`);
        const taxInput = form.querySelector(`[name="taxWithhold_${key}"]`);
        const taxEnabledInput = form.querySelector(`[name="taxWithholdEnabled_${key}"]`);
        if (rateInput) raw.products[key] = rateInput.value;
        if (taxInput) raw.taxWithhold[key] = taxInput.value;
        if (taxEnabledInput) raw.taxWithholdEnabled[key] = taxEnabledInput.checked;
      });
    });

    const overrideEnabledInput = form.querySelector('[name="overrideEnabled"]');
    if (overrideEnabledInput) {
      raw.overrideEnabled = overrideEnabledInput.checked;
      raw.override = { products: {}, taxWithhold: {}, taxWithholdEnabled: {} };
      this.listCategoryGroups().forEach((group) => {
        group.insurers.forEach((ins) => {
          const key = this.productKey(group.code, ins.code);
          const rateInput = form.querySelector(`[name="override_commissionProduct_${key}"]`);
          const taxInput = form.querySelector(`[name="override_taxWithhold_${key}"]`);
          const taxEnabledInput = form.querySelector(`[name="override_taxWithholdEnabled_${key}"]`);
          if (rateInput) raw.override.products[key] = rateInput.value;
          if (taxInput) raw.override.taxWithhold[key] = taxInput.value;
          if (taxEnabledInput) raw.override.taxWithholdEnabled[key] = taxEnabledInput.checked;
        });
      });
    }

    return this.normalize(raw);
  },

  /** Gross commission from net premium (เบี้ยสุทธิ), not gross premium. */
  calcCommission(netPremium, ratePercent) {
    const prem = Number(netPremium) || 0;
    const rate = Number(ratePercent) || 0;
    return Math.round(prem * (rate / 100) * 100) / 100;
  },

  /** Tax withhold = % of commission amount (only when tax withhold is enabled). */
  calcTaxWithhold(commissionAmount, taxPercent) {
    const commission = Number(commissionAmount) || 0;
    const tax = Number(taxPercent) || 0;
    return Math.round(commission * (tax / 100) * 100) / 100;
  },

  /** true = ออก 50 ทวิ อัตโนมัติ (เมื่อไม่ได้เปิดหักภาษี) */
  shouldIssueForm50Tawi(rates, productKey) {
    const normalized = this.normalize(rates);
    return normalized.taxWithholdEnabled[productKey] === false;
  },

  /**
   * Settlement amounts from net + gross premium.
   * Example: net 5398.56, gross 5800, rate 15%, tax 10% enabled
   * → commission 809.78, tax 80.98, netCommission 728.80, agentCollect 5071.20
   */
  calcSettlement({ netPremium, grossPremium, rates, productKey }) {
    const normalized = this.normalize(rates);
    const rate = normalized.products[productKey] ?? 0;
    const taxEnabled = normalized.taxWithholdEnabled[productKey] !== false;
    const taxRate = taxEnabled
      ? (normalized.taxWithhold[productKey] ?? this.DEFAULT_TAX_WITHHOLD)
      : 0;
    const commission = this.calcCommission(netPremium, rate);
    const taxWithhold = taxEnabled ? this.calcTaxWithhold(commission, taxRate) : 0;
    const netCommission = Math.round((commission - taxWithhold) * 100) / 100;
    const gross = Number(grossPremium);
    const hasGross = Number.isFinite(gross) && gross > 0;
    const agentCollect = hasGross
      ? Math.round((gross - netCommission) * 100) / 100
      : null;

    return {
      netPremium: Number(netPremium) || 0,
      grossPremium: hasGross ? gross : null,
      rate,
      taxEnabled,
      taxRate: taxEnabled ? (normalized.taxWithhold[productKey] ?? this.DEFAULT_TAX_WITHHOLD) : 0,
      commission,
      taxWithhold,
      netCommission,
      agentCollect,
      issueForm50Tawi: !taxEnabled
    };
  },

  /** Convenience alias — net commission path only. */
  calcFromNetPremium(netPremium, rates, productKey, grossPremium) {
    return this.calcSettlement({ netPremium, grossPremium, rates, productKey });
  },

  _rateInput({ id, name, value, ariaLabel, caption, extraClass = '', disabled = false }) {
    return `
      <div class="agent-commission-rates__field${extraClass ? ` ${extraClass}` : ''}${disabled ? ' is-disabled' : ''}">
        ${caption ? `<span class="agent-commission-rates__caption">${this._escape(caption)}</span>` : ''}
        <div class="agent-commission-rates__input-wrap">
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
            ${disabled ? 'disabled' : ''}
          >
          <span class="agent-commission-rates__suffix">%</span>
        </div>
      </div>
    `;
  },

  renderRatesGrid(rates, options = {}) {
    const prefix = options.prefix || '';
    const rateColLabel = options.rateColumnLabel || 'นายหน้าได้คอม';
    const source = options.rateSource === 'override'
      ? this.normalize(rates).override
      : this.normalize(rates);
    const groups = this.listCategoryGroups();

    const panels = groups.map((group, index) => {
      const groupId = `${prefix}${group.code}`;
      const open = index === 0 ? ' is-open' : '';
      const insurerRows = group.insurers.map((ins) => {
        const key = this.productKey(group.code, ins.code);
        const logoSrc = this._logoUrl(ins.logo);
        const logoHtml = logoSrc
          ? `<span class="agent-commission-rates__logo" aria-hidden="true"><img src="${this._escape(logoSrc)}" alt="" width="36" height="36" loading="lazy"></span>`
          : `<span class="agent-commission-rates__logo agent-commission-rates__logo--fallback" aria-hidden="true">${this._escape((ins.name || '?').slice(0, 2))}</span>`;
        const taxEnabled = source.taxWithholdEnabled[key] !== false;
        const fieldPrefix = prefix;

        return `
          <div class="agent-commission-rates__row agent-commission-rates__row--insurer" data-product-key="${this._escape(key)}">
            <label class="agent-commission-rates__brand" for="${fieldPrefix}commission-product-${key}">
              ${logoHtml}
              <span class="agent-commission-rates__label">${this._escape(ins.name)}</span>
            </label>
            <div class="agent-commission-rates__cell">
              ${this._rateInput({
                id: `${fieldPrefix}commission-product-${key}`,
                name: `${fieldPrefix}commissionProduct_${key}`,
                value: source.products[key],
                ariaLabel: `${rateColLabel} ${ins.name} (${group.label})`
              })}
            </div>
            <div class="agent-commission-rates__tax-block${taxEnabled ? '' : ' is-off'}">
              <label class="agent-commission-rates__tax-toggle">
                <input
                  type="checkbox"
                  name="${fieldPrefix}taxWithholdEnabled_${key}"
                  data-tax-enabled
                  ${taxEnabled ? 'checked' : ''}
                  aria-label="เปิดหักภาษี ${ins.name} (${group.label})"
                >
                <span>หักภาษี</span>
              </label>
              <div class="agent-commission-rates__input-wrap">
                <input
                  type="number"
                  id="${fieldPrefix}tax-withhold-${key}"
                  name="${fieldPrefix}taxWithhold_${key}"
                  class="agent-commission-rates__input"
                  data-tax-rate-input
                  min="0"
                  max="100"
                  step="0.01"
                  value="${source.taxWithhold[key]}"
                  inputmode="decimal"
                  aria-label="หักภาษี % จากค่าคอม ${this._escape(ins.name)} (${this._escape(group.label)})"
                  ${taxEnabled ? '' : 'disabled'}
                >
                <span class="agent-commission-rates__suffix">%</span>
              </div>
            </div>
            <span class="agent-commission-rates__result" data-tax-hint>
              ${taxEnabled ? `หัก ${source.taxWithhold[key]}% จากคอม` : 'ออกใบ 50 ทวิ'}
            </span>
          </div>
        `;
      }).join('');

      const firstKey = group.insurers[0]
        ? this.productKey(group.code, group.insurers[0].code)
        : null;
      const firstRate = firstKey ? source.products[firstKey] : group.defaultRate;
      const firstTax = firstKey ? source.taxWithhold[firstKey] : this.DEFAULT_TAX_WITHHOLD;

      return `
        <div class="agent-commission-rates__group${open}" data-commission-group="${groupId}">
          <button type="button" class="agent-commission-rates__category" data-commission-toggle aria-expanded="${index === 0 ? 'true' : 'false'}">
            <span class="agent-commission-rates__category-left">
              <i data-lucide="${group.icon}" class="agent-commission-rates__cat-icon" aria-hidden="true"></i>
              <span class="agent-commission-rates__label">${this._escape(group.label)}</span>
              <em>${group.insurers.length} บริษัท</em>
            </span>
            <i data-lucide="chevron-down" class="agent-commission-rates__chevron" aria-hidden="true"></i>
          </button>
          <div class="agent-commission-rates__panel" ${index === 0 ? '' : 'hidden'}>
            <div class="agent-commission-rates__bulk">
              <span>ตั้งทั้งหมวดนี้</span>
              <label>คอม
                <input type="number" min="0" max="100" step="0.01" value="${firstRate}" data-bulk-rate="${groupId}">
              </label>
              <label class="agent-commission-rates__bulkTax">
                <input type="checkbox" checked data-bulk-tax-on="${groupId}"> หักภาษี
              </label>
              <label>ภาษี
                <input type="number" min="0" max="100" step="0.01" value="${firstTax}" data-bulk-tax="${groupId}">
              </label>
              <button type="button" class="btn-secondary btn-sm" data-bulk-apply="${groupId}">ใส่ให้ทุกบริษัท</button>
            </div>
            <div class="agent-commission-rates__cols" aria-hidden="true">
              <span>บริษัทประกัน</span>
              <span>${this._escape(rateColLabel)}</span>
              <span>หักภาษีจากคอม</span>
              <span>ผลลัพธ์</span>
            </div>
            ${insurerRows}
          </div>
        </div>
      `;
    }).join('');

    return `<div class="agent-commission-rates" data-commission-rates>${panels}</div>`;
  },

  _syncTaxEnabledUI(root) {
    root.querySelectorAll('[data-tax-enabled]').forEach((checkbox) => {
      const row = checkbox.closest('[data-product-key]');
      const taxInput = row?.querySelector('[data-tax-rate-input]') || row?.querySelector('[name*="taxWithhold_"]');
      const hint = row?.querySelector('[data-tax-hint]');
      const block = checkbox.closest('.agent-commission-rates__tax-block');
      const enabled = checkbox.checked;
      if (taxInput) taxInput.disabled = !enabled;
      if (block) block.classList.toggle('is-off', !enabled);
      if (hint) {
        const taxVal = taxInput?.value || this.DEFAULT_TAX_WITHHOLD;
        hint.textContent = enabled ? `หัก ${taxVal}% จากคอม` : 'ออกใบ 50 ทวิ';
        hint.classList.toggle('is-wht50', !enabled);
      }
    });
  },

  bindForm(root) {
    if (!root) return;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    root.querySelectorAll('[data-commission-toggle]').forEach((btn) => {
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

    root.querySelectorAll('[data-tax-enabled]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => this._syncTaxEnabledUI(root));
    });
    root.querySelectorAll('[name*="taxWithhold_"]').forEach((input) => {
      input.addEventListener('input', () => this._syncTaxEnabledUI(root));
    });
    root.querySelectorAll('[data-bulk-apply]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-bulk-apply');
        const group = root.querySelector(`[data-commission-group="${code}"]`);
        if (!group) return;
        const rate = group.querySelector(`[data-bulk-rate="${code}"]`)?.value;
        const taxOn = group.querySelector(`[data-bulk-tax-on="${code}"]`)?.checked;
        const tax = group.querySelector(`[data-bulk-tax="${code}"]`)?.value;
        group.querySelectorAll('[data-product-key]').forEach((row) => {
          const rateInput = row.querySelector('[name*="commissionProduct_"]');
          const taxInput = row.querySelector('[data-tax-rate-input]');
          const taxEnabled = row.querySelector('[data-tax-enabled]');
          if (rateInput && rate !== '' && rate != null) rateInput.value = rate;
          if (taxEnabled) taxEnabled.checked = !!taxOn;
          if (taxInput && tax !== '' && tax != null) taxInput.value = tax;
        });
        this._syncTaxEnabledUI(root);
      });
    });

    this._bindOverrideSection(root);
    this._syncTaxEnabledUI(root);
  },

  _bindOverrideSection(root) {
    const section = root.querySelector('[data-override-section]');
    if (!section) return;
    const parentSelect = root.querySelector('[name="parentId"]');
    const enableCb = section.querySelector('[name="overrideEnabled"]');
    const grid = section.querySelector('[data-override-grid]');

    const sync = () => {
      const hasParent = !!(parentSelect && String(parentSelect.value || '').trim());
      section.hidden = !hasParent;
      const on = hasParent && !!enableCb?.checked;
      if (grid) grid.hidden = !on;
    };

    parentSelect?.addEventListener('change', sync);
    enableCb?.addEventListener('change', sync);
    sync();
  },

  overrideAsRates(rates) {
    const normalized = this.normalize(rates);
    return {
      categories: normalized.categories,
      products: normalized.override.products,
      taxWithhold: normalized.override.taxWithhold,
      taxWithholdEnabled: normalized.override.taxWithholdEnabled
    };
  },

  renderFormSection(rates) {
    const normalized = this.normalize(rates);
    return `
      <section class="agent-form__section">
        <div class="agent-form__sectionHead">
          <h3 class="agent-form__sectionTitle">2. ค่าคอมของนายหน้าคนนี้</h3>
        </div>
        <ol class="agent-commission-rates__howto">
          <li>ใส่ <strong>% คอม</strong> ที่นายหน้าได้จากเบี้ยสุทธิ เช่น ลูกทีมได้ 12</li>
          <li>ถ้าต้องการหักภาษี จากค่าคอม ให้ติ๊ก <strong>หักภาษี</strong> แล้วใส่ % เช่น หัก 10</li>
          <li>ถ้าไม่หักภาษี ระบบจะ <strong>ออกใบ 50 ทวิ</strong> ให้อัตโนมัติ</li>
        </ol>
        ${this.renderRatesGrid(normalized)}
      </section>
      <section class="agent-form__section agent-commission-rates__override" data-override-section hidden>
        <div class="agent-form__sectionHead">
          <h3 class="agent-form__sectionTitle">3. คอมแม่ทีม (จากยอดขายลูกทีมคนนี้)</h3>
        </div>
        <p class="agent-form__sectionHint">ใช้เมื่อนายหน้าคนนี้เป็นลูกทีม — คิดแบบเดียวกัน แยกหักภาษี / ออก 50 ทวิ ของแม่ทีมได้เอง</p>
        <label class="wht50-settings__option" for="overrideEnabled" style="margin-bottom:14px">
          <input id="overrideEnabled" name="overrideEnabled" type="checkbox" ${normalized.overrideEnabled ? 'checked' : ''}>
          <span class="wht50-settings__optionBody">
            <span class="wht50-settings__optionTitle">เปิดคอมแม่ทีมจากยอดขายของลูกทีมคนนี้</span>
            <span class="wht50-settings__optionDesc">เช่น ลูกได้ 12 หัก 10 · แม่ได้ 3 หัก 10 — ถ้าปิดหักภาษีของใคร ระบบออก 50 ทวิให้คนนั้น</span>
          </span>
        </label>
        <div data-override-grid ${normalized.overrideEnabled ? '' : 'hidden'}>
          ${this.renderRatesGrid(normalized, {
            prefix: 'override_',
            rateSource: 'override',
            rateColumnLabel: 'แม่ทีมได้คอม'
          })}
        </div>
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
