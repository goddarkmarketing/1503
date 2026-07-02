/**
 * Build agent/reports/*.html from shell + partials
 * Run: node scripts/build-report-pages.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILTER = fs.readFileSync(path.join(ROOT, 'partials', 'agent-report-filter.html'), 'utf8');

const PAGES = [
  {
    file: 'agent/reports/daily-policies.html',
    title: 'ขายกรมธรรม์ประจำวัน — KLADEE BROKER',
    heading: 'รายการขายกรมธรรม์ประจำวัน',
    icon: 'clipboard-list',
    reportType: 'policies',
    columns: `
                      <th>เลขกรมธรรม์</th>
                      <th>ชื่อผู้เอาประกัน</th>
                      <th>รหัสแพ็คเกจ</th>
                      <th>ทะเบียนรถ</th>
                      <th class="col-money">เบี้ย</th>
                      <th class="col-money">เบี้ยรวม</th>
                      <th class="col-center">วันที่คุ้มครอง</th>
                      <th class="col-center">วันทำ</th>`
  },
  {
    file: 'agent/reports/daily-summary.html',
    title: 'สรุปการขายประจำวัน — KLADEE BROKER',
    heading: 'สรุปการขายประจำวัน',
    icon: 'bar-chart-3',
    reportType: 'summary',
    columns: `
                      <th>รหัสตัวแทน</th>
                      <th>รายละเอียด</th>
                      <th class="col-center">จำนวน กธ.</th>
                      <th class="col-money">ยอดสุทธิ</th>
                      <th class="col-money">เบี้ยรวมภาษีอากร</th>`
  }
];

function shell(main) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${main.title}</title>
  <link rel="stylesheet" href="../../css/style.css">
  <link rel="stylesheet" href="../../css/admin.css">
  <link rel="stylesheet" href="../../css/portal.css">
  <link rel="stylesheet" href="../../css/agent-report.css">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
</head>
<body data-base-path="../../" data-report-type="${main.reportType}">
  <div class="app">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon"><i data-lucide="shield-check"></i></div>
          <a href="../../agent/index.html" class="sidebar-logo-text">KLADEE BROKER</a>
        </div>
        <button class="sidebar-toggle" id="sidebarToggle" aria-label="สลับเมนู"><i data-lucide="menu"></i></button>
      </div>
      <nav class="sidebar-nav" data-agent-sidebar></nav>
      <div class="sidebar-footer"><a href="#" class="nav-link"><i data-lucide="log-out"></i><span class="nav-link-text">ออกจากระบบ</span></a></div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <div class="main-wrapper">
      <header class="top-header">
        <button class="header-icon-btn" id="mobileMenuBtn" aria-label="เปิดเมนู" style="display:none"><i data-lucide="menu"></i></button>
        <div class="balance-pill">
          <div class="balance-pill-text">
            <span class="balance-label">วงเงินคงเหลือ</span>
            <span class="balance-value"><span class="balance-amount" id="balanceAmount">0.00</span><span class="balance-currency">บ.</span></span>
          </div>
        </div>
        <button class="header-icon-btn" aria-label="การแจ้งเตือน"><i data-lucide="bell"></i><span class="notif-badge">0</span></button>
        <div class="user-profile"><div class="user-avatar">CK</div><span class="user-name">-</span></div>
      </header>
      <main class="main-content">
        <div class="content-card content-card--report">
          <div class="report-panel">
            <header class="report-panel__head">
              <i data-lucide="${main.icon}"></i>
              <h1>${main.heading}</h1>
            </header>
            <div class="report-panel__body">
${FILTER.split('\n').map((l) => '              ' + l).join('\n')}
              <div class="report-table-wrap">
                <table class="report-table">
                  <thead>
                    <tr>${main.columns}
                    </tr>
                  </thead>
                  <tbody id="reportTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  <script src="../../js/agent-sidebar-nav-template.js?v=20260701i"></script>
  <script src="../../js/load-agent.js"></script>
  <script src="../../js/app.js?v=20260701j"></script>
  <script src="../../js/pages/agent-report-daily.js"></script>
</body>
</html>
`;
}

PAGES.forEach((p) => {
  const out = path.join(ROOT, p.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, shell(p), 'utf8');
  console.log('built:', p.file);
});
