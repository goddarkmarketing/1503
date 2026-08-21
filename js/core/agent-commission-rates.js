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

    const tabButtons = groups.map((group, index) => {
      const groupId = `${prefix}${group.code}`;
      const active = index === 0 ? ' is-active' : '';
      return `
        <button
          type="button"
          class="agent-commission-rates__tab agent-commission-rates__tab--${this._escape(group.code)}${active}"
          role="tab"
          id="${this._escape(groupId)}-tab"
          data-commission-tab="${this._escape(groupId)}"
          data-tab-theme="${this._escape(group.code)}"
          aria-selected="${index === 0 ? 'true' : 'false'}"
          aria-controls="${this._escape(groupId)}-panel"
        >
          <i data-lucide="${group.icon}" class="agent-commission-rates__cat-icon" aria-hidden="true"></i>
          <span class="agent-commission-rates__tabLabel">${this._escape(group.label)}</span>
          <em>${group.insurers.length}</em>
        </button>
      `;
    }).join('');

    const panels = groups.map((group, index) => {
      const groupId = `${prefix}${group.code}`;
      const active = index === 0 ? ' is-active' : '';
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
        <div
          class="agent-commission-rates__group${active}"
          data-commission-group="${groupId}"
          data-tab-theme="${this._escape(group.code)}"
          id="${this._escape(groupId)}-panel"
          role="tabpanel"
          aria-labelledby="${this._escape(groupId)}-tab"
          ${index === 0 ? '' : 'hidden'}
        >
          <div class="agent-commission-rates__panel">
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

    return `
      <div class="agent-commission-rates" data-commission-rates>
        <div class="agent-commission-rates__tabs" role="tablist" aria-label="หมวดประกัน">
          ${tabButtons}
        </div>
        <div class="agent-commission-rates__panels">
          ${panels}
        </div>
      </div>
    `;
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

    root.querySelectorAll('[data-commission-rates]').forEach((wrap) => {
      const tabs = wrap.querySelectorAll('[data-commission-tab]');
      const panels = wrap.querySelectorAll('[data-commission-group]');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const id = tab.getAttribute('data-commission-tab');
          tabs.forEach((t) => {
            const active = t === tab;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          panels.forEach((panel) => {
            const active = panel.getAttribute('data-commission-group') === id;
            panel.classList.toggle('is-active', active);
            panel.hidden = !active;
          });
        });
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

    this._bindTeamQuickRates(root);
    this._bindTeamOverviewTotals(root);
    this._bindTeamLeaderRadios(root);
    this._bindOverrideSection(root);
    this._syncTaxEnabledUI(root);
  },

  _parseOverviewRate(input) {
    const raw = String(input?.value ?? '').trim();
    if (raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100) / 100;
  },

  _formatPctLabel(n) {
    if (n == null) return '—';
    const rounded = Math.round(n * 100) / 100;
    return `${rounded}%`;
  },

  _syncTeamOverviewTotals(overview) {
    if (!overview) return;
    overview.querySelectorAll('[data-team-member-row]').forEach((row) => {
      const out = row.querySelector('[data-team-total]');
      if (!out) return;
      const role = row.getAttribute('data-team-role');
      if (role === 'leader') {
        const self = this._parseOverviewRate(row.querySelector('[data-team-self-rate]'));
        out.innerHTML = self == null
          ? '<span class="agent-team-overview__totalVal">—</span>'
          : `<span class="agent-team-overview__totalVal">${this._formatPctLabel(self)}</span>
             <span class="agent-team-overview__totalHint">ขายเอง</span>`;
        return;
      }
      const member = this._parseOverviewRate(row.querySelector('[data-member-rate]'));
      const leader = this._parseOverviewRate(row.querySelector('[data-leader-rate]'));
      if (member == null && (leader == null || leader === 0)) {
        out.innerHTML = '<span class="agent-team-overview__totalVal">—</span>';
        return;
      }
      const saleTotal = (member || 0) + (leader || 0);
      const hint = leader
        ? `รวมยอดขายนี้ ${this._formatPctLabel(saleTotal)}`
        : '';
      out.innerHTML = `
        <span class="agent-team-overview__totalVal">${this._formatPctLabel(member)}</span>
        ${hint ? `<span class="agent-team-overview__totalHint">${hint}</span>` : ''}
      `;
    });
  },

  _bindTeamLeaderRadios(root) {
    const overview = root.querySelector('[data-team-commission-overview]');
    if (!overview) return;
    const tbody = overview.querySelector('tbody');
    if (!tbody) return;

    const getSelected = () => overview.querySelector('[name=teamLeaderId]:checked')?.value || '';
    let selectedId = getSelected();

    const applyLeader = (nextLeaderId) => {
      if (!nextLeaderId) return;

      const rows = Array.from(tbody.querySelectorAll('[data-team-member-row]'));
      const leaderRow = rows.find((r) => (r.getAttribute('data-team-member-row') || '') === nextLeaderId) || rows[0];
      if (!leaderRow) return;

      // reorder: selected leader goes to top
      const rest = rows.filter((r) => r !== leaderRow);
      [leaderRow, ...rest].forEach((r) => tbody.appendChild(r));

      // toggle inputs + role for totals + saving
      rows.forEach((row) => {
        const rowId = row.getAttribute('data-team-member-row') || '';
        const isLeader = rowId === nextLeaderId;

        row.setAttribute('data-team-role', isLeader ? 'leader' : 'member');
        row.classList.toggle('is-team-head', isLeader);

        const text = row.querySelector('.agent-team-overview__roleText');
        if (text) text.textContent = isLeader ? 'หัวทีม' : 'ลูกทีม';

        const selfInput = row.querySelector('[data-team-self-rate]');
        const memberInput = row.querySelector('[data-member-rate]');
        const leaderInput = row.querySelector('[data-leader-rate]');
        const naSpan = row.querySelector('[data-team-leader-na]');

        if (isLeader) {
          // self = member-rate (own product rate)
          if (selfInput && memberInput) selfInput.value = memberInput.value;
          if (memberInput) memberInput.hidden = true;
          if (selfInput) selfInput.hidden = false;
          if (leaderInput) leaderInput.hidden = true;
          if (naSpan) naSpan.hidden = false;
        } else {
          // member = self (own product rate)
          if (memberInput && selfInput) memberInput.value = selfInput.value;
          if (selfInput) selfInput.hidden = true;
          if (memberInput) memberInput.hidden = false;
          if (leaderInput) leaderInput.hidden = false;
          if (naSpan) naSpan.hidden = true;
        }
      });

      this._syncTeamOverviewTotals(overview);
    };

    // apply initial selection state
    applyLeader(selectedId || (tbody.querySelector('[data-team-member-row]')?.getAttribute('data-team-member-row') || ''));

    overview.addEventListener('change', (e) => {
      if (!e.target.matches('[name=teamLeaderId]')) return;

      const nextSelectedId = getSelected();
      if (!nextSelectedId || nextSelectedId === selectedId) return;

      const ok = window.confirm(
        'หากเปลี่ยนหัวทีม ค่าคอมในตารางจะต้องตั้งค่าใหม่ และช่อง “คอม/หัวทีม/คนนี้ได้” จะถูกสลับตามหัวทีมที่เลือก\nต้องการดำเนินการหรือไม่?'
      );
      if (!ok) {
        // revert checked radio
        overview.querySelectorAll('[name=teamLeaderId]').forEach((r) => {
          r.checked = r.value === selectedId;
        });
        return;
      }

      selectedId = nextSelectedId;
      applyLeader(selectedId);
    });
  },

  _bindTeamOverviewTotals(root) {
    const overview = root.querySelector('[data-team-commission-overview]');
    if (!overview) return;
    const sync = () => this._syncTeamOverviewTotals(overview);
    overview.addEventListener('input', (e) => {
      if (e.target.matches('[data-team-self-rate], [data-member-rate], [data-leader-rate]')) sync();
    });
    sync();
  },

  _commonProductRate(products) {
    const vals = Object.values(products || {}).map((v) => Number(v));
    const valid = vals.filter((v) => Number.isFinite(v));
    if (!valid.length) return '';
    const first = valid[0];
    return valid.every((v) => v === first) ? first : '';
  },

  _applyQuickRates(root, memberRate, leaderRate) {
    const memberVal = String(memberRate ?? '').trim();
    const leaderVal = String(leaderRate ?? '').trim();
    if (memberVal !== '') {
      root.querySelectorAll('[name^="commissionProduct_"]').forEach((input) => {
        input.value = memberVal;
      });
    }
    const enableCb = root.querySelector('[name="overrideEnabled"]');
    const leaderNum = Number(leaderVal);
    if (leaderVal !== '' && Number.isFinite(leaderNum) && leaderNum > 0) {
      if (enableCb) enableCb.checked = true;
      root.querySelectorAll('[name^="override_commissionProduct_"]').forEach((input) => {
        input.value = leaderVal;
      });
    } else if (enableCb && leaderVal === '0') {
      enableCb.checked = false;
      root.querySelectorAll('[name^="override_commissionProduct_"]').forEach((input) => {
        input.value = '0';
      });
    }
    this._syncOverrideSectionUI(root);
    this._syncTaxEnabledUI(root);
  },

  _syncOverrideSectionUI(root) {
    const section = root.querySelector('[data-override-section]');
    if (!section) return;
    const parentSelect = root.querySelector('[name="parentId"]');
    const enableCb = section.querySelector('[name="overrideEnabled"]');
    const grid = section.querySelector('[data-override-grid]');
    const quickSection = root.querySelector('[data-team-quick-section]');

    const hasParent = !!(parentSelect && String(parentSelect.value || '').trim());
    const leaderWrap = root.querySelector('[data-quick-leader-wrap]');
    const leaderHint = root.querySelector('[data-quick-leader-hint]');
    const memberHint = root.querySelector('[data-quick-member-hint]');
    const memberLabel = root.querySelector('[data-quick-member-label]');
    if (leaderWrap) leaderWrap.hidden = !hasParent;
    if (leaderHint) leaderHint.hidden = hasParent;
    if (memberHint) memberHint.hidden = !hasParent;
    if (memberLabel) {
      memberLabel.textContent = hasParent ? 'ลูกทีมได้คอม (%)' : 'ค่าคอมของคนนี้ (%)';
    }
    if (quickSection) quickSection.hidden = false;
    section.hidden = !hasParent;
    const on = hasParent && !!enableCb?.checked;
    if (grid) grid.hidden = !on;
  },

  _bindTeamQuickRates(root) {
    const quickSection = root.querySelector('[data-team-quick-section]');
    if (!quickSection) return;
    const parentSelect = root.querySelector('[name="parentId"]');
    const memberInput = quickSection.querySelector('[data-quick-member-rate]');
    const leaderInput = quickSection.querySelector('[data-quick-leader-rate]');
    const applyBtn = quickSection.querySelector('[data-quick-apply]');

    const syncVisibility = () => this._syncOverrideSectionUI(root);
    parentSelect?.addEventListener('change', syncVisibility);

    applyBtn?.addEventListener('click', () => {
      this._applyQuickRates(root, memberInput?.value, leaderInput?.value);
    });

    [memberInput, leaderInput].forEach((input) => {
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._applyQuickRates(root, memberInput?.value, leaderInput?.value);
        }
      });
    });

    syncVisibility();
  },

  _bindOverrideSection(root) {
    const section = root.querySelector('[data-override-section]');
    if (!section) return;
    const parentSelect = root.querySelector('[name="parentId"]');
    const enableCb = section.querySelector('[name="overrideEnabled"]');

    const sync = () => this._syncOverrideSectionUI(root);

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

  renderAdminOnlyNotice(extraText) {
    const extra = extraText ? ` — ${this._escape(extraText)}` : '';
    return `<p class="admin-only-notice" role="note"><i data-lucide="shield"></i> <strong>ตั้งโดยแอดมินเท่านั้น</strong>${extra}</p>`;
  },

  renderQuickCommissionBlock(rates, options = {}) {
    const normalized = this.normalize(rates);
    const memberRate = this._commonProductRate(normalized.products);
    const leaderRate = normalized.overrideEnabled
      ? this._commonProductRate(normalized.override.products)
      : '';
    const hasParent = !!options.hasParent;
    const memberLabel = hasParent ? 'ลูกทีมได้คอม (%)' : 'ค่าคอมของคนนี้ (%)';
    const memberPlaceholder = hasParent ? 'เช่น 12' : 'เช่น 15';
    return `
      <section class="agent-form__section agent-commission-rates__quick" data-team-quick-section>
        <div class="agent-form__sectionHead">
          <h3 class="agent-form__sectionTitle">ตั้งค่าคอม (แบบง่าย)</h3>
          <span class="agent-form__sectionBadge">แนะนำ</span>
        </div>
        <p class="agent-form__sectionHint" data-quick-leader-hint ${hasParent ? 'hidden' : ''}>
          กรอก % ที่หัวทีมได้เมื่อ<strong>ขายเอง</strong> แล้วกดใช้ค่านี้ — ถ้าต้องการแบ่งให้ลูกทีม (เช่น ลูกได้ 12 · หัวได้ 3) ให้ไปกด <strong>ทีม/คอม</strong> ที่บัญชี<strong>ลูกทีม</strong>แต่ละคน
        </p>
        <p class="agent-form__sectionHint" data-quick-member-hint ${hasParent ? '' : 'hidden'}>
          กรอก % แล้วกด <strong>ใช้ค่านี้</strong> — เช่น ลูกทีมได้ 12 · หัวหน้าได้ 3 ระบบจะใส่ให้ทุกบริษัท
        </p>
        <div class="agent-commission-rates__quickRow">
          <div class="form-field">
            <label for="quickMemberRate" data-quick-member-label>${memberLabel}</label>
            <input
              type="number"
              id="quickMemberRate"
              data-quick-member-rate
              min="0"
              max="100"
              step="0.01"
              inputmode="decimal"
              placeholder="${memberPlaceholder}"
              value="${memberRate !== '' ? memberRate : ''}"
            >
          </div>
          <div class="form-field" data-quick-leader-wrap ${hasParent ? '' : 'hidden'}>
            <label for="quickLeaderRate">หัวหน้าทีมได้จากยอดนี้ (%)</label>
            <input
              type="number"
              id="quickLeaderRate"
              data-quick-leader-rate
              min="0"
              max="100"
              step="0.01"
              inputmode="decimal"
              placeholder="เช่น 3"
              value="${leaderRate !== '' ? leaderRate : ''}"
            >
          </div>
          <div class="form-field agent-commission-rates__quickAction">
            <label aria-hidden="true">&nbsp;</label>
            <button type="button" class="btn-primary btn-sm" data-quick-apply>ใช้ค่านี้</button>
          </div>
        </div>
        <p class="agent-form__sectionHint agent-commission-rates__scrollHint">เลื่อนลงด้านล่างได้ หากต้องการตั้งรายบริษัทหรือหักภาษี</p>
      </section>
    `;
  },

  renderDetailedCommissionSections(rates) {
    const normalized = this.normalize(rates);
    return `
      <section class="agent-form__section">
        <div class="agent-form__sectionHead">
          <h3 class="agent-form__sectionTitle">ค่าคอมรายบริษัท (ขั้นสูง)</h3>
          <span class="agent-form__sectionBadge agent-form__sectionBadge--muted">ไม่บังคับ</span>
        </div>
        <p class="agent-form__sectionHint">ใช้เมื่อแต่ละบริษัทให้ % ไม่เท่ากัน หรือต้องตั้งหักภาษี / ออก 50 ทวิ แยกบริษัท</p>
        <ol class="agent-commission-rates__howto">
          <li>ใส่ <strong>% คอม</strong> ที่นายหน้าได้จากเบี้ยสุทธิ</li>
          <li>ถ้าต้องการหักภาษี จากค่าคอม ให้ติ๊ก <strong>หักภาษี</strong> แล้วใส่ %</li>
          <li>ถ้าไม่หักภาษี ระบบจะ <strong>ออกใบ 50 ทวิ</strong> ให้อัตโนมัติ</li>
        </ol>
        ${this.renderRatesGrid(normalized)}
      </section>
      <section class="agent-form__section agent-commission-rates__override" data-override-section hidden>
        <div class="agent-form__sectionHead">
          <h3 class="agent-form__sectionTitle">คอมหัวหน้าทีมรายบริษัท (ขั้นสูง)</h3>
        </div>
        <p class="agent-form__sectionHint">เปิดเมื่อหัวหน้าต้องได้ % จากยอดขายของลูกทีม — ตั้งแบบง่ายได้ที่ช่องด้านบน</p>
        <label class="wht50-settings__option" for="overrideEnabled" style="margin-bottom:14px">
          <input id="overrideEnabled" name="overrideEnabled" type="checkbox" ${normalized.overrideEnabled ? 'checked' : ''}>
          <span class="wht50-settings__optionBody">
            <span class="wht50-settings__optionTitle">เปิดคอมหัวหน้าทีมจากยอดขายของลูกทีมคนนี้</span>
            <span class="wht50-settings__optionDesc">เช่น ลูกได้ 12 · หัวหน้าได้ 3 — ถ้าปิดหักภาษีของใคร ระบบออก 50 ทวิให้คนนั้น</span>
          </span>
        </label>
        <div data-override-grid ${normalized.overrideEnabled ? '' : 'hidden'}>
          ${this.renderRatesGrid(normalized, {
            prefix: 'override_',
            rateSource: 'override',
            rateColumnLabel: 'หัวหน้าทีมได้คอม'
          })}
        </div>
      </section>
    `;
  },

  renderTeamQuickSection(rates) {
    return this.renderQuickCommissionBlock(rates);
  },

  applyUniformRates(baseRates, { memberPercent, leaderPercent } = {}) {
    const normalized = this.normalize(baseRates);
    const next = {
      ...normalized,
      products: { ...normalized.products },
      taxWithhold: { ...normalized.taxWithhold },
      taxWithholdEnabled: { ...normalized.taxWithholdEnabled },
      override: {
        products: { ...normalized.override.products },
        taxWithhold: { ...normalized.override.taxWithhold },
        taxWithholdEnabled: { ...normalized.override.taxWithholdEnabled }
      }
    };

    const memberVal = String(memberPercent ?? '').trim();
    if (memberVal !== '') {
      const p = this._parseRate(memberVal, null);
      if (p != null) {
        Object.keys(next.products).forEach((key) => {
          next.products[key] = p;
        });
      }
    }

    if (leaderPercent !== undefined) {
      const leaderVal = String(leaderPercent ?? '').trim();
      if (leaderVal !== '') {
        const leaderNum = Number(leaderVal);
        if (Number.isFinite(leaderNum)) {
          next.overrideEnabled = leaderNum > 0;
          Object.keys(next.override.products).forEach((key) => {
            next.override.products[key] = leaderNum;
          });
        }
      }
    }

    return next;
  },

  _rolePickCell(agentId, isLeader) {
    return `
      <td class="agent-team-overview__role">
        <label class="agent-team-overview__rolePick">
          <input
            type="radio"
            name="teamLeaderId"
            value="${this._escape(agentId)}"
            ${isLeader ? 'checked' : ''}
            aria-label="ตั้งเป็นหัวทีม"
          >
          <span class="agent-team-overview__roleText">${isLeader ? 'หัวทีม' : 'ลูกทีม'}</span>
        </label>
      </td>
    `;
  },

  _readOverviewMemberRate(row) {
    if (!row) return '';
    const role = row.getAttribute('data-team-role');
    if (role === 'leader') {
      return row.querySelector('[data-team-self-rate]')?.value ?? '';
    }
    return row.querySelector('[data-member-rate]')?.value
      ?? row.querySelector('[data-team-self-rate]')?.value
      ?? '';
  },

  renderTeamCommissionOverview(leader, members = []) {
    const leaderNorm = this.normalize(leader.commissionRates);
    const leaderSelf = this._commonProductRate(leaderNorm.products);
    const leaderOverrideRate = leaderNorm.overrideEnabled
      ? this._commonProductRate(leaderNorm.override.products)
      : '';

    const leaderRow = `
      <tr data-team-member-row="${this._escape(leader.id)}" data-team-role="leader">
        <td>
          <strong>${this._escape(leader.name)}</strong>
          <span class="agent-team-overview__code">${this._escape(leader.code)}</span>
        </td>
        ${this._rolePickCell(leader.id, true)}
        <td>
          <input
            type="number"
            data-team-self-rate
            min="0"
            max="100"
            step="0.01"
            inputmode="decimal"
            placeholder="เช่น 15"
            value="${leaderSelf !== '' ? leaderSelf : ''}"
            aria-label="ค่าคอมของ ${this._escape(leader.name)} เมื่อขายเอง"
          >
          <input
            type="number"
            data-member-rate
            min="0"
            max="100"
            step="0.01"
            inputmode="decimal"
            placeholder="เช่น 15"
            value="${leaderSelf !== '' ? leaderSelf : ''}"
            hidden
            aria-label="ลูกทีม ${this._escape(leader.name)} ได้คอม"
          >
        </td>
        <td>
          <span class="agent-team-overview__na" data-team-leader-na aria-hidden="true">—</span>
          <input
            type="number"
            data-leader-rate
            min="0"
            max="100"
            step="0.01"
            inputmode="decimal"
            placeholder="เช่น 3"
            value="${leaderOverrideRate !== '' ? leaderOverrideRate : ''}"
            hidden
            aria-label="หัวทีมได้จากยอดขายของ ${this._escape(leader.name)}"
          >
        </td>
        <td class="agent-team-overview__total" data-team-total></td>
      </tr>
    `;

    const memberRows = members.map((member) => {
      const norm = this.normalize(member.commissionRates);
      const memberRate = this._commonProductRate(norm.products);
      const leaderRate = norm.overrideEnabled
        ? this._commonProductRate(norm.override.products)
        : '';
      return `
        <tr data-team-member-row="${this._escape(member.id)}" data-team-role="member">
          <td>
            <strong>${this._escape(member.name)}</strong>
            <span class="agent-team-overview__code">${this._escape(member.code)}</span>
          </td>
          ${this._rolePickCell(member.id, false)}
          <td>
            <input
              type="number"
              data-member-rate
              min="0"
              max="100"
              step="0.01"
              inputmode="decimal"
              placeholder="เช่น 12"
              value="${memberRate !== '' ? memberRate : ''}"
              aria-label="ลูกทีม ${this._escape(member.name)} ได้คอม"
            >
            <input
              type="number"
              data-team-self-rate
              min="0"
              max="100"
              step="0.01"
              inputmode="decimal"
              placeholder="เช่น 12"
              value="${memberRate !== '' ? memberRate : ''}"
              hidden
              aria-label="ค่าคอมของ ${this._escape(member.name)} เมื่อขายเอง"
            >
          </td>
          <td>
            <span class="agent-team-overview__na" data-team-leader-na aria-hidden="true" hidden>—</span>
            <input
              type="number"
              data-leader-rate
              min="0"
              max="100"
              step="0.01"
              inputmode="decimal"
              placeholder="เช่น 3"
              value="${leaderRate !== '' ? leaderRate : ''}"
              aria-label="หัวทีมได้จากยอดขายของ ${this._escape(member.name)}"
            >
          </td>
          <td class="agent-team-overview__total" data-team-total></td>
        </tr>
      `;
    }).join('');

    const emptyHint = members.length
      ? ''
      : '<p class="form-field__hint">ยังไม่มีลูกทีม — ตั้งค่าคอมของหัวทีมได้ที่แถวด้านบน</p>';

    return `
      <section class="agent-form__section agent-team-commission-overview" data-team-commission-overview>
        <div class="agent-form__sectionHead">
          <h3 class="agent-form__sectionTitle">ตั้งค่าคอมทั้งทีม</h3>
          <span class="agent-form__sectionBadge">แนะนำ</span>
        </div>
        <p class="agent-form__sectionHint">
          เลือก <strong>วงกลมในคอลัมน์บทบาท</strong> เพื่อกำหนดหัวทีม · กำหนด % ให้ทุกคนในที่เดียว — คอลัมน์ <strong>คนนี้ได้ (%)</strong> จะโชว์ทันทีว่าแต่ละคนได้รับเท่าไร
        </p>
        <div class="agent-team-overview__tableWrap">
          <table class="agent-team-overview__table">
            <thead>
              <tr>
                <th scope="col">ชื่อ</th>
                <th scope="col">บทบาท</th>
                <th scope="col">ได้คอม (%)</th>
                <th scope="col">หัวทีมได้จากยอดนี้ (%)</th>
                <th scope="col">คนนี้ได้ (%)</th>
              </tr>
            </thead>
            <tbody>
              ${leaderRow}
              ${memberRows}
            </tbody>
          </table>
        </div>
        ${emptyHint}
      </section>
    `;
  },

  buildTeamOverviewUpdates(form, leader, members = []) {
    if (!form || !leader) return [];
    const roster = [leader, ...members];
    const selectedLeaderId = form.querySelector('[name=teamLeaderId]:checked')?.value || leader.id;
    const updates = [];

    const leaderRow = form.querySelector(`[data-team-member-row="${selectedLeaderId}"]`);
    const leaderAgent = roster.find((a) => a.id === selectedLeaderId);
    if (leaderRow && leaderAgent) {
      updates.push({
        id: selectedLeaderId,
        parentId: null,
        commissionRates: this.applyUniformRates(leaderAgent.commissionRates, {
          memberPercent: this._readOverviewMemberRate(leaderRow)
        })
      });
    }

    roster.forEach((member) => {
      if (member.id === selectedLeaderId) return;
      const row = form.querySelector(`[data-team-member-row="${member.id}"]`);
      if (!row) return;
      const leaderRate = row.querySelector('[data-leader-rate]')?.value;
      updates.push({
        id: member.id,
        parentId: selectedLeaderId,
        commissionRates: this.applyUniformRates(member.commissionRates, {
          memberPercent: this._readOverviewMemberRate(row),
          leaderPercent: leaderRate
        })
      });
    });

    return updates;
  },

  mergeLeaderAdvancedRates(uniformRates, formRates) {
    if (!formRates) return uniformRates;
    return {
      ...uniformRates,
      taxWithhold: formRates.taxWithhold,
      taxWithholdEnabled: formRates.taxWithholdEnabled,
      override: {
        ...uniformRates.override,
        taxWithhold: formRates.override?.taxWithhold || uniformRates.override.taxWithhold,
        taxWithholdEnabled: formRates.override?.taxWithholdEnabled || uniformRates.override.taxWithholdEnabled
      }
    };
  },

  renderFormSection(rates, options = {}) {
    return `
      ${this.renderAdminOnlyNotice('หัวหน้าทีมและนายหน้าไม่สามารถตั้งค่าคอมเองได้')}
      ${this.renderQuickCommissionBlock(rates, options)}
      ${this.renderDetailedCommissionSections(rates)}
    `;
  },

  applyQuickRatesFromForm(form) {
    if (!form) return;
    const member = form.querySelector('[data-quick-member-rate]')?.value;
    const leader = form.querySelector('[data-quick-leader-rate]')?.value;
    if ((member == null || member === '') && (leader == null || leader === '')) return;
    this._applyQuickRates(form, member, leader);
  },

  _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
