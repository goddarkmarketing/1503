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

  const numberModeAuto = document.getElementById('numberModeAuto');
  const numberModeManual = document.getElementById('numberModeManual');
  const numberPanelAuto = document.getElementById('numberPanelAuto');
  const numberPanelManual = document.getElementById('numberPanelManual');
  const autoFormat = document.getElementById('autoFormat');
  const autoPrefix = document.getElementById('autoPrefix');
  const autoPrefixField = document.getElementById('autoPrefixField');
  const autoNextSeq = document.getElementById('autoNextSeq');
  const autoPad = document.getElementById('autoPad');
  const autoBookMode = document.getElementById('autoBookMode');
  const autoBookNo = document.getElementById('autoBookNo');
  const autoBookNoField = document.getElementById('autoBookNoField');
  const manualBookNo = document.getElementById('manualBookNo');
  const manualDocNo = document.getElementById('manualDocNo');
  const manualAutoBump = document.getElementById('manualAutoBump');
  const previewBookNo = document.getElementById('previewBookNo');
  const previewDocNo = document.getElementById('previewDocNo');

  const applyToUnprinted = document.getElementById('applyToUnprinted');
  const btnReset = document.getElementById('btnWht50Reset');
  const btnPreview = document.getElementById('btnWht50Preview');
  const btnClearSignature = document.getElementById('btnClearSignature');
  const btnClearStamp = document.getElementById('btnClearStamp');

  const DEFAULT_NUMBERING = {
    mode: 'auto',
    format: 'ym-seq',
    prefix: '',
    nextSeq: 1,
    pad: 4,
    bookMode: 'year',
    bookNo: '',
    manualBookNo: String(new Date().getFullYear() + 543),
    manualDocNo: '0001',
    manualAutoBump: true
  };

  const DEFAULTS = {
    payer: {
      name: (App.Config?.COMPANY?.name || ''),
      address: (App.Config?.COMPANY?.address || ''),
      taxId: (App.Config?.COMPANY?.taxId || '')
    },
    signatureUrlData: null,
    stampUrlData: null,
    numbering: { ...DEFAULT_NUMBERING }
  };

  const defaultSignatureSrc = () =>
    App.Wht50Document?.DEFAULT_SIGNATURE_PATH
      ? `../${App.Wht50Document.DEFAULT_SIGNATURE_PATH}?v=20260821b`
      : '../assets/wht50/payer-signature.png?v=20260821b';

  const defaultStampSrc = () =>
    App.Wht50Document?.DEFAULT_STAMP_PATH
      ? `../${App.Wht50Document.DEFAULT_STAMP_PATH}?v=20260821b`
      : '../assets/wht50/company-stamp.png?v=20260821b';

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

  function currentMode() {
    return numberModeManual?.checked ? 'manual' : 'auto';
  }

  function padSeq(seq, pad) {
    const n = Math.max(1, Number(seq) || 1);
    const width = Math.min(8, Math.max(1, Number(pad) || 4));
    return String(n).padStart(width, '0');
  }

  function thaiYm() {
    const now = new Date();
    return `${now.getFullYear() + 543}${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function thaiYear() {
    return String(new Date().getFullYear() + 543);
  }

  function previewNumbers(numbering) {
    const n = { ...DEFAULT_NUMBERING, ...(numbering || {}) };
    if (n.mode === 'manual') {
      return {
        bookNo: String(n.manualBookNo || '').trim() || '—',
        docNo: String(n.manualDocNo || '').trim() || '—'
      };
    }
    const seq = padSeq(n.nextSeq, n.pad);
    const prefix = String(n.prefix || '');
    let docNo = seq;
    if (n.format === 'ym-seq') docNo = `${thaiYm()}-${seq}`;
    else if (n.format === 'prefix-seq') docNo = `${prefix}${seq}`;
    const bookNo = n.bookMode === 'fixed'
      ? (String(n.bookNo || '').trim() || '—')
      : thaiYear();
    return { bookNo, docNo };
  }

  function syncNumberPanels() {
    const mode = currentMode();
    if (numberPanelAuto) numberPanelAuto.hidden = mode !== 'auto';
    if (numberPanelManual) numberPanelManual.hidden = mode !== 'manual';
    if (autoPrefixField) autoPrefixField.hidden = autoFormat?.value !== 'prefix-seq';
    if (autoBookNoField) autoBookNoField.hidden = autoBookMode?.value !== 'fixed';
    updateNumberPreview();
  }

  function updateNumberPreview() {
    const peek = previewNumbers(readNumbering());
    if (previewBookNo) previewBookNo.textContent = peek.bookNo;
    if (previewDocNo) previewDocNo.textContent = peek.docNo;
  }

  function readNumbering() {
    return {
      mode: currentMode(),
      format: autoFormat?.value || 'ym-seq',
      prefix: (autoPrefix?.value || '').trim(),
      nextSeq: Math.max(1, Number(autoNextSeq?.value) || 1),
      pad: Math.min(8, Math.max(1, Number(autoPad?.value) || 4)),
      bookMode: autoBookMode?.value === 'fixed' ? 'fixed' : 'year',
      bookNo: (autoBookNo?.value || '').trim(),
      manualBookNo: (manualBookNo?.value || '').trim(),
      manualDocNo: (manualDocNo?.value || '').trim(),
      manualAutoBump: !!manualAutoBump?.checked
    };
  }

  function fillNumbering(numbering) {
    const n = { ...DEFAULT_NUMBERING, ...(numbering || {}) };
    if (numberModeAuto) numberModeAuto.checked = n.mode !== 'manual';
    if (numberModeManual) numberModeManual.checked = n.mode === 'manual';
    setField(autoFormat, n.format || 'ym-seq');
    setField(autoPrefix, n.prefix || '');
    setField(autoNextSeq, n.nextSeq || 1);
    setField(autoPad, n.pad || 4);
    setField(autoBookMode, n.bookMode === 'fixed' ? 'fixed' : 'year');
    setField(autoBookNo, n.bookNo || '');
    setField(manualBookNo, n.manualBookNo || thaiYear());
    setField(manualDocNo, n.manualDocNo || '0001');
    if (manualAutoBump) manualAutoBump.checked = n.manualAutoBump !== false;
    syncNumberPanels();
  }

  function buildPreviewDoc(settings) {
    const signatureUrl = settings?.signatureUrlData || undefined;
    const stampUrl = settings?.stampUrlData || undefined;
    const payer = {
      ...(App.Wht50Document?.DEFAULT_PAYER || {}),
      ...(settings?.payer || {}),
      signatureUrl,
      stampUrl
    };
    const peek = previewNumbers(settings?.numbering);
    return {
      ...(App.Wht50Document?.SAMPLE_FROM_PDF || {}),
      bookNo: peek.bookNo === '—' ? '' : peek.bookNo,
      docNo: peek.docNo === '—' ? '' : peek.docNo,
      payer,
      signatureUrl,
      stampUrl
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
    signaturePreview.src = defaultSignatureSrc();
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
      stampPreview.src = defaultStampSrc();
      stampPreview.hidden = false;
      stampPreview.alt = 'ตราประทับค่าเริ่มต้น';
    }
    if (stampEmpty) stampEmpty.hidden = true;
    if (stampBadge) {
      stampBadge.textContent = 'ค่าเริ่มต้น';
      stampBadge.classList.add('agent-form__sectionBadge--muted');
    }
  }

  function fillForm(settings) {
    const next = {
      ...DEFAULTS,
      ...(settings || {}),
      numbering: { ...DEFAULT_NUMBERING, ...(settings?.numbering || {}) }
    };
    setField(payerName, next.payer?.name);
    setField(payerAddress, next.payer?.address);
    setField(payerTaxId, next.payer?.taxId);
    if (signatureUrlData) signatureUrlData.value = next.signatureUrlData || '';
    if (stampUrlData) stampUrlData.value = next.stampUrlData || '';
    fillNumbering(next.numbering);
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
      numbering: readNumbering(),
      applyToUnprinted: !!applyToUnprinted?.checked
    };
  }

  bindImageUpload(signatureFile, signatureUrlData, updateSignaturePreview, 'ลายเซ็น');
  bindImageUpload(stampFile, stampUrlData, updateStampPreview, 'ตราประทับ');

  payerName?.addEventListener('input', updatePayerTypeHint);

  [numberModeAuto, numberModeManual].forEach((el) => {
    el?.addEventListener('change', syncNumberPanels);
  });
  autoFormat?.addEventListener('change', syncNumberPanels);
  autoBookMode?.addEventListener('change', syncNumberPanels);
  [autoPrefix, autoNextSeq, autoPad, autoBookNo, manualBookNo, manualDocNo].forEach((el) => {
    el?.addEventListener('input', updateNumberPreview);
  });
  manualAutoBump?.addEventListener('change', updateNumberPreview);

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
    if (!confirm('คืนค่า 50 ทวิเป็นค่าเริ่มต้น (ลายเซ็น/ตราประทับ/รายละเอียดผู้จ่าย/เลขที่)?')) return;
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

  function activateTab(tabId) {
    const tabs = [...form.querySelectorAll('[data-wht50-tab]')];
    const panels = [...form.querySelectorAll('[data-wht50-panel]')];
    if (!tabs.length) return;
    const target = tabId || tabs[0].dataset.wht50Tab;
    tabs.forEach((tab) => {
      const active = tab.dataset.wht50Tab === target;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.wht50Panel === target;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    refreshIcons();
  }

  function panelForField(el) {
    return el?.closest?.('[data-wht50-panel]')?.dataset?.wht50Panel || null;
  }

  form.querySelectorAll('[data-wht50-tab]').forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.wht50Tab));
  });

  form.querySelector('.wht50-settings__tabs')?.addEventListener('keydown', (e) => {
    const tabs = [...form.querySelectorAll('[data-wht50-tab]')];
    const idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight'
        ? tabs[(idx + 1) % tabs.length]
        : tabs[(idx - 1 + tabs.length) % tabs.length];
      next.focus();
      activateTab(next.dataset.wht50Tab);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const invalid = form.querySelector(':invalid');
      const panel = panelForField(invalid);
      if (panel) activateTab(panel);
      form.reportValidity();
      return;
    }

    const taxDigits = String(payerTaxId?.value || '').replace(/\D/g, '');
    if (taxDigits.length !== 13) {
      activateTab('payer');
      showToast('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก', 'error');
      payerTaxId?.focus();
      return;
    }

    const numbering = readNumbering();
    if (numbering.mode === 'manual') {
      if (!numbering.manualBookNo || !numbering.manualDocNo) {
        activateTab('numbering');
        showToast('กรุณากรอกเล่มที่และเลขที่สำหรับโหมดกำหนดเอง', 'error');
        (numbering.manualBookNo ? manualDocNo : manualBookNo)?.focus();
        return;
      }
    } else if (numbering.bookMode === 'fixed' && !numbering.bookNo) {
      activateTab('numbering');
      showToast('กรุณากรอกเล่มที่เมื่อเลือกกำหนดเอง', 'error');
      autoBookNo?.focus();
      return;
    }

    const payload = readForm();
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
  activateTab('payer');

  (async function boot() {
    try {
      if (App.Wht50Service?.getSettings) {
        const settings = await App.Wht50Service.getSettings();
        fillForm(settings);
      }
    } catch (err) {
      console.error(err);
    }
    activateTab('payer');
    refreshIcons();
  })();
})();
