/**
 * Build & print ตรอ.กล้าดี receipt document (ต้นฉบับใบเสร็จรับเงิน)
 */
(function (global) {
  const SHOP = {
    name: 'ตรอ.กล้าดี',
    address: '1311/35 หมู่ 10 ต.นครสวรรค์ตก อ.เมือง จ.นครสวรรค์ 60000',
    taxId: '1609900051711',
    phone: '0894646551',
  };

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

  const LOGO_FILE = 'assets/logos/tro-kladee.png';

  function getLogoUrl() {
    if (typeof window !== 'undefined' && window.location?.href) {
      return new URL(`../../${LOGO_FILE}`, window.location.href).href;
    }
    return `../../${LOGO_FILE}`;
  }

  function troLogoHtml() {
    const src = esc(getLogoUrl());
    return `<img class="receipt-doc__logo" src="${src}" width="88" height="88" alt="ตรอ. สถานตรวจสภาพรถเอกชน">`;
  }

  function buildReceiptHtml(data) {
    const lines = (data.lines || []).filter((l) => l.description || l.total > 0);
    const minRows = 4;
    while (lines.length < minRows) lines.push({ description: '', qty: '', price: '', total: '' });

    const lineRows = lines.map((line, i) => {
      const hasAmount = line.total > 0 || line.description;
      return `<tr>
        <td class="c">${hasAmount ? i + 1 : ''}</td>
        <td class="l" colspan="4">${esc(line.description)}</td>
        <td class="r">${hasAmount && line.qty !== '' ? formatQty(line.qty) : ''}</td>
        <td class="r">${hasAmount && line.price !== '' ? formatMoney(line.price) : ''}</td>
        <td class="r">${hasAmount && line.total !== '' ? formatMoney(line.total) : ''}</td>
      </tr>`;
    }).join('');

    const totalText = global.BahtText ? global.BahtText.toText(data.grandTotal) : '';

    return `<article class="receipt-doc" id="receiptDocPrint">
  <header class="receipt-doc__head">
    <div class="receipt-doc__shop">
      <p class="receipt-doc__shop-name">${esc(SHOP.name)}</p>
      <p>${esc(SHOP.address)}</p>
      <p>เลขประจำตัวผู้เสียภาษี ${esc(SHOP.taxId)}</p>
      <p>โทร. ${esc(SHOP.phone)}</p>
    </div>
    <div class="receipt-doc__brand">
      ${troLogoHtml()}
      <p class="receipt-doc__doc-title">ต้นฉบับใบเสร็จรับเงิน</p>
    </div>
    <table class="receipt-doc__meta">
      <tr><th>บิลเลขที่</th><td>${esc(data.billNo)}</td></tr>
      <tr><th>วันที่ออกใบเสร็จ</th><td>${esc(data.issueDate)}</td></tr>
      <tr><th>วันที่รับเล่ม</th><td>${esc(data.bookDate)}</td></tr>
    </table>
  </header>

  <table class="receipt-doc__sheet">
    <colgroup>
      <col span="8" class="receipt-doc__col">
    </colgroup>
    <tbody>
      <tr class="receipt-doc__customer">
        <th>ทะเบียน</th><td>${esc(data.plateNo)}</td>
        <th>ยี่ห้อ</th><td>${esc(data.brand)}</td>
        <th>ชื่อ-สกุล</th><td>${esc(data.customerName)}</td>
        <th>เบอร์โทร</th><td>${esc(data.phone)}</td>
      </tr>
      <tr class="receipt-doc__items-head">
        <th class="c">ลำดับ</th>
        <th class="l" colspan="4">รายการสินค้า/รายละเอียด</th>
        <th class="r">จำนวน</th>
        <th class="r">ราคา/หน่วย</th>
        <th class="r">รวมเงิน</th>
      </tr>
      ${lineRows}
      <tr class="receipt-doc__total">
        <td colspan="5" class="receipt-doc__words">${esc(totalText)}</td>
        <th class="r" colspan="2">รวมเงิน</th>
        <td class="r receipt-doc__grand">${formatMoney(data.grandTotal)}</td>
      </tr>
    </tbody>
  </table>

  <footer class="receipt-doc__foot">
    <div class="receipt-doc__foot-row">
      <span class="receipt-doc__sign-line"></span>
      <p class="receipt-doc__thanks">ขอบคุณทุกท่านที่มาอุดหนุน</p>
    </div>
    <span class="receipt-doc__sign-label">ผู้รับเงิน</span>
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
    win.focus();
    setTimeout(() => {
      win.print();
      setTimeout(() => frame.remove(), 800);
    }, 300);
  }

  global.ReceiptDocument = {
    SHOP,
    nextBillNo,
    formatThaiDateLong,
    buildReceiptHtml,
    collectFromForm,
    printHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
