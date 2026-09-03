/**
 * BKI voluntary motor (2+/3+) — quote form wired to Motor Web Service API.
 * Layout and comparison table mirror voluntary-axa-quote.js.
 */
window.App = window.App || {};

App.MotorBkiService = {
  async getCarCodes(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return App.API.request(`/motor/bki/vol/car-codes${qs ? `?${qs}` : ''}`);
  },

  async getLookups() {
    return App.API.request('/motor/bki/vol/lookups');
  },

  async getAmphurs(provinceCode) {
    const qs = new URLSearchParams({ province_code: provinceCode }).toString();
    return App.API.request(`/motor/bki/vol/lookups/amphurs?${qs}`);
  },

  async getTambols(provinceCode, amphurCode) {
    const qs = new URLSearchParams({
      province_code: provinceCode,
      amphur_code: amphurCode
    }).toString();
    return App.API.request(`/motor/bki/vol/lookups/tambols?${qs}`);
  },

  async calculatePremium(payload) {
    return App.API.request('/motor/bki/vol/premium/calculate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async transferPolicy(payload) {
    return App.API.request('/motor/bki/vol/transfer/policy', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async issuePolicy(payload) {
    return App.API.request('/motor/bki/vol/issue', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async createQuote(payload) {
    return App.API.request('/motor/bki/vol/quotes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getQuote(quoteId) {
    return App.API.request(`/motor/bki/vol/quotes/${encodeURIComponent(quoteId)}`);
  }
};

App.VoluntaryBkiQuote = {
  _variants: [],
  _lookups: null,
  _packagesByPlan: {},
  _premiumsByPlan: {},

  CUSTOMER_TITLES: ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง'],
  CAR_COLORS: [
    { value: '01', label: '01 — ขาว' },
    { value: '04', label: '04 — ดำ' },
    { value: '07', label: '07 — เทา' },
    { value: '05', label: '05 — แดง' },
    { value: '08', label: '08 — น้ำเงิน' },
    { value: '02', label: '02 — เขียว' },
    { value: '00', label: '00 — ไม่ระบุ' }
  ],

  BKK_AREA: new Set([
    'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'
  ]),

  PROVINCES: [
    'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี',
    'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง',
    'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช',
    'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี',
    'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา',
    'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม',
    'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี',
    'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล',
    'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
    'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู',
    'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
  ],

  REG_TYPES: [
    { value: '110', label: 'รถยนต์นั่งส่วนบุคคลไม่เกิน 7 คน (110)' },
    { value: '120', label: 'รถยนต์นั่งส่วนบุคคลเกิน 7 คน (120)' },
    { value: '210', label: 'รถโดยสารส่วนบุคคล (210)' },
    { value: '320', label: 'รถกระบะใช้ส่วนบุคคล (320)' },
    { value: '340', label: 'รถกระบะบรรทุกส่วนบุคคล (340)' }
  ],

  USAGE_TYPES: [
    { value: 'personal', label: 'รถใช้เพื่อส่วนบุคคล' },
    { value: 'commercial', label: 'รถใช้เพื่อการพาณิชย์' }
  ],

  pad2(n) {
    return String(n).padStart(2, '0');
  },

  toInputDate(d) {
    return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-${this.pad2(d.getDate())}`;
  },

  addOneYear(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    if (!y || !m || !d) return '';
    return this.toInputDate(new Date(y + 1, m - 1, d));
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  escapeAttr(value) {
    return this.escapeHtml(value).replace(/'/g, '&#39;');
  },

  formatCarDesc(desc) {
    const text = String(desc ?? '').trim().replace(/\s+/g, ' ');
    if (!text) return '';
    const parts = text.split(' ');
    const out = [];
    parts.forEach((part) => {
      const prev = out[out.length - 1];
      if (prev && prev.toLowerCase() === part.toLowerCase()) return;
      out.push(part);
    });
    return out.join(' ');
  },

  optionsHtml(items, { placeholder, selected, valueKey = 'value', labelKey = 'label' } = {}) {
    const head = placeholder ? `<option value="">${placeholder}</option>` : '';
    const body = items.map((item) => {
      const value = typeof item === 'string' ? item : item[valueKey];
      const label = typeof item === 'string' ? item : item[labelKey];
      const sel = selected != null && String(selected) === String(value) ? ' selected' : '';
      return `<option value="${this.escapeAttr(value)}"${sel}>${this.escapeHtml(label)}</option>`;
    }).join('');
    return head + body;
  },

  money(n) {
    if (n == null || n === '' || Number.isNaN(Number(n))) return '—';
    return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  formatThaiDate(value) {
    const raw = String(value || '').slice(0, 10);
    const [y, m, d] = raw.split('-').map(Number);
    if (!y || !m || !d) return value ? String(value).slice(0, 10) : '—';
    return `${this.pad2(d)}/${this.pad2(m)}/${y + 543}`;
  },

  optionLabel(el) {
    if (!el) return '';
    return el.selectedOptions?.[0]?.textContent?.trim() || el.value || '';
  },

  absAsset(path) {
    const base = document.body?.dataset?.basePath || '../';
    try {
      return new URL(path, new URL(base, window.location.href)).href;
    } catch {
      return `${base}${path}`;
    }
  },

  deductLabel(value) {
    const map = { 0: 'ไม่มี', 2000: '2,000', 5000: '5,000' };
    return map[Number(value)] ?? (value ? String(value) : '—');
  },

  agentLabel(user) {
    if (!user) return 'ไม่พบข้อมูลนายหน้า';
    const code = user.agentCode || user.username || '-';
    const name = user.name || '';
    return `(${code}) ${name}`.trim();
  },

  resolveZone(province) {
    return this.BKK_AREA.has(String(province || '')) ? '1' : '2';
  },

  formatApiError(err, result) {
    if (result?.message) return result.message;
    if (err?.status === 403 || String(err?.message || '').includes('Forbidden')) {
      return 'BKI ปฏิเสธการเชื่อมต่อ (403) — localhost ไม่ได้อยู่ใน IP whitelist ของ BKI กรุณาทดสอบบนเซิร์ฟเวอร์ production';
    }
    return err?.message || 'เรียก API BKI ไม่สำเร็จ';
  },

  sumOptionsHtml(selected, variant) {
    const min = Number(variant?.sum_ins_min) || 0;
    const max = Number(variant?.sum_ins_max) || 0;
    const sel = Number(selected) || min || 100000;
    if (min > 0 && max > 0 && max >= min) {
      const mid = Math.round((min + max) / 2 / 1000) * 1000;
      const values = [...new Set([min, mid, max])].sort((a, b) => a - b);
      return values.map((n) =>
        `<option value="${n}" ${sel === n ? 'selected' : ''}>${this.money(n)}</option>`
      ).join('');
    }
    const fallback = [100000, 200000, 300000];
    return fallback.map((n) =>
      `<option value="${n}" ${sel === n ? 'selected' : ''}>${this.money(n)}</option>`
    ).join('');
  },

  deductibleOptionsHtml(selected = '0') {
    const opts = [
      { value: '0', label: 'ไม่มี' },
      { value: '2000', label: '2,000' },
      { value: '5000', label: '5,000' }
    ];
    return opts.map((o) =>
      `<option value="${o.value}" ${String(selected) === o.value ? 'selected' : ''}>${o.label}</option>`
    ).join('');
  },

  garageOptionsHtml(selected = 'garage') {
    return [
      { value: 'garage', label: 'ซ่อมอู่' },
      { value: 'dealer', label: 'ซ่อมห้าง' }
    ].map((o) =>
      `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`
    ).join('');
  },

  planLabel(plan) {
    if (plan === '2plus') return 'ชั้น 2+';
    if (plan === '3plus') return 'ชั้น 3+';
    if (plan === '3') return 'ชั้น 3';
    return plan || '';
  },

  getSelectedPlan(root) {
    return root?.dataset?.selectedPlan || '3plus';
  },

  setSelectedPlan(root, plan) {
    if (!root || !plan) return;
    root.dataset.selectedPlan = plan;
    const table = root.querySelector('.axa-cmp');
    const plans = ['2plus', '3plus', '3'];

    root.querySelectorAll('.axa-cmp__planHead').forEach((th) => {
      th.classList.toggle('is-selected', th.dataset.plan === plan);
    });

    if (table) {
      plans.forEach((p) => {
        table.classList.toggle(`is-col-selected-${p}`, p === plan);
      });
      table.querySelectorAll('[data-col]').forEach((cell) => {
        cell.classList.toggle('is-col-active', cell.dataset.col === plan);
      });
    }

    plans.forEach((p) => {
      const prb = root.querySelector(`input[name="buyPrb_${p}"]`);
      if (prb) prb.checked = p === plan;
    });

    const cover = root.closest('form')?.querySelector('#coverType');
    if (cover) cover.value = plan;

    const premiumEl = document.getElementById('productKeyPremium');
    const premium = this._premiumsByPlan?.[plan] ?? this.getDisplayedPremium(root, plan);
    if (premiumEl && premium != null) {
      this.setPremiumBar(premiumEl, premium);
    }
  },

  wireComparisonColumns(host) {
    const table = host.querySelector('.axa-cmp');
    if (!table || table.dataset.colsBound === '1') return;
    table.dataset.colsBound = '1';

    const plans = ['2plus', '3plus', '3'];

    table.querySelectorAll('.axa-cmp__planHead[data-plan]').forEach((th) => {
      th.dataset.col = th.dataset.plan;
      th.classList.add('axa-cmp__col');
    });

    table.querySelectorAll('tbody tr:not(.axa-cmp__section)').forEach((tr) => {
      tr.querySelectorAll(':scope > td').forEach((td, i) => {
        if (!plans[i]) return;
        td.dataset.col = plans[i];
        td.classList.add('axa-cmp__col');
      });
    });

    const setHoverCol = (col) => {
      plans.forEach((p) => table.classList.toggle(`is-col-hover-${p}`, col === p));
    };

    table.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('[data-col]');
      setHoverCol(cell?.dataset.col || null);
    });
    table.addEventListener('mouseleave', () => setHoverCol(null));

    table.addEventListener('click', (e) => {
      if (e.target.closest('select, input, label.axa-cmp__prb, button, a')) return;
      const cell = e.target.closest('[data-col]');
      if (cell?.dataset.col) this.setSelectedPlan(host, cell.dataset.col);
    });
  },

  buildFields(user) {
    const today = new Date();
    const start = this.toInputDate(today);
    const end = this.addOneYear(start);

    return `
      <div class="axa-quote bki-quote" data-policy-mode="voluntary">
        <input type="hidden" name="coverType" id="coverType" value="3plus">
        <input type="hidden" id="zoneUse" name="zone_use" value="1">
        <input type="hidden" id="sumInsured" name="sum_ins" value="">
        <input type="hidden" id="ncb" name="ncb" value="0">
        <input type="hidden" id="deduct" name="deduct" value="0">
        <input type="hidden" id="cc" name="cc">
        <input type="hidden" id="seat" name="seat">
        <input type="hidden" id="carType" name="car_type">

        <div class="axa-quote__row axa-quote__row--policy">
          <div class="form-field axa-quote__field axa-quote__field--agent">
            <label for="agentDisplay">ตัวแทน/นายหน้า <span class="form-req">*</span></label>
            <input type="text" id="agentDisplay" class="form-input" value="${this.escapeAttr(this.agentLabel(user))}" readonly>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--policyType">
            <span class="axa-quote__label">ประเภทกรมธรรม์ <span class="form-req">*</span></span>
            <div class="axa-quote__seg" role="group" aria-label="ประเภทกรมธรรม์">
              <label class="axa-quote__segOpt">
                <input type="radio" name="policyType" value="voluntary" checked>
                <span>ภาคสมัครใจ</span>
              </label>
              <label class="axa-quote__segOpt">
                <input type="radio" name="policyType" value="compulsory" disabled>
                <span>พ.ร.บ.</span>
              </label>
            </div>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--promo">
            <label for="promoCode">โปรโมชั่นโค้ด</label>
            <input type="text" id="promoCode" name="promoCode" class="form-input" autocomplete="off" spellcheck="false">
          </div>
        </div>

        <div class="axa-quote__row axa-quote__row--car">
          <div class="form-field axa-quote__field">
            <label for="make">ยี่ห้อรถ <span class="form-req">*</span></label>
            <select id="make" name="make" class="form-input" required>
              <option value="">กำลังโหลด...</option>
            </select>
          </div>
          <div class="form-field axa-quote__field">
            <label for="makeCode">รุ่นรถยนต์ <span class="form-req">*</span></label>
            <select id="makeCode" name="make_code" class="form-input" required disabled>
              <option value="">เลือกยี่ห้อก่อน</option>
            </select>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--year">
            <label for="carYear">ปีที่ผลิต <span class="form-req">*</span></label>
            <select id="carYear" name="car_year" class="form-input" required disabled>
              <option value="">เลือกรุ่นก่อน</option>
            </select>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--regType">
            <label for="regType">ประเภทการจดทะเบียน <span class="form-req">*</span></label>
            <select id="regType" name="reg_type" class="form-input" required>
              ${this.optionsHtml(this.REG_TYPES, { selected: '110' })}
            </select>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--submodel">
            <label for="carSubmodel">รุ่นย่อยรถยนต์ <span class="form-req">*</span></label>
            <select id="carSubmodel" name="car_submodel" class="form-input" required disabled>
              <option value="">โปรดเลือก</option>
            </select>
          </div>
        </div>

        <div class="axa-quote__stack">
          <div class="axa-quote__row axa-quote__row--coverA">
            <div class="form-field axa-quote__field axa-quote__field--province">
              <label for="regProvince">จังหวัดที่จดทะเบียน <span class="form-req">*</span></label>
              <select id="regProvince" name="regProvince" class="form-input" required>
                ${this.optionsHtml(this.PROVINCES, { placeholder: 'โปรดเลือก', selected: 'กรุงเทพมหานคร' })}
              </select>
            </div>
            <div class="form-field axa-quote__field axa-quote__field--usage">
              <label for="usageType">ประเภทการใช้รถ <span class="form-req">*</span></label>
              <select id="usageType" name="usageType" class="form-input" required>
                ${this.optionsHtml(this.USAGE_TYPES, { selected: 'personal' })}
              </select>
            </div>
            <div class="form-field axa-quote__field axa-quote__field--dashcam">
              <label for="dashcam">กล้องติดรถยนต์ <span class="form-req">*</span></label>
              <select id="dashcam" name="dashcam" class="form-input" required>
                <option value="none" selected>ไม่มี</option>
                <option value="yes">มี</option>
              </select>
            </div>
          </div>

          <div class="axa-quote__row axa-quote__row--coverB">
            <div class="form-field axa-quote__field axa-quote__field--start">
              <label for="coverageStart">วันเริ่มต้นความคุ้มครอง <span class="form-req">*</span></label>
              <input type="date" id="coverageStart" name="coverage_start" class="form-input" value="${start}" required>
            </div>
            <div class="form-field axa-quote__field axa-quote__field--end">
              <label for="coverageEnd">วันสิ้นสุดความคุ้มครอง <span class="form-req">*</span></label>
              <input type="date" id="coverageEnd" name="coverage_end" class="form-input form-input--readonly" value="${end}" readonly tabindex="-1">
            </div>
            <div class="form-field axa-quote__field axa-quote__field--driver">
              <span class="axa-quote__label">ระบุผู้ขับขี่ <span class="form-req">*</span></span>
              <button type="button" class="axa-quote__driverBtn" id="driverToggle" aria-pressed="false">
                Unnamed
              </button>
              <input type="hidden" name="driverMode" id="driverMode" value="unnamed">
            </div>
            <div class="form-field axa-quote__field axa-quote__field--check">
              <span class="axa-quote__label axa-quote__label--spacer" aria-hidden="true">&nbsp;</span>
              <button type="button" class="axa-quote__checkBtn" id="btnCheckPrice">
                ตรวจสอบราคา
              </button>
            </div>
          </div>
        </div>

        <div class="axa-result" id="bkiQuoteResult" hidden></div>
        <div class="bki-issue" id="bkiQuotePanel" hidden aria-live="polite"></div>
        <div class="bki-issue" id="bkiIssuePanel" hidden aria-live="polite"></div>
      </div>`;
  },

  buildDriverBlockHtml(n, { required = false } = {}) {
    const req = required ? ' required' : '';
    const star = required ? ' <span class="form-req">*</span>' : '';
    const titleOpts = this.optionsHtml(
      (this._lookups?.titles || this.CUSTOMER_TITLES.map((t) => ({ value: t, label: t }))).slice(0, 80),
      { placeholder: 'เลือก' }
    );
    const licenseOpts = this.optionsHtml(
      this._lookups?.license_types || [
        { value: '02', label: '02 — ใบขับขี่ประเภทส่วนบุคคล' },
        { value: '00', label: '00 — ไม่มีใบขับขี่' }
      ],
      { selected: '02' }
    );
    return `
      <div class="bki-issue__driverCard" data-driver="${n}">
        <h5 class="bki-issue__driverHead">ผู้ขับขี่คนที่ ${n}${required ? '' : ' (ถ้ามี)'}</h5>
        <div class="bki-issue__grid">
          <div class="form-field bki-issue__field">
            <label for="driver${n}Title">คำนำหน้า${star}</label>
            <select id="driver${n}Title" name="driver${n}Title" class="form-input"${req}>${titleOpts}</select>
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver${n}FirstName">ชื่อ${star}</label>
            <input type="text" id="driver${n}FirstName" name="driver${n}FirstName" class="form-input"${req}>
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver${n}LastName">นามสกุล${star}</label>
            <input type="text" id="driver${n}LastName" name="driver${n}LastName" class="form-input"${req}>
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver${n}Id">เลขบัตร${star}</label>
            <input type="text" id="driver${n}Id" name="driver${n}IdNumber" class="form-input" maxlength="13"${req}>
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver${n}Dob">วันเกิด${star}</label>
            <input type="date" id="driver${n}Dob" name="driver${n}Dob" class="form-input"${req}>
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver${n}LicenseType">ประเภทใบขับขี่${star}</label>
            <select id="driver${n}LicenseType" name="driver${n}LicenseType" class="form-input"${req}>${licenseOpts}</select>
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver${n}License">เลขใบขับขี่${star}</label>
            <input type="text" id="driver${n}License" name="driver${n}LicenseNo" class="form-input"${req}>
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver${n}LicenseExpire">วันหมดอายุใบขับขี่</label>
            <input type="date" id="driver${n}LicenseExpire" name="driver${n}LicenseExpire" class="form-input">
          </div>
        </div>
      </div>`;
  },

  buildIssuePanelHtml({ planLabel, premiumText } = {}) {
    const titles = this._lookups?.titles?.length
      ? this._lookups.titles
      : this.CUSTOMER_TITLES.map((t) => ({ value: t, label: t }));
    const colors = this._lookups?.colors?.length ? this._lookups.colors : this.CAR_COLORS;
    const occupations = this._lookups?.occupations || [];
    const provinces = this._lookups?.provinces || [];
    const plateProvinces = this._lookups?.provinces_plate || this.PROVINCES.map((p) => ({ value: p, label: p }));

    const titleOpts = this.optionsHtml(titles.slice(0, 120), { placeholder: 'เลือก', selected: 'นาย' });
    const colorOpts = this.optionsHtml(colors, { selected: '01' });
    const occOpts = this.optionsHtml(
      occupations.length ? occupations : [{ value: '1011', label: '1011 — เจ้าของกิจการ / พนักงานทั่วไป' }],
      { selected: occupations[0]?.value || '1011' }
    );
    const provOpts = this.optionsHtml(
      provinces.length ? provinces : this.PROVINCES.map((p) => ({ value: p, label: p })),
      { placeholder: 'โปรดเลือก' }
    );
    const plateOpts = this.optionsHtml(plateProvinces, {
      placeholder: 'โปรดเลือก',
      selected: plateProvinces.find((p) => /กรุงเทพ|กทม/.test(p.value || p.label || ''))?.value
        || 'กรุงเทพมหานคร'
    });

    return `
      <div class="bki-issue__head">
        <div>
          <h3 class="bki-issue__title">ข้อมูลลูกค้า / ผู้เอาประกัน</h3>
          <p class="bki-issue__sub">แผน <strong>${this.escapeHtml(planLabel || '—')}</strong> · เบี้ย <strong>${this.escapeHtml(premiumText || '—')}</strong></p>
        </div>
        <button type="button" class="bki-issue__back" id="btnBkiIssueBack">กลับไปตารางเปรียบเทียบ</button>
      </div>

      <div class="bki-issue__grid">
        <div class="form-field bki-issue__field">
          <span class="axa-quote__label">ประเภทผู้เอาประกัน <span class="form-req">*</span></span>
          <div class="bki-issue__radioRow">
            <label><input type="radio" name="idType" value="idcard" checked> บุคคลธรรมดา</label>
            <label><input type="radio" name="idType" value="corporate"> นิติบุคคล</label>
            <label><input type="radio" name="idType" value="passport"> ต่างชาติ</label>
          </div>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueGender">เพศ <span class="form-req">*</span></label>
          <select id="issueGender" name="gender" class="form-input" required>
            <option value="M" selected>ชาย</option>
            <option value="F">หญิง</option>
          </select>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueTitle">คำนำหน้า <span class="form-req">*</span></label>
          <select id="issueTitle" name="titleTh" class="form-input" required>${titleOpts}</select>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueFirstName">ชื่อ <span class="form-req">*</span></label>
          <input type="text" id="issueFirstName" name="firstName" class="form-input" required autocomplete="given-name">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueLastName">นามสกุล <span class="form-req">*</span></label>
          <input type="text" id="issueLastName" name="lastName" class="form-input" required autocomplete="family-name">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueIdNumber">เลขบัตร / เลขทะเบียนนิติบุคคล <span class="form-req">*</span></label>
          <input type="text" id="issueIdNumber" name="idNumber" class="form-input" required inputmode="numeric" maxlength="13">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueDob">วันเกิด <span class="form-req">*</span></label>
          <input type="date" id="issueDob" name="dob" class="form-input" required>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueOccupation">อาชีพ <span class="form-req">*</span></label>
          <select id="issueOccupation" name="occupation" class="form-input" required>${occOpts}</select>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issuePhone">เบอร์โทร <span class="form-req">*</span></label>
          <input type="tel" id="issuePhone" name="phone" class="form-input" required autocomplete="tel">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueEmail">อีเมล</label>
          <input type="email" id="issueEmail" name="email" class="form-input" autocomplete="email">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueHomeNumber">บ้านเลขที่ <span class="form-req">*</span></label>
          <input type="text" id="issueHomeNumber" name="homeNumber" class="form-input" required>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueMoo">หมู่ที่</label>
          <input type="text" id="issueMoo" name="moo" class="form-input">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueSoi">ซอย</label>
          <input type="text" id="issueSoi" name="soi" class="form-input">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueRoad">ถนน</label>
          <input type="text" id="issueRoad" name="road" class="form-input">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueBuilding">อาคาร / หมู่บ้าน</label>
          <input type="text" id="issueBuilding" name="building" class="form-input">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueProvince">จังหวัด <span class="form-req">*</span></label>
          <select id="issueProvince" name="insuredProvinceCode" class="form-input" required>
            ${provOpts}
          </select>
          <input type="hidden" id="issueProvinceName" name="insuredProvince" value="">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueDistrict">อำเภอ / เขต <span class="form-req">*</span></label>
          <select id="issueDistrict" name="insuredDistrictCode" class="form-input" required disabled>
            <option value="">เลือกจังหวัดก่อน</option>
          </select>
          <input type="hidden" id="issueDistrictName" name="insuredDistrict" value="">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueSubdistrict">ตำบล / แขวง <span class="form-req">*</span></label>
          <select id="issueSubdistrict" name="insuredSubdistrictCode" class="form-input" required disabled>
            <option value="">เลือกอำเภอก่อน</option>
          </select>
          <input type="hidden" id="issueSubdistrictName" name="insuredSubdistrict" value="">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issuePostal">รหัสไปรษณีย์ <span class="form-req">*</span></label>
          <input type="text" id="issuePostal" name="insuredPostal" class="form-input" required inputmode="numeric" maxlength="5">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueLicensePlate">ทะเบียนรถ <span class="form-req">*</span></label>
          <input type="text" id="issueLicensePlate" name="licensePlate" class="form-input" required placeholder="กก 1234">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueLicenseProvince">จังหวัดทะเบียน <span class="form-req">*</span></label>
          <select id="issueLicenseProvince" name="licenseProvince" class="form-input" required>
            ${plateOpts}
          </select>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueChassis">เลขตัวถัง</label>
          <input type="text" id="issueChassis" name="chassisNo" class="form-input">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueEngine">เลขเครื่องยนต์</label>
          <input type="text" id="issueEngine" name="engineNo" class="form-input">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueCarColor">สีรถ <span class="form-req">*</span></label>
          <select id="issueCarColor" name="carColor" class="form-input" required>${colorOpts}</select>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issuePrintCust">วิธีจัดส่งกรมธรรม์</label>
          <select id="issuePrintCust" name="print_cust" class="form-input">
            <option value="1" selected>คู่ค้าพิมพ์และจัดส่ง</option>
            <option value="2">BKI พิมพ์และจัดส่ง</option>
            <option value="3">BKI ส่ง e-Policy</option>
          </select>
        </div>
      </div>

      <div class="bki-issue__drivers" id="bkiIssueDrivers" hidden>
        <h4 class="bki-issue__sectionTitle">ผู้ขับขี่ (ระบุชื่อ สูงสุด 5 คน)</h4>
        <label class="bki-issue__consent">
          <input type="checkbox" id="consentDrv" name="consent_drv" value="Y">
          ยินยอมให้ตรวจสอบประวัติการขับขี่ (consent_drv)
        </label>
        ${this.buildDriverBlockHtml(1, { required: true })}
        ${this.buildDriverBlockHtml(2)}
        ${this.buildDriverBlockHtml(3)}
        <details class="bki-issue__moreDrivers">
          <summary>เพิ่มผู้ขับขี่คนที่ 4–5</summary>
          ${this.buildDriverBlockHtml(4)}
          ${this.buildDriverBlockHtml(5)}
        </details>
      </div>

      <div class="bki-issue__actions">
        <button type="button" class="axa-result__btn axa-result__btn--policy" id="btnBkiIssueSubmit">
          ยืนยันออกกรมธรรม์
        </button>
      </div>`;
  },

  buildResultHtml(form) {
    const variant = this.selectedVariant();
    const sum = form.querySelector('#sumInsured')?.value || variant?.sum_ins_min || 100000;
    const deduct = form.querySelector('#deduct')?.value || '0';
    const dash = '<span class="axa-cmp__dash">-</span>';
    const sel = (plan, field, html) =>
      `<select class="axa-cmp__select" data-plan="${plan}" data-field="${field}">${html}</select>`;

    return `
      <div class="axa-result__wrap">
        <table class="axa-cmp" aria-label="เปรียบเทียบแผนประกัน BKI">
          <thead>
            <tr>
              <th scope="col" class="axa-cmp__corner"></th>
              <th scope="col" class="axa-cmp__planHead is-selected" data-plan="2plus">
                <div class="axa-cmp__planName">ชั้น 2+</div>
                <div class="axa-cmp__planPrice" data-price-for="2plus">— บาท/ปี</div>
              </th>
              <th scope="col" class="axa-cmp__planHead" data-plan="3plus">
                <div class="axa-cmp__planName">ชั้น 3+</div>
                <div class="axa-cmp__planPrice" data-price-for="3plus">— บาท/ปี</div>
              </th>
              <th scope="col" class="axa-cmp__planHead" data-plan="3">
                <div class="axa-cmp__planName">ชั้น 3</div>
                <div class="axa-cmp__planPrice" data-price-for="3">— บาท/ปี</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="axa-cmp__section">
              <td colspan="4">ปรับเลือกรายละเอียดความคุ้มครอง</td>
            </tr>
            <tr>
              <th scope="row">ทุนประกันภัยรถยนต์ (เสียหายต่อรถยนต์)</th>
              <td>${sel('2plus', 'sumInsured', this.sumOptionsHtml(sum, variant))}</td>
              <td>${sel('3plus', 'sumInsured', this.sumOptionsHtml(sum, variant))}</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ทุนประกันภัยรถยนต์ (ภัยธรรมชาติ)</th>
              <td>${sel('2plus', 'natureSum', this.sumOptionsHtml(sum, variant))}</td>
              <td>${sel('3plus', 'natureSum', this.sumOptionsHtml(sum, variant))}</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ค่าเสียหายส่วนแรก (เสียหายต่อรถยนต์)</th>
              <td>${sel('2plus', 'deductible', this.deductibleOptionsHtml(deduct))}</td>
              <td>${sel('3plus', 'deductible', this.deductibleOptionsHtml(deduct))}</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ประเภทอู่ซ่อมรถ</th>
              <td>${sel('2plus', 'garageType', this.garageOptionsHtml('garage'))}</td>
              <td>${sel('3plus', 'garageType', this.garageOptionsHtml('garage'))}</td>
              <td>${dash}</td>
            </tr>

            <tr class="axa-cmp__section">
              <td colspan="4">ความคุ้มครองความเสียหายต่อรถยนต์</td>
            </tr>
            <tr>
              <th scope="row">ทุนประกันภัยรถยนต์ (เสียหายต่อรถยนต์)</th>
              <td data-display="2plus-sum">—</td>
              <td data-display="3plus-sum">—</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ทุนประกันภัยรถยนต์ (สูญหาย ไฟไหม้)</th>
              <td data-display="2plus-fire">—</td>
              <td data-display="3plus-fire">—</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ทุนประกันภัยรถยนต์ (ภัยธรรมชาติ)</th>
              <td data-display="2plus-nature">—</td>
              <td data-display="3plus-nature">—</td>
              <td>${dash}</td>
            </tr>

            <tr class="axa-cmp__section">
              <td colspan="4">ความรับผิดชอบต่อบุคคลภายนอก</td>
            </tr>
            <tr>
              <th scope="row">บาดเจ็บหรือเสียชีวิต ต่อคน</th>
              <td data-display="2plus-tp-person">—</td>
              <td data-display="3plus-tp-person">—</td>
              <td data-display="3-tp-person">—</td>
            </tr>
            <tr>
              <th scope="row">บาดเจ็บหรือเสียชีวิต ต่อครั้ง</th>
              <td data-display="2plus-tp-event">—</td>
              <td data-display="3plus-tp-event">—</td>
              <td data-display="3-tp-event">—</td>
            </tr>
            <tr>
              <th scope="row">ทรัพย์สิน ต่อครั้ง</th>
              <td data-display="2plus-tp-property">—</td>
              <td data-display="3plus-tp-property">—</td>
              <td data-display="3-tp-property">—</td>
            </tr>

            <tr class="axa-cmp__footer">
              <th scope="row">เพิ่ม พ.ร.บ. ประกันรถยนต์</th>
              <td>
                <label class="axa-cmp__prb">
                  <input type="checkbox" name="buyPrb_2plus" value="1">
                  <span>ซื้อ พ.ร.บ.</span>
                </label>
              </td>
              <td>
                <label class="axa-cmp__prb">
                  <input type="checkbox" name="buyPrb_3plus" value="1">
                  <span>ซื้อ พ.ร.บ.</span>
                </label>
              </td>
              <td>
                <label class="axa-cmp__prb">
                  <input type="checkbox" name="buyPrb_3" value="1">
                  <span>ซื้อ พ.ร.บ.</span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="bki-quote__result-note" id="bkiResultNote" hidden></p>
      <div class="axa-result__actions">
        <button type="button" class="axa-result__btn axa-result__btn--quote" id="btnBkiCreateQuote">
          สร้างใบเสนอราคา
        </button>
        <button type="button" class="axa-result__btn axa-result__btn--policy" id="btnBkiCreatePolicy">
          สร้างกรมธรรม์
        </button>
      </div>`;
  },

  readForm(form) {
    this.syncHiddenFromTable(form);
    this.syncZoneFromProvince(form);
    const fd = new FormData(form);
    const values = Object.fromEntries(fd.entries());
    values.zone_use = form.querySelector('#zoneUse')?.value || this.resolveZone(values.regProvince);
    const plan = this.getSelectedPlan(form.querySelector('#bkiQuoteResult')) || values.coverType || '3plus';
    const buyPrb = !!form.querySelector(`#bkiQuoteResult input[name="buyPrb_${plan}"]`)?.checked
      || !!form.querySelector(`input[name="buyPrb_${plan}"]`)?.checked;
    values.buyPrb = buyPrb;
    values.comp_req = buyPrb ? 'Y' : 'N';
    values.coverType = plan;
    return values;
  },

  syncZoneFromProvince(form) {
    const province = form.querySelector('#regProvince')?.value || '';
    const zoneEl = form.querySelector('#zoneUse');
    if (zoneEl) zoneEl.value = this.resolveZone(province);
  },

  syncHiddenFromTable(form) {
    const root = form.querySelector('#bkiQuoteResult');
    if (!root || root.hidden) return;
    const plan = this.getSelectedPlan(root) || '3plus';
    const sum = root.querySelector(`select[data-plan="${plan}"][data-field="sumInsured"]`)?.value;
    const deduct = root.querySelector(`select[data-plan="${plan}"][data-field="deductible"]`)?.value;
    const sumEl = form.querySelector('#sumInsured');
    const deductEl = form.querySelector('#deduct');
    if (sum != null && sumEl) sumEl.value = sum;
    if (deduct != null && deductEl) deductEl.value = deduct;
  },

  selectedVariant() {
    const form = document.getElementById('productKeyForm');
    const code = form?.querySelector('#makeCode')?.value || '';
    const year = form?.querySelector('#carYear')?.value || '';
    return this._variants.find((v) => v.make_code === code && v.car_year === year) || null;
  },

  pkgValue(pkg, keys) {
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) return null;
    for (const key of keys) {
      if (pkg[key] != null && pkg[key] !== '') return pkg[key];
    }
    const lowerMap = {};
    Object.keys(pkg).forEach((key) => {
      lowerMap[String(key).toLowerCase()] = pkg[key];
    });
    for (const key of keys) {
      const value = lowerMap[String(key).toLowerCase()];
      if (value != null && value !== '') return value;
    }
    return null;
  },

  getPackagePremium(pkg) {
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) return null;

    // Server-normalized canonical amount (preferred).
    const canonical = this.parsePremiumNumber(this.pkgValue(pkg, ['premium_total', 'premiumTotal']));
    if (canonical != null) return canonical;

    // Spec: total_prem_vol = final voluntary premium (includes stamp/vat).
    const totalKeys = [
      'total_prem_vol', 'TOTAL_PREM_VOL', 'totalPremVol', 'TotalPremVol',
      'gross_total_vol', 'GROSS_TOTAL_VOL', 'grossTotalVol', 'GrossTotalVol',
      'gross_total', 'GROSS_TOTAL', 'grossTotal', 'GrossTotal',
      'total_prem', 'TOTAL_PREM', 'totalPrem', 'TotalPrem',
      'total_premium', 'TOTAL_PREMIUM', 'totalPremium', 'TotalPremium',
      'premium_total', 'PREMIUM_TOTAL', 'premiumTotal'
    ];
    const totalRaw = this.pkgValue(pkg, totalKeys);
    if (totalRaw != null && totalRaw !== '') {
      const total = this.parsePremiumNumber(totalRaw);
      if (total != null) return total;
    }

    const stamp = this.parsePremiumNumber(this.pkgValue(pkg, [
      'stamp_vol', 'STAMP_VOL', 'stampVol', 'StampVol', 'stamp', 'STAMP'
    ]));
    const vat = this.parsePremiumNumber(this.pkgValue(pkg, [
      'vat_vol', 'VAT_VOL', 'vatVol', 'VatVol', 'vat', 'VAT'
    ]));
    const gross = this.parsePremiumNumber(this.pkgValue(pkg, [
      'gross_prem_vol', 'GROSS_PREM_VOL', 'grossPremVol', 'GrossPremVol',
      'net_premium', 'NET_PREMIUM', 'netPremium', 'NetPremium',
      'premium', 'PREMIUM', 'prem', 'PREM'
    ]));
    if (gross != null && (stamp != null || vat != null)) {
      return gross + (stamp || 0) + (vat || 0);
    }
    if (gross != null) return gross;

    return this.findPremiumInObject(pkg);
  },

  describePackagePremium(pkg) {
    if (!pkg || typeof pkg !== 'object') return 'no package';
    const keys = Object.keys(pkg);
    const pick = (name) => {
      const raw = this.pkgValue(pkg, [name]);
      return raw == null || raw === '' ? 'missing' : String(raw);
    };
    return [
      `keys=${keys.length}`,
      `premium_total=${pick('premium_total')}`,
      `total_prem_vol=${pick('total_prem_vol')}`,
      `gross_prem_vol=${pick('gross_prem_vol')}`,
      `stamp=${pick('stamp')}`,
      `vat=${pick('vat')}`,
      `status=${pick('status')}`,
      `remark=${pick('remark')}`
    ].join(', ');
  },

  parsePremiumNumber(value) {
    if (value == null || value === '') return null;
    const n = Number(String(value).replace(/,/g, ''));
    return Number.isNaN(n) || n <= 0 ? null : n;
  },

  findPremiumInObject(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 4) return null;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = this.findPremiumInObject(item, depth + 1);
        if (found != null) return found;
      }
      return null;
    }
    for (const [key, value] of Object.entries(obj)) {
      if (/prem|total|gross|net/i.test(key) && !/comp|compulsory|prb|sum|stamp|vat|tax/i.test(key)
        && (typeof value === 'string' || typeof value === 'number')) {
        const n = this.parsePremiumNumber(value);
        if (n != null) return n;
      }
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') {
        const found = this.findPremiumInObject(value, depth + 1);
        if (found != null) return found;
      }
    }
    return null;
  },

  getDisplayedPremium(root, plan) {
    const el = root?.querySelector(`[data-price-for="${plan}"]`);
    if (!el) return null;
    const text = el.textContent || '';
    if (text.includes('—')) return null;
    const m = text.replace(/,/g, '').match(/([\d.]+)/);
    if (!m) return null;
    return this.parsePremiumNumber(m[1]);
  },

  resolvePlanPremium(form, plan) {
    if (!plan) return null;
    const cached = this._premiumsByPlan?.[plan];
    if (cached != null) {
      const n = this.parsePremiumNumber(cached);
      if (n != null) return n;
    }

    const root = form.querySelector('#bkiQuoteResult');
    const packages = this.getPackagesByPlan(form);
    const stored = root?.dataset?.[`premium_${plan}`];
    if (stored) {
      const n = this.parsePremiumNumber(stored);
      if (n != null) return n;
    }

    const fromPkg = this.getPackagePremium(packages[plan]);
    if (fromPkg != null) return fromPkg;

    const fromDisplay = this.getDisplayedPremium(root, plan);
    if (fromDisplay != null) return fromDisplay;

    const premiumEl = form.querySelector('#productKeyPremium');
    const cover = form.querySelector('#coverType')?.value;
    if (premiumEl?.dataset?.premium && cover === plan) {
      const n = this.parsePremiumNumber(premiumEl.dataset.premium);
      if (n != null) return n;
    }

    return null;
  },

  /** Prefer preferred plan; otherwise first plan that has a resolvable premium. */
  resolvePlanWithPremium(form, preferredPlan) {
    const order = [preferredPlan, '3plus', '2plus', '3']
      .filter((plan, idx, arr) => plan && arr.indexOf(plan) === idx);
    for (const plan of order) {
      const premium = this.resolvePlanPremium(form, plan);
      if (premium != null) return { plan, premium };
    }
    return null;
  },

  plansWithPremium(form) {
    return ['2plus', '3plus', '3'].filter((plan) => this.resolvePlanPremium(form, plan) != null);
  },

  mapPackagesToPlans(packages) {
    const out = { '2plus': null, '3plus': null, '3': null };
    const assign = (plan, pkg) => {
      if (!plan || !pkg) return;
      const existing = out[plan];
      if (!existing) {
        out[plan] = pkg;
        return;
      }
      // Prefer the row that actually carries a readable premium.
      if (this.getPackagePremium(existing) == null && this.getPackagePremium(pkg) != null) {
        out[plan] = pkg;
      }
    };

    packages.forEach((pkg) => {
      assign(this.classifyPackagePlan(pkg), pkg);
    });

    const order = ['2plus', '3plus', '3'];
    let slot = 0;
    packages.forEach((pkg) => {
      if (Object.values(out).includes(pkg)) return;
      while (slot < order.length && out[order[slot]]) slot += 1;
      if (slot < order.length) {
        out[order[slot]] = pkg;
        slot += 1;
      }
    });

    return out;
  },

  classifyPackagePlan(pkg) {
    if (!pkg || typeof pkg !== 'object') return null;
    const name = String(this.pkgValue(pkg, [
      'packname', 'PACKNAME', 'package_name', 'PACKAGE_NAME', 'plan_name', 'PLAN_NAME'
    ]) || '');
    const planSeq = String(this.pkgValue(pkg, ['plan_seq', 'PLAN_SEQ']) || '').trim();
    const subPlan = String(this.pkgValue(pkg, ['sub_plan', 'SUB_PLAN']) || '').trim();
    const garage = String(this.pkgValue(pkg, ['garage', 'GARAGE']) || '');
    const text = `${name} ${garage}`.toUpperCase();

    if (/2\s*\+|2P\+|ชั้น\s*2\s*\+|TYPE\s*2\s*\+|CLASS\s*2\s*\+/i.test(text)) return '2plus';
    if (/3\s*\+|3P\+|ชั้น\s*3\s*\+|TYPE\s*3\s*\+|CLASS\s*3\s*\+/i.test(text)) return '3plus';
    if (/ชั้น\s*3(?!\s*\+)|TYPE\s*3(?!\s*\+)|CLASS\s*3(?!\s*\+)/i.test(text)) return '3';

    // BKI sample: plan_seq "2" + sub_plan "20" ≈ 2+
    if (subPlan === '20' || subPlan === '2+' || /^2\d$/.test(subPlan)) return '2plus';
    if (subPlan === '30' || subPlan === '3+' || /^3\d$/.test(subPlan)) return '3plus';
    if (subPlan === '3' || subPlan === '03' || subPlan === '01') return '3';

    if (planSeq === '2') return '2plus';
    if (planSeq === '3') return '3plus';
    if (planSeq === '4' || planSeq === '1') return planSeq === '1' ? '2plus' : '3';

    return null;
  },

  pickDefaultPlan(packagesByPlan) {
    const order = ['3plus', '2plus', '3'];
    for (const plan of order) {
      if (this.getPackagePremium(packagesByPlan?.[plan]) != null) return plan;
    }
    for (const plan of order) {
      if (packagesByPlan?.[plan]) return plan;
    }
    return '3plus';
  },

  applyVariantToForm(form, variant) {
    const sumEl = form.querySelector('#sumInsured');
    const subSelect = form.querySelector('#carSubmodel');

    if (!variant) {
      if (subSelect) {
        subSelect.innerHTML = '<option value="">โปรดเลือก</option>';
        subSelect.disabled = true;
      }
      form.querySelector('#cc').value = '';
      form.querySelector('#seat').value = '';
      form.querySelector('#carType').value = '';
      if (sumEl) sumEl.value = '';
      return;
    }

    const desc = this.formatCarDesc(
      variant.desc || `${variant.make || ''} ${variant.make_code || ''}`.trim()
    );
    if (subSelect) {
      subSelect.innerHTML = `<option value="${this.escapeAttr(desc)}" selected>${this.escapeHtml(desc)}</option>`;
      subSelect.disabled = false;
    }

    form.querySelector('#cc').value = variant.cc || '';
    form.querySelector('#seat').value = variant.seat || '';
    form.querySelector('#carType').value = variant.car_type || '';

    const min = Number(variant.sum_ins_min) || 0;
    if (sumEl && min > 0) sumEl.value = String(min);
  },

  syncCoverageEnd(form) {
    const startEl = form.querySelector('#coverageStart');
    const endEl = form.querySelector('#coverageEnd');
    if (startEl && endEl) {
      endEl.value = this.addOneYear(startEl.value);
    }
  },

  syncResultDisplays(form, packagesByPlan = null) {
    const root = form.querySelector('#bkiQuoteResult');
    if (!root) return;

    this.syncHiddenFromTable(form);
    const sum = Number(form.querySelector('#sumInsured')?.value || 0);
    const set = (key, val) => {
      const el = root.querySelector(`[data-display="${key}"]`);
      if (el) el.textContent = val == null || val === '' ? '—' : String(val);
    };

    ['2plus', '3plus'].forEach((plan) => {
      const pkg = packagesByPlan?.[plan];
      const planSum = Number(
        root.querySelector(`select[data-plan="${plan}"][data-field="sumInsured"]`)?.value || sum
      );
      const planNature = Number(
        root.querySelector(`select[data-plan="${plan}"][data-field="natureSum"]`)?.value || planSum
      );
      const own = this.pkgValue(pkg, [
        'sum_ins_own_damage', 'SUM_INS_OWN_DAMAGE', 'sum_ins', 'sum_insured', 'SUM_INS', 'own_damage'
      ]) ?? planSum;
      const fire = this.pkgValue(pkg, [
        'sum_ins_fire_theft', 'SUM_INS_FIRE_THEFT', 'fire_sum', 'sum_fire'
      ]) ?? own;
      const nature = this.pkgValue(pkg, [
        'natural_sum_ins', 'NATURAL_SUM_INS', 'nature_sum', 'sum_nature'
      ]) ?? (pkg?.att_sumins ? this.pkgValue(pkg.att_sumins, ['natural_sum_ins', 'NATURAL_SUM_INS']) : null) ?? planNature;
      const tpPerson = this.pkgValue(pkg, ['tpbi_per', 'TPBI_PER', 'tp_person', 'TP_PERSON', 'liab_person']);
      const tpEvent = this.pkgValue(pkg, ['tpbi_acc', 'TPBI_ACC', 'tp_event', 'TP_EVENT', 'liab_event']);
      const tpProperty = this.pkgValue(pkg, ['tppd', 'TPPD', 'tp_property', 'TP_PROPERTY', 'liab_property']);

      set(`${plan}-sum`, this.money(own));
      set(`${plan}-fire`, this.money(fire));
      set(`${plan}-nature`, this.money(nature));
      set(`${plan}-tp-person`, tpPerson != null ? this.money(tpPerson) : '—');
      set(`${plan}-tp-event`, tpEvent != null ? this.money(tpEvent) : '—');
      set(`${plan}-tp-property`, tpProperty != null ? this.money(tpProperty) : '—');
    });

    const pkg3 = packagesByPlan?.['3'];
    const tp3 = (keys) => this.pkgValue(pkg3, keys);
    set('3-tp-person', tp3(['tpbi_per', 'TPBI_PER', 'tp_person', 'TP_PERSON']) != null
      ? this.money(tp3(['tpbi_per', 'TPBI_PER', 'tp_person', 'TP_PERSON'])) : '—');
    set('3-tp-event', tp3(['tpbi_acc', 'TPBI_ACC', 'tp_event', 'TP_EVENT']) != null
      ? this.money(tp3(['tpbi_acc', 'TPBI_ACC', 'tp_event', 'TP_EVENT'])) : '—');
    set('3-tp-property', tp3(['tppd', 'TPPD', 'tp_property', 'TP_PROPERTY']) != null
      ? this.money(tp3(['tppd', 'TPPD', 'tp_property', 'TP_PROPERTY'])) : '—');
  },

  refreshResultPrices(form) {
    const root = form.querySelector('#bkiQuoteResult');
    if (!root || root.hidden) return;

    let packagesByPlan = this.getPackagesByPlan(form);
    this.syncResultDisplays(form, packagesByPlan);

    const premiums = {};
    ['2plus', '3plus', '3'].forEach((plan) => {
      const premium = this.getPackagePremium(packagesByPlan[plan]);
      if (premium != null) {
        premiums[plan] = premium;
        root.dataset[`premium_${plan}`] = String(premium);
      } else {
        delete root.dataset[`premium_${plan}`];
      }
      const el = root.querySelector(`[data-price-for="${plan}"]`);
      if (el) {
        el.textContent = premium == null
          ? '— บาท/ปี'
          : `${this.money(premium)} บาท/ปี`;
      }
    });
    this._premiumsByPlan = premiums;
  },

  getPackagesByPlan(form) {
    if (this._packagesByPlan && Object.keys(this._packagesByPlan).length) {
      return this._packagesByPlan;
    }
    const root = form?.querySelector('#bkiQuoteResult');
    if (!root) return {};
    try {
      return JSON.parse(root.dataset.packages || '{}');
    } catch {
      return {};
    }
  },

  rememberPackages(packagesByPlan) {
    const slim = {};
    Object.entries(packagesByPlan || {}).forEach(([plan, pkg]) => {
      slim[plan] = pkg ? this.slimPackage(pkg) : null;
    });
    this._packagesByPlan = slim;
    const premiums = {};
    ['2plus', '3plus', '3'].forEach((plan) => {
      const premium = this.getPackagePremium(this._packagesByPlan[plan]);
      if (premium != null) premiums[plan] = premium;
    });
    this._premiumsByPlan = premiums;
    return this._packagesByPlan;
  },

  slimPackage(pkg) {
    if (!pkg || typeof pkg !== 'object') return pkg;
    const out = { ...pkg };
    delete out.sumins_phase;
    delete out.ncb_phase;
    delete out.SUMINS_PHASE;
    delete out.NCB_PHASE;
    return out;
  },

  readCustomerForm(form) {
    const panel = form.querySelector('#bkiIssuePanel');
    if (!panel) return {};
    const fd = new FormData(panel);
    const values = Object.fromEntries(fd.entries());
    const idTypeEl = panel.querySelector('input[name="idType"]:checked');
    values.idType = idTypeEl?.value || 'idcard';
    values.consent_drv = panel.querySelector('#consentDrv')?.checked ? 'Y' : 'N';
    // Prefer Thai names for display fields while codes go in *Code fields.
    values.insuredProvince = panel.querySelector('#issueProvinceName')?.value
      || panel.querySelector('#issueProvince')?.selectedOptions?.[0]?.textContent?.trim()
      || values.insuredProvince
      || '';
    values.insuredDistrict = panel.querySelector('#issueDistrictName')?.value
      || panel.querySelector('#issueDistrict')?.selectedOptions?.[0]?.textContent?.trim()
      || values.insuredDistrict
      || '';
    values.insuredSubdistrict = panel.querySelector('#issueSubdistrictName')?.value
      || panel.querySelector('#issueSubdistrict')?.selectedOptions?.[0]?.textContent?.trim()
      || values.insuredSubdistrict
      || '';
    values.address = [values.homeNumber, values.moo ? `ม.${values.moo}` : '', values.soi, values.road]
      .filter(Boolean)
      .join(' ');
    return values;
  },

  validateCustomerForm(form) {
    const panel = form.querySelector('#bkiIssuePanel');
    if (!panel) return { ok: false, message: 'ไม่พบฟอร์มลูกค้า' };
    const required = panel.querySelectorAll('[required]');
    for (const el of required) {
      if (el.closest('#bkiIssueDrivers') && panel.querySelector('#bkiIssueDrivers')?.hidden) {
        continue;
      }
      if (!el.value || !String(el.value).trim()) {
        el.focus();
        return { ok: false, message: 'กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน' };
      }
    }
    const driverMode = form.querySelector('#driverMode')?.value || 'unnamed';
    if (driverMode === 'named') {
      const first = panel.querySelector('#driver1FirstName')?.value?.trim();
      const last = panel.querySelector('#driver1LastName')?.value?.trim();
      const id = panel.querySelector('#driver1Id')?.value?.trim();
      const dob = panel.querySelector('#driver1Dob')?.value?.trim();
      const license = panel.querySelector('#driver1License')?.value?.trim();
      if (!first || !last || !id || !dob || !license) {
        return { ok: false, message: 'กรุณากรอกข้อมูลผู้ขับขี่คนที่ 1 ให้ครบ (ชื่อ, บัตร, วันเกิด, ใบขับขี่)' };
      }
    }
    return { ok: true };
  },

  buildDrivers(form) {
    const panel = form.querySelector('#bkiIssuePanel');
    const driverMode = form.querySelector('#driverMode')?.value || 'unnamed';
    if (driverMode !== 'named' || !panel) return [];
    const drivers = [];
    for (let n = 1; n <= 5; n += 1) {
      const firstName = panel.querySelector(`#driver${n}FirstName`)?.value?.trim() || '';
      const lastName = panel.querySelector(`#driver${n}LastName`)?.value?.trim() || '';
      if (!firstName && !lastName) continue;
      drivers.push({
        title: panel.querySelector(`#driver${n}Title`)?.value?.trim() || '',
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        idNumber: panel.querySelector(`#driver${n}Id`)?.value?.trim() || '',
        dob: panel.querySelector(`#driver${n}Dob`)?.value?.trim() || '',
        licenseNo: panel.querySelector(`#driver${n}License`)?.value?.trim() || '',
        licenseType: panel.querySelector(`#driver${n}LicenseType`)?.value?.trim() || '02',
        licenseExpire: panel.querySelector(`#driver${n}LicenseExpire`)?.value?.trim() || ''
      });
    }
    return drivers;
  },

  async ensureLookups() {
    if (this._lookups) return this._lookups;
    try {
      this._lookups = await App.MotorBkiService.getLookups();
    } catch (err) {
      console.warn('[bki] lookup load failed', err);
      this._lookups = {
        titles: this.CUSTOMER_TITLES.map((t) => ({ value: t, label: t })),
        colors: this.CAR_COLORS,
        occupations: [],
        license_types: [],
        provinces: [],
        provinces_plate: this.PROVINCES.map((p) => ({ value: p, label: p }))
      };
    }
    return this._lookups;
  },

  async initIssueGeo(form) {
    const panel = form.querySelector('#bkiIssuePanel');
    if (!panel) return;

    const provinceEl = panel.querySelector('#issueProvince');
    const districtEl = panel.querySelector('#issueDistrict');
    const subEl = panel.querySelector('#issueSubdistrict');
    const postalEl = panel.querySelector('#issuePostal');
    const provNameEl = panel.querySelector('#issueProvinceName');
    const distNameEl = panel.querySelector('#issueDistrictName');
    const subNameEl = panel.querySelector('#issueSubdistrictName');
    if (!provinceEl || !districtEl || !subEl) return;
    if (panel.dataset.geoBound === '1') return;
    panel.dataset.geoBound = '1';

    const syncSelectedName = (selectEl, hiddenEl) => {
      if (!selectEl || !hiddenEl) return;
      hiddenEl.value = selectEl.selectedOptions?.[0]?.textContent?.trim() || '';
    };

    const loadAmphurs = async (provinceCode) => {
      districtEl.innerHTML = '<option value="">กำลังโหลด...</option>';
      districtEl.disabled = true;
      subEl.innerHTML = '<option value="">เลือกอำเภอก่อน</option>';
      subEl.disabled = true;
      if (postalEl) postalEl.value = '';
      syncSelectedName(provinceEl, provNameEl);
      if (!provinceCode) {
        districtEl.innerHTML = '<option value="">เลือกจังหวัดก่อน</option>';
        return;
      }
      try {
        const data = await App.MotorBkiService.getAmphurs(provinceCode);
        const items = data.items || [];
        districtEl.innerHTML = this.optionsHtml(items, { placeholder: 'โปรดเลือก' });
        districtEl.disabled = false;
      } catch (err) {
        districtEl.innerHTML = '<option value="">โหลดอำเภอไม่สำเร็จ</option>';
        console.warn(err);
      }
    };

    const loadTambols = async (provinceCode, amphurCode) => {
      subEl.innerHTML = '<option value="">กำลังโหลด...</option>';
      subEl.disabled = true;
      if (postalEl) postalEl.value = '';
      syncSelectedName(districtEl, distNameEl);
      if (!provinceCode || !amphurCode) {
        subEl.innerHTML = '<option value="">เลือกอำเภอก่อน</option>';
        return;
      }
      try {
        const data = await App.MotorBkiService.getTambols(provinceCode, amphurCode);
        const items = data.items || [];
        panel._tambols = items;
        subEl.innerHTML = this.optionsHtml(items, { placeholder: 'โปรดเลือก' });
        subEl.disabled = false;
      } catch (err) {
        subEl.innerHTML = '<option value="">โหลดตำบลไม่สำเร็จ</option>';
        console.warn(err);
      }
    };

    provinceEl.addEventListener('change', () => {
      loadAmphurs(provinceEl.value).catch(() => {});
    });
    districtEl.addEventListener('change', () => {
      loadTambols(provinceEl.value, districtEl.value).catch(() => {});
    });
    subEl.addEventListener('change', () => {
      syncSelectedName(subEl, subNameEl);
      const item = (panel._tambols || []).find((t) => String(t.value) === String(subEl.value));
      if (item?.zipcode && postalEl) postalEl.value = String(item.zipcode);
    });

    // Prefer matching registration province from quote form.
    const regProvince = form.querySelector('#regProvince')?.value || '';
    if (regProvince && provinceEl.options.length) {
      const match = [...provinceEl.options].find((o) =>
        o.textContent.includes(regProvince.replace('กรุงเทพมหานคร', 'กทม'))
        || (regProvince.includes('กรุงเทพ') && o.textContent.includes('กทม'))
      );
      if (match) {
        provinceEl.value = match.value;
        await loadAmphurs(match.value);
      }
    }
  },

  hidePanel(panel) {
    if (!panel) return;
    panel.hidden = true;
    panel.innerHTML = '';
    delete panel.dataset.plan;
    delete panel.dataset.premium;
  },

  collectQuoteSnapshot(form, plan) {
    this.refreshResultPrices(form);
    const root = form.querySelector('#bkiQuoteResult');
    const packages = this.getPackagesByPlan(form);
    const pkg = packages[plan] || {};
    const user = App.Session?.getUser?.();
    const company = App.Config?.COMPANY || {};
    const makeEl = form.querySelector('#make');
    const codeEl = form.querySelector('#makeCode');
    const yearEl = form.querySelector('#carYear');
    const subEl = form.querySelector('#carSubmodel');
    const make = this.optionLabel(makeEl);
    const model = this.optionLabel(codeEl);
    const year = yearEl?.value || '';
    const submodel = this.optionLabel(subEl);
    const desc = [make, submodel || model, year ? `ปี ${year}` : ''].filter(Boolean).join(' ');
    const sumEl = root?.querySelector(`select[data-plan="${plan}"][data-field="sumInsured"]`);
    const natureEl = root?.querySelector(`select[data-plan="${plan}"][data-field="natureSum"]`);
    const deductEl = root?.querySelector(`select[data-plan="${plan}"][data-field="deductible"]`);
    const garageEl = root?.querySelector(`select[data-plan="${plan}"][data-field="garageType"]`);
    const display = (key) => root?.querySelector(`[data-display="${key}"]`)?.textContent?.trim() || '—';
    const premium = this.resolvePlanPremium(form, plan);
    const driverMode = form.querySelector('#driverMode')?.value || 'unnamed';

    return {
      company,
      agent: {
        code: user?.agentCode || user?.username || '',
        name: user?.name || '',
        label: this.agentLabel(user)
      },
      plan,
      planLabel: this.planLabel(plan),
      premium,
      breakdown: {
        net: this.parsePremiumNumber(this.pkgValue(pkg, ['gross_prem_vol', 'GROSS_PREM_VOL'])),
        stamp: this.parsePremiumNumber(this.pkgValue(pkg, ['stamp_vol', 'STAMP_VOL', 'stamp'])),
        vat: this.parsePremiumNumber(this.pkgValue(pkg, ['vat_vol', 'VAT_VOL', 'vat'])),
        total: premium
      },
      buyPrb: !!root?.querySelector(`input[name="buyPrb_${plan}"]`)?.checked,
      driverMode,
      driverLabel: driverMode === 'named' ? 'ระบุชื่อผู้ขับขี่' : 'ไม่ระบุชื่อผู้ขับขี่ (Unnamed)',
      coverageStart: form.querySelector('#coverageStart')?.value || '',
      coverageEnd: form.querySelector('#coverageEnd')?.value || '',
      vehicle: {
        make,
        model,
        makeCode: codeEl?.value || '',
        year,
        submodel,
        desc,
        cc: form.querySelector('#cc')?.value || '',
        seat: form.querySelector('#seat')?.value || '',
        regType: this.optionLabel(form.querySelector('#regType')),
        usage: this.optionLabel(form.querySelector('#usageType')),
        province: this.optionLabel(form.querySelector('#regProvince')),
        dashcam: this.optionLabel(form.querySelector('#dashcam')),
        sumInsured: this.optionLabel(sumEl),
        natureSum: this.optionLabel(natureEl),
        deductible: this.optionLabel(deductEl),
        garage: this.optionLabel(garageEl)
      },
      coverage: {
        ownDamage: display(`${plan}-sum`),
        fire: display(`${plan}-fire`),
        nature: display(`${plan}-nature`),
        tpPerson: display(`${plan}-tp-person`),
        tpEvent: display(`${plan}-tp-event`),
        tpProperty: display(`${plan}-tp-property`)
      }
    };
  },

  buildQuoteFormHtml({ planLabel, premiumText } = {}) {
    return `
      <div class="bki-issue__head">
        <div>
          <h3 class="bki-issue__title">สร้างใบเสนอราคา</h3>
          <p class="bki-issue__sub">แผน <strong>${this.escapeHtml(planLabel || '—')}</strong> · เบี้ย <strong>${this.escapeHtml(premiumText || '—')}</strong> · ไม่ตัดวงเงิน</p>
        </div>
        <button type="button" class="bki-issue__back" id="btnBkiQuoteBack">กลับไปตารางเปรียบเทียบ</button>
      </div>
      <div class="bki-issue__grid">
        <div class="form-field bki-issue__field">
          <label for="quoteCustomerName">ชื่อลูกค้า <span class="form-req">*</span></label>
          <input type="text" id="quoteCustomerName" name="quoteCustomerName" class="form-input" required autocomplete="name">
        </div>
        <div class="form-field bki-issue__field">
          <label for="quoteCustomerPhone">เบอร์โทร</label>
          <input type="tel" id="quoteCustomerPhone" name="quoteCustomerPhone" class="form-input" autocomplete="tel">
        </div>
        <div class="form-field bki-issue__field">
          <label for="quotePlate">ทะเบียนรถ</label>
          <input type="text" id="quotePlate" name="quotePlate" class="form-input" placeholder="กก 1234">
        </div>
        <div class="form-field bki-issue__field">
          <label for="quoteNote">หมายเหตุ</label>
          <input type="text" id="quoteNote" name="quoteNote" class="form-input" maxlength="200">
        </div>
      </div>
      <div class="bki-issue__actions">
        <button type="button" class="axa-result__btn axa-result__btn--quote" id="btnBkiQuoteSubmit">
          ยืนยันสร้างใบเสนอราคา
        </button>
      </div>`;
  },

  buildQuoteDocHtml(quote) {
    const snap = quote.snapshot || {};
    const vehicle = snap.vehicle || {};
    const coverage = snap.coverage || {};
    const company = snap.company || App.Config?.COMPANY || {};
    const agentLabel = snap.agent?.label || this.agentLabel(App.Session?.getUser?.());
    const planLabel = quote.planLabel || snap.planLabel || this.planLabel(quote.planCode);
    const premium = quote.premiumTotal ?? quote.premium ?? snap.premium;
    const breakdown = snap.breakdown || {};
    const logoKladee = this.absAsset('images/logo-kladee-icon.png');
    const logoBki = this.absAsset('images/partners/bangkok-insurance.jpg');
    const coverageRows = [
      ['ทุนประกันภัยรถยนต์ (เสียหายต่อรถยนต์)', coverage.ownDamage || vehicle.sumInsured || '—'],
      ['สูญหาย / ไฟไหม้', coverage.fire || '—'],
      ['ภัยธรรมชาติ', coverage.nature || vehicle.natureSum || '—'],
      ['บุคคลภายนอก บาดเจ็บ/เสียชีวิต ต่อคน', coverage.tpPerson || '—'],
      ['บุคคลภายนอก บาดเจ็บ/เสียชีวิต ต่อครั้ง', coverage.tpEvent || '—'],
      ['ทรัพย์สินบุคคลภายนอก ต่อครั้ง', coverage.tpProperty || '—'],
      ['ค่าเสียหายส่วนแรก', vehicle.deductible || '—'],
      ['ประเภทอู่ซ่อม', vehicle.garage || '—'],
      ['ผู้ขับขี่', snap.driverLabel || '—'],
      ['ซื้อ พ.ร.บ.', snap.buyPrb ? 'รวมเสนอซื้อ พ.ร.บ.' : 'ไม่รวม พ.ร.บ.']
    ];
    const extraPrem = [];
    if (breakdown.net != null) extraPrem.push(`เบี้ยสุทธิ ${this.money(breakdown.net)}`);
    if (breakdown.stamp != null) extraPrem.push(`อากร ${this.money(breakdown.stamp)}`);
    if (breakdown.vat != null) extraPrem.push(`VAT ${this.money(breakdown.vat)}`);

    return `
      <article class="bki-quote-doc">
        <header class="bki-quote-doc__head">
          <div class="bki-quote-doc__brand">
            <img src="${this.escapeAttr(logoKladee)}" alt="KLADEE BROKER" class="bki-quote-doc__logo">
            <div>
              <p class="bki-quote-doc__company">${this.escapeHtml(company.name || 'KLADEE BROKER')}</p>
              <p class="bki-quote-doc__addr">${this.escapeHtml(company.address || '')}</p>
            </div>
          </div>
          <div class="bki-quote-doc__insurer">
            <img src="${this.escapeAttr(logoBki)}" alt="BKI" class="bki-quote-doc__bki">
            <p>BKI กรุงเทพประกันภัย</p>
          </div>
        </header>
        <h1 class="bki-quote-doc__title">ใบเสนอราคาประกันภัยรถยนต์ภาคสมัครใจ</h1>
        <dl class="bki-quote-doc__meta">
          <div><dt>เลขที่</dt><dd>${this.escapeHtml(quote.id || '—')}</dd></div>
          <div><dt>วันที่ออก</dt><dd>${this.escapeHtml(this.formatThaiDate(quote.createdAt))}</dd></div>
          <div><dt>มีผลถึง</dt><dd>${this.escapeHtml(this.formatThaiDate(quote.validUntil))}</dd></div>
        </dl>
        <section class="bki-quote-doc__grid">
          <div>
            <h2>ข้อมูลลูกค้า / นายหน้า</h2>
            <p>ลูกค้า: <strong>${this.escapeHtml(quote.customerName || '—')}</strong></p>
            <p>โทร: ${this.escapeHtml(quote.customerPhone || '—')}</p>
            <p>นายหน้า: ${this.escapeHtml(agentLabel)}</p>
          </div>
          <div>
            <h2>รถยนต์</h2>
            <p><strong>${this.escapeHtml(vehicle.desc || quote.vehicleDesc || '—')}</strong></p>
            <p>ทะเบียน: ${this.escapeHtml(quote.plate || quote.licensePlate || '—')}</p>
            <p>จดทะเบียน: ${this.escapeHtml(vehicle.province || '—')} · ${this.escapeHtml(vehicle.regType || '—')}</p>
            <p>${this.escapeHtml(vehicle.usage || '')}${vehicle.dashcam ? ` · กล้อง: ${this.escapeHtml(vehicle.dashcam)}` : ''}</p>
          </div>
        </section>
        <p class="bki-quote-doc__plan">แผน ${this.escapeHtml(planLabel)} · ความคุ้มครอง ${this.escapeHtml(this.formatThaiDate(quote.coverageStart || snap.coverageStart))} – ${this.escapeHtml(this.formatThaiDate(quote.coverageEnd || snap.coverageEnd))}</p>
        <table class="bki-quote-doc__table">
          <tbody>${coverageRows.map(([label, value]) =>
            `<tr><th>${this.escapeHtml(label)}</th><td>${this.escapeHtml(value)}</td></tr>`
          ).join('')}</tbody>
        </table>
        <div class="bki-quote-doc__premium">
          <span>เบี้ยประกันภัยรวม (โดยประมาณ)</span>
          <strong>${this.money(premium)} บาท/ปี</strong>
          ${extraPrem.length ? `<small>${this.escapeHtml(extraPrem.join(' · '))}</small>` : ''}
        </div>
        ${quote.note ? `<p class="bki-quote-doc__note">หมายเหตุ: ${this.escapeHtml(quote.note)}</p>` : ''}
        <p class="bki-quote-doc__foot">เอกสารนี้เป็นใบเสนอราคาของนายหน้า ไม่ใช่กรมธรรม์ ราคาและเงื่อนไขอาจเปลี่ยนแปลงตามหลักเกณฑ์ของบริษัทประกันภัย จนกว่าจะออกกรมธรรม์สำเร็จ ใบเสนอราคามีผล 15 วันนับจากวันที่ออก</p>
      </article>`;
  },

  quotePrintCss() {
    return `
      @page { size: A4; margin: 14mm 12mm; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #fff; color: #0f172a; font-family: 'Sarabun', 'TH Sarabun New', sans-serif; }
      .bki-quote-doc { max-width: 190mm; margin: 0 auto; color: #0f172a; }
      .bki-quote-doc__head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 10px; }
      .bki-quote-doc__brand { display: flex; gap: 10px; align-items: center; }
      .bki-quote-doc__logo { width: 48px; height: 48px; object-fit: contain; }
      .bki-quote-doc__bki { width: 72px; height: 36px; object-fit: contain; }
      .bki-quote-doc__company { margin: 0; font-size: 16px; font-weight: 700; }
      .bki-quote-doc__addr { margin: 2px 0 0; font-size: 12px; color: #475569; }
      .bki-quote-doc__insurer { text-align: right; font-size: 12px; font-weight: 600; color: #0f766e; }
      .bki-quote-doc__insurer p { margin: 4px 0 0; }
      .bki-quote-doc__title { margin: 14px 0 10px; font-size: 20px; text-align: center; }
      .bki-quote-doc__meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 14px; }
      .bki-quote-doc__meta div { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; }
      .bki-quote-doc__meta dt { margin: 0; font-size: 11px; color: #64748b; }
      .bki-quote-doc__meta dd { margin: 2px 0 0; font-weight: 700; font-size: 14px; }
      .bki-quote-doc__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
      .bki-quote-doc__grid h2 { margin: 0 0 6px; font-size: 13px; color: #0f766e; }
      .bki-quote-doc__grid p { margin: 0 0 4px; font-size: 13px; }
      .bki-quote-doc__plan { margin: 0 0 10px; font-weight: 700; font-size: 14px; }
      .bki-quote-doc__table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .bki-quote-doc__table th, .bki-quote-doc__table td { border: 1px solid #cbd5e1; padding: 7px 10px; }
      .bki-quote-doc__table th { text-align: left; font-weight: 600; width: 62%; background: #f8fafc; }
      .bki-quote-doc__premium { margin-top: 14px; padding: 12px 14px; background: #f0fdfa; border: 1px solid #99f6e4; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
      .bki-quote-doc__premium span { font-size: 13px; }
      .bki-quote-doc__premium strong { font-size: 22px; color: #0f766e; }
      .bki-quote-doc__premium small { font-size: 12px; color: #475569; }
      .bki-quote-doc__note, .bki-quote-doc__foot { font-size: 12px; color: #475569; margin: 12px 0 0; }
      @media print { .bki-quote-doc__premium { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `;
  },

  printQuoteDoc(quote) {
    const html = this.buildQuoteDocHtml(quote);
    const win = window.open('', '_blank', 'noopener,width=900,height=1200');
    if (!win) return false;
    win.document.open();
    win.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>${this.escapeHtml(quote.id || 'ใบเสนอราคา')}</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap">
      <style>${this.quotePrintCss()}</style></head>
      <body class="bki-quote-print">${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      try { win.print(); } catch (_) { /* ignore */ }
    }, 250);
    return true;
  },

  showQuoteSuccess(form, quote, { toast } = {}) {
    const panel = form.querySelector('#bkiQuotePanel');
    const resultHost = form.querySelector('#bkiQuoteResult');
    if (!panel) return;
    panel.hidden = false;
    panel.dataset.quoteId = quote.id || '';
    panel.innerHTML = `
      <div class="bki-quote-panel__toolbar">
        <div>
          <h3 class="bki-issue__title">สร้างใบเสนอราคาแล้ว</h3>
          <p class="bki-issue__sub">เลขที่ <strong>${this.escapeHtml(quote.id || '—')}</strong> · มีผลถึง ${this.escapeHtml(this.formatThaiDate(quote.validUntil))}</p>
        </div>
        <div class="bki-quote-panel__actions">
          <button type="button" class="bki-issue__back" id="btnBkiQuoteBack">ปิด</button>
          <button type="button" class="axa-result__btn axa-result__btn--quote" id="btnBkiQuotePrint">พิมพ์ใบเสนอราคา</button>
        </div>
      </div>
      ${this.buildQuoteDocHtml(quote)}`;
    panel.querySelector('#btnBkiQuoteBack')?.addEventListener('click', () => {
      this.hidePanel(panel);
      resultHost?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    panel.querySelector('#btnBkiQuotePrint')?.addEventListener('click', () => {
      if (!this.printQuoteDoc(quote)) {
        toast?.('กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์ใบเสนอราคา', 'error');
      }
    });
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  async showQuotePanel(form, { plan, toast } = {}) {
    const resultHost = form.querySelector('#bkiQuoteResult');
    const panel = form.querySelector('#bkiQuotePanel');
    if (!resultHost || !panel) return;

    const picked = this.resolvePlanWithPremium(form, plan);
    if (!picked) {
      toast?.(
        this.plansWithPremium(form).length
          ? 'ไม่พบเบี้ยในแผนที่เลือก — คลิกหัวคอลัมน์แผนที่มีราคา หรือกดตรวจสอบราคาอีกครั้ง'
          : 'กรุณาตรวจสอบราคาให้มีเบี้ยก่อนสร้างใบเสนอราคา',
        'error'
      );
      return;
    }

    if (picked.plan !== plan) {
      this.setSelectedPlan(resultHost, picked.plan);
      toast?.(`ใช้แผน ${this.planLabel(picked.plan)} เพราะแผนที่เลือกยังไม่มีเบี้ย`, 'success');
    }

    plan = picked.plan;
    const premium = picked.premium;

    this.hidePanel(form.querySelector('#bkiIssuePanel'));
    panel.innerHTML = this.buildQuoteFormHtml({
      planLabel: this.planLabel(plan),
      premiumText: `${this.money(premium)} บาท/ปี`
    });
    panel.hidden = false;
    panel.dataset.plan = plan;
    panel.dataset.premium = String(premium);

    panel.querySelector('#btnBkiQuoteBack')?.addEventListener('click', () => {
      this.hidePanel(panel);
      resultHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    panel.querySelector('#btnBkiQuoteSubmit')?.addEventListener('click', () => {
      this.submitCreateQuote(form, { toast });
    });
    panel.querySelector('#quoteCustomerName')?.focus();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  async submitCreateQuote(form, { toast } = {}) {
    const panel = form.querySelector('#bkiQuotePanel');
    const preferred = panel?.dataset?.plan || this.getSelectedPlan(form.querySelector('#bkiQuoteResult'));
    const picked = this.resolvePlanWithPremium(form, preferred);
    const plan = picked?.plan || preferred;
    const premium = Number(panel?.dataset?.premium || picked?.premium || 0);
    if (!plan || !(premium > 0)) {
      toast?.('กรุณาตรวจสอบราคาให้มีเบี้ยก่อนสร้างใบเสนอราคา', 'error');
      return;
    }

    const customerName = panel.querySelector('#quoteCustomerName')?.value?.trim() || '';
    const customerPhone = panel.querySelector('#quoteCustomerPhone')?.value?.trim() || '';
    const plate = panel.querySelector('#quotePlate')?.value?.trim() || '';
    const note = panel.querySelector('#quoteNote')?.value?.trim() || '';
    if (!customerName) {
      toast?.('กรุณากรอกชื่อลูกค้า', 'error');
      panel.querySelector('#quoteCustomerName')?.focus();
      return;
    }
    if (customerPhone && !/^0\d{8,9}$/.test(customerPhone.replace(/[-\s]/g, ''))) {
      toast?.('เบอร์โทรไม่ถูกต้อง', 'error');
      panel.querySelector('#quoteCustomerPhone')?.focus();
      return;
    }

    const snapshot = this.collectQuoteSnapshot(form, plan);
    const payload = {
      customerName,
      customerPhone: customerPhone.replace(/[-\s]/g, ''),
      licensePlate: plate,
      note,
      planCode: plan,
      planLabel: this.planLabel(plan),
      premiumTotal: premium,
      coverageStart: snapshot.coverageStart,
      coverageEnd: snapshot.coverageEnd,
      vehicleDesc: snapshot.vehicle?.desc || '',
      insurer: 'BKI กรุงเทพ',
      insurerCode: 'bki',
      productId: 'voluntary-bki',
      productName: '2+ / 3+',
      snapshot
    };

    const btn = panel.querySelector('#btnBkiQuoteSubmit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'กำลังบันทึก...';
    }

    try {
      const result = await App.MotorBkiService.createQuote(payload);
      const quote = result.quote || result;
      if (!result?.ok && !quote?.id) {
        toast?.(result?.message || 'บันทึกใบเสนอราคาไม่สำเร็จ', 'error');
        return;
      }
      toast?.(`สร้างใบเสนอราคา ${quote.id} แล้ว`);
      this.showQuoteSuccess(form, quote, { toast });
    } catch (err) {
      toast?.(err?.message || 'บันทึกใบเสนอราคาไม่สำเร็จ', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'ยืนยันสร้างใบเสนอราคา';
      }
    }
  },

  async showIssuePanel(form, { plan, toast } = {}) {
    const resultHost = form.querySelector('#bkiQuoteResult');
    const panel = form.querySelector('#bkiIssuePanel');
    if (!resultHost || !panel) return;

    await this.ensureLookups();

    const packages = this.getPackagesByPlan(form);
    const picked = this.resolvePlanWithPremium(form, plan);
    if (!picked) {
      toast?.(
        this.plansWithPremium(form).length || Object.values(packages).some(Boolean)
          ? 'ไม่พบเบี้ยในแผนที่เลือก — คลิกหัวคอลัมน์แผนที่มีราคา หรือกดตรวจสอบราคาอีกครั้ง'
          : 'กรุณาตรวจสอบราคาและเลือกแผนที่มีเบี้ยก่อนสร้างกรมธรรม์',
        'error'
      );
      return;
    }

    if (picked.plan !== plan) {
      this.setSelectedPlan(resultHost, picked.plan);
      toast?.(`ใช้แผน ${this.planLabel(picked.plan)} เพราะแผนที่เลือกยังไม่มีเบี้ย`, 'success');
    }

    plan = picked.plan;
    const premium = picked.premium;

    this.hidePanel(form.querySelector('#bkiQuotePanel'));

    const planLabel = this.planLabel(plan);
    const premiumText = `${this.money(premium)} บาท/ปี`;
    panel.dataset.geoBound = '';
    panel.innerHTML = this.buildIssuePanelHtml({ planLabel, premiumText });
    panel.hidden = false;
    panel.dataset.plan = plan;
    panel.dataset.premium = String(premium);
    panel.dataset.packagePlan = packages[plan] ? plan : (packages['3plus'] ? '3plus' : plan);

    const licenseProvince = form.querySelector('#regProvince')?.value || 'กรุงเทพมหานคร';
    const licenseEl = panel.querySelector('#issueLicenseProvince');
    if (licenseEl && licenseProvince) {
      const match = [...licenseEl.options].find((o) =>
        o.value === licenseProvince || o.textContent.includes(licenseProvince.replace('กรุงเทพมหานคร', 'กทม'))
      );
      if (match) licenseEl.value = match.value;
    }

    const driverMode = form.querySelector('#driverMode')?.value || 'unnamed';
    const driversBlock = panel.querySelector('#bkiIssueDrivers');
    if (driversBlock) driversBlock.hidden = driverMode !== 'named';

    panel.querySelector('#btnBkiIssueBack')?.addEventListener('click', () => {
      this.hidePanel(panel);
      resultHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    panel.querySelector('#btnBkiIssueSubmit')?.addEventListener('click', () => {
      this.submitIssuePolicy(form, { toast });
    });

    this.initIssueGeo(form).catch(() => {});
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  updateBalanceDisplay(balance) {
    if (balance == null) return;
    const el = document.getElementById('balanceAmount');
    if (el) {
      el.textContent = Number(balance).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    if (window.refreshBalance) window.refreshBalance();
  },

  async submitIssuePolicy(form, { toast } = {}) {
    const panel = form.querySelector('#bkiIssuePanel');
    const valid = this.validateCustomerForm(form);
    if (!valid.ok) {
      toast?.(valid.message, 'error');
      return;
    }

    const plan = panel?.dataset?.plan || this.getSelectedPlan(form.querySelector('#bkiQuoteResult'));
    const packages = this.getPackagesByPlan(form);
    const pkgPlan = panel?.dataset?.packagePlan || plan;
    const pkg = packages[pkgPlan] || packages[plan] || {};
    const premium = Number(panel?.dataset?.premium || this.resolvePlanPremium(form, plan) || 0);
    const quote = this.readForm(form);
    const customer = this.readCustomerForm(form);
    const buyPrb = !!form.querySelector(`#bkiQuoteResult input[name="buyPrb_${plan}"]`)?.checked;

    const payload = {
      ...quote,
      coverType: plan,
      selected_plan: plan,
      package: pkg || {},
      premiumTotal: premium,
      buyPrb,
      comp_req: buyPrb ? 'Y' : 'N',
      consent_drv: customer.consent_drv || 'N',
      driverMode: form.querySelector('#driverMode')?.value || 'unnamed',
      customer,
      drivers: this.buildDrivers(form)
    };

    const btn = panel?.querySelector('#btnBkiIssueSubmit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'กำลังออกกรมธรรม์...';
    }

    try {
      const result = await App.MotorBkiService.issuePolicy(payload);
      if (!result?.ok) {
        toast?.(result?.message || result?.parsed?.status_message || 'ออกกรมธรรม์ไม่สำเร็จ', 'error');
        return;
      }

      const policy = result.policy || {};
      const parsed = result.parsed || {};
      const links = result.links || {};
      const policyNo = policy.bkiPolicyNo || parsed.policy_no || policy.id || '';
      const linkPolicy = links.policy || parsed.link_policy || '';
      const compNo = parsed.comp_policy_no || '';
      const linkComp = links.compPolicy || parsed.link_comp_policy || '';
      toast?.(`ออกกรมธรรม์สำเร็จ ${policyNo}`.trim());
      this.updateBalanceDisplay(result.balance);

      const printBtns = [
        linkPolicy
          ? `<a class="axa-result__btn axa-result__btn--policy" href="${this.escapeAttr(linkPolicy)}" target="_blank" rel="noopener">พิมพ์กรมธรรม์ภาคสมัครใจ</a>`
          : '',
        linkComp
          ? `<a class="axa-result__btn axa-result__btn--quote" href="${this.escapeAttr(linkComp)}" target="_blank" rel="noopener">พิมพ์ พ.ร.บ.</a>`
          : ''
      ].filter(Boolean).join('');

      panel.innerHTML = `
        <div class="bki-issue__success">
          <h3 class="bki-issue__title">ออกกรมธรรม์สำเร็จ</h3>
          <p>เลขที่ระบบ: <strong>${this.escapeHtml(policy.id || '—')}</strong></p>
          ${policyNo ? `<p>เลขกรมธรรม์ BKI: <strong>${this.escapeHtml(policyNo)}</strong></p>` : ''}
          ${compNo ? `<p>เลข พ.ร.บ.: <strong>${this.escapeHtml(compNo)}</strong></p>` : ''}
          <p>ทะเบียน: <strong>${this.escapeHtml(policy.plate || customer.licensePlate || '—')}</strong></p>
          <p>เบี้ย: <strong>${this.money(policy.premium || premium)} บาท</strong></p>
          ${printBtns ? `<div class="bki-issue__printActions">${printBtns}</div>` : '<p class="bki-issue__printHint">ยังไม่มีลิงก์พิมพ์จาก BKI — ใช้เลขกรมธรรม์ด้านบนติดตามกับบริษัท</p>'}
        </div>`;
    } catch (err) {
      toast?.(err?.message || 'ออกกรมธรรม์ไม่สำเร็จ', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'ยืนยันออกกรมธรรม์';
      }
    }
  },

  showResult(form, { toast, result, errorMessage } = {}) {
    const host = form.querySelector('#bkiQuoteResult');
    if (!host) return;

    host.innerHTML = this.buildResultHtml(form);
    host.dataset.ready = '1';
    this.wireComparisonColumns(host);

    host.querySelector('#btnBkiCreateQuote')?.addEventListener('click', () => {
      const plan = this.getSelectedPlan(host);
      this.showQuotePanel(form, { plan, toast });
    });
    host.querySelector('#btnBkiCreatePolicy')?.addEventListener('click', () => {
      const plan = this.getSelectedPlan(host);
      this.showIssuePanel(form, { plan, toast });
    });

    host.addEventListener('change', (e) => {
      if (e.target?.matches?.('input[name^="buyPrb_"]')) {
        const match = String(e.target.name || '').match(/^buyPrb_(.+)$/);
        if (match?.[1] && e.target.checked) {
          this.setSelectedPlan(host, match[1]);
        }
        return;
      }
      if (e.target?.matches?.('select[data-plan]')) {
        this.syncHiddenFromTable(form);
        this.syncResultDisplays(form, this.getPackagesByPlan(form));
      }
    });

    const parsed = result?.parsed || {};
    const packages = parsed.packages || [];
    const packagesByPlan = this.rememberPackages(this.mapPackagesToPlans(packages));
    try {
      host.dataset.packages = JSON.stringify(packagesByPlan);
    } catch {
      host.dataset.packages = '{}';
    }

    const noteEl = host.querySelector('#bkiResultNote');
    const statusMsg = errorMessage || result?.message || parsed.status_message || '';
    if (noteEl) {
      if (!packages.length) {
        noteEl.hidden = false;
        noteEl.textContent = statusMsg
          || 'เชื่อมต่อ BKI แล้ว — ไม่พบแพ็กเกจ ลองเปลี่ยนรุ่นรถ/ทุนประกัน หรือติดต่อ BKI ให้เปิดแพ็กเกจสำหรับ agent';
      } else {
        noteEl.hidden = !statusMsg;
        noteEl.textContent = statusMsg;
      }
    }

    host.hidden = false;
    const defaultPlan = this.pickDefaultPlan(packagesByPlan);
    const current = host.dataset.selectedPlan || defaultPlan;
    const currentPremium = this.getPackagePremium(packagesByPlan[current]);
    this.setSelectedPlan(host, currentPremium != null ? current : defaultPlan);
    this.refreshResultPrices(form);
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  async loadMakes(form) {
    const makeEl = form.querySelector('#make');
    if (!makeEl) return;
    try {
      const data = await App.MotorBkiService.getCarCodes({ limit: '1' });
      const makes = data.makes || [];
      makeEl.innerHTML = this.optionsHtml(makes, { placeholder: 'โปรดเลือก' });
      makeEl.disabled = false;
    } catch (err) {
      makeEl.innerHTML = '<option value="">โหลดยี่ห้อไม่สำเร็จ</option>';
      throw err;
    }
  },

  async loadVariants(form, make) {
    const codeEl = form.querySelector('#makeCode');
    const yearEl = form.querySelector('#carYear');
    if (!codeEl || !yearEl) return;
    codeEl.disabled = true;
    yearEl.disabled = true;
    codeEl.innerHTML = '<option value="">กำลังโหลด...</option>';
    yearEl.innerHTML = '<option value="">เลือกรุ่นก่อน</option>';
    if (!make) {
      codeEl.innerHTML = '<option value="">เลือกยี่ห้อก่อน</option>';
      this.applyVariantToForm(form, null);
      return;
    }
    const data = await App.MotorBkiService.getCarCodes({ make, limit: '120' });
    this._variants = data.items || [];
    const codes = [];
    const seen = new Set();
    this._variants.forEach((row) => {
      const key = row.make_code;
      if (!key || seen.has(key)) return;
      seen.add(key);
      const cleanDesc = this.formatCarDesc(row.desc || '');
      const shortDesc = cleanDesc.length > 48
        ? `${cleanDesc.slice(0, 48)}…`
        : cleanDesc;
      codes.push({
        value: key,
        label: shortDesc ? `${key} — ${shortDesc}` : key
      });
    });
    codeEl.innerHTML = this.optionsHtml(codes, { placeholder: 'โปรดเลือก' });
    codeEl.disabled = codes.length === 0;
    yearEl.innerHTML = '<option value="">เลือกรุ่นก่อน</option>';
    yearEl.disabled = true;
    this.applyVariantToForm(form, null);
  },

  syncYears(form) {
    const code = form.querySelector('#makeCode')?.value || '';
    const yearEl = form.querySelector('#carYear');
    if (!yearEl) return;
    const years = this._variants
      .filter((v) => v.make_code === code)
      .map((v) => v.car_year)
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a));
    const unique = [...new Set(years)];
    yearEl.innerHTML = this.optionsHtml(unique, {
      placeholder: 'โปรดเลือก',
      selected: unique[0] || ''
    });
    yearEl.disabled = unique.length === 0;
    this.applyVariantToForm(form, this.selectedVariant());
  },

  validateQuote(form) {
    if (!form.reportValidity()) return false;

    const sumEl = form.querySelector('#sumInsured');
    if (!sumEl?.value) {
      form.querySelector('#carYear')?.focus();
      return { ok: false, message: 'กรุณาเลือกรุ่นและปีรถก่อนตรวจสอบราคา' };
    }

    const variant = this.selectedVariant();
    if (variant) {
      const sum = Number(sumEl.value || 0);
      const min = Number(variant.sum_ins_min) || 0;
      const max = Number(variant.sum_ins_max) || 0;
      if (min > 0 && sum < min) {
        return { ok: false, message: `ทุนประกันต่ำกว่าขั้นต่ำ ${this.money(min)} บาท` };
      }
      if (max > 0 && sum > max) {
        return { ok: false, message: `ทุนประกันสูงกว่าสูงสุด ${this.money(max)} บาท` };
      }
    }
    return { ok: true };
  },

  setPremiumBar(premiumEl, premium) {
    if (!premiumEl) return;
    const wrap = premiumEl.closest('.product-key__premium');
    if (premium == null || !(Number(premium) > 0)) {
      delete premiumEl.dataset.premium;
      premiumEl.innerHTML = '—';
      wrap?.classList.remove('is-visible');
      return;
    }
    premiumEl.dataset.premium = String(premium);
    premiumEl.innerHTML = `${this.money(premium)}<span>บาท/ปี</span>`;
    wrap?.classList.add('is-visible');
  },

  clearQuoteState(form, premiumEl) {
    this._packagesByPlan = {};
    this._premiumsByPlan = {};
    const result = form?.querySelector('#bkiQuoteResult');
    if (result) {
      result.hidden = true;
      result.innerHTML = '';
      delete result.dataset.packages;
      delete result.dataset.selectedPlan;
      delete result.dataset.ready;
      ['2plus', '3plus', '3'].forEach((plan) => delete result.dataset[`premium_${plan}`]);
    }
    this.hidePanel(form?.querySelector('#bkiQuotePanel'));
    this.hidePanel(form?.querySelector('#bkiIssuePanel'));
    this.setPremiumBar(premiumEl, null);
  },

  async calculate(form, { toast, premiumEl } = {}) {
    const valid = this.validateQuote(form);
    if (valid === false) return null;
    if (valid.ok === false) {
      toast?.(valid.message, 'error');
      return null;
    }

    const btn = form.querySelector('#btnCheckPrice');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'กำลังตรวจสอบ...';
    }

    let result = null;
    let errorMessage = null;
    try {
      result = await App.MotorBkiService.calculatePremium(this.readForm(form));
      if (!result?.ok) {
        errorMessage = this.formatApiError(null, result);
      }
    } catch (err) {
      errorMessage = this.formatApiError(err, null);
      result = { ok: false, parsed: { packages: [] }, message: errorMessage };
    }

    this.showResult(form, { toast, result, errorMessage });

    const packagesByPlan = this._packagesByPlan || this.mapPackagesToPlans(result?.parsed?.packages || []);
    const selectedPlan = this.getSelectedPlan(form.querySelector('#bkiQuoteResult'));
    const rawPackages = result?.parsed?.packages || [];
    const pkg = packagesByPlan[selectedPlan]
      || rawPackages.find((row) => this.getPackagePremium(row) != null)
      || rawPackages[0];
    let premium = this.getPackagePremium(pkg) || this.resolvePlanPremium(form, selectedPlan);
    if (premium == null) {
      for (const row of rawPackages) {
        premium = this.getPackagePremium(row);
        if (premium != null) break;
      }
    }

    this.setPremiumBar(premiumEl, premium);

    const noteEl = form.querySelector('#bkiResultNote');
    if (errorMessage || !result?.ok || !rawPackages.length) {
      toast?.(errorMessage || result?.parsed?.status_message || 'BKI ตอบกลับแต่ไม่พบแพ็กเกจ — แสดงตารางเปรียบเทียบจากข้อมูลที่กรอก', 'error');
    } else if (premium == null) {
      const dbg = result?.premium_debug;
      const sample = dbg
        ? `premium_total=${dbg.premium_total ?? 'null'}, total_prem_vol=${dbg.total_prem_vol ?? 'null'}, gross_prem_vol=${dbg.gross_prem_vol ?? 'null'}, stamp=${dbg.stamp ?? 'null'}, vat=${dbg.vat ?? 'null'}, status=${dbg.status ?? 'null'}, remark=${dbg.remark ?? 'null'}, keys=${dbg.key_count ?? '?'}`
        : this.describePackagePremium(rawPackages[0]);
      if (noteEl) {
        noteEl.hidden = false;
        noteEl.textContent = `อ่านเบี้ยไม่สำเร็จจากแพ็กเกจ BKI (${sample})`;
      }
      toast?.('ได้แพ็กเกจจาก BKI แล้ว แต่ยังอ่านเบี้ยไม่ได้ — ลองเปลี่ยนทุนประกัน/รุ่นรถแล้วตรวจราคาอีกครั้ง', 'error');
    } else {
      toast?.('ตรวจสอบราคาจาก BKI แล้ว');
    }

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'ตรวจสอบราคา';
    }
    return result;
  },

  bind(form, { toast, premiumEl } = {}) {
    if (!form || form.dataset.bkiQuoteBound === '1') return;
    form.dataset.bkiQuoteBound = '1';

    this.syncCoverageEnd(form);
    this.syncZoneFromProvince(form);

    this.ensureLookups().catch(() => {});
    this.loadMakes(form).catch((err) => {
      toast?.(err.message || 'โหลดข้อมูลรถไม่สำเร็จ', 'error');
    });

    form.querySelector('#coverageStart')?.addEventListener('change', () => {
      this.syncCoverageEnd(form);
    });

    form.querySelector('#regProvince')?.addEventListener('change', () => {
      this.syncZoneFromProvince(form);
    });

    form.querySelector('#driverToggle')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const named = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', named ? 'false' : 'true');
      btn.textContent = named ? 'Unnamed' : 'Named';
      btn.classList.toggle('is-named', !named);
      const mode = form.querySelector('#driverMode');
      if (mode) mode.value = named ? 'unnamed' : 'named';
    });

    form.querySelector('#make')?.addEventListener('change', async (e) => {
      this.clearQuoteState(form, premiumEl);
      try {
        await this.loadVariants(form, e.target.value);
        this.syncYears(form);
      } catch (err) {
        toast?.(err.message || 'โหลดรุ่นรถไม่สำเร็จ', 'error');
      }
    });

    form.querySelector('#makeCode')?.addEventListener('change', () => {
      this.clearQuoteState(form, premiumEl);
      this.syncYears(form);
    });

    form.querySelector('#carYear')?.addEventListener('change', () => {
      this.clearQuoteState(form, premiumEl);
      this.applyVariantToForm(form, this.selectedVariant());
    });

    ['#sumInsured', '#deduct'].forEach((sel) => {
      form.querySelector(sel)?.addEventListener('change', () => {
        this.refreshResultPrices(form);
      });
    });

    form.querySelector('#btnCheckPrice')?.addEventListener('click', () => {
      this.calculate(form, { toast, premiumEl });
    });
  }
};
