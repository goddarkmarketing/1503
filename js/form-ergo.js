/* ภาคบังคับ (พ.ร.บ.) — เออร์โกประกันภัย */

let licenseProvinceSS;
let insuredProvinceSS;
let insuredDistrictSS;
let insuredSubdistrictSS;

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initCoverageDays();
  initPremiumCalc();
  initCarCodePicker();
  initCarColorPicker();
  initTitlePicker();
  await initGeoLocation();
  await fillMockData();
  initSubmit();
});

function initCoverageDays() {
  const start = document.getElementById('coverageStart');
  const end = document.getElementById('coverageEnd');
  const days = document.getElementById('coverageDays');

  if (!start || !end || !days) return;

  const today = formatDateInput(new Date());
  start.value = today;
  end.value = addYears(today, 1);
  updateDays();

  [start, end].forEach((el) => el.addEventListener('change', updateDays));

  function updateDays() {
    if (!start.value || !end.value) return;
    const s = new Date(start.value);
    const e = new Date(end.value);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
    days.value = diff >= 0 ? diff : 0;
  }
}

function addYears(dateStr, years) {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return formatDateInput(d);
}

function formatDateInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  if (typeof date === 'string') date = new Date(date);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function money(n) {
  return (parseFloat(n) || 0).toFixed(2);
}

function initPremiumCalc() {
  const prem = document.getElementById('premiumPrem');
  const vat = document.getElementById('premiumVat');
  const stamp = document.getElementById('premiumStamp');
  const total = document.getElementById('premiumTotal');

  if (!total) return;

  [prem, vat, stamp].forEach((el) => {
    el?.addEventListener('input', calcTotal);
  });

  calcTotal();

  function calcTotal() {
    const p = parseFloat(prem?.value) || 0;
    const v = parseFloat(vat?.value) || 0;
    const s = parseFloat(stamp?.value) || 0;
    const sum = p + v + s;
    total.value = money(sum);

    const setText = (id, val) => {
      const node = document.getElementById(id);
      if (node) node.textContent = money(val);
    };
    setText('summaryPrem', p);
    setText('summaryVat', v);
    setText('summaryStamp', s);
    setText('summaryTotal', sum);
  }

  window.__ergoRecalcPremium = calcTotal;
}

const ERGO_CAR_CODES = {
  '1.10': {
    code2: 'รถยนต์นั่งไม่เกิน 7',
    type: 'รถยนต์นั่ง',
    prem: 600,
    vat: 42.21,
    stamp: 3
  },
  E11PA: {
    code2: 'รถยนต์นั่งไม่เกิน 7',
    type: 'รถยนต์นั่ง',
    prem: 600,
    vat: 42.21,
    stamp: 3
  },
  '1.20A': {
    code2: 'โดยสาร ไม่เกิน 15',
    type: 'รถยนต์โดยสาร',
    prem: 1100,
    vat: 77.35,
    stamp: 5
  },
  '1.40A': {
    code2: 'กระบะบรรทุก ไม่เกิน',
    type: 'รถยนต์บรรทุก',
    prem: 900,
    vat: 63.28,
    stamp: 4
  },
  E32PA: {
    code2: 'กะบะบรรทุก ไม่เกิน',
    type: 'รถยนต์บรรทุก',
    prem: 900,
    vat: 63.28,
    stamp: 4
  }
};

function applyCarCode(code) {
  const row = ERGO_CAR_CODES[code];
  const code1 = document.getElementById('carCode1');
  const code2 = document.getElementById('carCode2');
  const carType = document.getElementById('carType');
  const prem = document.getElementById('premiumPrem');
  const vat = document.getElementById('premiumVat');
  const stamp = document.getElementById('premiumStamp');

  if (!row) {
    if (code2) code2.value = '';
    if (carType) carType.value = '';
    return;
  }

  if (code1) code1.value = code;
  if (code2) code2.value = row.code2;
  if (carType) carType.value = row.type;
  if (prem) prem.value = money(row.prem);
  if (vat) vat.value = money(row.vat);
  if (stamp) stamp.value = String(row.stamp);
  window.__ergoRecalcPremium?.();
}

function initCarCodePicker() {
  const input = document.getElementById('carCode1');
  const menu = document.getElementById('carCodeMenu');
  const picker = input?.closest('.ergo-carcode__picker');
  if (!input || !menu || !picker) return;

  const openMenu = () => {
    menu.hidden = false;
    picker.classList.add('is-open');
  };
  const closeMenu = () => {
    menu.hidden = true;
    picker.classList.remove('is-open');
  };

  input.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  menu.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-code]');
    if (!chip) return;
    applyCarCode(chip.dataset.code);
    menu.querySelectorAll('[data-code]').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.code === chip.dataset.code);
    });
    closeMenu();
  });

  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) closeMenu();
  });
}

