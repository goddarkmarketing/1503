(function () {
  const form = document.getElementById('receiptPaperForm');
  const previewHost = document.getElementById('receiptPaperLivePreview');
  const logoPreview = document.getElementById('paperLogoPreview');
  if (!form || !window.ReceiptDocument) return;

  const defaults = { ...ReceiptDocument.DEFAULT_SHOP };
  const field = (name) => form.elements.namedItem(name);

  const toast = (msg, type) => {
    if (window.App?.AdminUtils?.showToast) App.AdminUtils.showToast(msg, type || 'success');
    else alert(msg);
  };

  function fieldValue(name) {
    const el = field(name);
    return el && 'value' in el ? String(el.value || '').trim() : '';
  }

  function setField(name, value) {
    const el = field(name);
    if (el && 'value' in el) el.value = value ?? '';
  }

  function readForm() {
    return {
      name: fieldValue('name') || defaults.name,
      address: fieldValue('address'),
      taxId: fieldValue('taxId'),
      phone: fieldValue('phone'),
      logoUrl: fieldValue('logoUrl') || defaults.logoUrl,
      docTitle: fieldValue('docTitle') || defaults.docTitle,
      footerThanks: fieldValue('footerThanks') || defaults.footerThanks,
      signLabel: fieldValue('signLabel') || defaults.signLabel
    };
  }

  function fillForm(settings) {
    const current = { ...defaults, ...settings };
    setField('name', current.name || defaults.name);
    setField('address', current.address || '');
    setField('taxId', current.taxId || '');
    setField('phone', current.phone || '');
    setField('logoUrl', current.logoUrl || defaults.logoUrl);
    setField('docTitle', current.docTitle || defaults.docTitle);
    setField('footerThanks', current.footerThanks || defaults.footerThanks);
    setField('signLabel', current.signLabel || defaults.signLabel);
    updateLogoPreview();
    renderPreview();
  }

  function updateLogoPreview() {
    if (!logoPreview) return;
    const raw = fieldValue('logoUrl') || defaults.logoUrl;
    const src = ReceiptDocument.resolveAssetUrl(raw);
    logoPreview.alt = 'ตัวอย่างโลโก้';
    logoPreview.src = src;
    logoPreview.onerror = () => {
      const fallback = ReceiptDocument.resolveAssetUrl(defaults.logoUrl);
      if (logoPreview.src !== fallback) {
        logoPreview.src = fallback;
      } else {
        logoPreview.removeAttribute('src');
        logoPreview.alt = 'ไม่พบโลโก้';
      }
    };
  }

  function sampleData() {
    return {
      billNo: 'ตัวอย่าง-00001',
      issueDate: ReceiptDocument.formatThaiDateLong(new Date()),
      bookDate: ReceiptDocument.formatThaiDateLong(new Date()),
      plateNo: '9กษ1234',
      brand: 'Toyota',
      customerName: 'ลูกค้าตัวอย่าง',
      phone: '0812345678',
      lines: [
        { description: 'พรบ', qty: 1, price: 645, total: 645 },
        { description: 'ค่าบริการ', qty: 1, price: 50, total: 50 },
        { description: '', qty: '', price: '', total: '' },
        { description: '', qty: '', price: '', total: '' }
      ],
      grandTotal: 695
    };
  }

  function renderPreview() {
    if (!previewHost) return;
    try {
      ReceiptDocument.applySettings(readForm());
      previewHost.innerHTML = ReceiptDocument.buildReceiptHtml(sampleData(), { preview: true });
    } catch (err) {
      console.error('receipt preview failed', err);
      previewHost.innerHTML = '<p class="admin-hint">ไม่สามารถแสดงตัวอย่างได้</p>';
    }
  }

  form.addEventListener('input', () => {
    updateLogoPreview();
    renderPreview();
  });

  document.getElementById('paperLogoFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast('ไฟล์โลโก้ใหญ่เกิน 1.5MB', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setField('logoUrl', String(reader.result || ''));
      updateLogoPreview();
      renderPreview();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnClearLogo')?.addEventListener('click', () => {
    setField('logoUrl', defaults.logoUrl);
    const fileInput = document.getElementById('paperLogoFile');
    if (fileInput) fileInput.value = '';
    updateLogoPreview();
    renderPreview();
  });

  document.getElementById('btnPaperPreview')?.addEventListener('click', renderPreview);

  document.getElementById('btnPaperReset')?.addEventListener('click', async () => {
    if (!confirm('คืนค่าหัวกระดาษใบเสร็จเป็นค่าเริ่มต้น?')) return;
    try {
      if (App.ReceiptService) {
        const company = await App.ReceiptService.getPaperSettings('default');
        fillForm(company);
      } else {
        fillForm(defaults);
      }
    } catch (e) {
      fillForm(defaults);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const btn = document.getElementById('btnPaperSave');
    const payload = readForm();
    const btnHtml = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'กำลังบันทึก...';
    }
    try {
      if (!App.ReceiptService) throw new Error('ระบบตั้งค่ายังไม่พร้อม');
      const saved = await App.ReceiptService.updatePaperSettings(payload);
      ReceiptDocument.applySettings(saved);
      fillForm(saved);
      toast('บันทึกตั้งค่าใบเสร็จเรียบร้อยแล้ว');
    } catch (err) {
      toast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = btnHtml || 'บันทึกการตั้งค่า';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  });

  // Show defaults immediately, then hydrate from saved settings
  fillForm(defaults);

  (async function boot() {
    try {
      if (App.ReceiptService) {
        const settings = await App.ReceiptService.getPaperSettings();
        fillForm(settings);
      }
    } catch (err) {
      console.error(err);
      fillForm(defaults);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  })();
})();
