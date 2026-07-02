/** Embedded agent sidebar — avoids fetch/cache issues */
window.AGENT_SIDEBAR_NAV_HTML = `<div class="nav-group" data-nav-zone="main">
  <p class="nav-group__title">หลัก</p>
  <ul class="nav-group__list">
    <li class="nav-item"><a href="{{BASE}}agent/index.html" class="nav-link" data-nav="home"><i data-lucide="house"></i><span class="nav-link-text">หน้าแรก</span></a></li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="products">
  <p class="nav-group__title">ออกกรมธรรม์</p>
  <ul class="nav-group__list">
    <li class="nav-item has-submenu" data-nav-group="compulsory">
      <a href="#" class="nav-link"><i data-lucide="shield"></i><span class="nav-link-text">ภาคบังคับ (พ.ร.บ.)</span><i data-lucide="chevron-down" class="nav-chevron"></i></a>
      <ul class="nav-submenu">
        <li><a href="{{BASE}}compulsory/indara.html" class="nav-sub-link" data-nav="compulsory-indara"><img src="{{BASE}}assets/logos/indara.png" alt="อินทรประกันภัย" class="sub-logo-img"><span class="nav-sub-link-label"><span>อินทรประกันภัย</span><span class="nav-badge">In-SURE</span></span></a></li>
        <li><a href="{{BASE}}compulsory/viriyah.html" class="nav-sub-link" data-nav="compulsory-viriyah"><img src="{{BASE}}assets/logos/viriyah.png" alt="วิริยะประกันภัย" class="sub-logo-img"><span class="nav-sub-link-label"><span>วิริยะประกันภัย</span><span class="nav-badge">OPApi</span></span></a></li>
        <li><a href="{{BASE}}compulsory/tokio-marine.html" class="nav-sub-link" data-nav="compulsory-tokio"><img src="{{BASE}}assets/logos/tokio-marine.png" alt="โตเกียวมารีนประกันภัย" class="sub-logo-img"><span class="nav-sub-link-label"><span>โตเกียวมารีนประกันภัย</span></span></a></li>
        <li><a href="{{BASE}}compulsory/ergo.html" class="nav-sub-link" data-nav="compulsory-ergo"><img src="{{BASE}}assets/logos/ergo.png" alt="เออร์โกประกันภัย" class="sub-logo-img"><span class="nav-sub-link-label"><span>เออร์โกประกันภัย</span></span></a></li>
      </ul>
    </li>
    <li class="nav-item has-submenu" data-nav-group="voluntary">
      <a href="#" class="nav-link"><i data-lucide="file-check"></i><span class="nav-link-text">ภาคสมัครใจ</span><i data-lucide="chevron-down" class="nav-chevron"></i></a>
      <ul class="nav-submenu">
        <li><a href="#" class="nav-sub-link"><img src="{{BASE}}assets/logos/indara.png" alt="อินทรประกันภัย" class="sub-logo-img"><span class="nav-sub-link-label"><span>อินทรประกันภัย</span></span></a></li>
        <li><a href="#" class="nav-sub-link"><img src="{{BASE}}assets/logos/ergo.png" alt="เออร์โกประกันภัย" class="sub-logo-img"><span class="nav-sub-link-label"><span>เออร์โกประกันภัย</span><span class="nav-badge">In-SURE</span></span></a></li>
        <li><a href="#" class="nav-sub-link"><img src="{{BASE}}assets/logos/tokio-marine.png" alt="โตเกียวมารีนประกันภัย" class="sub-logo-img"><span class="nav-sub-link-label"><span>โตเกียวมารีนประกันภัย</span></span></a></li>
      </ul>
    </li>
    <li class="nav-item has-submenu" data-nav-group="pa">
      <a href="#" class="nav-link"><i data-lucide="heart-pulse"></i><span class="nav-link-text">ประกันอุบัติเหตุ</span><i data-lucide="chevron-down" class="nav-chevron"></i></a>
      <ul class="nav-submenu">
        <li><a href="#" class="nav-sub-link"><img src="{{BASE}}assets/logos/ergo.png" alt="เออร์โกประกันภัย" class="sub-logo-img"><span class="nav-sub-link-label"><span>เออร์โกประกันภัย</span></span></a></li>
      </ul>
    </li>
    <li class="nav-item"><a href="{{BASE}}agent/renew.html" class="nav-link" data-nav="renew"><i data-lucide="refresh-cw"></i><span class="nav-link-text">ต่ออายุ กธ.</span><span class="nav-badge">renew</span></a></li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="reports">
  <p class="nav-group__title">รายงาน &amp; ข้อมูล</p>
  <ul class="nav-group__list">
    <li class="nav-item has-submenu" data-nav-group="reports">
      <a href="#" class="nav-link"><i data-lucide="bar-chart-3"></i><span class="nav-link-text">รายงาน</span><i data-lucide="chevron-down" class="nav-chevron"></i></a>
      <ul class="nav-submenu">
        <li><a href="{{BASE}}agent/reports/daily-policies.html" class="nav-sub-link" data-nav="reports-daily-policies"><i data-lucide="clipboard-list" class="nav-sub-icon"></i><span>ขายกรมธรรม์ประจำวัน</span></a></li>
        <li><a href="{{BASE}}agent/reports/daily-summary.html" class="nav-sub-link" data-nav="reports-daily-summary"><i data-lucide="bar-chart-3" class="nav-sub-icon"></i><span>สรุปการขายประจำวัน</span></a></li>
        <li><a href="{{BASE}}agent/reports/monthly.html" class="nav-sub-link" data-nav="reports-monthly"><i data-lucide="calendar-range" class="nav-sub-icon"></i><span>รายงานรายเดือน</span></a></li>
        <li><a href="{{BASE}}agent/reports/team.html" class="nav-sub-link" data-nav="reports-team"><i data-lucide="users-round" class="nav-sub-icon"></i><span>รายงานลูกทีม</span></a></li>
      </ul>
    </li>
    <li class="nav-item"><a href="{{BASE}}agent/inquiry.html" class="nav-link" data-nav="inquiry"><i data-lucide="search"></i><span class="nav-link-text">สอบถามกรมธรรม์</span></a></li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="finance">
  <p class="nav-group__title">การเงิน</p>
  <ul class="nav-group__list">
    <li class="nav-item"><a href="{{BASE}}agent/commission.html" class="nav-link" data-nav="commission"><i data-lucide="coins"></i><span class="nav-link-text">ค่าคอมมิชชัน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}agent/credit.html" class="nav-link" data-nav="credit"><i data-lucide="wallet"></i><span class="nav-link-text">ขอเติมวงเงิน</span></a></li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="receipt">
  <p class="nav-group__title">ใบเสร็จ</p>
  <ul class="nav-group__list">
    <li class="nav-item has-submenu" data-receipt-nav data-nav-group="receipt">
      <a href="#" class="nav-link"><i data-lucide="receipt"></i><span class="nav-link-text">ออกใบเสร็จ</span><i data-lucide="chevron-down" class="nav-chevron"></i></a>
      <ul class="nav-submenu">
        <li><a href="{{BASE}}agent/receipt/issue.html" class="nav-sub-link" data-receipt-page="issue" data-nav="receipt-issue"><i data-lucide="printer" class="nav-sub-icon"></i><span>ออกใบเสร็จ</span></a></li>
        <li><a href="{{BASE}}agent/receipt/inquiry.html" class="nav-sub-link" data-receipt-page="inquiry" data-nav="receipt-inquiry"><i data-lucide="search" class="nav-sub-icon"></i><span>สอบถามข้อมูล</span></a></li>
        <li><a href="{{BASE}}agent/receipt/daily-summary.html" class="nav-sub-link" data-receipt-page="daily-summary" data-nav="receipt-summary"><i data-lucide="bar-chart-2" class="nav-sub-icon"></i><span>สรุปประจำวัน</span></a></li>
        <li><a href="{{BASE}}agent/receipt/daily-detail.html" class="nav-sub-link" data-receipt-page="daily-detail" data-nav="receipt-detail"><i data-lucide="list" class="nav-sub-icon"></i><span>รายละเอียดประจำวัน</span></a></li>
      </ul>
    </li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="team">
  <p class="nav-group__title">ทีมงาน</p>
  <ul class="nav-group__list">
    <li class="nav-item"><a href="{{BASE}}agent/team.html" class="nav-link" data-nav="team"><i data-lucide="users"></i><span class="nav-link-text">ลูกทีม</span></a></li>
  </ul>
</div>`;

window.AGENT_SIDEBAR_NAV_COUNT = 11;

window.renderAgentSidebarNav = function renderAgentSidebarNav() {
  const navRoot = document.querySelector('.sidebar-nav[data-agent-sidebar]');
  if (!navRoot || !window.AGENT_SIDEBAR_NAV_HTML) return false;

  const itemCount = navRoot.querySelectorAll('.nav-item').length;
  const hasReceipt = !!navRoot.querySelector('[data-receipt-nav]');
  const hasGroups = !!navRoot.querySelector('.nav-group');
  const base = document.body?.dataset?.basePath || '';

  if (itemCount >= window.AGENT_SIDEBAR_NAV_COUNT && hasReceipt && hasGroups) {
    return true;
  }

  navRoot.innerHTML = window.AGENT_SIDEBAR_NAV_HTML.replace(/\{\{BASE\}\}/g, base);
  navRoot.dataset.sidebarRendered = '1';
  return true;
};

(function bootAgentSidebarNav() {
  function run() {
    if (typeof window.renderAgentSidebarNav === 'function') {
      window.renderAgentSidebarNav();
    }
  }
  run();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  }
})();