function initCarColorPicker() {
  const input = document.getElementById('carColor');
  const menu = document.getElementById('carColorMenu');
  const picker = input?.closest('.ergo-color__picker');
  if (!input || !menu || !picker) return;

  const openMenu = () => {
    menu.hidden = false;
    picker.classList.add('is-open');
  };
  const closeMenu = () => {
    menu.hidden = true;
    picker.classList.remove('is-open');
  };

  input.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  menu.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-color]');
    if (!chip) return;
    const color = chip.dataset.color;
    input.value = color;
    input.style.setProperty('--selected-color', chip.style.getPropertyValue('--chip-border') || '#94a3b8');
    input.classList.add('has-color');
    menu.querySelectorAll('[data-color]').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.color === color);
    });
    closeMenu();
  });

  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) closeMenu();
  });
}

function initTitlePicker() {
  const input = document.getElementById('titleTh');
  const titleEn = document.getElementById('titleEn');
  const menu = document.getElementById('titleThMenu');
  const picker = input?.closest('.ergo-title__picker');
  const btnOther = document.getElementById('titleThOther');
  const btnClose = document.getElementById('titleThClose');
  if (!input || !menu || !picker) return;

  const openMenu = () => {
    menu.hidden = false;
    picker.classList.add('is-open');
  };
  const closeMenu = () => {
    menu.hidden = true;
    picker.classList.remove('is-open');
  };

  input.addEventListener('click', (e) => {
    e.stopPropagation();
    if (input.readOnly) {
      if (menu.hidden) openMenu();
      else closeMenu();
    }
  });

  menu.addEventListener('click', (e) => {
    e.stopPropagation();
    const chip = e.target.closest('[data-title]');
    if (!chip) return;
    const title = chip.dataset.title;
    input.value = title;
    input.readOnly = true;
    if (titleEn) titleEn.value = chip.dataset.titleEn || '';
    menu.querySelectorAll('[data-title]').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.title === title);
    });
    closeMenu();
  });

  btnOther?.addEventListener('click', (e) => {
    e.stopPropagation();
    input.readOnly = false;
    input.value = '';
    input.placeholder = 'ระบุคำนำหน้า';
    if (titleEn) titleEn.value = '';
    menu.querySelectorAll('[data-title]').forEach((el) => el.classList.remove('is-active'));
    closeMenu();
    input.focus();
  });

  btnClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });

  input.addEventListener('blur', () => {
    if (!input.readOnly && !input.value.trim()) {
      input.readOnly = true;
      input.placeholder = '--เลือก--';
    }
  });

  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) closeMenu();
  });
}

