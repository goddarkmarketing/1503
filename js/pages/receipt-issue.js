(function () {
  const tbody = document.getElementById('receiptLinesBody');
  const netTotalEl = document.getElementById('netTotal');
  if (!tbody) return;

  const defaultItems = ['พรบ', '', '', ''];

  function formatMoney(n) {
    return Number(n || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  function addRow(itemName) {
    const index = tbody.querySelectorAll('tr').length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-no line-no">${index}</td>
      <td><input type="text" class="line-item" value="${itemName || ''}" placeholder="รายการ"></td>
      <td class="col-qty"><input type="number" class="line-qty" value="1" min="0" step="1"></td>
      <td class="col-money"><input type="text" class="line-price" value="0.00" inputmode="decimal"></td>
      <td class="col-money"><input type="text" class="line-total" value="0.00" readonly tabindex="-1"></td>
      <td class="col-act"><button type="button" class="receipt-line-remove" aria-label="ลบรายการ"><i data-lucide="x"></i></button></td>
    `;
    tbody.appendChild(tr);
    bindRow(tr);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateNetTotal();
  }

  defaultItems.forEach((name) => addRow(name));

  document.getElementById('btnAddLine')?.addEventListener('click', () => addRow(''));

  document.getElementById('btnPlateSearch')?.addEventListener('click', () => {
    const plate = document.getElementById('plateNo')?.value?.trim();
    if (!plate) {
      alert('กรุณากรอกทะเบียนรถ');
      return;
    }
    alert('ค้นหาทะเบียน: ' + plate + ' (เชื่อมต่อ API ภายหลัง)');
  });

  document.getElementById('receiptIssueForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('บันทึกใบเสร็จเรียบร้อย (เชื่อมต่อ API ภายหลัง)');
  });
})();
