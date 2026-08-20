(function () {
  const form = document.getElementById('receiptPaperForm');
  const previewHost = document.getElementById('receiptPaperLivePreview');
  const logoFileInput = document.getElementById('paperLogoFile');
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
    renderPreview();
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

  function bindPreviewLogo() {
    previewHost?.querySelector('#receiptLogoPick')?.addEventListener('click', () => {
      logoFileInput?.click();
    });
    previewHost?.querySelector('#receiptLogoTrash')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setField('logoUrl', defaults.logoUrl);
      if (logoFileInput) logoFileInput.value = '';
      renderPreview();
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  const printModal = document.getElementById('receiptPrintModal');
  const printPreview = document.getElementById('receiptPrintPreview');

  function renderPreview() {
    if (!previewHost) return;
    try {
      ReceiptDocument.applySettings(readForm());
      previewHost.innerHTML = ReceiptDocument.buildReceiptHtml(sampleData(), { preview: true });
      bindPreviewLogo();
    } catch (err) {
      console.error('receipt preview failed', err);
      previewHost.innerHTML = '<p class="admin-hint">ไม่สามารถแสดงตัวอย่างได้</p>';
    }
  }

  function openPrintPreview() {
    if (!printModal || !printPreview) {
      previewHost?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      renderPreview();
      return;
    }
    try {
      ReceiptDocument.applySettings(readForm());
      printPreview.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.innerHTML = ReceiptDocument.buildReceiptHtml(sampleData());
      const doc = wrap.querySelector('#receiptDocPrint');
      if (doc) printPreview.appendChild(doc);
      printModal.hidden = false;
      document.body.classList.add('receipt-modal-open');
    } catch (err) {
      console.error('receipt print preview failed', err);
      toast(err.message || 'ดูตัวอย่างไม่สำเร็จ', 'error');
    }
  }

  function closePrintPreview() {
    if (!printModal) return;
    printModal.hidden = true;
    document.body.classList.remove('receipt-modal-open');
  }

  form.addEventListener('input', () => {
    renderPreview();
  });

  logoFileInput?.addEventListener('change', (e) => {
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
      renderPreview();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnPaperPreview')?.addEventListener('click', openPrintPreview);
  document.getElementById('btnReceiptClose')?.addEventListener('click', closePrintPreview);
  printModal?.querySelector('.receipt-print-modal__backdrop')?.addEventListener('click', closePrintPreview);
  document.getElementById('btnReceiptPrint')?.addEventListener('click', () => {
    const doc = printPreview?.querySelector('#receiptDocPrint');
    if (doc && window.ReceiptDocument) {
      ReceiptDocument.printHtml(doc.outerHTML);
    }
  });

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
