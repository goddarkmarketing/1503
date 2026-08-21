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

  const DEFAULT_SIGNATURE_FILE = 'payer-signature.png';
  const DEFAULT_STAMP_FILE = 'company-stamp.png';
  const DEFAULT_SIGNATURE_PATH = 'assets/wht50/payer-signature.png';
  const DEFAULT_STAMP_PATH = 'assets/wht50/company-stamp.png';

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
      signImg.src = resolveAssetUrl(payer.signatureUrl || data.signatureUrl, DEFAULT_SIGNATURE_FILE);
      signImg.alt = 'ลายเซ็นผู้จ่ายเงิน';
      signImg.style.display = '';
    }

    const stampWrap = doc.getElementById('payerStampWrap');
    const stampImg = doc.getElementById('payerStamp');
    const stampIcon = doc.getElementById('payerStampIcon');
    const customStamp = String(payer.stampUrl || data.stampUrl || '').trim();
    const showStamp = isCompanyPayer(payer.name);
    if (stampWrap) stampWrap.classList.toggle('is-visible', showStamp);
    if (stampImg) {
      if (showStamp) {
        stampImg.src = resolveAssetUrl(customStamp, DEFAULT_STAMP_FILE);
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

  function ensureHtml2Pdf() {
    if (typeof global.html2pdf === 'function') return Promise.resolve(global.html2pdf);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-html2pdf]');
      if (existing) {
        existing.addEventListener('load', () => resolve(global.html2pdf));
        existing.addEventListener('error', () => reject(new Error('โหลดโมดูล PDF ไม่สำเร็จ')));
        return;
      }
      const base = document.body?.dataset?.basePath || '../';
      const script = document.createElement('script');
      script.src = `${base}js/vendor/html2pdf.bundle.min.js`;
      script.dataset.html2pdf = '1';
      script.onload = () => {
        if (typeof global.html2pdf === 'function') resolve(global.html2pdf);
        else reject(new Error('โหลดโมดูล PDF ไม่สำเร็จ'));
      };
      script.onerror = () => reject(new Error('โหลดโมดูล PDF ไม่สำเร็จ'));
      document.head.appendChild(script);
    });
  }

  function waitFrameReady(frame) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        try {
          const doc = frame.contentDocument;
          if (!doc) throw new Error('ไม่สามารถอ่านเอกสารได้');
          // รอให้ body พร้อมก่อน fill
          if (!doc.body) {
            setTimeout(finish, 50);
            return;
          }
          settled = true;
          resolve(doc);
        } catch (err) {
          settled = true;
          reject(err);
        }
      };
      if (frame.contentDocument?.readyState === 'complete') {
        setTimeout(finish, 120);
        return;
      }
      frame.addEventListener('load', () => setTimeout(finish, 150), { once: true });
      setTimeout(() => {
        if (!settled) reject(new Error('โหลดแบบฟอร์มหมดเวลา'));
      }, 15000);
    });
  }

  function absoluteUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function waitImages(root) {
    const imgs = [...(root?.querySelectorAll?.('img') || [])];
    if (!imgs.length) return Promise.resolve();
    return Promise.all(imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, 4000);
      });
    }));
  }

  function waitStylesheets(root) {
    const links = [...(root?.querySelectorAll?.('link[rel="stylesheet"]') || [])];
    if (!links.length) return Promise.resolve();
    return Promise.all(links.map((link) => {
      if (link.sheet) return Promise.resolve();
      return new Promise((resolve) => {
        const done = () => resolve();
        link.addEventListener('load', done, { once: true });
        link.addEventListener('error', done, { once: true });
        setTimeout(done, 3000);
      });
    }));
  }

  /**
   * โคลนแบบฟอร์มเข้า parent document ที่พิกัด (0,0)
   * — ห้ามวาง left ติดลบ (html2canvas จะตัดขอบซ้าย)
   * — ห้ามจับจาก iframe โดยตรง (พิกัดคนละ window ทำให้เลื่อน)
   */
  function cloneFormForExport(sourceDoc) {
    const source = sourceDoc.getElementById('documentBody') || sourceDoc.body;
    if (!source) throw new Error('ไม่พบเนื้อหาเอกสาร');

    const wrap = document.createElement('div');
    wrap.setAttribute('data-wht50-export', '1');
    wrap.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:210mm',
      'height:297mm',
      'margin:0',
      'padding:0',
      'background:#fff',
      'z-index:2147483646',
      'opacity:0.015',
      'overflow:hidden',
      'pointer-events:none',
      'box-sizing:border-box'
    ].join(';');

    sourceDoc.querySelectorAll('style').forEach((node) => {
      const style = document.createElement('style');
      style.textContent = node.textContent || '';
      wrap.appendChild(style);
    });
    sourceDoc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = node.href;
      wrap.appendChild(link);
    });

    const force = document.createElement('style');
    force.textContent = `
      [data-wht50-export],
      [data-wht50-export] * { box-sizing: border-box; }
      [data-wht50-export] .a4-page,
      [data-wht50-export] #documentBody {
        width: 210mm !important;
        min-height: 297mm !important;
        max-width: 210mm !important;
        height: auto !important;
        margin: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
        position: relative !important;
        left: 0 !important;
        top: 0 !important;
        transform: none !important;
      }
      [data-wht50-export] .no-print { display: none !important; }
    `;
    wrap.appendChild(force);

    const clone = source.cloneNode(true);
    clone.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (!src) return;
      if (/^(data:|https?:|blob:)/i.test(src)) return;
      try {
        img.src = new URL(src, sourceDoc.baseURI || window.location.href).href;
      } catch (_) { /* keep */ }
    });
    wrap.appendChild(clone);
    document.body.appendChild(wrap);
    return wrap;
  }

  async function saveCanvasAsA4Pdf(canvas, filename) {
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = await global.html2pdf()
      .set({
        margin: 0,
        filename,
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(canvas)
      .toPdf()
      .get('pdf');

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let w = pageW;
    let h = (canvas.height * pageW) / canvas.width;
    if (h > pageH) {
      h = pageH;
      w = (canvas.width * pageH) / canvas.height;
    }

    // ล้างหน้าที่ html2pdf แบ่งอัตโนมัติ แล้วใส่ภาพพอดี 1 หน้า A4
    const pages = pdf.internal.getNumberOfPages();
    for (let i = pages; i >= 1; i -= 1) pdf.deletePage(i);
    pdf.addPage([pageW, pageH], 'portrait');
    pdf.addImage(imgData, 'JPEG', (pageW - w) / 2, 0, w, h, undefined, 'FAST');
    pdf.save(filename);
  }

  async function downloadPdf(data, options = {}) {
    const payload = data || SAMPLE_FROM_PDF;
    const filename = String(options.filename || `50ทวิ-${payload.docNo || payload.id || 'document'}.pdf`)
      .replace(/[\\/:*?"<>|]+/g, '-');

    await ensureHtml2Pdf();

    const prevScrollX = window.scrollX;
    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // โหลดฟอร์มใน iframe เพื่อให้ Tailwind สร้าง CSS ครบ แล้วค่อยโคลนมาจับภาพ
    const frame = document.createElement('iframe');
    frame.setAttribute('title', 'wht50-pdf-export');
    frame.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:210mm',
      'height:297mm',
      'border:0',
      'opacity:0',
      'pointer-events:none',
      'z-index:-1',
      'background:#fff'
    ].join(';');
    frame.src = sampleFormUrl({ embed: '1' });
    document.body.appendChild(frame);

    let host = null;
    try {
      const doc = await waitFrameReady(frame);
      await waitStylesheets(doc);
      // รอ Tailwind CDN สแกน DOM แล้ว inject utilities
      await new Promise((r) => setTimeout(r, 400));
      fillForm(doc, payload);
      await waitImages(doc);
      await new Promise((r) => setTimeout(r, 200));

      host = cloneFormForExport(doc);
      await waitStylesheets(host);
      await waitImages(host);
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch (_) { /* ignore */ }
      }
      await new Promise((r) => setTimeout(r, 200));

      const target = host.querySelector('#documentBody') || host.querySelector('.a4-page');
      if (!target) throw new Error('ไม่พบเนื้อหาเอกสารสำหรับสร้าง PDF');

      // จับทั้ง host (มี <style>/Tailwind) — ถ้าจับแค่ #documentBody สไตล์พี่น้องจะหาย
      const width = Math.ceil(host.getBoundingClientRect().width) || host.offsetWidth;
      const height = Math.ceil(host.getBoundingClientRect().height) || host.offsetHeight;

      const canvas = await global.html2pdf()
        .set({
          margin: 0,
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            width,
            height,
            windowWidth: width,
            windowHeight: height,
            // wrapper ใช้ opacity ต่ำเพื่อไม่ให้กระพริบบนจอ — ตอนจับภาพต้องทึบ
            onclone: (clonedDoc) => {
              const root = clonedDoc.querySelector('[data-wht50-export]');
              if (root) {
                root.style.opacity = '1';
                root.style.zIndex = '1';
              }
            }
          }
        })
        .from(host)
        .toCanvas();

      await saveCanvasAsA4Pdf(canvas, filename);

      if (options.markPrinted !== false && payload?.id && App.Wht50Service?.markPrinted) {
        App.Wht50Service.markPrinted(payload.id).catch(() => {});
      }
      return true;
    } finally {
      host?.remove();
      frame.remove();
      window.scrollTo(prevScrollX, prevScrollY);
    }
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
            <h2 class="wht50-preview-modal__title">หนังสือ 50 ทวิ</h2>
            <p class="wht50-preview-modal__meta">${esc(payload.docNo || payload.id || '')}</p>
          </div>
          <button type="button" class="wht50-preview-modal__close" aria-label="ปิด">&times;</button>
        </div>
        <div class="wht50-preview-modal__body wht50-preview-modal__body--sample">
          <iframe class="wht50-sample-frame wht50-sample-frame--preview" title="หนังสือรับรอง 50 ทวิ" src="${esc(src)}"></iframe>
        </div>
        <div class="wht50-preview-modal__footer">
          <button type="button" class="btn-secondary" data-wht50-close>ปิด</button>
          <button type="button" class="btn-secondary" data-wht50-pdf>ดาวน์โหลด PDF</button>
          <button type="button" class="btn-primary" data-wht50-print>พิมพ์</button>
        </div>
      </div>`;

    const onClose = () => closePreviewModal();
    const setBusy = (busy, label) => {
      const pdfBtn = overlay.querySelector('[data-wht50-pdf]');
      const printBtn = overlay.querySelector('[data-wht50-print]');
      if (pdfBtn) {
        pdfBtn.disabled = !!busy;
        if (busy) pdfBtn.textContent = label || 'กำลังสร้าง PDF...';
        else pdfBtn.textContent = 'ดาวน์โหลด PDF';
      }
      if (printBtn) printBtn.disabled = !!busy;
    };

    overlay.addEventListener('click', (e) => { if (e.target === overlay) onClose(); });
    overlay.querySelector('.wht50-preview-modal__close')?.addEventListener('click', onClose);
    overlay.querySelector('[data-wht50-close]')?.addEventListener('click', onClose);
    overlay.querySelector('[data-wht50-print]')?.addEventListener('click', () => {
      printSample(payload);
      if (payload?.id && App.Wht50Service?.markPrinted) {
        App.Wht50Service.markPrinted(payload.id).catch(() => {});
      }
    });
    overlay.querySelector('[data-wht50-pdf]')?.addEventListener('click', async () => {
      setBusy(true);
      try {
        await downloadPdf(payload);
      } catch (err) {
        console.error(err);
        alert(err.message || 'ดาวน์โหลด PDF ไม่สำเร็จ — ลองใช้ปุ่มพิมพ์แล้วเลือก Save as PDF');
      } finally {
        setBusy(false);
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
    DEFAULT_SIGNATURE_FILE,
    DEFAULT_STAMP_FILE,
    DEFAULT_SIGNATURE_PATH,
    DEFAULT_STAMP_PATH,
    SAMPLE_FROM_PDF,
    isCompanyPayer,
    sampleFormUrl,
    fillForm,
    buildHtml,
    copiesHtml,
    printHtml,
    printCopies,
    printSample,
    downloadPdf,
    openPreview,
    closePreviewModal,
    formatMoney,
    bahtText,
    formatThaiDate,
    absoluteUrl
  };
})(window);
