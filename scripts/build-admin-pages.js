/**
 * Build admin sub-pages from shell template
 * Run: node scripts/build-admin-pages.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function sidebarHeaderHtml(base) {
  return `<div class="sidebar-header">
        <a href="${base}admin/index.html" class="sidebar-brand" aria-label="กล้าดีโบรคเกอร์">
          <img src="${base}images/logo-kladee.png" alt="กล้าดีโบรคเกอร์" class="sidebar-brand__img" width="140" height="40">
        </a>
        <button class="sidebar-toggle" id="sidebarToggle" aria-label="สลับเมนู"><i data-lucide="menu"></i></button>
      </div>`;
}

function shell(opts) {
  const base = opts.depth === 2 ? '../../' : '../';
  const cssReport = opts.report ? `
  <link rel="stylesheet" href="${base}css/agent-report.css">
  <link rel="stylesheet" href="${base}css/agent-finance.css">` : '';
  const bodyAttrs = [opts.bodyData].filter(Boolean).join(' ');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <link rel="stylesheet" href="${base}css/style.css">
  <link rel="stylesheet" href="${base}css/admin.css">
  <link rel="stylesheet" href="${base}css/portal.css">${cssReport}
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
</head>
<body data-portal="admin" data-base-path="${base}"${bodyAttrs ? ` ${bodyAttrs}` : ''}>
  <div class="app">
    <aside class="sidebar" id="sidebar">
      ${sidebarHeaderHtml(base)}
      <nav class="sidebar-nav" data-admin-sidebar></nav>
      <div class="sidebar-footer"><a href="#" class="nav-link"><i data-lucide="log-out"></i><span class="nav-link-text">ออกจากระบบ</span></a></div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <div class="main-wrapper">
      <header class="top-header">
        <button class="header-icon-btn" id="mobileMenuBtn" aria-label="เปิดเมนู" style="display:none"><i data-lucide="menu"></i></button>
        <button class="header-icon-btn" aria-label="การแจ้งเตือน"><i data-lucide="bell"></i><span class="notif-badge">0</span></button>
        <div class="user-profile"><div class="user-avatar">AD</div><span class="user-name" data-shell="user-name">Admin</span></div>
      </header>
      <main class="main-content">
${opts.main}
      </main>
    </div>
  </div>
  <script src="${base}js/admin-sidebar-nav-template.js?v=20260702a"></script>
  <script src="${base}js/load-admin.js"></script>
  <script src="${base}js/admin-app.js"></script>
  <script src="${base}js/pages/${opts.script}"></script>
</body>
</html>
`;
}

const PAGES = [
  {
    file: 'admin/credit-requests.html',
    title: 'อนุมัติเติมวงเงิน — Admin',
    script: 'admin-credit-requests.js',
    main: `        <div class="content-card">
          <div class="admin-toolbar">
            <div>
              <h1 class="admin-page-title">อนุมัติเติมวงเงิน</h1>
              <p class="admin-hint">ตรวจสอบและอนุมัติคำขอจากนายหน้า</p>
            </div>
            <select id="creditRequestFilter" class="admin-select">
              <option value="">ทุกสถานะ</option>
              <option value="pending">รออนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>วันที่ขอ</th><th>นายหน้า</th><th>จำนวน</th><th>หมายเหตุ</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
              <tbody id="creditRequestsBody"></tbody>
            </table>
          </div>
        </div>`
  },
  {
    file: 'admin/commission.html',
    title: 'ค่าคอมมิชชัน — Admin',
    script: 'admin-commission.js',
    main: `        <div class="content-card">
          <div class="admin-toolbar">
            <div>
              <h1 class="admin-page-title">ค่าคอมมิชชัน</h1>
              <p class="admin-hint">จัดการค่าคอมมิชชันทั้งระบบ</p>
            </div>
            <div class="admin-filter-bar">
              <select id="commissionPeriod" class="admin-select"></select>
              <select id="commissionStatus" class="admin-select">
                <option value="">ทุกสถานะ</option>
                <option value="paid">จ่ายแล้ว</option>
                <option value="pending">ค้างจ่าย</option>
              </select>
            </div>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>นายหน้า</th><th>เลขกรมธรรม์</th><th>ประเภท</th><th>เบี้ย</th><th>ค่าคอม</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
              <tbody id="adminCommissionBody"></tbody>
            </table>
          </div>
        </div>`
  },
  {
    file: 'admin/renew.html',
    title: 'ต่ออายุกรมธรรม์ — Admin',
    script: 'admin-renew.js',
    report: true,
    main: `        <div class="content-card content-card--report">
          <div class="report-panel">
            <header class="report-panel__head"><i data-lucide="refresh-cw"></i><h1>กรมธรรม์ใกล้หมดอายุ (ทั้งระบบ)</h1></header>
            <div class="report-panel__body">
              <div class="finance-toolbar">
                <div class="finance-toolbar__field"><label for="renewDays">ภายใน (วัน)</label><select id="renewDays"><option value="30">30 วัน</option><option value="60" selected>60 วัน</option><option value="90">90 วัน</option></select></div>
                <div class="finance-toolbar__field"><label>&nbsp;</label><button type="button" class="btn-primary btn-sm" id="btnRenewSearch">ค้นหา</button></div>
              </div>
              <div class="report-table-wrap">
                <table class="report-table">
                  <thead><tr><th>เลขกรมธรรม์</th><th>นายหน้า</th><th>บริษัทประกัน</th><th>ผู้เอาประกัน</th><th>ทะเบียน</th><th>หมดอายุ</th><th>เบี้ย</th></tr></thead>
                  <tbody id="adminRenewBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>`
  },
  {
    file: 'admin/team.html',
    title: 'โครงสร้างทีม — Admin',
    script: 'admin-team.js',
    main: `        <div class="content-card">
          <div class="admin-toolbar">
            <div><h1 class="admin-page-title">โครงสร้างทีม</h1><p class="admin-hint">หัวทีมและลูกทีมในระบบ</p></div>
          </div>
          <div id="teamHierarchyRoot"></div>
        </div>`
  },
  {
    file: 'admin/products.html',
    title: 'ตั้งค่าผลิตภัณฑ์ — Admin',
    script: 'admin-products.js',
    main: `        <div class="content-card">
          <div class="admin-toolbar">
            <div><h1 class="admin-page-title">ตั้งค่าผลิตภัณฑ์</h1><p class="admin-hint">เปิด/ปิดผลิตภัณฑ์ตามบริษัทประกัน</p></div>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>บริษัทประกัน</th><th>พ.ร.บ.</th><th>ภาคสมัครใจ</th><th>ประกันอุบัติเหตุ</th></tr></thead>
              <tbody id="productsTableBody"></tbody>
            </table>
          </div>
        </div>`
  }
];

const REPORT_PAGES = [
  {
    file: 'admin/reports/daily-policies.html',
    title: 'ขายกรมธรรม์ประจำวัน — Admin',
    script: 'admin-report-daily.js',
    bodyData: 'data-report-type="policies"',
    columns: `<th>เลขกรมธรรม์</th><th>นายหน้า</th><th>ชื่อผู้เอาประกัน</th><th>ทะเบียนรถ</th><th class="col-money">เบี้ย</th><th class="col-money">เบี้ยรวม</th><th class="col-center">วันทำ</th>`,
    heading: 'ขายกรมธรรม์ประจำวัน (ทั้งระบบ)',
    icon: 'clipboard-list'
  },
  {
    file: 'admin/reports/daily-summary.html',
    title: 'สรุปการขายประจำวัน — Admin',
    script: 'admin-report-daily.js',
    bodyData: 'data-report-type="summary"',
    columns: `<th>รหัสตัวแทน</th><th>รายละเอียด</th><th class="col-center">จำนวน กธ.</th><th class="col-money">ยอดสุทธิ</th><th class="col-money">เบี้ยรวมภาษีอากร</th>`,
    heading: 'สรุปการขายประจำวัน (ทั้งระบบ)',
    icon: 'bar-chart-3'
  },
  {
    file: 'admin/reports/monthly.html',
    title: 'รายงานรายเดือน — Admin',
    script: 'admin-report-monthly.js',
    heading: 'รายงานรายเดือน (ทั้งระบบ)',
    icon: 'calendar-range'
  },
  {
    file: 'admin/reports/team.html',
    title: 'รายงานลูกทีม — Admin',
    script: 'admin-report-team.js',
    heading: 'รายงานลูกทีม (ทั้งระบบ)',
    icon: 'users-round'
  }
];

function reportShell(p) {
  const base = '../../';
  if (p.file.includes('monthly')) {
    return shell({
      depth: 2,
      title: p.title,
      script: p.script,
      report: true,
      main: `        <div class="content-card content-card--report">
          <div class="report-panel">
            <header class="report-panel__head"><i data-lucide="${p.icon}"></i><h1>${p.heading}</h1></header>
            <div class="report-panel__body">
              <div class="finance-stats finance-stats--3x2">
                <div class="finance-stat"><div class="finance-stat__label">พ.ร.บ. (จำนวน)</div><div class="finance-stat__value" id="statPrbCount">0</div></div>
                <div class="finance-stat"><div class="finance-stat__label">พ.ร.บ. (เบี้ย)</div><div class="finance-stat__value" id="statPrbPremium">0</div></div>
                <div class="finance-stat"><div class="finance-stat__label">สมัครใจ (จำนวน)</div><div class="finance-stat__value" id="statVolCount">0</div></div>
                <div class="finance-stat"><div class="finance-stat__label">สมัครใจ (เบี้ย)</div><div class="finance-stat__value" id="statVolPremium">0</div></div>
                <div class="finance-stat"><div class="finance-stat__label">รวม (จำนวน)</div><div class="finance-stat__value" id="statTotalCount">0</div></div>
                <div class="finance-stat"><div class="finance-stat__label">รวม (เบี้ย)</div><div class="finance-stat__value" id="statTotalPremium">0</div></div>
              </div>
              <div class="finance-toolbar">
                <div class="finance-toolbar__field"><label for="reportPeriod">เดือน</label><select id="reportPeriod"></select></div>
                <div class="finance-toolbar__field"><label for="reportView">มุมมอง</label><select id="reportView"><option value="insurer">แยกตามบริษัทประกัน</option><option value="day">แยกตามวัน</option></select></div>
                <div class="finance-toolbar__field"><label>&nbsp;</label><button type="button" class="btn-primary btn-sm" id="btnMonthlySearch">ค้นหา</button></div>
              </div>
              <div class="report-table-wrap"><table class="report-table"><thead id="monthlyTableHead"><tr><th>บริษัทประกัน</th><th class="col-center">จำนวน กธ.</th><th class="col-money">เบี้ยรวม</th></tr></thead><tbody id="monthlyTableBody"></tbody></table></div>
            </div>
          </div>
        </div>`
    });
  }
  if (p.file.includes('team.html') && p.file.includes('reports')) {
    return shell({
      depth: 2,
      title: p.title,
      script: p.script,
      report: true,
      main: `        <div class="content-card content-card--report">
          <div class="report-panel">
            <header class="report-panel__head"><i data-lucide="${p.icon}"></i><h1>${p.heading}</h1></header>
            <div class="report-panel__body">
              <div class="finance-toolbar">
                <div class="finance-toolbar__field"><label for="teamReportPeriod">เดือน</label><select id="teamReportPeriod"></select></div>
                <div class="finance-toolbar__field"><label>&nbsp;</label><button type="button" class="btn-primary btn-sm" id="btnTeamReportSearch">ค้นหา</button></div>
              </div>
              <div class="report-table-wrap"><table class="report-table"><thead><tr><th>หัวทีม</th><th>รหัสลูกทีม</th><th>ชื่อ</th><th class="col-center">จำนวน กธ.</th><th class="col-money">เบี้ยรวม</th><th class="col-money">ค่าคอม</th></tr></thead><tbody id="teamReportBody"></tbody><tfoot id="teamReportFoot"></tfoot></table></div>
            </div>
          </div>
        </div>`
    });
  }
  return shell({
    depth: 2,
    title: p.title,
    script: p.script,
    report: true,
    bodyData: p.bodyData,
    main: `        <div class="content-card content-card--report">
          <div class="report-panel">
            <header class="report-panel__head"><i data-lucide="${p.icon}"></i><h1>${p.heading}</h1></header>
            <div class="report-panel__body">
              <div class="finance-toolbar">
                <div class="finance-toolbar__field"><label for="reportDate">วันที่</label><input type="date" id="reportDate"></div>
                <div class="finance-toolbar__field"><label>&nbsp;</label><button type="button" class="btn-primary btn-sm" id="btnReportSearch">ค้นหา</button></div>
              </div>
              <div class="report-table-wrap"><table class="report-table"><thead><tr>${p.columns}</tr></thead><tbody id="reportTableBody"></tbody></table></div>
            </div>
          </div>
        </div>`
  });
}

const RECEIPT_PAGES = [
  { file: 'admin/receipt/inquiry.html', mode: 'inquiry', title: 'สอบถามใบเสร็จ — Admin', heading: 'สอบถามใบเสร็จ (ทั้งระบบ)', cols: 7, head: '<th>เลขใบเสร็จ</th><th>นายหน้า</th><th>ลูกค้า</th><th>เลขกรมธรรม์</th><th class="col-money">จำนวน</th><th>วันที่</th><th>สถานะ</th>' },
  { file: 'admin/receipt/daily-summary.html', mode: 'summary', title: 'สรุปใบเสร็จรายวัน — Admin', heading: 'สรุปใบเสร็จประจำวัน', cols: 4, head: '<th>นายหน้า</th><th class="col-center">จำนวนใบ</th><th class="col-money">ยอดรวม</th><th>วันที่</th>' },
  { file: 'admin/receipt/daily-detail.html', mode: 'detail', title: 'รายละเอียดใบเสร็จ — Admin', heading: 'รายละเอียดใบเสร็จประจำวัน', cols: 6, head: '<th>เลขใบเสร็จ</th><th>นายหน้า</th><th>ลูกค้า</th><th>เลขกรมธรรม์</th><th class="col-money">จำนวน</th><th>เวลา</th>' }
];

PAGES.forEach((p) => {
  const out = path.join(ROOT, p.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, shell({ ...p, depth: 1 }), 'utf8');
  console.log('built:', p.file);
});

REPORT_PAGES.forEach((p) => {
  const out = path.join(ROOT, p.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, reportShell(p), 'utf8');
  console.log('built:', p.file);
});

RECEIPT_PAGES.forEach((p) => {
  const out = path.join(ROOT, p.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const html = shell({
    depth: 2,
    title: p.title,
    script: 'admin-receipt.js',
    report: true,
    bodyData: `data-receipt-mode="${p.mode}"`,
    main: `        <div class="content-card content-card--report">
          <div class="report-panel">
            <header class="report-panel__head"><i data-lucide="receipt"></i><h1>${p.heading}</h1></header>
            <div class="report-panel__body">
              <div class="finance-toolbar">
                <div class="finance-toolbar__field"><label for="receiptDate">วันที่</label><input type="date" id="receiptDate"></div>
                <div class="finance-toolbar__field"><label for="receiptAgent">นายหน้า</label><select id="receiptAgent"><option value="">ทุกนายหน้า</option></select></div>
                <div class="finance-toolbar__field"><label>&nbsp;</label><button type="button" class="btn-primary btn-sm" id="btnReceiptSearch">ค้นหา</button></div>
              </div>
              <div class="report-table-wrap"><table class="report-table"><thead><tr>${p.head}</tr></thead><tbody id="receiptTableBody"></tbody></table></div>
            </div>
          </div>
        </div>`
  });
  fs.writeFileSync(out, html, 'utf8');
  console.log('built:', p.file);
});
