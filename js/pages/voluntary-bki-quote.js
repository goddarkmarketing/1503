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
  }
};

App.VoluntaryBkiQuote = {
  _variants: [],
  _issueGeoReady: false,

  CUSTOMER_TITLES: ['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.'],
  CAR_COLORS: [
    { value: '01', label: 'ขาว' },
    { value: '02', label: 'ดำ' },
    { value: '03', label: 'เทา' },
    { value: '04', label: 'เงิน' },
    { value: '05', label: 'แดง' },
    { value: '06', label: 'น้ำเงิน' },
    { value: '07', label: 'เขียว' },
    { value: '08', label: 'เหลือง' },
    { value: '09', label: 'ส้ม' },
    { value: '10', label: 'อื่นๆ' }
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
        <div class="bki-issue" id="bkiIssuePanel" hidden aria-live="polite"></div>
      </div>`;
  },

  buildIssuePanelHtml({ planLabel, premiumText } = {}) {
    const titleOpts = this.optionsHtml(this.CUSTOMER_TITLES.map((t) => ({ value: t, label: t })), { placeholder: 'เลือก' });
    const colorOpts = this.optionsHtml(this.CAR_COLORS, { selected: '01' });
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
          <label for="issuePhone">เบอร์โทร <span class="form-req">*</span></label>
          <input type="tel" id="issuePhone" name="phone" class="form-input" required autocomplete="tel">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueEmail">อีเมล</label>
          <input type="email" id="issueEmail" name="email" class="form-input" autocomplete="email">
        </div>
        <div class="form-field bki-issue__field bki-issue__field--full">
          <label for="issueAddress">ที่อยู่ <span class="form-req">*</span></label>
          <input type="text" id="issueAddress" name="address" class="form-input" required placeholder="บ้านเลขที่ หมู่ ซอย ถนน">
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueProvince">จังหวัด <span class="form-req">*</span></label>
          <select id="issueProvince" name="insuredProvince" class="form-input" required>
            ${this.optionsHtml(this.PROVINCES, { placeholder: 'โปรดเลือก' })}
          </select>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueDistrict">อำเภอ / เขต <span class="form-req">*</span></label>
          <select id="issueDistrict" name="insuredDistrict" class="form-input" required disabled>
            <option value="">เลือกจังหวัดก่อน</option>
          </select>
        </div>
        <div class="form-field bki-issue__field">
          <label for="issueSubdistrict">ตำบล / แขวง <span class="form-req">*</span></label>
          <select id="issueSubdistrict" name="insuredSubdistrict" class="form-input" required disabled>
            <option value="">เลือกอำเภอก่อน</option>
          </select>
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
            ${this.optionsHtml(this.PROVINCES, { placeholder: 'โปรดเลือก', selected: 'กรุงเทพมหานคร' })}
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
      </div>

      <div class="bki-issue__drivers" id="bkiIssueDrivers" hidden>
        <h4 class="bki-issue__sectionTitle">ผู้ขับขี่ (ระบุชื่อ)</h4>
        <div class="bki-issue__grid">
          <div class="form-field bki-issue__field">
            <label for="driver1FirstName">ชื่อผู้ขับขี่ 1</label>
            <input type="text" id="driver1FirstName" name="driver1FirstName" class="form-input">
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver1LastName">นามสกุลผู้ขับขี่ 1</label>
            <input type="text" id="driver1LastName" name="driver1LastName" class="form-input">
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver1Id">เลขบัตรผู้ขับขี่ 1</label>
            <input type="text" id="driver1Id" name="driver1IdNumber" class="form-input" maxlength="13">
          </div>
          <div class="form-field bki-issue__field">
            <label for="driver1License">เลขใบขับขี่ 1</label>
            <input type="text" id="driver1License" name="driver1LicenseNo" class="form-input">
          </div>
        </div>
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
    if (!pkg) return null;
    for (const key of keys) {
      if (pkg[key] != null && pkg[key] !== '') return pkg[key];
    }
    return null;
  },

  getPackagePremium(pkg) {
    if (!pkg || typeof pkg !== 'object') return null;

    const keys = [
      'gross_total_vol', 'GROSS_TOTAL_VOL', 'gross_total', 'GROSS_TOTAL',
      'total_prem', 'TOTAL_PREM', 'total_premium', 'TOTAL_PREMIUM',
      'premium_total', 'PREMIUM_TOTAL',
      'gross_prem_vol', 'GROSS_PREM_VOL', 'net_premium', 'NET_PREMIUM',
      'premium', 'PREMIUM'
    ];
    const raw = this.pkgValue(pkg, keys);
    if (raw != null && raw !== '') {
      const direct = this.parsePremiumNumber(raw);
      if (direct != null) return direct;
    }

    const stamp = this.parsePremiumNumber(this.pkgValue(pkg, ['stamp_vol', 'STAMP_VOL', 'stamp', 'STAMP']));
    const vat = this.parsePremiumNumber(this.pkgValue(pkg, ['vat_vol', 'VAT_VOL', 'vat', 'VAT']));
    const gross = this.parsePremiumNumber(this.pkgValue(pkg, ['gross_prem_vol', 'GROSS_PREM_VOL']));
    if (gross != null && (stamp != null || vat != null)) {
      return gross + (stamp || 0) + (vat || 0);
    }
    if (gross != null) return gross;

    return this.findPremiumInObject(pkg);
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
      if (/prem|total|gross|net/i.test(key) && (typeof value === 'string' || typeof value === 'number')) {
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

  mapPackagesToPlans(packages) {
    const out = { '2plus': null, '3plus': null, '3': null };
    const assign = (plan, pkg) => {
      if (plan && !out[plan]) out[plan] = pkg;
    };

    packages.forEach((pkg) => {
      const text = String(
        this.pkgValue(pkg, ['package_name', 'plan_name', 'package_code', 'PACKAGE_CODE', 'plan_code']) || ''
      ).toUpperCase();
      if (/2\s*\+|CLASS\s*2|TYPE\s*2|ชั้น\s*2/i.test(text)) assign('2plus', pkg);
      else if (/3\s*\+|CLASS\s*3\s*\+|TYPE\s*3\s*\+|ชั้น\s*3\s*\+/i.test(text)) assign('3plus', pkg);
      else if (/^3[^+]|CLASS\s*3[^+]|TYPE\s*3[^+]|ชั้น\s*3[^+]/i.test(text)) assign('3', pkg);
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
      const own = this.pkgValue(pkg, ['sum_ins', 'sum_insured', 'SUM_INS', 'own_damage']) ?? planSum;
      const tpPerson = this.pkgValue(pkg, ['tp_person', 'TP_PERSON', 'liab_person']);
      const tpEvent = this.pkgValue(pkg, ['tp_event', 'TP_EVENT', 'liab_event']);
      const tpProperty = this.pkgValue(pkg, ['tp_property', 'TP_PROPERTY', 'liab_property']);

      set(`${plan}-sum`, this.money(own));
      set(`${plan}-fire`, this.money(this.pkgValue(pkg, ['fire_sum', 'sum_fire']) ?? own));
      set(`${plan}-nature`, this.money(this.pkgValue(pkg, ['nature_sum', 'sum_nature']) ?? planNature));
      set(`${plan}-tp-person`, tpPerson != null ? this.money(tpPerson) : '—');
      set(`${plan}-tp-event`, tpEvent != null ? this.money(tpEvent) : '—');
      set(`${plan}-tp-property`, tpProperty != null ? this.money(tpProperty) : '—');
    });

    const pkg3 = packagesByPlan?.['3'];
    set('3-tp-person', this.pkgValue(pkg3, ['tp_person', 'TP_PERSON']) != null
      ? this.money(this.pkgValue(pkg3, ['tp_person', 'TP_PERSON'])) : '—');
    set('3-tp-event', this.pkgValue(pkg3, ['tp_event', 'TP_EVENT']) != null
      ? this.money(this.pkgValue(pkg3, ['tp_event', 'TP_EVENT'])) : '—');
    set('3-tp-property', this.pkgValue(pkg3, ['tp_property', 'TP_PROPERTY']) != null
      ? this.money(this.pkgValue(pkg3, ['tp_property', 'TP_PROPERTY'])) : '—');
  },

  refreshResultPrices(form) {
    const root = form.querySelector('#bkiQuoteResult');
    if (!root || root.hidden) return;

    let packagesByPlan = {};
    try {
      packagesByPlan = JSON.parse(root.dataset.packages || '{}');
    } catch {
      packagesByPlan = {};
    }

    this.syncResultDisplays(form, packagesByPlan);

    ['2plus', '3plus', '3'].forEach((plan) => {
      const premium = this.getPackagePremium(packagesByPlan[plan]);
      if (root) {
        if (premium != null) root.dataset[`premium_${plan}`] = String(premium);
        else delete root.dataset[`premium_${plan}`];
      }
      const el = root.querySelector(`[data-price-for="${plan}"]`);
      if (el) {
        el.textContent = premium == null
          ? '— บาท/ปี'
          : `${this.money(premium)} บาท/ปี`;
      }
    });
  },

  getPackagesByPlan(form) {
    const root = form.querySelector('#bkiQuoteResult');
    if (!root) return {};
    try {
      return JSON.parse(root.dataset.packages || '{}');
    } catch {
      return {};
    }
  },

  readCustomerForm(form) {
    const panel = form.querySelector('#bkiIssuePanel');
    if (!panel) return {};
    const fd = new FormData(panel);
    const values = Object.fromEntries(fd.entries());
    const idTypeEl = panel.querySelector('input[name="idType"]:checked');
    values.idType = idTypeEl?.value || 'idcard';
    return values;
  },

  validateCustomerForm(form) {
    const panel = form.querySelector('#bkiIssuePanel');
    if (!panel) return { ok: false, message: 'ไม่พบฟอร์มลูกค้า' };
    const required = panel.querySelectorAll('[required]');
    for (const el of required) {
      if (!el.value || !String(el.value).trim()) {
        el.focus();
        return { ok: false, message: 'กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน' };
      }
    }
    const driverMode = form.querySelector('#driverMode')?.value || 'unnamed';
    if (driverMode === 'named') {
      const first = panel.querySelector('#driver1FirstName')?.value?.trim();
      const last = panel.querySelector('#driver1LastName')?.value?.trim();
      if (!first || !last) {
        return { ok: false, message: 'กรุณาระบุชื่อผู้ขับขี่อย่างน้อย 1 คน' };
      }
    }
    return { ok: true };
  },

  buildDrivers(form) {
    const panel = form.querySelector('#bkiIssuePanel');
    const driverMode = form.querySelector('#driverMode')?.value || 'unnamed';
    if (driverMode !== 'named' || !panel) return [];
    const first = panel.querySelector('#driver1FirstName')?.value?.trim();
    const last = panel.querySelector('#driver1LastName')?.value?.trim();
    if (!first && !last) return [];
    return [{
      firstName: first || '',
      lastName: last || '',
      idNumber: panel.querySelector('#driver1IdNumber')?.value?.trim() || '',
      licenseNo: panel.querySelector('#driver1LicenseNo')?.value?.trim() || ''
    }];
  },

  async initIssueGeo(form) {
    const panel = form.querySelector('#bkiIssuePanel');
    if (!panel || typeof GeoTH === 'undefined') return;

    const provinceEl = panel.querySelector('#issueProvince');
    const districtEl = panel.querySelector('#issueDistrict');
    const subEl = panel.querySelector('#issueSubdistrict');
    const postalEl = panel.querySelector('#issuePostal');
    if (!provinceEl || !districtEl || !subEl) return;

    if (panel.dataset.geoBound === '1') {
      return;
    }
    panel.dataset.geoBound = '1';

    try {
      const provinces = await GeoTH.getProvinces();
      provinceEl.innerHTML = this.optionsHtml(
        provinces.map((p) => ({ value: p.name, label: p.name })),
        { placeholder: 'โปรดเลือก' }
      );

      const loadDistricts = async (provinceName) => {
        districtEl.innerHTML = '<option value="">กำลังโหลด...</option>';
        districtEl.disabled = true;
        subEl.innerHTML = '<option value="">เลือกอำเภอก่อน</option>';
        subEl.disabled = true;
        if (postalEl) postalEl.value = '';
        const province = provinces.find((p) => p.name === provinceName);
        if (!province) {
          districtEl.innerHTML = '<option value="">เลือกจังหวัดก่อน</option>';
          return;
        }
        const districts = await GeoTH.getDistricts(province.id);
        panel._districts = districts;
        districtEl.innerHTML = this.optionsHtml(
          districts.map((d) => ({ value: d.name, label: d.name })),
          { placeholder: 'โปรดเลือก' }
        );
        districtEl.disabled = false;
      };

      const loadSubdistricts = async (districtName) => {
        subEl.innerHTML = '<option value="">กำลังโหลด...</option>';
        subEl.disabled = true;
        if (postalEl) postalEl.value = '';
        const district = (panel._districts || []).find((d) => d.name === districtName);
        if (!district) {
          subEl.innerHTML = '<option value="">เลือกอำเภอก่อน</option>';
          return;
        }
        const subs = await GeoTH.getSubdistricts(district.id);
        panel._subdistricts = subs;
        subEl.innerHTML = this.optionsHtml(
          subs.map((s) => ({ value: s.name, label: s.name })),
          { placeholder: 'โปรดเลือก' }
        );
        subEl.disabled = false;
      };

      provinceEl.addEventListener('change', () => {
        loadDistricts(provinceEl.value).catch(() => {});
      });
      districtEl.addEventListener('change', () => {
        loadSubdistricts(districtEl.value).catch(() => {});
      });
      subEl.addEventListener('change', () => {
        const sub = (panel._subdistricts || []).find((s) => s.name === subEl.value);
        if (sub?.zip && postalEl) postalEl.value = String(sub.zip);
      });

      const regProvince = form.querySelector('#regProvince')?.value;
      if (regProvince) {
        provinceEl.value = regProvince;
        await loadDistricts(regProvince);
      }
    } catch (err) {
      console.warn('[bki-issue] geo init failed', err);
    }
  },

  showIssuePanel(form, { plan, toast } = {}) {
    const resultHost = form.querySelector('#bkiQuoteResult');
    const panel = form.querySelector('#bkiIssuePanel');
    if (!resultHost || !panel) return;

    const packages = this.getPackagesByPlan(form);
    const premium = this.resolvePlanPremium(form, plan);
    if (premium == null) {
      const hasPackages = Object.values(packages).some(Boolean);
      toast?.(
        hasPackages
          ? 'ไม่พบเบี้ยในแผนที่เลือก — คลิกหัวคอลัมน์แผนที่มีราคา หรือกดตรวจสอบราคาอีกครั้ง'
          : 'กรุณาตรวจสอบราคาและเลือกแผนที่มีเบี้ยก่อนสร้างกรมธรรม์',
        'error'
      );
      return;
    }

    const pkg = packages[plan] || packages['3plus'] || packages['2plus'] || packages['3'] || {};

    const planLabel = this.planLabel(plan);
    const premiumText = `${this.money(premium)} บาท/ปี`;
    panel.innerHTML = this.buildIssuePanelHtml({ planLabel, premiumText });
    panel.hidden = false;
    panel.dataset.plan = plan;
    panel.dataset.premium = String(premium);
    panel.dataset.packagePlan = packages[plan] ? plan : (packages['3plus'] ? '3plus' : plan);

    const licenseProvince = form.querySelector('#regProvince')?.value || 'กรุงเทพมหานคร';
    const licenseEl = panel.querySelector('#issueLicenseProvince');
    if (licenseEl && licenseProvince) licenseEl.value = licenseProvince;

    const driverMode = form.querySelector('#driverMode')?.value || 'unnamed';
    const driversBlock = panel.querySelector('#bkiIssueDrivers');
    if (driversBlock) driversBlock.hidden = driverMode !== 'named';

    panel.querySelector('#btnBkiIssueBack')?.addEventListener('click', () => {
      panel.hidden = true;
      panel.innerHTML = '';
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
      const policyNo = policy.bkiPolicyNo || policy.id || '';
      toast?.(`ออกกรมธรรม์สำเร็จ ${policyNo}`.trim());
      this.updateBalanceDisplay(result.balance);

      panel.innerHTML = `
        <div class="bki-issue__success">
          <h3 class="bki-issue__title">ออกกรมธรรม์สำเร็จ</h3>
          <p>เลขที่ระบบ: <strong>${this.escapeHtml(policy.id || '—')}</strong></p>
          ${policy.bkiPolicyNo ? `<p>เลขกรมธรรม์ BKI: <strong>${this.escapeHtml(policy.bkiPolicyNo)}</strong></p>` : ''}
          <p>ทะเบียน: <strong>${this.escapeHtml(policy.plate || customer.licensePlate || '—')}</strong></p>
          <p>เบี้ย: <strong>${this.money(policy.premium || premium)} บาท</strong></p>
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
      const packages = JSON.parse(host.dataset.packages || '{}');
      const premium = this.getPackagePremium(packages[plan]);
      const price = premium == null ? '—' : `${this.money(premium)} บาท/ปี`;
      toast?.(`สร้างใบเสนอราคา ${this.planLabel(plan)} · ${price}`);
    });
    host.querySelector('#btnBkiCreatePolicy')?.addEventListener('click', () => {
      const plan = this.getSelectedPlan(host);
      this.showIssuePanel(form, { plan, toast });
    });

    host.addEventListener('change', (e) => {
      if (e.target?.matches?.('select[data-plan]')) {
        this.syncHiddenFromTable(form);
        this.syncResultDisplays(form, JSON.parse(host.dataset.packages || '{}'));
      }
    });

    const parsed = result?.parsed || {};
    const packages = parsed.packages || [];
    const packagesByPlan = this.mapPackagesToPlans(packages);
    host.dataset.packages = JSON.stringify(packagesByPlan);

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
    const defaultPlan = packagesByPlan['3plus'] ? '3plus'
      : (packagesByPlan['2plus'] ? '2plus' : '3');
    const current = host.dataset.selectedPlan || '3plus';
    this.setSelectedPlan(host, packagesByPlan[current] ? current : defaultPlan);
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

    const packagesByPlan = this.mapPackagesToPlans(result?.parsed?.packages || []);
    const selectedPlan = this.getSelectedPlan(form.querySelector('#bkiQuoteResult'));
    const pkg = packagesByPlan[selectedPlan] || result?.parsed?.packages?.[0];
    const premium = this.getPackagePremium(pkg);

    if (premiumEl && premium != null) {
      premiumEl.dataset.premium = String(premium);
      premiumEl.innerHTML = `${this.money(premium)}<span>บาท/ปี</span>`;
      premiumEl.closest('.product-key__premium')?.classList.add('is-visible');
    }

    if (errorMessage || !result?.ok || !(result?.parsed?.packages?.length)) {
      toast?.(errorMessage || result?.parsed?.status_message || 'BKI ตอบกลับแต่ไม่พบแพ็กเกจ — แสดงตารางเปรียบเทียบจากข้อมูลที่กรอก', 'error');
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
      try {
        await this.loadVariants(form, e.target.value);
        this.syncYears(form);
      } catch (err) {
        toast?.(err.message || 'โหลดรุ่นรถไม่สำเร็จ', 'error');
      }
    });

    form.querySelector('#makeCode')?.addEventListener('change', () => {
      this.syncYears(form);
    });

    form.querySelector('#carYear')?.addEventListener('change', () => {
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
