/**
 * Generate shared agent shell pages for product key + brochure.
 * Run: node scripts/build-product-key-pages.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  { file: 'pa/indara.html', product: 'pa-indara', title: 'ประกันอุบัติเหตุ — อินทร' },
  { file: 'pa/axa.html', product: 'pa-axa', title: 'ประกันอุบัติเหตุ — AXA' },
  { file: 'pa/bki.html', product: 'pa-bki', title: 'ประกันอุบัติเหตุ — BKI' },
  { file: 'voluntary/axa.html', product: 'voluntary-axa', title: '2+ / 3+ — AXA' },
  { file: 'voluntary/indara.html', product: 'voluntary-indara', title: '2+ / 3+ — อินทร' },
  { file: 'travel/indara.html', product: 'travel-indara', title: 'ประกันเดินทาง — อินทร' }
];

function pageHtml({ product, title }) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | KLADEE BROKER</title>
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/form.css">
  <link rel="stylesheet" href="../css/portal.css">
  <link rel="stylesheet" href="../css/admin.css">
  <link rel="stylesheet" href="../css/product-key.css">
  <script src="../js/vendor/lucide.min.js"></script>
</head>
<body data-base-path="../" data-product="${product}">
  <div class="app form-page">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon"><i data-lucide="shield-check"></i></div>
          <a href="../agent/index.html" class="sidebar-logo-text">KLADEE BROKER</a>
        </div>
        <button class="sidebar-toggle" id="sidebarToggle" aria-label="สลับเมนู"><i data-lucide="menu"></i></button>
      </div>
      <!-- AGENT_SIDEBAR_V3 -->
      <nav class="sidebar-nav" data-agent-sidebar>
        <div class="nav-group" data-nav-zone="main">
          <p class="nav-group__title">หลัก</p>
          <ul class="nav-group__list">
            <li class="nav-item"><a href="../agent/index.html" class="nav-link" data-nav="home"><span class="nav-link-text">หน้าแรก</span></a></li>
          </ul>
        </div>
      </nav>
      <div class="sidebar-footer">
        <a href="#" class="nav-link"><i data-lucide="log-out"></i><span class="nav-link-text">ออกจากระบบ</span></a>
      </div>
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
          <button type="button" class="balance-refresh" id="balanceRefresh" aria-label="รีเฟรชยอดเงิน"><i data-lucide="refresh-cw"></i></button>
        </div>
        <button class="header-icon-btn" aria-label="การแจ้งเตือน"><i data-lucide="bell"></i><span class="notif-badge">0</span></button>
        <div class="user-profile"><div class="user-avatar">CK</div><span class="user-name">-</span><i data-lucide="chevron-down" class="user-chevron" style="width:16px;height:16px"></i></div>
      </header>
      <main class="main-content">
        <div class="product-key">
          <aside class="product-key__brochure" id="brochurePanel" aria-label="โบรชัวร์ผลิตภัณฑ์"></aside>
          <div class="product-key__form">
            <form id="productKeyForm" class="product-key__card" novalidate>
              <div class="product-key-card__head" id="productKeyHeader"></div>
              <div class="product-key-card__body">
                <div class="product-key__fields" id="productKeyFields"></div>
                <div class="product-key__premium">
                  <span class="product-key__premium-label">เบี้ยประกันภัยรวม</span>
                  <div class="product-key__premium-value" id="productKeyPremium">—</div>
                </div>
                <p class="product-key__hint" id="productKeyHint"></p>
              </div>
              <div class="product-key-card__foot">
                <p class="product-key-card__foot-hint" id="productKeyPageTitle">${title}</p>
                <button type="submit" class="btn-next">
                  บันทึกออกกรมธรรม์
                  <i data-lucide="check" style="width:18px;height:18px"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <footer class="page-footer"><span>KLADEE BROKER — Agent Portal</span></footer>
    </div>
  </div>
  <script src="../js/agent-sidebar-nav-template.js"></script>
  <script src="../js/load-agent.js"></script>
  <script src="../js/app.js"></script>
  <script src="../js/config/product-brochures.js"></script>
  <script src="../js/ui/brochure-panel.js"></script>
  <script src="../js/pages/product-key.js"></script>
  <script>
  (function () {
    const btn = document.getElementById('mobileMenuBtn');
    function check() { if (btn) btn.style.display = window.innerWidth <= 768 ? 'flex' : 'none'; }
    check();
    window.addEventListener('resize', check);
  })();
  </script>
</body>
</html>
`;
}

PAGES.forEach(({ file, product, title }) => {
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, pageHtml({ product, title }), 'utf8');
  console.log('wrote', file);
});
