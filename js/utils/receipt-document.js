/**
 * Build & print receipt document (ต้นฉบับใบเสร็จรับเงิน)
 * Shop branding comes from admin paper settings (localStorage / mock), with defaults.
 */
(function (global) {
  const DEFAULT_SHOP = {
    name: 'ตรอ.กล้าดี',
    address: '1311/35 หมู่ 10 ต.นครสวรรค์ตก อ.เมือง จ.นครสวรรค์ 60000',
    taxId: '1609900051711',
    phone: '0894646551',
    logoUrl: 'assets/logos/tro-kladee.png',
    docTitle: 'ต้นฉบับใบเสร็จรับเงิน',
    footerThanks: 'ขอบคุณทุกท่านที่มาอุดหนุน',
    signLabel: 'ผู้รับเงิน'
  };

  let shop = { ...DEFAULT_SHOP };
  let settingsReady = false;

  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(n) {
    return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatQty(n) {
    return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatThaiDateLong(d) {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return String(d || '');
    const day = String(date.getDate()).padStart(2, '0');
    const month = THAI_MONTHS[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  }

  function parseBookDate(text) {
    const t = String(text || '').trim();
    if (!t) return '';
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return formatThaiDateLong(d);
    return t;
  }

  function nextBillNo() {
    const key = 'kladee_receipt_bill_seq';
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    let stored;
    try {
      stored = JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      stored = {};
    }
    if (stored.ym !== ym) stored.seq = 0;
    stored.ym = ym;
    stored.seq = (stored.seq || 0) + 1;
    localStorage.setItem(key, JSON.stringify(stored));
    return `${ym}${String(stored.seq).padStart(5, '0')}`;
  }

  function storageKey() {
    return (global.App && App.Config && App.Config.RECEIPT_PAPER_KEY) || 'kladeebroker_receipt_paper';
  }

  function resolveOwnerId(explicitId) {
    if (explicitId) return explicitId;
    try {
      if (global.App?.ReceiptService?.resolveOwnerId) {
        return App.ReceiptService.resolveOwnerId();
      }
      const user = global.App?.AuthService?.getCurrentUser?.() || global.App?.Session?.getUser?.();
      if (!user || user.role === 'admin') return 'default';
      return user.id || 'default';
    } catch {
      return 'default';
    }
  }

  function readStoredSettings(ownerId) {
    try {
      const raw = localStorage.getItem(storageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;

      const id = resolveOwnerId(ownerId);
      const seed = { ...DEFAULT_SHOP };

      // Legacy flat object
      if (parsed.name || parsed.address || parsed.logoUrl) {
        return id === 'default' ? { ...seed, ...parsed } : { ...seed, ...parsed };
      }

      const map = parsed.byOwner && typeof parsed.byOwner === 'object' ? parsed.byOwner : {};
      const company = map.default || {};
      if (id === 'default') return { ...seed, ...company };
      return { ...seed, ...company, ...(map[id] || {}) };
    } catch {
      return null;
    }
  }

  function applySettings(partial) {
    if (!partial || typeof partial !== 'object') return shop;
    shop = { ...DEFAULT_SHOP, ...shop, ...partial };
    return shop;
  }

  function getShop() {
    if (!settingsReady) {
      applySettings(readStoredSettings());
      settingsReady = true;
    }
    return { ...shop };
  }

  async function ensureSettings(ownerId) {
    applySettings(readStoredSettings(ownerId));
    try {
      if (global.App?.ReceiptService?.getPaperSettings) {
        const remote = await App.ReceiptService.getPaperSettings(ownerId);
        applySettings(remote);
      }
    } catch (e) {
      /* use stored / defaults */
    }
    settingsReady = true;
    return getShop();
  }

  function resolveAssetUrl(path) {
    const value = String(path || '').trim();
    if (!value) return resolveAssetUrl(DEFAULT_SHOP.logoUrl);
    if (/^(data:|https?:|blob:)/i.test(value)) return value;

    const base = (typeof document !== 'undefined' && document.body?.dataset?.basePath) || '';
    const rel = value.replace(/^\//, '');

    // Prefer site-root relative via data-base-path (works from agent/receipt/* and admin/*)
    if (base) {
      try {
        return new URL(`${base}${rel}`, window.location.href).href;
      } catch (e) { /* fall through */ }
    }

    try {
      return new URL(`../../${rel}`, window.location.href).href;
    } catch (e) {
      return `${base}${rel}`;
    }
  }

  function getLogoUrl() {
    return resolveAssetUrl(getShop().logoUrl || DEFAULT_SHOP.logoUrl);
  }

  function troLogoHtml() {
    const src = esc(getLogoUrl());
    const name = esc(getShop().name || 'โลโก้');
    return `<img class="receipt-doc__logo" src="${src}" width="88" height="88" alt="${name}">`;
  }

  function logoMarkup(paper, editable) {
    const img = troLogoHtml();
    if (!editable) {
      return `<div class="receipt-doc__logoWrap">${img}</div>`;
    }
    const custom = paper.logoUrl && paper.logoUrl !== DEFAULT_SHOP.logoUrl;
    return `<div class="receipt-doc__logoWrap">
        <button type="button" class="receipt-doc__logoBtn" id="receiptLogoPick" title="คลิกเพื่ออัปโหลดโลโก้">${img}</button>
        <button type="button" class="receipt-doc__logoTrash${custom ? '' : ' is-hidden'}" id="receiptLogoTrash" title="ลบโลโก้">
          <i data-lucide="trash-2"></i>
        </button>
      </div>`;
  }

  function buildReceiptHtml(data, options = {}) {
    const paper = getShop();
    const editable = !!(options && options.preview);
    const lines = (data.lines || []).filter((l) => l.description || l.total > 0);
    const lineRows = lines.map((line, i) => {
      const hasAmount = line.total > 0 || line.description;
      return `<tr>
        <td class="c">${hasAmount ? i + 1 : ''}</td>
        <td class="l">${esc(line.description)}</td>
        <td class="r">${hasAmount && line.qty !== '' ? formatQty(line.qty) : ''}</td>
        <td class="r">${hasAmount && line.price !== '' ? formatMoney(line.price) : ''}</td>
        <td class="r">${hasAmount && line.total !== '' ? formatMoney(line.total) : ''}</td>
      </tr>`;
    }).join('');
    const totalText = global.BahtText ? global.BahtText.toText(data.grandTotal) : '';
    const money = formatMoney(data.grandTotal);

    return `<article class="receipt-doc${editable ? ' receipt-doc--preview' : ''}" id="receiptDocPrint">
  <header class="receipt-doc__head">
    <div class="receipt-doc__shopBlock">
      ${logoMarkup(paper, editable)}
      <div class="receipt-doc__shop">
        <p class="receipt-doc__shop-name">${esc(paper.name)}</p>
        <p>${esc(paper.address)}</p>
        <p>เลขประจำตัวผู้เสียภาษี ${esc(paper.taxId)}</p>
        <p>โทร. ${esc(paper.phone)}</p>
      </div>
    </div>
    <div class="receipt-doc__metaWrap">
      <div class="receipt-doc__badge">${esc(paper.docTitle || DEFAULT_SHOP.docTitle)}</div>
      <dl class="receipt-doc__meta">
        <div class="receipt-doc__metaRow"><dt>เลขที่</dt><dd>${esc(data.billNo)}</dd></div>
        <div class="receipt-doc__metaRow"><dt>วันที่ออกใบเสร็จ</dt><dd>${esc(data.issueDate)}</dd></div>
        <div class="receipt-doc__metaRow"><dt>วันที่รับเงิน</dt><dd>${esc(data.bookDate)}</dd></div>
      </dl>
    </div>
  </header>

  <div class="receipt-doc__chips">
    <div class="receipt-doc__chip"><span>ทะเบียน</span><strong>${esc(data.plateNo)}</strong></div>
    <div class="receipt-doc__chip"><span>ยี่ห้อ</span><strong>${esc(data.brand)}</strong></div>
    <div class="receipt-doc__chip"><span>ชื่อ-สกุล</span><strong>${esc(data.customerName)}</strong></div>
    <div class="receipt-doc__chip"><span>เบอร์โทร</span><strong>${esc(data.phone)}</strong></div>
  </div>

  <table class="receipt-doc__sheet">
    <colgroup>
      <col class="receipt-doc__col-no">
      <col class="receipt-doc__col-item">
      <col class="receipt-doc__col-qty">
      <col class="receipt-doc__col-price">
      <col class="receipt-doc__col-total">
    </colgroup>
    <thead>
      <tr class="receipt-doc__items-head">
        <th class="c">ลำดับ</th>
        <th class="l">รายการสินค้า / รายละเอียด</th>
        <th class="r">จำนวน</th>
        <th class="r">ราคาต่อหน่วย</th>
        <th class="r">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
      <tr class="receipt-doc__total">
        <td colspan="3"></td>
        <th class="r">รวมเงิน</th>
        <td class="r receipt-doc__grand">${money}</td>
      </tr>
    </tbody>
  </table>

  <div class="receipt-doc__summary">
    <div class="receipt-doc__note"><span>หมายเหตุ</span></div>
    <div class="receipt-doc__grandBox">
      <span>รวมเงินทั้งสิ้น</span>
      <strong>${money} บาท</strong>
      <em>${esc(totalText ? `(${totalText})` : '')}</em>
    </div>
  </div>

  <footer class="receipt-doc__foot">
    <div class="receipt-doc__sign">
      <span class="receipt-doc__sign-line"></span>
      <span class="receipt-doc__sign-label">${esc(paper.signLabel || DEFAULT_SHOP.signLabel)}</span>
    </div>
    <p class="receipt-doc__thanks">${esc(paper.footerThanks || DEFAULT_SHOP.footerThanks)}</p>
  </footer>
</article>`;
  }

  function collectFromForm(form) {
    const tbody = form.querySelector('#receiptLinesBody');
    const lines = [];
    let grandTotal = 0;
    tbody?.querySelectorAll('tr').forEach((row) => {
      const description = row.querySelector('.line-item')?.value?.trim() || '';
      const qty = parseFloat(row.querySelector('.line-qty')?.value) || 0;
      const price = parseFloat(String(row.querySelector('.line-price')?.value).replace(/,/g, '')) || 0;
      const total = qty * price;
      if (!description && total <= 0) return;
      lines.push({ description, qty, price, total });
      grandTotal += total;
    });

    const bookRaw = form.querySelector('#bookDate')?.value?.trim() || '';
    let bookDate = parseBookDate(bookRaw);
    if (!bookDate && bookRaw) bookDate = bookRaw;

    return {
      billNo: nextBillNo(),
      issueDate: formatThaiDateLong(new Date()),
      bookDate,
      plateNo: form.querySelector('#plateNo')?.value?.trim() || '',
      brand: form.querySelector('#brand')?.value?.trim() || '',
      customerName: form.querySelector('#customerName')?.value?.trim() || '',
      phone: form.querySelector('#phone')?.value?.trim() || '',
      lines,
      grandTotal,
    };
  }

  function printHtml(html) {
    const cssLink = document.querySelector('link[href*="receipt-print.css"]');
    const cssHref = cssLink
      ? new URL(cssLink.getAttribute('href'), window.location.href).href
      : new URL('../../css/receipt-print.css', window.location.href).href;

    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const win = frame.contentWindow;
    const doc = win.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${cssHref}">
<style>@page{size:A4;margin:12mm;}body{margin:0;padding:0;font-family:Sarabun,sans-serif;}</style>
</head><body>${html}</body></html>`);
    doc.close();
    const imgs = Array.from(doc.images || []);
    const ready = imgs.length
      ? Promise.all(imgs.map((img) => img.complete ? Promise.resolve() : new Promise((res) => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      })))
      : Promise.resolve();
    ready.then(() => {
      win.focus();
      setTimeout(() => {
        win.print();
        setTimeout(() => frame.remove(), 800);
      }, 200);
    });
  }

  // warm cache early
  try {
    applySettings(readStoredSettings());
    settingsReady = true;
  } catch (e) { /* ignore */ }

  global.ReceiptDocument = {
    DEFAULT_SHOP,
    get SHOP() {
      return getShop();
    },
    getShop,
    applySettings,
    ensureSettings,
    nextBillNo,
    formatThaiDateLong,
    buildReceiptHtml,
    collectFromForm,
    printHtml,
    resolveAssetUrl,
  };
})(typeof window !== 'undefined' ? window : globalThis);
