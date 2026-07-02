(function () {
  const tbody = document.getElementById('reportTableBody');
  if (!tbody) return;

  const reportType = document.body.dataset.reportType || 'policies';
  const form = document.getElementById('reportFilterForm');

  const mockPolicies = [
    {
      policyNo: 'POL-2026-00128',
      insuredName: 'นายสมชาย ใจดี',
      packageCode: 'PKG-M1',
      plate: '1กก 9999',
      premium: '3,300.00',
      totalPremium: '3,534.00',
      coverageDate: '01/07/2026',
      txnDate: '30/06/2026'
    },
    {
      policyNo: 'POL-2026-00129',
      insuredName: 'นางสาวมาลี รักดี',
      packageCode: 'PKG-V2',
      plate: '2ขข 1234',
      premium: '8,500.00',
      totalPremium: '9,095.00',
      coverageDate: '05/07/2026',
      txnDate: '30/06/2026'
    }
  ];

  const mockSummary = [
    {
      agentCode: 'Ck1-039',
      detail: 'คุณเฟิร์น',
      policyCount: 5,
      netAmount: '16,500.00',
      totalTax: '17,655.00'
    },
    {
      agentCode: 'Ck2-040',
      detail: 'สมชาย ใจดี',
      policyCount: 3,
      netAmount: '9,900.00',
      totalTax: '10,593.00'
    }
  ];

  function renderEmpty() {
    const cols = tbody.closest('table')?.querySelectorAll('thead th').length || 5;
    tbody.innerHTML = `<tr class="report-empty"><td colspan="${cols}">ไม่พบข้อมูล — กด Submit เพื่อค้นหา</td></tr>`;
  }

  function renderPolicies(rows) {
    if (!rows.length) {
      renderEmpty();
      return;
    }
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>${r.policyNo}</td>
        <td>${r.insuredName}</td>
        <td>${r.packageCode}</td>
        <td>${r.plate}</td>
        <td class="col-money">${r.premium}</td>
        <td class="col-money">${r.totalPremium}</td>
        <td class="col-center">${r.coverageDate}</td>
        <td class="col-center">${r.txnDate}</td>
      </tr>
    `).join('');
  }

  function renderSummary(rows) {
    if (!rows.length) {
      renderEmpty();
      return;
    }
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>${r.agentCode}</td>
        <td>${r.detail}</td>
        <td class="col-center">${r.policyCount}</td>
        <td class="col-money">${r.netAmount}</td>
        <td class="col-money">${r.totalTax}</td>
      </tr>
    `).join('');
  }

  function runSearch() {
    if (reportType === 'summary') {
      renderSummary(mockSummary);
    } else {
      renderPolicies(mockPolicies);
    }
  }

  function resetForm() {
    form?.reset();
    const agentRadio = form?.querySelector('input[name="reportBy"][value="agent"]');
    if (agentRadio) agentRadio.checked = true;
    renderEmpty();
  }

  renderEmpty();

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch();
  });

  document.getElementById('btnReportCancel')?.addEventListener('click', resetForm);
  document.getElementById('btnReportPdf')?.addEventListener('click', () => {
    alert('ส่งออก PDF (เชื่อมต่อ API ภายหลัง)');
  });
  document.getElementById('btnReportExcel')?.addEventListener('click', () => {
    alert('ส่งออก Excel (เชื่อมต่อ API ภายหลัง)');
  });
})();
