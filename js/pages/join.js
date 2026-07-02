document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const form = document.getElementById('joinForm');
  if (!form) return;

  const TOTAL_STEPS = 4;
  let currentStep = 1;
  let provinceMap = new Map();
  let districtMap = new Map();

  const alertEl = document.getElementById('joinAlert');
  const prevBtn = document.getElementById('joinPrev');
  const nextBtn = document.getElementById('joinNext');
  const submitBtn = document.getElementById('joinSubmit');
  const summaryEl = document.getElementById('joinSummary');
  const uploadZone = document.getElementById('idUploadZone');
  const fileInput = document.getElementById('idCardFile');
  const previewWrap = document.getElementById('idUploadPreview');
  const previewImg = document.getElementById('idUploadImg');
  const previewName = document.getElementById('idUploadName');

  const provinceSelect = document.getElementById('province');
  const districtSelect = document.getElementById('district');
  const subdistrictSelect = document.getElementById('subdistrict');
  const zipcodeInput = document.getElementById('zipcode');
  const workProvinceSelect = document.getElementById('workProvince');

  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  initBirthSelects();
  initGeo();
  initUpload();
  updateStepUI();

  prevBtn.addEventListener('click', () => goToStep(currentStep - 1));
  nextBtn.addEventListener('click', () => {
    if (validateStep(currentStep)) goToStep(currentStep + 1);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlert();
    if (!validateStep(4)) return;

    alertEl.className = 'joinReg__alert is-success';
    alertEl.innerHTML =
      'บันทึกข้อมูลสมัครสมาชิกเรียบร้อยแล้ว ทีมงานจะติดต่อกลับภายใน 1–2 วันทำการ หรือโทร <a href="tel:0826164555">082-616-4555</a><br><br>' +
      '<a href="login.html">ไปหน้าเข้าสู่ระบบ</a>';
    submitBtn.disabled = true;
    nextBtn.disabled = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  provinceSelect.addEventListener('change', onProvinceChange);
  districtSelect.addEventListener('change', onDistrictChange);
  subdistrictSelect.addEventListener('change', onSubdistrictChange);

  function initBirthSelects() {
    const daySel = document.getElementById('birthDay');
    const monthSel = document.getElementById('birthMonth');
    const yearSel = document.getElementById('birthYear');

    for (let d = 1; d <= 31; d += 1) {
      daySel.add(new Option(String(d), String(d)));
    }
    THAI_MONTHS.forEach((name, i) => {
      monthSel.add(new Option(name, String(i + 1)));
    });
    const currentBE = new Date().getFullYear() + 543;
    for (let y = currentBE - 20; y >= currentBE - 80; y -= 1) {
      yearSel.add(new Option(String(y), String(y)));
    }
  }

  async function initGeo() {
    try {
      const provinces = await GeoTH.getProvinces();
      provinces.forEach((p) => {
        provinceMap.set(p.nameTh, p.id);
        provinceSelect.add(new Option(p.nameTh, p.nameTh));
        workProvinceSelect.add(new Option(p.nameTh, p.nameTh));
      });
    } catch (err) {
      console.warn('GeoTH unavailable', err);
    }
  }

  async function onProvinceChange() {
    resetSelect(districtSelect, 'กรุณาเลือกเขต/อำเภอ', true);
    resetSelect(subdistrictSelect, 'กรุณาเลือกแขวง/ตำบล', true);
    zipcodeInput.value = '';
    districtMap.clear();

    const provinceName = provinceSelect.value;
    const provinceId = provinceMap.get(provinceName);
    if (!provinceId) return;

    try {
      const districts = await GeoTH.getDistricts(provinceId);
      districts.forEach((d) => {
        districtMap.set(d.nameTh, d.id);
        districtSelect.add(new Option(d.nameTh, d.nameTh));
      });
      districtSelect.disabled = false;
    } catch (err) {
      console.warn('GeoTH districts error', err);
    }
  }

  async function onDistrictChange() {
    resetSelect(subdistrictSelect, 'กรุณาเลือกแขวง/ตำบล', true);
    zipcodeInput.value = '';

    const districtId = districtMap.get(districtSelect.value);
    if (!districtId) return;

    try {
      const subs = await GeoTH.getSubdistricts(districtId);
      subs.forEach((s) => {
        const opt = new Option(s.nameTh, s.nameTh);
        opt.dataset.zip = s.zipCode || '';
        subdistrictSelect.add(opt);
      });
      subdistrictSelect.disabled = false;
    } catch (err) {
      console.warn('GeoTH subdistricts error', err);
    }
  }

  function onSubdistrictChange() {
    const opt = subdistrictSelect.selectedOptions[0];
    zipcodeInput.value = opt && opt.dataset.zip ? opt.dataset.zip : '';
  }

  function resetSelect(sel, placeholder, disable) {
    sel.innerHTML = '';
    sel.add(new Option(placeholder, ''));
    sel.disabled = !!disable;
  }

  function initUpload() {
    ['dragenter', 'dragover'].forEach((evt) => {
      uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        uploadZone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach((evt) => {
      uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        uploadZone.classList.remove('is-dragover');
      });
    });
    uploadZone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) setUploadFile(file);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) setUploadFile(fileInput.files[0]);
    });
  }

  function setUploadFile(file) {
    if (!file.type.startsWith('image/')) {
      showError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG)');
      fileInput.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('ไฟล์มีขนาดเกิน 5 MB กรุณาเลือกไฟล์ใหม่');
      fileInput.value = '';
      return;
    }
    hideAlert();
    const reader = new FileReader();
    reader.onload = () => {
      previewImg.src = reader.result;
      previewName.textContent = file.name;
      previewWrap.classList.add('is-show');
    };
    reader.readAsDataURL(file);
  }

  function goToStep(step) {
    if (step < 1 || step > TOTAL_STEPS) return;
    currentStep = step;
    updateStepUI();
    if (currentStep === 4) renderSummary();
    hideAlert();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStepUI() {
    document.querySelectorAll('[data-step]').forEach((panel) => {
      panel.classList.toggle('is-active', Number(panel.dataset.step) === currentStep);
    });
    document.querySelectorAll('[data-step-indicator]').forEach((el) => {
      const n = Number(el.dataset.stepIndicator);
      el.classList.toggle('is-active', n === currentStep);
      el.classList.toggle('is-done', n < currentStep);
    });
    prevBtn.hidden = currentStep === 1;
    nextBtn.hidden = currentStep === TOTAL_STEPS;
    submitBtn.hidden = currentStep !== TOTAL_STEPS;
  }

  function validateStep(step) {
    hideAlert();
    clearInvalid();

    if (step === 1) {
      const required = [
        'memberType', 'title', 'fullName', 'idCard', 'phone',
        'birthDay', 'birthMonth', 'birthYear', 'occupation', 'email',
        'addressNo', 'province', 'district', 'subdistrict', 'zipcode', 'workProvince'
      ];
      if (!validateRequired(required)) return false;
      if (!/^\d{13}$/.test(form.idCard.value.trim())) {
        showError('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
        markInvalid('idCard');
        return false;
      }
      if (!isAdult()) {
        showError('ผู้สมัครต้องมีอายุไม่ต่ำกว่า 20 ปี');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())) {
        showError('รูปแบบอีเมลไม่ถูกต้อง');
        markInvalid('email');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!fileInput.files || !fileInput.files.length) {
        showError('กรุณาอัปโหลดภาพบัตรประชาชน');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!form.acceptTerms.checked) {
        showError('กรุณายอมรับเงื่อนไขการสมัครสมาชิก');
        return false;
      }
      return true;
    }

    if (step === 4) {
      const required = ['username', 'password', 'passwordConfirm'];
      if (!validateRequired(required)) return false;
      if (form.password.value.length < 6) {
        showError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        markInvalid('password');
        return false;
      }
      if (form.password.value !== form.passwordConfirm.value) {
        showError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        markInvalid('passwordConfirm');
        return false;
      }
      if (!form.acceptTerms.checked) {
        showError('กรุณายอมรับเงื่อนไขการสมัครสมาชิก');
        goToStep(3);
        return false;
      }
      return true;
    }

    return true;
  }

  function validateRequired(names) {
    let ok = true;
    names.forEach((name) => {
      const el = form.elements[name];
      if (!el) return;
      const val = el.type === 'checkbox' ? el.checked : String(el.value || '').trim();
      if (!val) {
        markInvalid(name);
        ok = false;
      }
    });
    if (!ok) showError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
    return ok;
  }

  function isAdult() {
    const day = Number(form.birthDay.value);
    const month = Number(form.birthMonth.value);
    const yearBE = Number(form.birthYear.value);
    if (!day || !month || !yearBE) return false;
    const birth = new Date(yearBE - 543, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
    return age >= 20;
  }

  function renderSummary() {
    const memberType = form.memberType.value === 'juristic' ? 'นิติบุคคล' : 'บุคคลทั่วไป';
    const birth = `${form.birthDay.value} ${THAI_MONTHS[Number(form.birthMonth.value) - 1]} ${form.birthYear.value}`;
    const address = `${form.addressNo.value} ต.${form.subdistrict.value} อ.${form.district.value} จ.${form.province.value} ${form.zipcode.value}`;
    const fileName = fileInput.files[0] ? fileInput.files[0].name : '-';

    const rows = [
      ['ประเภทสมาชิก', memberType],
      ['ชื่อ-นามสกุล', `${form.title.value} ${form.fullName.value}`],
      ['เลขบัตรประชาชน', form.idCard.value],
      ['เบอร์โทร', form.phone.value],
      ['วันเกิด', birth],
      ['อาชีพ', form.occupation.value],
      ['อีเมล', form.email.value],
      ['รหัสผู้แนะนำ', form.referrer.value.trim() || '-'],
      ['ที่อยู่', address],
      ['จังหวัดที่ทำงาน', form.workProvince.value],
      ['เอกสารแนบ', fileName],
      ['ชื่อผู้ใช้', form.username.value]
    ];

    summaryEl.innerHTML = rows.map(([label, value]) =>
      `<div class="joinReg__summaryRow"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`
    ).join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showError(msg) {
    alertEl.className = 'joinReg__alert is-error';
    alertEl.textContent = msg;
    alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    alertEl.className = 'joinReg__alert';
    alertEl.textContent = '';
  }

  function markInvalid(name) {
    const el = form.elements[name];
    if (el) el.classList.add('is-invalid');
  }

  function clearInvalid() {
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  }
});
