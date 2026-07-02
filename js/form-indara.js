/* ภาคบังคับ (พ.ร.บ.) — อินทร */

let licenseProvinceSS;
let insuredProvinceSS;
let insuredDistrictSS;
let insuredSubdistrictSS;
let currentStep = 1;
const TOTAL_STEPS = 3;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initCoverageDays();
  initPremiumCalc();
  initFormSteps();
  initGeoLocation();
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

  [start, end].forEach(el => el.addEventListener('change', updateDays));

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

function initPremiumCalc() {
  const prem = document.getElementById('premiumPrem');
  const vat = document.getElementById('premiumVat');
  const stamp = document.getElementById('premiumStamp');
  const total = document.getElementById('premiumTotal');

  if (!total) return;

  [prem, vat, stamp].forEach(el => {
    el?.addEventListener('input', calcTotal);
  });

  function calcTotal() {
    const sum = [prem, vat, stamp].reduce((acc, el) => {
      return acc + (parseFloat(el?.value) || 0);
    }, 0);
    total.value = sum.toFixed(2);
  }
}

/* จังหวัด / อำเภอ / ตำบล / รหัสไปรษณีย์ — GeoTH API */
async function initGeoLocation() {
  const licenseProvince = document.getElementById('licenseProvince');
  const insuredProvince = document.getElementById('insuredProvince');
  const insuredDistrict = document.getElementById('insuredDistrict');
  const insuredSubdistrict = document.getElementById('insuredSubdistrict');
  const insuredPostal = document.getElementById('insuredPostal');

  if (!insuredProvince) return;

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
    const provinceItems = provinces.map(p => ({ value: p.nameTh, label: p.nameTh, id: p.id }));

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
    insuredPostal.value = '';

    const provinceId = insuredProvinceSS.getSelectedId();
    if (!provinceId) {
      insuredDistrictSS.reset('--อำเภอ/เขต--');
      return;
    }

    try {
      insuredDistrictSS.setLoading();
      const districts = await GeoTH.getDistricts(provinceId);
      insuredDistrictSS.setOptions(
        districts.map(d => ({ value: d.nameTh, label: d.nameTh, id: d.id })),
        '--อำเภอ/เขต--'
      );
    } catch (err) {
      console.error(err);
      insuredDistrictSS.setError();
    }
  });

  insuredDistrict.addEventListener('change', async () => {
    insuredPostal.value = '';

    const districtId = insuredDistrictSS.getSelectedId();
    if (!districtId) {
      insuredSubdistrictSS.reset('--ตำบล/แขวง--');
      return;
    }

    try {
      insuredSubdistrictSS.setLoading();
      const subdistricts = await GeoTH.getSubdistricts(districtId);
      insuredSubdistrictSS.setOptions(
        subdistricts.map(s => ({
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
    insuredPostal.value = insuredSubdistrictSS.getSelectedZip();
  });

  goToStep(currentStep);
}

function initFormSteps() {
  const btnNext = document.getElementById('btnNext');
  const btnPrev = document.getElementById('btnPrev');
  const form = document.getElementById('indaraForm');

  btnNext?.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    } else {
      submitPolicy(form);
    }
  });

  btnPrev?.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  document.querySelectorAll('.step-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = parseInt(item.dataset.step, 10);
      if (target === currentStep) return;
      if (target > currentStep) return;
      goToStep(target);
    });
  });

  goToStep(1);
}

function goToStep(step) {
  currentStep = step;

  document.querySelectorAll('.form-step').forEach(panel => {
    const n = parseInt(panel.dataset.step, 10);
    const active = n === step;
    panel.classList.toggle('step-active', active);
    toggleStepFields(panel, active);
  });

  document.querySelectorAll('.step-item').forEach(item => {
    const n = parseInt(item.dataset.step, 10);
    item.classList.toggle('active', n === step);
    item.classList.toggle('done', n < step);
  });

  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('done', i < step - 1);
  });

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  if (btnPrev) btnPrev.hidden = step === 1;

  if (btnNext) {
    btnNext.innerHTML = step === TOTAL_STEPS
      ? 'ยืนยันข้อมูล <i data-lucide="check" style="width:18px;height:18px"></i>'
      : 'ถัดไป <i data-lucide="arrow-right" style="width:18px;height:18px"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  const stepTitles = ['ข้อมูลกรมธรรม์', 'ข้อมูลรถยนต์', 'ข้อมูลผู้เอาประกัน'];
  const hint = document.getElementById('formStepHint');
  if (hint) hint.textContent = `ขั้นตอนที่ ${step} จาก ${TOTAL_STEPS} — ${stepTitles[step - 1]}`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleStepFields(panel, enabled) {
  const skipIds = ['agentCode', 'coverageDays', 'premiumTotal', 'insuredPostal', 'carCode2'];

  panel.querySelectorAll('input, select, textarea').forEach(el => {
    if (skipIds.includes(el.id)) return;
    if (el.readOnly && el.classList.contains('readonly')) return;
    if (el.classList.contains('search-select-native')) return;
    if (el.classList.contains('search-select-input')) return;
    el.disabled = !enabled;
  });

  if (panel.id === 'step-vehicle') {
    if (enabled && licenseProvinceSS) {
      const lp = document.getElementById('licenseProvince');
      lp?.options.length > 1 ? licenseProvinceSS.enable() : licenseProvinceSS.disable('--กำลังโหลด--');
    } else if (licenseProvinceSS) {
      licenseProvinceSS.disable('--เลือกจังหวัด--');
    }
  }

  if (panel.id === 'step-insured') {
    if (enabled) {
      const ip = document.getElementById('insuredProvince');
      if (ip?.options.length > 1) insuredProvinceSS?.enable();
      const id = document.getElementById('insuredDistrict');
      if (id?.options.length > 1) insuredDistrictSS?.enable();
      const is = document.getElementById('insuredSubdistrict');
      if (is?.options.length > 1) insuredSubdistrictSS?.enable();
    } else {
      insuredProvinceSS?.disable('เลือกจังหวัด');
      insuredDistrictSS?.disable('--อำเภอ/เขต--');
      insuredSubdistrictSS?.disable('--ตำบล/แขวง--');
    }
  }
}

function validateStep(step) {
  const panel = document.querySelector(`.form-step[data-step="${step}"]`);
  if (!panel) return true;

  const fields = panel.querySelectorAll('input, select, textarea');
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
      alert('บันทึกข้อมูลเรียบร้อย — พร้อมดำเนินการต่อ');
    }
  } catch (err) {
    alert(err.message || 'บันทึกไม่สำเร็จ');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'ยืนยันข้อมูล <i data-lucide="check" style="width:18px;height:18px"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
}
