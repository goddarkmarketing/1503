/** Embedded admin sidebar */
window.ADMIN_SIDEBAR_NAV_HTML = `<div class="nav-group" data-nav-zone="main">
  <p class="nav-group__title">หลัก</p>
  <ul class="nav-group__list">
    <li class="nav-item"><a href="{{BASE}}admin/" class="nav-link" data-nav="home"><i data-lucide="layout-dashboard"></i><span class="nav-link-text">แดชบอร์ด</span></a></li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="agents">
  <p class="nav-group__title">นายหน้า &amp; ทีม</p>
  <ul class="nav-group__list">
    <li class="nav-item"><a href="{{BASE}}admin/agents" class="nav-link" data-nav="agents"><i data-lucide="users"></i><span class="nav-link-text">จัดการนายหน้า</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/agent-commission-credit" class="nav-link" data-nav="agent-commission-credit"><i data-lucide="sliders-horizontal"></i><span class="nav-link-text">ตั้งค่าคอม/ปรับวงเงิน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/agent-requests" class="nav-link" data-nav="agent-requests"><i data-lucide="user-plus"></i><span class="nav-link-text">อนุมัติเพิ่มตัวแทน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/agent-verifications" class="nav-link" data-nav="agent-verifications"><i data-lucide="badge-check"></i><span class="nav-link-text">ยืนยันตัวตน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/team" class="nav-link" data-nav="team"><i data-lucide="users-round"></i><span class="nav-link-text">โครงสร้างทีม</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/users" class="nav-link" data-nav="users"><i data-lucide="shield"></i><span class="nav-link-text">ผู้ดูแลระบบ</span></a></li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="policies">
  <p class="nav-group__title">กรมธรรม์</p>
  <ul class="nav-group__list">
    <li class="nav-item"><a href="{{BASE}}admin/policies" class="nav-link" data-nav="policies"><i data-lucide="file-text"></i><span class="nav-link-text">กรมธรรม์ทั้งหมด</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/pending" class="nav-link" data-nav="pending"><i data-lucide="alert-circle"></i><span class="nav-link-text">กรมธรรม์ค้าง</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/renew" class="nav-link" data-nav="renew"><i data-lucide="refresh-cw"></i><span class="nav-link-text">ต่ออายุกรมธรรม์</span></a></li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="reports">
  <p class="nav-group__title">รายงาน</p>
  <ul class="nav-group__list">
    <li class="nav-item has-submenu" data-nav-group="reports">
      <a href="#" class="nav-link"><i data-lucide="bar-chart-3"></i><span class="nav-link-text">รายงานยอดขาย</span><i data-lucide="chevron-down" class="nav-chevron"></i></a>
      <ul class="nav-submenu">
        <li><a href="{{BASE}}admin/reports/daily-policies" class="nav-sub-link" data-nav="reports-daily-policies"><i data-lucide="clipboard-list" class="nav-sub-icon"></i><span>ขายกรมธรรม์ประจำวัน</span></a></li>
        <li><a href="{{BASE}}admin/reports/daily-summary" class="nav-sub-link" data-nav="reports-daily-summary"><i data-lucide="bar-chart-3" class="nav-sub-icon"></i><span>สรุปการขายประจำวัน</span></a></li>
        <li><a href="{{BASE}}admin/reports/monthly" class="nav-sub-link" data-nav="reports-monthly"><i data-lucide="calendar-range" class="nav-sub-icon"></i><span>รายงานรายเดือน</span></a></li>
        <li><a href="{{BASE}}admin/reports/team" class="nav-sub-link" data-nav="reports-team"><i data-lucide="users-round" class="nav-sub-icon"></i><span>รายงานลูกทีม</span></a></li>
      </ul>
    </li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="finance">
  <p class="nav-group__title">การเงิน</p>
  <ul class="nav-group__list">
    <li class="nav-item"><a href="{{BASE}}admin/credit-requests" class="nav-link" data-nav="credit-requests"><i data-lucide="inbox"></i><span class="nav-link-text">อนุมัติเติมวงเงิน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/withdraw-requests" class="nav-link" data-nav="withdraw-requests"><i data-lucide="banknote"></i><span class="nav-link-text">อนุมัติถอนเงิน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/credit-ledger" class="nav-link" data-nav="credit-ledger"><i data-lucide="wallet"></i><span class="nav-link-text">ประวัติวงเงิน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/credit-bank-accounts" class="nav-link" data-nav="credit-bank-accounts"><i data-lucide="banknote"></i><span class="nav-link-text">บัญชีรับโอน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/commission" class="nav-link" data-nav="commission"><i data-lucide="coins"></i><span class="nav-link-text">ค่าคอมมิชชัน</span></a></li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="receipt">
  <p class="nav-group__title">ใบเสร็จ</p>
  <ul class="nav-group__list">
    <li class="nav-item has-submenu" data-receipt-nav data-nav-group="receipt">
      <a href="#" class="nav-link"><i data-lucide="receipt"></i><span class="nav-link-text">ใบเสร็จ</span><i data-lucide="chevron-down" class="nav-chevron"></i></a>
      <ul class="nav-submenu">
        <li><a href="{{BASE}}admin/receipt/issue" class="nav-sub-link" data-nav="receipt-issue"><i data-lucide="printer" class="nav-sub-icon"></i><span>ออกใบเสร็จ</span></a></li>
        <li><a href="{{BASE}}admin/receipt/inquiry" class="nav-sub-link" data-nav="receipt-inquiry"><i data-lucide="search" class="nav-sub-icon"></i><span>สอบถามข้อมูล</span></a></li>
        <li><a href="{{BASE}}admin/receipt/daily-summary" class="nav-sub-link" data-nav="receipt-summary"><i data-lucide="bar-chart-2" class="nav-sub-icon"></i><span>สรุปประจำวัน</span></a></li>
        <li><a href="{{BASE}}admin/receipt/daily-detail" class="nav-sub-link" data-nav="receipt-detail"><i data-lucide="list" class="nav-sub-icon"></i><span>รายละเอียดประจำวัน</span></a></li>
      </ul>
    </li>
  </ul>
</div>
<div class="nav-group" data-nav-zone="settings">
  <p class="nav-group__title">ตั้งค่าระบบ</p>
  <ul class="nav-group__list">
    <li class="nav-item"><a href="{{BASE}}admin/insurers" class="nav-link" data-nav="insurers"><i data-lucide="building-2"></i><span class="nav-link-text">บริษัทประกัน</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/products" class="nav-link" data-nav="products"><i data-lucide="settings"></i><span class="nav-link-text">ตั้งค่าผลิตภัณฑ์</span></a></li>
    <li class="nav-item"><a href="{{BASE}}admin/receipt-settings" class="nav-link" data-nav="receipt-settings"><i data-lucide="file-pen"></i><span class="nav-link-text">ตั้งค่าใบเสร็จ</span></a></li>
    <li class="nav-item has-submenu" data-nav-group="wht50">
      <a href="#" class="nav-link"><i data-lucide="file-signature"></i><span class="nav-link-text">ตั้งค่า 50 ทวิ</span><i data-lucide="chevron-down" class="nav-chevron"></i></a>
      <ul class="nav-submenu">
        <li><a href="{{BASE}}admin/wht50-settings" class="nav-sub-link" data-nav="wht50-settings"><i data-lucide="settings-2" class="nav-sub-icon"></i><span>ตั้งค่าเอกสาร</span></a></li>
        <li><a href="{{BASE}}admin/wht50" class="nav-sub-link" data-nav="wht50"><i data-lucide="file-badge" class="nav-sub-icon"></i><span>สรุปยอด 50 ทวิ</span></a></li>
      </ul>
    </li>
    <li class="nav-item"><a href="{{BASE}}admin/audit-log" class="nav-link" data-nav="audit"><i data-lucide="scroll-text"></i><span class="nav-link-text">บันทึกระบบ</span></a></li>
  </ul>
</div>`;

window.ADMIN_SIDEBAR_NAV_VERSION = '20260821e';

window.renderAdminSidebarNav = function renderAdminSidebarNav() {
  const navRoot = document.querySelector('.sidebar-nav[data-admin-sidebar]');
  if (!navRoot || !window.ADMIN_SIDEBAR_NAV_HTML) return false;

  const base = document.body?.dataset?.basePath || '';
  const alreadyCurrent = navRoot.dataset.sidebarVersion === window.ADMIN_SIDEBAR_NAV_VERSION
    && navRoot.querySelector('[data-nav="agent-verifications"]');
  if (alreadyCurrent) return true;

  navRoot.innerHTML = window.ADMIN_SIDEBAR_NAV_HTML.replace(/\{\{BASE\}\}/g, base);
  navRoot.dataset.sidebarVersion = window.ADMIN_SIDEBAR_NAV_VERSION;
  return true;
};

(function bootAdminSidebarNav() {
  function run() {
    if (typeof window.renderAdminSidebarNav === 'function') {
      window.renderAdminSidebarNav();
    }
  }
  run();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  }
})();
