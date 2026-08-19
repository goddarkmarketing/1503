/**
 * Form 50 ทวิ — ใช้ assets/wht50/50.html เป็นต้นฉบับ
 */
(function (global) {
  const App = (global.App = global.App || {});

  const DEFAULT_PAYER = {
    name: 'สำนักงานนายหน้าประกันวินาศภัย ชวดล',
    address: '1311/35 หมู่ 10 ตำบลนครสวรรค์ตก อำเภอเมืองนครสวรรค์ จังหวัดนครสวรรค์ 60000',
    taxId: '1609900051711'
  };

  const SAMPLE_FROM_PDF = {
    docNo: '',
    bookNo: '',
    seqNo: '',
    payer: { ...DEFAULT_PAYER },
    payee: {
      name: 'นางสาวคุณัชญ์ชญา จูสวย',
      address: '2/496 หมู่ 13 ตำบลวัดไทร อำเภอเมืองนครสวรรค์ จังหวัดนครสวรรค์ 60000',
      taxId: '3600600267112',
      idCard: '3600600267112'
    },
    paidAmount: 4724.55,
    taxAmount: 0,
    incomeType: '2',
    formType: '',
    payMethod: '1',
    issuedAt: '2024-12-01',
    paidAt: '2024-12-01'
  };

  const THAI_MONTHS = [
    '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(n) {
    return Number(n || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatThaiDate(d) {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) {
      return { day: '', month: '', monthName: '', year: '', text: '', long: '' };
    }
    const day = String(date.getDate());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear() + 543);
    return {
      day,
      month,
      monthName: THAI_MONTHS[date.getMonth() + 1],
      year,
      text: `${day.padStart(2, '0')}/${month}/${year}`,
      long: `${day} ${THAI_MONTHS[date.getMonth() + 1]} ${year}`
    };
  }

  function bahtText(amount) {
    const n = Math.round((Number(amount) || 0) * 100) / 100;
    if (!n) return 'ศูนย์บาทถ้วน';
    return `${formatMoney(n)} บาท`;
  }

  function isCompanyPayer(name) {
    return /บริษัท|ห้างหุ้นส่วน|หจก\.?|บจก\.?|บมจ\.?|จำกัด|นิติบุคคล/i.test(String(name || ''));
  }

  function resolveAssetUrl(value, fallback) {
    const custom = String(value || '').trim();
    if (!custom) return fallback || '';
    if (custom.startsWith('http') || custom.startsWith('data:') || custom.startsWith('blob:')) {
      return custom;
    }
    const base = document.body?.dataset?.basePath || '../';
    return `${base}${custom.replace(/^\//, '')}`;
  }

  function sampleFormUrl(query) {
    const base = document.body?.dataset?.basePath || '../';
    const url = new URL(`${base}assets/wht50/50.html`, window.location.href);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v != null && v !== '') url.searchParams.set(k, v);
      });
    }
    return url.href;
  }

  function taxIdDigitsHtml(taxId) {
    const digits = String(taxId || '').replace(/\D/g, '').padEnd(13, ' ').slice(0, 13).split('');
    const groups = [
      digits.slice(0, 1),
      digits.slice(1, 5),
      digits.slice(5, 10),
      digits.slice(10, 12),
      digits.slice(12, 13)
    ];
    return groups.map((g, gi) => {
      const boxes = g.map((d) => `<span class="digit-box">${esc(String(d).trim())}</span>`).join('');
      return gi === 0 ? boxes : `<span class="digit-dash">-</span>${boxes}`;
    }).join('');
  }

  function setText(doc, id, value) {
    const el = doc.getElementById(id);
    if (el) el.textContent = value == null ? '' : String(value);
  }

  function fillForm(doc, data) {
    if (!doc || !data) return;
    const payer = { ...DEFAULT_PAYER, ...(data.payer || {}) };
    const payee = data.payee || {};
    const paidAmount = Number(data.paidAmount) || 0;
    const taxAmount = Number(data.taxAmount) || 0;
    const issue = formatThaiDate(data.issuedAt || data.paidAt || new Date());
    const payDate = formatThaiDate(data.paidAt || data.issuedAt || new Date());
    const formType = String(data.formType || '');
    const payMethod = String(data.payMethod || '1');

    setText(doc, 'bookNo', data.bookNo || '');
    setText(doc, 'docNo', data.docNo || '');
    setText(doc, 'sequenceNo', data.seqNo || '');
    setText(doc, 'payerName', payer.name || '');
    setText(doc, 'payerAddress', payer.address || '');
    setText(doc, 'payeeName', payee.name || '');
    setText(doc, 'payeeAddress', payee.address || '');

    const payerTax = doc.getElementById('payerTaxIdContainer');
    if (payerTax) payerTax.innerHTML = taxIdDigitsHtml(payer.taxId);
    const payeeTax = doc.getElementById('payeeTaxIdContainer');
    if (payeeTax) payeeTax.innerHTML = taxIdDigitsHtml(payee.taxId || payee.idCard);

    setText(doc, 'row2Date', payDate.long);
    setText(doc, 'row2Amount', formatMoney(paidAmount));
    setText(doc, 'row2Tax', formatMoney(taxAmount));
    setText(doc, 'totalAmount', formatMoney(paidAmount));
    setText(doc, 'totalTax', formatMoney(taxAmount));
    setText(doc, 'totalTaxWords', taxAmount ? bahtText(taxAmount) : 'ศูนย์บาทถ้วน');
    setText(doc, 'issueDate', issue.long);

    const signImg = doc.getElementById('payerSignature');
    if (signImg) {
      signImg.src = resolveAssetUrl(payer.signatureUrl || data.signatureUrl, 'payer-signature.png');
      signImg.alt = 'ลายเซ็นผู้จ่ายเงิน';
      signImg.style.display = '';
    }

    const stampWrap = doc.getElementById('payerStampWrap');
    const stampImg = doc.getElementById('payerStamp');
    const stampIcon = doc.getElementById('payerStampIcon');
    const stampUrl = payer.stampUrl || data.stampUrl || '';
    const showStamp = isCompanyPayer(payer.name) && !!String(stampUrl).trim();
    if (stampWrap) stampWrap.classList.toggle('is-visible', showStamp);
    if (stampImg) {
      if (showStamp) {
        stampImg.src = resolveAssetUrl(stampUrl, '');
        stampImg.alt = 'ตรานิติบุคคล';
      } else {
        stampImg.removeAttribute('src');
      }
    }
    if (stampIcon) stampIcon.style.visibility = showStamp ? 'hidden' : '';

    for (let i = 1; i <= 7; i++) {
      const chk = doc.getElementById(`chk_${i}`);
      if (chk) chk.textContent = formType === String(i) ? '✓' : '';
    }
    for (let i = 1; i <= 4; i++) {
      const cond = doc.getElementById(`cond_${i}`);
      if (cond) cond.textContent = payMethod === String(i) ? '✓' : '';
    }

    // Hide action bar when embedded from app
    doc.querySelectorAll('.no-print').forEach((el) => {
      el.style.display = 'none';
    });
    doc.documentElement?.classList.add('embed');
    if (doc.body) {
      doc.body.classList.add('embed');
      doc.body.classList.remove('py-6', 'px-2');
      doc.body.style.padding = '0';
      doc.body.style.margin = '0';
      doc.body.style.background = '#fff';
      doc.body.style.overflow = 'visible';
      doc.body.style.height = 'auto';
    }
  }

  function resizeFrameToContent(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const page = doc.getElementById('documentBody') || doc.body;
      const h = Math.max(
        page?.scrollHeight || 0,
        page?.offsetHeight || 0,
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0
      );
      // +24px เผื่อขอบล่าง หมายเหตุ/คำเตือน ไม่ถูกตัด
      if (h > 0) frame.style.height = `${h + 24}px`;
    } catch (_) { /* ignore */ }
  }

  function prepareFrame(frame, data) {
    const run = () => {
      try {
        fillForm(frame.contentDocument, data || SAMPLE_FROM_PDF);
        resizeFrameToContent(frame);
        // ฟอนต์/layout settle อีกรอบ
        setTimeout(() => resizeFrameToContent(frame), 200);
      } catch (_) { /* ignore */ }
    };
    if (frame.contentDocument?.readyState === 'complete') {
      setTimeout(run, 50);
    }
    frame.addEventListener('load', () => setTimeout(run, 80));
  }

  function buildHtml(data) {
    const src = sampleFormUrl({ embed: '1' });
    return `<iframe class="wht50-sample-frame" title="หนังสือรับรอง 50 ทวิ" src="${esc(src)}" data-wht50-fill="1"></iframe>`;
  }

  function copiesHtml(data) {
    return buildHtml(data);
  }

  function printSample(data) {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    frame.src = sampleFormUrl({ embed: '1' });
    document.body.appendChild(frame);
    frame.addEventListener('load', () => {
      try {
        fillForm(frame.contentDocument, data || SAMPLE_FROM_PDF);
      } catch (_) { /* ignore */ }
      const win = frame.contentWindow;
      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(() => frame.remove(), 800);
      }, 350);
    });
  }

  function printHtml(_html) {
    printSample(SAMPLE_FROM_PDF);
  }

  function printCopies(data) {
    printSample(data);
  }

  function closePreviewModal() {
    document.getElementById('wht50PreviewOverlay')?.remove();
    document.body.classList.remove('modal-open');
  }

  function openPreview(data) {
    closePreviewModal();
    const payload = data || SAMPLE_FROM_PDF;
    const src = sampleFormUrl({ embed: '1' });
    const overlay = document.createElement('div');
    overlay.id = 'wht50PreviewOverlay';
    overlay.className = 'wht50-preview-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="wht50-preview-modal wht50-preview-modal--sample">
        <div class="wht50-preview-modal__header">
          <div>
            <h2 class="wht50-preview-modal__title">ตัวอย่างหนังสือ 50 ทวิ</h2>
          </div>
          <button type="button" class="wht50-preview-modal__close" aria-label="ปิด">&times;</button>
        </div>
        <div class="wht50-preview-modal__body wht50-preview-modal__body--sample">
          <iframe class="wht50-sample-frame wht50-sample-frame--preview" title="หนังสือรับรอง 50 ทวิ" src="${esc(src)}"></iframe>
        </div>
        <div class="wht50-preview-modal__footer">
          <button type="button" class="btn-secondary" data-wht50-close>ปิด</button>
          <button type="button" class="btn-primary" data-wht50-print>พิมพ์</button>
        </div>
      </div>`;

    const onClose = () => closePreviewModal();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) onClose(); });
    overlay.querySelector('.wht50-preview-modal__close')?.addEventListener('click', onClose);
    overlay.querySelector('[data-wht50-close]')?.addEventListener('click', onClose);
    overlay.querySelector('[data-wht50-print]')?.addEventListener('click', () => {
      printSample(payload);
      if (payload?.id && App.Wht50Service?.markPrinted) {
        App.Wht50Service.markPrinted(payload.id).catch(() => {});
      }
    });

    const iframe = overlay.querySelector('iframe');
    prepareFrame(iframe, payload);

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    return overlay;
  }

  App.Wht50Document = {
    DEFAULT_PAYER,
    SAMPLE_FROM_PDF,
    isCompanyPayer,
    sampleFormUrl,
    fillForm,
    buildHtml,
    copiesHtml,
    printHtml,
    printCopies,
    printSample,
    openPreview,
    closePreviewModal,
    formatMoney,
    bahtText,
    formatThaiDate
  };
})(window);