async function initGeoLocation() {
  const licenseProvince = document.getElementById('licenseProvince');
  const insuredProvince = document.getElementById('insuredProvince');
  const insuredDistrict = document.getElementById('insuredDistrict');
  const insuredSubdistrict = document.getElementById('insuredSubdistrict');
  const insuredPostal = document.getElementById('insuredPostal');

  if (!insuredProvince || typeof SearchableSelect === 'undefined' || typeof GeoTH === 'undefined') return;

  licenseProvinceSS = SearchableSelect.create(licenseProvince, { placeholder: '--เลือกจังหวัด--' });
  insuredProvinceSS = SearchableSelect.create(insuredProvince, { placeholder: 'เลือกจังหวัด' });
  insuredDistrictSS = SearchableSelect.create(insuredDistrict, { placeholder: '--อำเภอ/เขต--' });
  insuredSubdistrictSS = SearchableSelect.create(insuredSubdistrict, { placeholder: '--ตำบล/แขวง--' });

  insuredDistrictSS.reset('--อำเภอ/เขต--');
  insuredSubdistrictSS.reset('--ตำบล/แขวง--');

  try {
    licenseProvinceSS.setLoading();
    insuredProvinceSS.setLoading();

    const provinces = await GeoTH.getProvinces();
    const provinceItems = provinces.map((p) => ({ value: p.nameTh, label: p.nameTh, id: p.id }));

    licenseProvinceSS.setOptions(provinceItems, '--เลือกจังหวัด--');
    insuredProvinceSS.setOptions(provinceItems, 'เลือกจังหวัด');
  } catch (err) {
    console.error(err);
    licenseProvinceSS.setError();
    insuredProvinceSS.setError();
    return;
  }

  insuredProvince.addEventListener('change', async () => {
    insuredSubdistrictSS.reset('--ตำบล/แขวง--');
    if (insuredPostal) insuredPostal.value = '';

    const provinceId = insuredProvinceSS.getSelectedId();
    if (!provinceId) {
      insuredDistrictSS.reset('--อำเภอ/เขต--');
      return;
    }

    try {
      insuredDistrictSS.setLoading();
      const districts = await GeoTH.getDistricts(provinceId);
      insuredDistrictSS.setOptions(
        districts.map((d) => ({ value: d.nameTh, label: d.nameTh, id: d.id })),
        '--อำเภอ/เขต--'
      );
    } catch (err) {
      console.error(err);
      insuredDistrictSS.setError();
    }
  });

  insuredDistrict.addEventListener('change', async () => {
    if (insuredPostal) insuredPostal.value = '';

    const districtId = insuredDistrictSS.getSelectedId();
    if (!districtId) {
      insuredSubdistrictSS.reset('--ตำบล/แขวง--');
      return;
    }

    try {
      insuredSubdistrictSS.setLoading();
      const subdistricts = await GeoTH.getSubdistricts(districtId);
      insuredSubdistrictSS.setOptions(
        subdistricts.map((s) => ({
          value: s.nameTh,
          label: s.nameTh,
          id: s.id,
          zip: s.zipCode ? String(s.zipCode).padStart(5, '0') : ''
        })),
        '--ตำบล/แขวง--'
      );
    } catch (err) {
      console.error(err);
      insuredSubdistrictSS.setError();
    }
  });

  insuredSubdistrict.addEventListener('change', () => {
    if (insuredPostal) insuredPostal.value = insuredSubdistrictSS.getSelectedZip();
  });
}

/** Mock data for UI demo — remove when wiring real API */
async function fillMockData() {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  applyCarCode('1.20A');
  document.querySelector('#carCodeMenu [data-code="1.20A"]')?.classList.add('is-active');

  set('carBrand', 'TT');
  set('carModel', 'TOYOTA');
  set('licensePlate', 'กฉ 7773');
  set('chassisNo', 'JTEGD23H508130210');
  set('carSeats', '7');
  set('carCC', '2362');
  set('carWeight', '2000');
  set('carYear', '2015');
  set('carColor', 'ขาว');
  document.getElementById('carColor')?.classList.add('has-color');
  document.querySelector('#carColorMenu [data-color="ขาว"]')?.classList.add('is-active');

  set('titleTh', 'นางสาว');
  set('titleEn', 'Ms.');
  document.querySelector('#titleThMenu [data-title="นางสาว"]')?.classList.add('is-active');
  set('idNumber', '1689900095751');
  set('firstName', 'กิรณา');
  set('lastName', 'นิธิธราวนารี');
  set('address', '75/13 ถนนนอกทางรถไฟ');
  set('phone', '0812345678');
  set('email', 'demo@kladee.co.th');

  await selectSearchable(licenseProvinceSS, 'นครสวรรค์');
  await selectSearchable(insuredProvinceSS, 'พิจิตร');
  await waitForSelectReady(document.getElementById('insuredDistrict'));
  await selectSearchable(insuredDistrictSS, 'เมืองพิจิตร');
  await waitForSelectReady(document.getElementById('insuredSubdistrict'));

  const sub = document.getElementById('insuredSubdistrict');
  const firstSub = [...(sub?.options || [])].find((o) => o.value)?.value || 'ในเมือง';
  await selectSearchable(insuredSubdistrictSS, firstSub);

  const postal = document.getElementById('insuredPostal');
  if (postal && !postal.value) postal.value = '66000';
}

function selectSearchable(ss, value) {
  if (!ss || !value) return Promise.resolve();
  const select = ss.select;
  if (![...select.options].some((o) => o.value === value)) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    if (value === 'เมืองพิจิตร' || value === 'ในเมือง') opt.dataset.id = 'mock';
    if (value === 'ในเมือง') opt.dataset.zip = '66000';
    select.appendChild(opt);
  }
  ss.enable();
  select.disabled = false;
  select.value = value;
  ss.syncInputFromSelect();
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return Promise.resolve();
}

