(function () {
  const tbody = document.getElementById('receiptLinesBody');
  const netTotalEl = document.getElementById('netTotal');
  const form = document.getElementById('receiptIssueForm');
  const modal = document.getElementById('receiptPrintModal');
  const preview = document.getElementById('receiptPrintPreview');
  if (!tbody || !form) return;

  const beYear = new Date().getFullYear() + 543;
  const defaultItems = [
    { name: 'พรบ', price: 645 },
    { name: `ภาษี${beYear}`, price: 1050 },
    { name: 'ค่าบริการ', price: 50 },
    { name: 'ค่าส่งเอกสาร', price: 50 },
  ];

  function formatMoney(n) {
    return Number(n || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function parseNum(val) {
    const n = parseFloat(String(val).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function calcRowTotal(row) {
    const qty = parseNum(row.querySelector('.line-qty')?.value);
    const price = parseNum(row.querySelector('.line-price')?.value);
    const total = qty * price;
    const totalInput = row.querySelector('.line-total');
    if (totalInput) totalInput.value = formatMoney(total);
    return total;
  }

  function updateNetTotal() {
    let sum = 0;
    tbody.querySelectorAll('tr').forEach((row) => {
      sum += calcRowTotal(row);
    });
    if (netTotalEl) netTotalEl.textContent = formatMoney(sum);
  }

  function bindRow(row) {
    row.querySelector('.line-qty')?.addEventListener('input', updateNetTotal);
    row.querySelector('.line-price')?.addEventListener('input', updateNetTotal);
    row.querySelector('.receipt-line-remove')?.addEventListener('click', () => {
      if (tbody.querySelectorAll('tr').length <= 1) return;
      row.remove();
      renumberRows();
      updateNetTotal();
    });
  }

  function renumberRows() {
    tbody.querySelectorAll('tr').forEach((row, i) => {
      const no = row.querySelector('.line-no');
      if (no) no.textContent = String(i + 1);
    });
  }

  function escAttr(s) {
    return String(s || '').replace(/"/g, '&quot;');
  }

  function addRow(itemName, price) {
    const index = tbody.querySelectorAll('tr').length + 1;
    const priceVal = price != null ? formatMoney(price) : '0.00';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-no line-no">${index}</td>
      <td><input type="text" class="line-item" value="${escAttr(itemName)}" placeholder="รายการ"></td>
      <td class="col-qty"><input type="number" class="line-qty" value="1" min="0" step="1"></td>
      <td class="col-money"><input type="text" class="line-price" value="${priceVal}" inputmode="decimal"></td>
      <td class="col-money"><input type="text" class="line-total" value="0.00" readonly tabindex="-1"></td>
      <td class="col-act"><button type="button" class="receipt-line-remove" aria-label="ลบรายการ"><i data-lucide="x"></i></button></td>
    `;
    tbody.appendChild(tr);
    bindRow(tr);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateNetTotal();
  }

  defaultItems.forEach((item) => addRow(item.name, item.price));

  const bookDateEl = document.getElementById('bookDate');
  if (bookDateEl && !bookDateEl.value && window.ReceiptDocument) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    bookDateEl.value = tomorrow.toISOString().slice(0, 10);
  }

  document.getElementById('btnAddLine')?.addEventListener('click', () => addRow(''));

  document.getElementById('btnPlateSearch')?.addEventListener('click', () => {
    const plate = document.getElementById('plateNo')?.value?.trim();
    if (!plate) {
      alert('กรุณากรอกทะเบียนรถ');
      return;
    }
    alert('ค้นหาทะเบียน: ' + plate + ' (เชื่อมต่อ API ภายหลัง)');
  });

  async function openPreview(data) {
    if (!modal || !preview || !window.ReceiptDocument) return;
    if (typeof ReceiptDocument.ensureSettings === 'function') {
      await ReceiptDocument.ensureSettings();
    }
    preview.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.innerHTML = ReceiptDocument.buildReceiptHtml(data);
    const doc = wrap.querySelector('#receiptDocPrint');
    if (doc) preview.appendChild(doc);
    modal.hidden = false;
    document.body.classList.add('receipt-modal-open');
  }

  function closePreview() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('receipt-modal-open');
  }

  document.getElementById('btnReceiptClose')?.addEventListener('click', closePreview);
  modal?.querySelector('.receipt-print-modal__backdrop')?.addEventListener('click', closePreview);

  document.getElementById('btnReceiptPrint')?.addEventListener('click', () => {
    const doc = document.getElementById('receiptDocPrint');
    if (doc && window.ReceiptDocument) {
      ReceiptDocument.printHtml(doc.outerHTML);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.ReceiptDocument) {
      alert('โหลดระบบใบเสร็จไม่สมบูรณ์ กรุณารีเฟรชหน้า');
      return;
    }

    const data = ReceiptDocument.collectFromForm(form);
    if (!data.lines.length) {
      alert('กรุณาเพิ่มรายการอย่างน้อย 1 รายการ');
      return;
    }
    if (data.grandTotal <= 0) {
      alert('ยอดรวมต้องมากกว่า 0 บาท');
      return;
    }

    await openPreview(data);
  });
})();
