(function () {
  const form = document.getElementById('wht50SettingsForm');
  if (!form) return;

  const payerName = document.getElementById('payerName');
  const payerAddress = document.getElementById('payerAddress');
  const payerTaxId = document.getElementById('payerTaxId');
  const payerTypeHint = document.getElementById('payerTypeHint');

  const signatureFile = document.getElementById('payerSignatureFile');
  const signatureUrlData = document.getElementById('payerSignatureUrlData');
  const signaturePreview = document.getElementById('payerSignaturePreview');
  const signatureBadge = document.getElementById('signatureStatusBadge');

  const stampFile = document.getElementById('payerStampFile');
  const stampUrlData = document.getElementById('payerStampUrlData');
  const stampPreview = document.getElementById('payerStampPreview');
  const stampEmpty = document.getElementById('payerStampEmpty');
  const stampBadge = document.getElementById('stampStatusBadge');

  const applyToUnprinted = document.getElementById('applyToUnprinted');
  const btnReset = document.getElementById('btnWht50Reset');
  const btnPreview = document.getElementById('btnWht50Preview');
  const btnClearSignature = document.getElementById('btnClearSignature');
  const btnClearStamp = document.getElementById('btnClearStamp');

  const DEFAULTS = {
    payer: {
      name: (App.Config?.COMPANY?.name || ''),
      address: (App.Config?.COMPANY?.address || ''),
      taxId: (App.Config?.COMPANY?.taxId || '')
    },
    signatureUrlData: null,
    stampUrlData: null
  };

  const showToast = (msg, type) => {
    if (App.AdminUtils?.showToast) return App.AdminUtils.showToast(msg, type);
    alert(msg);
  };

  function setField(el, value) {
    if (!el) return;
    el.value = value == null ? '' : String(value);
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function isCompanyName(name) {
    if (App.Wht50Document?.isCompanyPayer) return App.Wht50Document.isCompanyPayer(name);
    return /บริษัท|ห้างหุ้นส่วน|หจก\.?|บจก\.?|บมจ\.?|จำกัด|นิติบุคคล/i.test(String(name || ''));
  }

  function updatePayerTypeHint() {
    if (!payerTypeHint) return;
    if (isCompanyName(payerName?.value)) {
      payerTypeHint.textContent = 'ตรวจพบชื่อบริษัท — เอกสารจะใช้ลายเซ็น + ตราประทับ';
    } else {
      payerTypeHint.textContent = 'ตรวจพบชื่อบุคคล — เอกสารจะใช้ลายเซ็นอย่างเดียว ไม่ประทับตรา';
    }
  }

  function bindImageUpload(input, hidden, onDone, label) {
    input?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast(`ไฟล์${label}ใหญ่เกิน 2MB`, 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (hidden) hidden.value = String(reader.result || '');
        onDone();
      };
      reader.readAsDataURL(file);
    });
  }

  function buildPreviewDoc(settings) {
    const payer = {
      ...(App.Wht50Document?.DEFAULT_PAYER || {}),
      ...(settings?.payer || {}),
      signatureUrl: settings?.signatureUrlData || undefined,
      stampUrl: settings?.stampUrlData || undefined
    };
    return {
      ...(App.Wht50Document?.SAMPLE_FROM_PDF || {}),
      payer,
      signatureUrl: settings?.signatureUrlData || undefined,
      stampUrl: settings?.stampUrlData || undefined
    };
  }

  function updateSignaturePreview() {
    if (!signaturePreview) return;
    const value = (signatureUrlData?.value || '').trim();
    if (value) {
      signaturePreview.src = value;
      signaturePreview.alt = 'ลายเซ็น (จากไฟล์ที่อัปโหลด)';
      if (signatureBadge) {
        signatureBadge.textContent = 'อัปโหลดแล้ว';
        signatureBadge.classList.remove('agent-form__sectionBadge--muted');
      }
      return;
    }
    signaturePreview.src = '../assets/wht50/payer-signature.png';
    signaturePreview.alt = 'ลายเซ็นค่าเริ่มต้น';
    if (signatureBadge) {
      signatureBadge.textContent = 'ค่าเริ่มต้น';
      signatureBadge.classList.add('agent-form__sectionBadge--muted');
    }
  }

  function updateStampPreview() {
    const value = (stampUrlData?.value || '').trim();
    if (value && stampPreview) {
      stampPreview.src = value;
      stampPreview.hidden = false;
      if (stampEmpty) stampEmpty.hidden = true;
      if (stampBadge) {
        stampBadge.textContent = 'อัปโหลดแล้ว';
        stampBadge.classList.remove('agent-form__sectionBadge--muted');
      }
      return;
    }
    if (stampPreview) {
      stampPreview.removeAttribute('src');
      stampPreview.hidden = true;
    }
    if (stampEmpty) stampEmpty.hidden = false;
    if (stampBadge) {
      stampBadge.textContent = 'ยังไม่อัปโหลด';
      stampBadge.classList.add('agent-form__sectionBadge--muted');
    }
  }

  function fillForm(settings) {
    const next = { ...DEFAULTS, ...(settings || {}) };
    setField(payerName, next.payer?.name);
    setField(payerAddress, next.payer?.address);
    setField(payerTaxId, next.payer?.taxId);
    if (signatureUrlData) signatureUrlData.value = next.signatureUrlData || '';
    if (stampUrlData) stampUrlData.value = next.stampUrlData || '';
    updateSignaturePreview();
    updateStampPreview();
    updatePayerTypeHint();
  }

  function readForm() {
    return {
      payer: {
        name: (payerName?.value || '').trim(),
        address: (payerAddress?.value || '').trim(),
        taxId: String(payerTaxId?.value || '').replace(/\D/g, '').trim()
      },
      signatureUrlData: (signatureUrlData?.value || '').trim() || null,
      stampUrlData: (stampUrlData?.value || '').trim() || null,
      applyToUnprinted: !!applyToUnprinted?.checked
    };
  }

  bindImageUpload(signatureFile, signatureUrlData, updateSignaturePreview, 'ลายเซ็น');
  bindImageUpload(stampFile, stampUrlData, updateStampPreview, 'ตราประทับ');

  payerName?.addEventListener('input', updatePayerTypeHint);

  btnClearSignature?.addEventListener('click', () => {
    if (signatureUrlData) signatureUrlData.value = '';
    if (signatureFile) signatureFile.value = '';
    updateSignaturePreview();
  });

  btnClearStamp?.addEventListener('click', () => {
    if (stampUrlData) stampUrlData.value = '';
    if (stampFile) stampFile.value = '';
    updateStampPreview();
  });

  btnReset?.addEventListener('click', async () => {
    if (!confirm('คืนค่า 50 ทวิเป็นค่าเริ่มต้น (ลายเซ็น/ตราประทับ/รายละเอียดผู้จ่าย)?')) return;
    fillForm(DEFAULTS);
    if (signatureFile) signatureFile.value = '';
    if (stampFile) stampFile.value = '';
  });

  btnPreview?.addEventListener('click', async () => {
    try {
      const settings = readForm();
      App.Wht50Document?.openPreview?.(buildPreviewDoc(settings));
    } catch (err) {
      console.error(err);
      showToast(err.message || 'ดูตัวอย่างไม่สำเร็จ', 'error');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const taxDigits = String(payerTaxId?.value || '').replace(/\D/g, '');
    if (taxDigits.length !== 13) {
      showToast('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก', 'error');
      payerTaxId?.focus();
      return;
    }

    const payload = readForm();
    if (isCompanyName(payload.payer.name) && !payload.stampUrlData) {
      showToast('ออกชื่อบริษัทต้องอัปโหลดรูปตราประทับด้วย', 'error');
      stampFile?.click();
      return;
    }

    const btn = document.getElementById('btnWht50Save');
    try {
      await App.ButtonUI?.withLoading?.(btn, async () => {
        const saved = await App.Wht50Service.saveSettings(payload);
        fillForm(saved);
        showToast('บันทึกตั้งค่า 50 ทวิเรียบร้อยแล้ว');
        refreshIcons();
      }, { label: 'กำลังบันทึก...' });
    } catch (err) {
      console.error(err);
      showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  });

  fillForm(DEFAULTS);

  (async function boot() {
    try {
      if (App.Wht50Service?.getSettings) {
        const settings = await App.Wht50Service.getSettings();
        fillForm(settings);
      }
    } catch (err) {
      console.error(err);
    }
    refreshIcons();
  })();
})();
