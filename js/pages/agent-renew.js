(function () {
  const tbody = document.getElementById('renewTableBody');
  if (!tbody) return;

  function renderEmpty(message = 'ไม่พบข้อมูล — กรุณากดค้นหา') {
    tbody.innerHTML = `<tr class="report-empty"><td colspan="10">${message}</td></tr>`;
  }

  document.getElementById('btnRenewSearch')?.addEventListener('click', () => {
    renderEmpty('ไม่พบกรมธรรม์ใกล้หมดอายุ');
  });

  renderEmpty();
})();
