(function () {
  const form = document.getElementById('wht50SettingsForm');
  if (!form) return;

  const payerName = document.getElementById('payerName');
  const payerAddress = document.getElementById('payerAddress');
  const payerTaxId = document.getElementById('payerTaxId');

  const signatureFile = document.getElementById('payerSignatureFile');
  const signatureUrlData = document.getElementById('payerSignatureUrlData');
  const signaturePreview = document.getElementById('payerSignaturePreview');
  const signatureBadge = document.getElementById('signatureStatusBadge');
  const applyToUnprinted = document.getElementById('applyToUnprinted');

  const btnReset = document.getElementById('btnWht50Reset');
  const btnPreview = document.getElementById('btnWht50Preview');
  const btnClearSignature = document.getElementById('btnClearSignature');

  const DEFAULTS = {
    payer: {
      name: (App.Config?.COMPANY?.name || ''),
      address: (App.Config?.COMPANY?.address || ''),
      taxId: (App.Config?.COMPANY?.taxId || '')
    },
    signatureUrlData: null
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

  function buildPreviewDoc(settings) {
    const payer = {
      ...(App.Wht50Document?.DEFAULT_PAYER || {}),
      ...(settings?.payer || {}),
      signatureUrl: settings?.signatureUrlData || undefined
    };
    return {
      ...(App.Wht50Document?.SAMPLE_FROM_PDF || {}),
      payer,
      signatureUrl: settings?.signatureUrlData || undefined
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

  function fillForm(settings) {
    const next = { ...DEFAULTS, ...(settings || {}) };
    setField(payerName, next.payer?.name);
    setField(payerAddress, next.payer?.address);
    setField(payerTaxId, next.payer?.taxId);

    if (signatureUrlData) signatureUrlData.value = next.signatureUrlData || '';
    updateSignaturePreview();
  }

  function readForm() {
    return {
      payer: {
        name: (payerName?.value || '').trim(),
        address: (payerAddress?.value || '').trim(),
        taxId: String(payerTaxId?.value || '').replace(/\D/g, '').trim()
      },
      signatureUrlData: (signatureUrlData?.value || '').trim() || null,
      applyToUnprinted: !!applyToUnprinted?.checked
    };
  }

  signatureFile?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('ไฟล์ลายเซ็นใหญ่เกิน 2MB', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (signatureUrlData) signatureUrlData.value = String(reader.result || '');
      updateSignaturePreview();
    };
    reader.readAsDataURL(file);
  });

  btnClearSignature?.addEventListener('click', () => {
    if (signatureUrlData) signatureUrlData.value = '';
    if (signatureFile) signatureFile.value = '';
    updateSignaturePreview();
  });

  btnReset?.addEventListener('click', async () => {
    if (!confirm('คืนค่า 50 ทวิเป็นค่าเริ่มต้น (ลายเซ็น/รายละเอียดผู้จ่าย)?')) return;
    fillForm(DEFAULTS);
    if (signatureFile) signatureFile.value = '';
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

    const btn = document.getElementById('btnWht50Save');
    const payload = readForm();

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
