(function () {
  const tbody = document.getElementById('receiptReportBody');
  if (!tbody) return;

  const mode = document.body.dataset.receiptReport || 'inquiry';
  const emptyColspan = mode === 'detail' ? 6 : 9;

  const dateInput = document.getElementById('receiptDate');
  if (dateInput && !dateInput.value) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    dateInput.value = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  }

  function renderEmpty() {
    tbody.innerHTML = `<tr class="receipt-empty"><td colspan="${emptyColspan}">ไม่พบข้อมูล</td></tr>`;
  }

  renderEmpty();

  document.getElementById('btnReceiptSearch')?.addEventListener('click', () => {
    renderEmpty();
  });

  document.getElementById('btnReceiptPdf')?.addEventListener('click', () => {
    alert('ส่งออก PDF (เชื่อมต่อ API ภายหลัง)');
  });
})();
