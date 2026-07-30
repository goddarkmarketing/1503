/**
 * AXA motor (2+/3+) quote form — fields + cascade helpers.
 */
window.App = window.App || {};

App.VoluntaryAxaQuote = {
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

  VEHICLES: {
    Toyota: {
      Fortuner: {
        2026: ['Auto / 4dr / Wagon / GR Sport 2.8DCT / MR0BA3FS / 1,968cc', 'Auto / 4dr / Wagon / Legender 2.8 / 1,968cc', 'Auto / 4dr / Wagon / V 2.4 / 2,393cc'],
        2025: ['Auto / 4dr / Wagon / GR Sport 2.8 / 1,968cc', 'Auto / 4dr / Wagon / Leader 2.4 / 2,393cc'],
        2024: ['Auto / 4dr / Wagon / GR Sport 2.8 / 1,968cc', 'Auto / 4dr / Wagon / V 2.4 / 2,393cc'],
        2023: ['Auto / 4dr / Wagon / Leader 2.8 / 1,968cc', 'Auto / 4dr / Wagon / V 2.4 / 2,393cc'],
        2022: ['Auto / 4dr / Wagon / V 2.4 / 2,393cc', 'Auto / 4dr / Wagon / G 2.4 / 2,393cc']
      },
      Vios: {
        2026: ['Auto / 4dr / Sedan / Entry 1.5 / 1,496cc', 'Auto / 4dr / Sedan / Mid 1.5 / 1,496cc'],
        2025: ['Auto / 4dr / Sedan / Entry 1.5 / 1,496cc', 'CVT / 4dr / Sedan / High 1.5 / 1,496cc'],
        2024: ['Auto / 4dr / Sedan / E 1.5 / 1,496cc', 'Auto / 4dr / Sedan / G 1.5 / 1,496cc'],
        2023: ['Auto / 4dr / Sedan / E 1.5 / 1,496cc'],
        2022: ['Auto / 4dr / Sedan / J 1.5 / 1,496cc']
      },
      Yaris: {
        2025: ['Auto / 5dr / Hatchback / Entry 1.2 / 1,198cc', 'Auto / 5dr / Hatchback / High 1.2 / 1,198cc'],
        2024: ['Auto / 5dr / Hatchback / Entry 1.2 / 1,198cc'],
        2023: ['Auto / 5dr / Hatchback / E 1.2 / 1,198cc'],
        2022: ['Auto / 5dr / Hatchback / J 1.2 / 1,198cc']
      },
      'Hilux Revo': {
        2026: ['Auto / Double Cab / Prerunner 2.4 / 2,393cc', 'Manual / Double Cab / Entry 2.4 / 2,393cc'],
        2025: ['Auto / Double Cab / Rocco 2.8 / 1,968cc', 'Auto / Double Cab / Mid 2.4 / 2,393cc'],
        2024: ['Auto / Double Cab / Prerunner 2.4 / 2,393cc'],
        2023: ['Auto / Double Cab / E 2.4 / 2,393cc'],
        2022: ['Manual / Double Cab / J 2.4 / 2,393cc']
      }
    },
    Honda: {
      City: {
        2026: ['CVT / 4dr / Sedan / SV 1.0 / 998cc', 'CVT / 4dr / Sedan / RS 1.0 / 998cc'],
        2025: ['CVT / 4dr / Sedan / S 1.0 / 998cc', 'CVT / 4dr / Sedan / RS 1.0 / 998cc'],
        2024: ['CVT / 4dr / Sedan / S 1.0 / 998cc'],
        2023: ['CVT / 4dr / Sedan / V 1.0 / 998cc'],
        2022: ['CVT / 4dr / Sedan / S 1.0 / 998cc']
      },
      Civic: {
        2026: ['CVT / 4dr / Sedan / EL 1.5 / 1,498cc', 'CVT / 4dr / Sedan / RS 1.5 / 1,498cc'],
        2025: ['CVT / 4dr / Sedan / EL 1.5 / 1,498cc'],
        2024: ['CVT / 4dr / Sedan / EL 1.5 / 1,498cc'],
        2023: ['CVT / 4dr / Sedan / EL+ 1.5 / 1,498cc'],
        2022: ['CVT / 4dr / Sedan / EL 1.5 / 1,498cc']
      },
      'CR-V': {
        2026: ['Auto / 5dr / SUV / ES 1.5 / 1,498cc', 'Auto / 5dr / SUV / e:HEV EL 2.0 / 1,993cc'],
        2025: ['Auto / 5dr / SUV / ES 1.5 / 1,498cc'],
        2024: ['Auto / 5dr / SUV / EL 1.5 / 1,498cc'],
        2023: ['Auto / 5dr / SUV / EL 1.5 / 1,498cc'],
        2022: ['Auto / 5dr / SUV / E 1.5 / 1,498cc']
      }
    },
    Isuzu: {
      'D-Max': {
        2026: ['Auto / Double Cab / Hi-Lander 1.9 / 1,898cc', 'Auto / Double Cab / V-Cross 3.0 / 2,999cc'],
        2025: ['Auto / Double Cab / Hi-Lander 1.9 / 1,898cc'],
        2024: ['Auto / Double Cab / L 1.9 / 1,898cc'],
        2023: ['Auto / Double Cab / S 1.9 / 1,898cc'],
        2022: ['Manual / Double Cab / S 1.9 / 1,898cc']
      },
      'MU-X': {
        2026: ['Auto / 5dr / SUV / Ultimate 3.0 / 2,999cc', 'Auto / 5dr / SUV / Elegant 1.9 / 1,898cc'],
        2025: ['Auto / 5dr / SUV / Elegant 1.9 / 1,898cc'],
        2024: ['Auto / 5dr / SUV / Elegant 1.9 / 1,898cc'],
        2023: ['Auto / 5dr / SUV / Elegant 1.9 / 1,898cc'],
        2022: ['Auto / 5dr / SUV / DVD 1.9 / 1,898cc']
      }
    },
    Mazda: {
      'CX-5': {
        2026: ['Auto / 5dr / SUV / SP 2.0 / 1,998cc', 'Auto / 5dr / SUV / Turbo SP 2.5 / 2,488cc'],
        2025: ['Auto / 5dr / SUV / C 2.0 / 1,998cc'],
        2024: ['Auto / 5dr / SUV / C 2.0 / 1,998cc'],
        2023: ['Auto / 5dr / SUV / C 2.0 / 1,998cc'],
        2022: ['Auto / 5dr / SUV / C 2.0 / 1,998cc']
      },
      '2': {
        2025: ['Auto / 4dr / Sedan / S 1.3 / 1,298cc', 'Auto / 5dr / Hatchback / S 1.3 / 1,298cc'],
        2024: ['Auto / 4dr / Sedan / S 1.3 / 1,298cc'],
        2023: ['Auto / 4dr / Sedan / High 1.3 / 1,298cc'],
        2022: ['Auto / 4dr / Sedan / High 1.3 / 1,298cc']
      }
    },
    Mitsubishi: {
      Triton: {
        2026: ['Auto / Double Cab / Athlete 2.4 / 2,439cc', 'Auto / Double Cab / GLS 2.4 / 2,439cc'],
        2025: ['Auto / Double Cab / GLS 2.4 / 2,439cc'],
        2024: ['Auto / Double Cab / GLS 2.4 / 2,439cc'],
        2023: ['Auto / Double Cab / GLS 2.4 / 2,439cc'],
        2022: ['Manual / Double Cab / GLX 2.4 / 2,439cc']
      },
      Xpander: {
        2026: ['CVT / 5dr / MPV / GT 1.5 / 1,499cc', 'CVT / 5dr / MPV / Cross 1.5 / 1,499cc'],
        2025: ['CVT / 5dr / MPV / GT 1.5 / 1,499cc'],
        2024: ['CVT / 5dr / MPV / GT 1.5 / 1,499cc'],
        2023: ['CVT / 5dr / MPV / GT 1.5 / 1,499cc'],
        2022: ['CVT / 5dr / MPV / GT 1.5 / 1,499cc']
      }
    }
  },

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
    const next = new Date(y + 1, m - 1, d);
    return this.toInputDate(next);
  },

  resolveArea(province) {
    return this.BKK_AREA.has(String(province || '')) ? 'bkk' : 'province';
  },

  optionsHtml(items, { placeholder, selected } = {}) {
    const head = placeholder
      ? `<option value="">${placeholder}</option>`
      : '';
    const body = items.map((item) => {
      const value = typeof item === 'string' ? item : item.value;
      const label = typeof item === 'string' ? item : item.label;
      const sel = selected != null && String(selected) === String(value) ? ' selected' : '';
      return `<option value="${this.escapeAttr(value)}"${sel}>${this.escapeHtml(label)}</option>`;
    }).join('');
    return head + body;
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

  agentLabel(user) {
    if (!user) return 'ไม่พบข้อมูลนายหน้า';
    const code = user.agentCode || user.username || '-';
    const name = user.name || '';
    return `(${code}) ${name}`.trim();
  },

  buildFields(user) {
    const today = new Date();
    const start = this.toInputDate(today);
    const end = this.addOneYear(start);
    const brands = Object.keys(this.VEHICLES);
    const yearNow = today.getFullYear();
    const years = [];
    for (let y = yearNow; y >= yearNow - 20; y--) years.push(String(y));

    return `
      <div class="axa-quote" data-policy-mode="voluntary">
        <input type="hidden" name="coverType" id="coverType" value="3plus">
        <input type="hidden" name="sumInsured" id="sumInsured" value="100000">
        <input type="hidden" name="area" id="area" value="bkk">

        <div class="axa-quote__row axa-quote__row--policy">
          <div class="form-field axa-quote__field axa-quote__field--agent">
            <label for="agentDisplay">ตัวแทน/นายหน้า <span class="form-req">*</span></label>
            <input type="text" id="agentDisplay" class="form-input" value="${this.escapeAttr(this.agentLabel(user))}" readonly>
            <input type="hidden" name="agentCode" value="${this.escapeAttr(user?.agentCode || user?.username || '')}">
            <input type="hidden" name="agentId" value="${this.escapeAttr(user?.id || '')}">
          </div>
          <div class="form-field axa-quote__field axa-quote__field--policyType">
            <span class="axa-quote__label">ประเภทกรมธรรม์ <span class="form-req">*</span></span>
            <div class="axa-quote__seg" role="group" aria-label="ประเภทกรมธรรม์">
              <label class="axa-quote__segOpt">
                <input type="radio" name="policyType" value="voluntary" checked>
                <span>ภาคสมัครใจ</span>
              </label>
              <label class="axa-quote__segOpt">
                <input type="radio" name="policyType" value="compulsory">
                <span>พ.ร.บ.</span>
              </label>
            </div>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--promo">
            <label for="promoCode">โปรโมชั่นโค้ด</label>
            <input type="text" id="promoCode" name="promoCode" class="form-input" autocomplete="off" spellcheck="false" placeholder="">
          </div>
        </div>

        <div class="axa-quote__row axa-quote__row--car">
          <div class="form-field axa-quote__field">
            <label for="carBrand">ยี่ห้อรถ <span class="form-req">*</span></label>
            <select id="carBrand" name="carBrand" class="form-input" required>
              ${this.optionsHtml(brands, { placeholder: 'โปรดเลือก', selected: 'Toyota' })}
            </select>
          </div>
          <div class="form-field axa-quote__field">
            <label for="carModel">รุ่นรถยนต์ <span class="form-req">*</span></label>
            <select id="carModel" name="carModel" class="form-input" required>
              <option value="">โปรดเลือก</option>
            </select>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--year">
            <label for="carYear">ปีที่ผลิต <span class="form-req">*</span></label>
            <select id="carYear" name="carYear" class="form-input" required>
              ${this.optionsHtml(years, { placeholder: 'โปรดเลือก', selected: String(yearNow) })}
            </select>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--regType">
            <label for="regType">ประเภทการจดทะเบียน <span class="form-req">*</span></label>
            <select id="regType" name="regType" class="form-input" required>
              ${this.optionsHtml(this.REG_TYPES, { selected: '110' })}
            </select>
          </div>
          <div class="form-field axa-quote__field axa-quote__field--submodel">
            <label for="carSubmodel">รุ่นย่อยรถยนต์ <span class="form-req">*</span></label>
            <select id="carSubmodel" name="carSubmodel" class="form-input" required>
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
            <div class="form-field axa-quote__field axa-quote__field--usage" data-voluntary-only>
              <label for="usageType">ประเภทการใช้รถ <span class="form-req">*</span></label>
              <select id="usageType" name="usageType" class="form-input" required>
                ${this.optionsHtml(this.USAGE_TYPES, { selected: 'personal' })}
              </select>
            </div>
            <div class="form-field axa-quote__field axa-quote__field--dashcam" data-voluntary-only>
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
              <input type="date" id="coverageStart" name="coverageStart" class="form-input" value="${start}" required>
            </div>
            <div class="form-field axa-quote__field axa-quote__field--tax" data-prb-only hidden>
              <label for="taxDueDate">วันครบกำหนดชำระภาษีรถยนต์</label>
              <input type="date" id="taxDueDate" name="taxDueDate" class="form-input">
            </div>
            <div class="form-field axa-quote__field axa-quote__field--end">
              <label for="coverageEnd">วันสิ้นสุดความคุ้มครอง <span class="form-req">*</span></label>
              <input type="date" id="coverageEnd" name="coverageEnd" class="form-input form-input--readonly" value="${end}" readonly tabindex="-1">
            </div>
            <div class="form-field axa-quote__field axa-quote__field--driver" data-voluntary-only>
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

        <div class="axa-result" id="axaQuoteResult" hidden></div>
        <div class="axa-prb-result" id="axaPrbResult" hidden>
          <p class="axa-prb-result__empty" id="axaPrbEmpty">ไม่พบข้อมูล</p>
          <div class="axa-prb-result__card" id="axaPrbCard" hidden>
            <div class="axa-prb-result__head">พ.ร.บ. ประกันรถยนต์</div>
            <div class="axa-prb-result__price" id="axaPrbPrice">—</div>
            <div class="axa-prb-result__meta" id="axaPrbMeta"></div>
            <div class="axa-result__actions">
              <button type="button" class="axa-result__btn axa-result__btn--quote" id="btnAxaPrbQuote">
                สร้างใบเสนอราคา
              </button>
              <button type="button" class="axa-result__btn axa-result__btn--policy" id="btnAxaPrbPolicy">
                สร้างกรมธรรม์
              </button>
            </div>
          </div>
        </div>
      </div>`;
  },

  money(n, { decimals = 0 } = {}) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return Number(n).toLocaleString('th-TH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  moneyInt(n) {
    return this.money(n, { decimals: 0 });
  },

  sumOptionsHtml(selected = 100000) {
    return [100000, 200000, 300000].map((n) =>
      `<option value="${n}" ${Number(selected) === n ? 'selected' : ''}>${this.moneyInt(n)}</option>`
    ).join('');
  },

  deductibleOptionsHtml(selected = '') {
    const opts = [
      { value: '', label: 'ไม่ระบุ' },
      { value: '1000', label: '1,000' },
      { value: '2000', label: '2,000' },
      { value: '3000', label: '3,000' },
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

  buildResultHtml() {
    const dash = '<span class="axa-cmp__dash">-</span>';
    const sel = (plan, name, html) =>
      `<select class="axa-cmp__select" data-plan="${plan}" data-field="${name}">${html}</select>`;

    return `
      <div class="axa-result__wrap">
        <table class="axa-cmp" aria-label="เปรียบเทียบแผนประกัน">
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
              <td>${sel('2plus', 'sumInsured', this.sumOptionsHtml(100000))}</td>
              <td>${sel('3plus', 'sumInsured', this.sumOptionsHtml(100000))}</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ทุนประกันภัยรถยนต์ (ภัยธรรมชาติ)</th>
              <td>${sel('2plus', 'natureSum', this.sumOptionsHtml(100000))}</td>
              <td>${sel('3plus', 'natureSum', this.sumOptionsHtml(100000))}</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ค่าเสียหายส่วนแรก (เสียหายต่อรถยนต์)</th>
              <td>${sel('2plus', 'deductible', this.deductibleOptionsHtml(''))}</td>
              <td>${sel('3plus', 'deductible', this.deductibleOptionsHtml(''))}</td>
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
              <td data-display="2plus-sum">100,000</td>
              <td data-display="3plus-sum">100,000</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ทุนประกันภัยรถยนต์ (สูญหาย ไฟไหม้)</th>
              <td data-display="2plus-fire">100,000</td>
              <td data-display="3plus-fire">100,000</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ทุนประกันภัยรถยนต์ (ภัยธรรมชาติ)</th>
              <td data-display="2plus-nature">100,000</td>
              <td data-display="3plus-nature">100,000</td>
              <td>${dash}</td>
            </tr>

            <tr class="axa-cmp__section">
              <td colspan="4">ความรับผิดชอบต่อบุคคลภายนอก</td>
            </tr>
            <tr>
              <th scope="row">บาดเจ็บหรือเสียชีวิต ต่อคน</th>
              <td>500,000</td>
              <td>500,000</td>
              <td>500,000</td>
            </tr>
            <tr>
              <th scope="row">บาดเจ็บหรือเสียชีวิต ต่อครั้ง</th>
              <td>20,000,000</td>
              <td>20,000,000</td>
              <td>10,000,000</td>
            </tr>
            <tr>
              <th scope="row">ทรัพย์สิน ต่อครั้ง</th>
              <td>1,000,000</td>
              <td>1,000,000</td>
              <td>1,000,000</td>
            </tr>

            <tr class="axa-cmp__section">
              <td colspan="4">ความคุ้มครองเพิ่มเติม</td>
            </tr>
            <tr>
              <th scope="row">อุบัติเหตุส่วนบุคคล</th>
              <td>100,000</td>
              <td>100,000</td>
              <td>50,000</td>
            </tr>
            <tr>
              <th scope="row">ค่ารักษาพยาบาล</th>
              <td>100,000</td>
              <td>100,000</td>
              <td>50,000</td>
            </tr>
            <tr>
              <th scope="row">ประกันตัวผู้ขับขี่</th>
              <td>300,000</td>
              <td>300,000</td>
              <td>200,000</td>
            </tr>
            <tr>
              <th scope="row">ความคุ้มครองอุปกรณ์อัดประจุไฟฟ้า (EV)</th>
              <td>${dash}</td>
              <td>${dash}</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ความคุ้มครองสายชาร์จรถไฟฟ้า (EV)</th>
              <td>${dash}</td>
              <td>${dash}</td>
              <td>${dash}</td>
            </tr>
            <tr>
              <th scope="row">ความคุ้มครองความรับผิดต่อบุคคลภายนอก เนื่องจากอุปกรณ์อัดประจุไฟฟ้า (EV) และสายชาร์จรถไฟฟ้า (EV)</th>
              <td>${dash}</td>
              <td>${dash}</td>
              <td>${dash}</td>
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
      <div class="axa-result__actions">
        <button type="button" class="axa-result__btn axa-result__btn--quote" id="btnAxaCreateQuote">
          สร้างใบเสนอราคา
        </button>
        <button type="button" class="axa-result__btn axa-result__btn--policy" id="btnAxaCreatePolicy">
          สร้างกรมธรรม์
        </button>
      </div>`;
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
    if (cover) cover.value = plan === '3' ? '3plus' : plan;
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

  applySelectedPlanToForm(form) {
    const root = form.querySelector('#axaQuoteResult');
    const plan = this.getSelectedPlan(root);
    const coverEl = form.querySelector('#coverType');
    const sumEl = form.querySelector('#sumInsured');
    if (coverEl) coverEl.value = plan === '3' ? '3' : plan;
    if (plan !== '3') {
      const over = this.planOverrides(root, plan);
      if (sumEl) sumEl.value = String(over.sumInsured || 100000);
    }
    return { plan, premium: this.calcPlanPremium(form, plan) };
  },

  readBaseValues(form) {
    const fd = new FormData(form);
    const values = Object.fromEntries(fd.entries());
    values.area = form.querySelector('#area')?.value || this.resolveArea(values.regProvince);
    values.dashcam = form.querySelector('#dashcam')?.value || values.dashcam;
    values.usageType = form.querySelector('#usageType')?.value || values.usageType;
    return values;
  },

  planOverrides(root, plan) {
    const get = (field) => root.querySelector(`select[data-plan="${plan}"][data-field="${field}"]`)?.value;
    return {
      sumInsured: Number(get('sumInsured') || 100000),
      natureSum: Number(get('natureSum') || 100000),
      deductible: get('deductible') || '',
      garageType: get('garageType') || 'garage'
    };
  },

  calcPlanPremium(form, plan) {
    const root = form.querySelector('#axaQuoteResult');
    const base = this.readBaseValues(form);
    const over = plan === '3' ? { sumInsured: 0 } : this.planOverrides(root, plan);
    const values = {
      ...base,
      ...over,
      coverType: plan
    };
    return window.App?.ProductCatalog?.calcPremium?.('voluntary-axa', values) ?? null;
  },

  syncResultDisplays(root) {
    ['2plus', '3plus'].forEach((plan) => {
      const sum = Number(root.querySelector(`select[data-plan="${plan}"][data-field="sumInsured"]`)?.value || 100000);
      const nature = Number(root.querySelector(`select[data-plan="${plan}"][data-field="natureSum"]`)?.value || sum);
      const set = (key, val) => {
        const el = root.querySelector(`[data-display="${key}"]`);
        if (el) el.textContent = this.moneyInt(val);
      };
      set(`${plan}-sum`, sum);
      set(`${plan}-fire`, sum);
      set(`${plan}-nature`, nature);
    });
  },

  refreshResultPrices(form) {
    const root = form.querySelector('#axaQuoteResult');
    if (!root || root.hidden) return;
    this.syncResultDisplays(root);
    ['2plus', '3plus', '3'].forEach((plan) => {
      const premium = this.calcPlanPremium(form, plan);
      const el = root.querySelector(`[data-price-for="${plan}"]`);
      if (el) {
        el.textContent = premium == null
          ? '— บาท/ปี'
          : `${this.moneyInt(premium)} บาท/ปี`;
      }
    });
  },

  showResult(form, { toast } = {}) {
    const host = form.querySelector('#axaQuoteResult');
    if (!host) return;
    if (!host.dataset.ready) {
      host.innerHTML = this.buildResultHtml();
      host.dataset.ready = '1';
      host.dataset.selectedPlan = '2plus';
      host.addEventListener('change', (e) => {
        if (e.target?.matches?.('select[data-plan]')) {
          this.refreshResultPrices(form);
        }
      });
      this.wireComparisonColumns(host);
      host.querySelector('#btnAxaCreateQuote')?.addEventListener('click', () => {
        const { plan, premium } = this.applySelectedPlanToForm(form);
        const price = premium == null ? '—' : `${this.moneyInt(premium)} บาท/ปี`;
        toast?.(`สร้างใบเสนอราคา ${this.planLabel(plan)} · ${price}`);
      });
      host.querySelector('#btnAxaCreatePolicy')?.addEventListener('click', () => {
        const { plan, premium } = this.applySelectedPlanToForm(form);
        const price = premium == null ? '—' : `${this.moneyInt(premium)} บาท/ปี`;
        toast?.(`พร้อมสร้างกรมธรรม์ ${this.planLabel(plan)} · ${price}`);
      });
    }
    host.hidden = false;
    this.setSelectedPlan(host, host.dataset.selectedPlan || '2plus');
    this.refreshResultPrices(form);
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  fillSelect(select, items, { placeholder, selected } = {}) {
    if (!select) return;
    select.innerHTML = this.optionsHtml(items, { placeholder, selected });
  },

  syncModels(form) {
    const brand = form.querySelector('#carBrand')?.value;
    const modelSelect = form.querySelector('#carModel');
    const yearSelect = form.querySelector('#carYear');
    const subSelect = form.querySelector('#carSubmodel');
    const models = brand && this.VEHICLES[brand] ? Object.keys(this.VEHICLES[brand]) : [];
    const keep = modelSelect?.value;
    this.fillSelect(modelSelect, models, {
      placeholder: 'เลือกรุ่น',
      selected: models.includes(keep) ? keep : (models[0] || '')
    });
    this.syncYears(form);
    if (subSelect && !models.length) {
      this.fillSelect(subSelect, [], { placeholder: 'เลือกรุ่นย่อย' });
    }
  },

  syncYears(form) {
    const brand = form.querySelector('#carBrand')?.value;
    const model = form.querySelector('#carModel')?.value;
    const yearSelect = form.querySelector('#carYear');
    const yearsMap = brand && model && this.VEHICLES[brand]?.[model]
      ? this.VEHICLES[brand][model]
      : null;
    const years = yearsMap
      ? Object.keys(yearsMap).sort((a, b) => Number(b) - Number(a))
      : [];
    const keep = yearSelect?.value;
    if (years.length) {
      this.fillSelect(yearSelect, years, {
        placeholder: 'เลือกปี',
        selected: years.includes(keep) ? keep : years[0]
      });
    }
    this.syncSubmodels(form);
  },

  syncSubmodels(form) {
    const brand = form.querySelector('#carBrand')?.value;
    const model = form.querySelector('#carModel')?.value;
    const year = form.querySelector('#carYear')?.value;
    const subSelect = form.querySelector('#carSubmodel');
    const list = brand && model && year
      ? (this.VEHICLES[brand]?.[model]?.[year] || [])
      : [];
    const keep = subSelect?.value;
    this.fillSelect(subSelect, list, {
      placeholder: 'เลือกรุ่นย่อย',
      selected: list.includes(keep) ? keep : (list[0] || '')
    });
  },

  syncCoverageEnd(form) {
    const startEl = form.querySelector('#coverageStart');
    const endEl = form.querySelector('#coverageEnd');
    if (!startEl || !endEl) return;
    endEl.value = this.addOneYear(startEl.value);
  },

  syncArea(form) {
    const province = form.querySelector('#regProvince')?.value;
    const areaEl = form.querySelector('#area');
    if (areaEl) areaEl.value = this.resolveArea(province);
  },

  setDriverMode(form, named) {
    const btn = form.querySelector('#driverToggle');
    const modeEl = form.querySelector('#driverMode');
    if (modeEl) modeEl.value = named ? 'named' : 'unnamed';
    if (btn) {
      btn.textContent = named ? 'Named' : 'Unnamed';
      btn.classList.toggle('is-named', named);
      btn.setAttribute('aria-pressed', named ? 'true' : 'false');
    }
  },

  getPolicyMode(form) {
    return form.querySelector('input[name="policyType"]:checked')?.value || 'voluntary';
  },

  setPolicyMode(form, mode) {
    const root = form.querySelector('.axa-quote');
    const next = mode === 'compulsory' ? 'compulsory' : 'voluntary';
    if (root) root.dataset.policyMode = next;

    form.querySelectorAll('[data-voluntary-only]').forEach((el) => {
      el.hidden = next === 'compulsory';
      el.querySelectorAll('select, input').forEach((ctrl) => {
        if (ctrl.type === 'hidden') return;
        if (ctrl.required || ctrl.dataset.wasRequired === '1') {
          if (next === 'compulsory') {
            ctrl.dataset.wasRequired = '1';
            ctrl.required = false;
          } else if (ctrl.dataset.wasRequired === '1') {
            ctrl.required = true;
          }
        }
      });
    });

    form.querySelectorAll('[data-prb-only]').forEach((el) => {
      el.hidden = next !== 'compulsory';
    });

    const volResult = form.querySelector('#axaQuoteResult');
    const prbResult = form.querySelector('#axaPrbResult');
    if (next === 'compulsory') {
      if (volResult) volResult.hidden = true;
      if (prbResult) {
        prbResult.hidden = false;
        const empty = prbResult.querySelector('#axaPrbEmpty');
        const card = prbResult.querySelector('#axaPrbCard');
        if (empty) empty.hidden = false;
        if (card) card.hidden = true;
      }
    } else {
      if (prbResult) prbResult.hidden = true;
    }
  },

  calcPrbPremium(form) {
    const regType = String(form.querySelector('#regType')?.value || '110');
    const table = {
      '110': 645.21,
      '120': 967.82,
      '210': 1180.45,
      '220': 1180.45,
      '230': 1896.34,
      '320': 967.82
    };
    return table[regType] ?? 645.21;
  },

  showPrbResult(form, { toast } = {}) {
    const host = form.querySelector('#axaPrbResult');
    if (!host) return;
    const empty = host.querySelector('#axaPrbEmpty');
    const card = host.querySelector('#axaPrbCard');
    const priceEl = host.querySelector('#axaPrbPrice');
    const metaEl = host.querySelector('#axaPrbMeta');
    const premium = this.calcPrbPremium(form);
    const brand = form.querySelector('#carBrand')?.value || '';
    const model = form.querySelector('#carModel')?.value || '';
    const year = form.querySelector('#carYear')?.value || '';
    if (empty) empty.hidden = true;
    if (card) card.hidden = false;
    if (priceEl) {
      priceEl.textContent = `${Number(premium).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} บาท/ปี`;
    }
    if (metaEl) {
      metaEl.textContent = [brand, model, year].filter(Boolean).join(' · ');
    }
    host.hidden = false;
    if (!host.dataset.bound) {
      host.dataset.bound = '1';
      host.querySelector('#btnAxaPrbQuote')?.addEventListener('click', () => {
        toast?.(`สร้างใบเสนอราคา พ.ร.บ. · ${priceEl?.textContent || ''}`);
      });
      host.querySelector('#btnAxaPrbPolicy')?.addEventListener('click', () => {
        toast?.(`พร้อมสร้างกรมธรรม์ พ.ร.บ. · ${priceEl?.textContent || ''}`);
      });
    }
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  validateQuote(form) {
    const mode = this.getPolicyMode(form);
    const requiredIds = mode === 'compulsory'
      ? ['carBrand', 'carModel', 'carYear', 'regType', 'carSubmodel', 'regProvince', 'coverageStart']
      : ['carBrand', 'carModel', 'carYear', 'regType', 'carSubmodel', 'regProvince', 'usageType', 'dashcam', 'coverageStart'];

    for (const id of requiredIds) {
      const el = form.querySelector(`#${id}`);
      if (!el || el.disabled || !String(el.value || '').trim()) {
        el?.focus();
        el?.reportValidity?.();
        return false;
      }
    }
    return { ok: true, mode };
  },

  bind(form, { onPremiumSync, onBrochureTab, toast } = {}) {
    if (!form || form.dataset.axaQuoteBound === '1') return;
    form.dataset.axaQuoteBound = '1';

    this.syncModels(form);
    this.syncCoverageEnd(form);
    this.syncArea(form);
    this.setDriverMode(form, false);
    this.setPolicyMode(form, 'voluntary');

    form.querySelector('#carBrand')?.addEventListener('change', () => {
      this.syncModels(form);
      onPremiumSync?.();
    });
    form.querySelector('#carModel')?.addEventListener('change', () => {
      this.syncYears(form);
      onPremiumSync?.();
    });
    form.querySelector('#carYear')?.addEventListener('change', () => {
      this.syncSubmodels(form);
      onPremiumSync?.();
    });
    form.querySelector('#coverageStart')?.addEventListener('change', () => {
      this.syncCoverageEnd(form);
    });
    form.querySelector('#regProvince')?.addEventListener('change', () => {
      this.syncArea(form);
      onPremiumSync?.();
    });

    form.querySelectorAll('input[name="policyType"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const val = this.getPolicyMode(form);
        this.setPolicyMode(form, val);
      });
    });

    form.querySelector('#driverToggle')?.addEventListener('click', () => {
      const named = form.querySelector('#driverMode')?.value !== 'named';
      this.setDriverMode(form, named);
    });

    form.querySelector('#btnCheckPrice')?.addEventListener('click', () => {
      const result = this.validateQuote(form);
      if (result === false) {
        toast?.('กรุณากรอกข้อมูลที่จำเป็นให้ครบก่อนตรวจสอบราคา', 'error');
        return;
      }
      if (result && result.ok === false) {
        toast?.(result.message, 'error');
        return;
      }
      this.syncArea(form);
      this.syncCoverageEnd(form);

      if (result.mode === 'compulsory') {
        this.showPrbResult(form, { toast });
        toast?.('แสดงราคา พ.ร.บ. แล้ว');
        return;
      }

      onBrochureTab?.(form.querySelector('#coverType')?.value || '3plus');
      onPremiumSync?.();
      this.showResult(form, { toast });
      toast?.('แสดงตารางเปรียบเทียบเบี้ยแล้ว');
    });
  }
};