function waitForSelectReady(select, timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (!select) return resolve();
    const started = Date.now();
    const tick = () => {
      const ready = !select.disabled && [...select.options].some((o) => o.value);
      if (ready || Date.now() - started > timeoutMs) {
        resolve();
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}

let currentStep = 1;

function initSubmit() {
  const btnNext = document.getElementById('btnNext');
  const btnPrev = document.getElementById('btnPrev');
  const form = document.getElementById('ergoForm');
  if (!btnNext || !form) return;

  btnNext.addEventListener('click', () => {
    if (currentStep === 1) {
      if (!validateForm(form)) return;
      fillConfirmSummary(form);
      goToStep(2);
      return;
    }
    submitPolicy(form);
  });

  btnPrev?.addEventListener('click', () => {
    if (currentStep === 2) goToStep(1);
  });
}

function goToStep(step) {
  currentStep = step;
  const step1 = document.getElementById('ergoStep1');
  const step2 = document.getElementById('ergoStep2');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const hint = document.getElementById('formStepHint');
  const badge = document.getElementById('ergoStepBadge');

  if (step1) step1.hidden = step !== 1;
  if (step2) step2.hidden = step !== 2;
  if (btnPrev) btnPrev.hidden = step === 1;

  if (badge) badge.textContent = `Step ${step} of 2`;

  if (hint) {
    hint.textContent = step === 1
      ? 'ตรวจสอบข้อมูลให้ครบถ้วนก่อนดำเนินการต่อ'
      : 'ตรวจสอบข้อมูลอีกครั้งก่อนยืนยันส่งกรมธรรม์';
  }

  if (btnNext) {
    btnNext.innerHTML = step === 2
      ? 'ยืนยัน <i data-lucide="check" style="width:18px;height:18px"></i>'
      : 'ถัดไป <i data-lucide="arrow-right" style="width:18px;height:18px"></i>';
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function val(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function formatDateTh(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`;
}

function joinParts(parts, sep = ' | ') {
  const list = parts.map((p) => String(p || '').trim()).filter(Boolean);
  return list.length ? list.join(sep) : '—';
}

function setConfirmText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '—';
}

function fillConfirmSummary() {
  setConfirmText('cfAgentCode', val('agentCode') || '—');
  setConfirmText(
    'cfCoverage',
    `${formatDateTh(val('coverageStart'))} ถึง ${formatDateTh(val('coverageEnd'))}`
  );
  setConfirmText('cfPremiumTotal', val('premiumTotal') || '0.00');

  setConfirmText('cfCarCode', joinParts([val('carCode1'), val('carCode2')]));
  setConfirmText('cfCarBrand', joinParts([val('carBrand'), val('carModel')]));
  setConfirmText('cfLicense', val('licensePlate') || '—');
  setConfirmText('cfLicenseProvince', val('licenseProvince') || '—');
  setConfirmText('cfChassis', val('chassisNo') || '—');
  setConfirmText(
    'cfSpecs',
    `${val('carSeats') || '0'} / ${val('carCC') || '0'} / ${val('carWeight') || '0'}`
  );

  setConfirmText('cfTitle', val('titleTh') || '—');
  setConfirmText('cfName', joinParts([val('firstName'), val('lastName')], ' '));
  setConfirmText('cfAddress', val('address') || '—');
  setConfirmText('cfDistrict', val('insuredDistrict') || '—');
  setConfirmText('cfProvince', val('insuredProvince') || '—');
  setConfirmText('cfPostal', val('insuredPostal') || '—');
  setConfirmText('cfIdNumber', val('idNumber') || '—');
}

function validateForm(form) {
  const step1 = document.getElementById('ergoStep1');
  const fields = (step1 || form).querySelectorAll('input, select, textarea');
  for (const field of fields) {
    if (field.disabled) continue;
    if (!field.checkValidity()) {
      field.reportValidity();
      field.focus();
      return false;
    }
  }
  return true;
}

async function submitPolicy(form) {
  const btn = document.getElementById('btnNext');
  const data = Object.fromEntries(new FormData(form));
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';
  }
  try {
    if (window.App?.PolicyService) {
      const policy = await App.PolicyService.createPolicy(data);
      sessionStorage.setItem('lastIssuedPolicy', JSON.stringify(policy));
      window.location.href = '../agent/success.html';
    } else {
      alert('ยืนยันการส่งกรมธรรม์เรียบร้อย');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'ยืนยัน <i data-lucide="check" style="width:18px;height:18px"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  } catch (err) {
    alert(err.message || 'บันทึกไม่สำเร็จ');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'ยืนยัน <i data-lucide="check" style="width:18px;height:18px"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
}
