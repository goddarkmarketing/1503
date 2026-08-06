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
    return { categories, products, taxWithhold, taxWithholdEnabled };
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

    return { categories, products, taxWithhold, taxWithholdEnabled };
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
        const taxEnabled = normalized.taxWithholdEnabled[key] !== false;

        return `
          <div class="agent-commission-rates__row agent-commission-rates__row--insurer" data-product-key="${this._escape(key)}">
            <label class="agent-commission-rates__brand" for="commission-product-${key}">
              ${logoHtml}
              <span class="agent-commission-rates__label">${this._escape(ins.name)}</span>
            </label>
            <div class="agent-commission-rates__controls">
              ${this._rateInput({
                id: `commission-product-${key}`,
                name: `commissionProduct_${key}`,
                value: normalized.products[key],
                caption: 'คอม',
                ariaLabel: `อัตราคอมมิชชัน ${ins.name} (${group.label})`
              })}
              <div class="agent-commission-rates__tax-block${taxEnabled ? '' : ' is-off'}">
                <label class="agent-commission-rates__tax-toggle" title="เปิด = หักภาษีจากค่าคอม / ปิด = ออก 50 ทวิ อัตโนมัติ">
                  <input
                    type="checkbox"
                    name="taxWithholdEnabled_${key}"
                    data-tax-enabled="${key}"
                    ${taxEnabled ? 'checked' : ''}
                    aria-label="เปิดหักภาษี ${ins.name} (${group.label})"
                  >
                  <span>หักภาษี</span>
                </label>
                <div class="agent-commission-rates__input-wrap">
                  <input
                    type="number"
                    id="tax-withhold-${key}"
                    name="taxWithhold_${key}"
                    class="agent-commission-rates__input"
                    min="0"
                    max="100"
                    step="0.01"
                    value="${normalized.taxWithhold[key]}"
                    inputmode="decimal"
                    aria-label="หักภาษี % จากค่าคอม ${this._escape(ins.name)} (${this._escape(group.label)})"
                    ${taxEnabled ? '' : 'disabled'}
                  >
                  <span class="agent-commission-rates__suffix">%</span>
                </div>
                <span class="agent-commission-rates__tax-hint" data-tax-hint="${key}">
                  ${taxEnabled ? 'ไม่ต้องออก 50 ทวิ' : 'ออก 50 ทวิ'}
                </span>
              </div>
            </div>
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

  _syncTaxEnabledUI(root) {
    root.querySelectorAll('[data-tax-enabled]').forEach((checkbox) => {
      const key = checkbox.getAttribute('data-tax-enabled');
      const taxInput = root.querySelector(`[name="taxWithhold_${key}"]`);
      const hint = root.querySelector(`[data-tax-hint="${key}"]`);
      const block = checkbox.closest('.agent-commission-rates__tax-block');
      const enabled = checkbox.checked;
      if (taxInput) taxInput.disabled = !enabled;
      if (block) block.classList.toggle('is-off', !enabled);
      if (hint) hint.textContent = enabled ? 'ไม่ต้องออก 50 ทวิ' : 'ออก 50 ทวิ';
    });
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

    container.querySelectorAll('[data-tax-enabled]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => this._syncTaxEnabledUI(container));
    });
    this._syncTaxEnabledUI(container);
  },

  renderFormSection(rates) {
    return `
      <section class="agent-form__section">
        <div class="agent-form__sectionHead">
          <h3 class="agent-form__sectionTitle">อัตราคอมมิชชันและหักภาษี (%)</h3>
          <span class="agent-form__sectionBadge agent-form__sectionBadge--muted">แยกตามบริษัท</span>
        </div>
        <p class="agent-form__sectionHint">
          ค่าคอม = <strong>เบี้ยสุทธิ</strong> × %คอม แล้วหักภาษี (% จากค่าคอม) —
          ยอดเก็บตัวแทน = เบี้ยเต็ม − ค่าคอมสุทธิ<br>
          <strong>ปิดหักภาษี</strong> → ออก 50 ทวิ อัตโนมัติ ·
          <strong>เปิดหักภาษี</strong> → ไม่ต้องออก 50 ทวิ
        </p>
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
