/* KLADEE BROKER — Dashboard App */

const AGENT_SIDEBAR_CACHE = '20260701j';

document.addEventListener('DOMContentLoaded', async () => {
  const basePath = document.body.dataset.basePath || '';

  if (window.App) {
    App.RoleGuard.enforce('agent', { basePath });
    App.Shell.init({
      basePath,
      profilePath: `${basePath}agent/profile.html`
    });
  }

  await loadAgentSidebarNav();
  if (typeof window.renderAgentSidebarNav === 'function') {
    window.renderAgentSidebarNav();
  }
  initLucideIcons();
  initSidebar();
  initNavDropdowns();
  initDevelopingInsurerLinks();
  initBalanceRefresh();
  initChartTabs();
  initRevenueChart();
  initAgentDashboard();
  initBackToTop();
  initDatePicker();
});

function initLucideIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function loadAgentSidebarNav() {
  if (typeof window.renderAgentSidebarNav === 'function') {
    window.renderAgentSidebarNav();
  }

  const navRoot = document.querySelector('.sidebar-nav[data-agent-sidebar]');
  if (!navRoot) return;

  markAgentNavActive(navRoot);
}

function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+$/, '') || '/';
}

function markAgentNavActive(navRoot) {
  const current = normalizePath(window.location.pathname);
  let activeLink = null;
  let activeScore = -1;

  navRoot.querySelectorAll('a[href]').forEach((link) => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    const linkPath = normalizePath(new URL(link.href, window.location.href).pathname);
    const exact = current === linkPath;
    const suffix = current.endsWith(linkPath)
      && (current.length === linkPath.length || current.charAt(current.length - linkPath.length - 1) === '/');
    const matches = exact || suffix;

    if (matches && linkPath.length > activeScore) {
      activeScore = linkPath.length;
      activeLink = link;
    }
  });

  navRoot.querySelectorAll('.nav-item.has-submenu').forEach((item) => {
    item.classList.remove('submenu-open');
  });

  if (!activeLink) return;

  activeLink.classList.add('active');
  const parentSubmenu = activeLink.closest('.nav-item.has-submenu');
  if (parentSubmenu) {
    parentSubmenu.classList.add('submenu-open');
  }
}

/* ── Sidebar ── */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const mobileBtn = document.getElementById('mobileMenuBtn');

  toggle?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('mobile-open');
      overlay?.classList.toggle('active');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });

  mobileBtn?.addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
    overlay?.classList.add('active');
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('mobile-open');
      overlay?.classList.remove('active');
    }
  });
}

/* ── Nav Dropdowns ── */
function initNavDropdowns() {
  document.querySelectorAll('.nav-item.has-submenu').forEach(item => {
    const link = item.querySelector(':scope > .nav-link');
    if (!link) return;

    if (item.querySelector('.nav-sub-link.active') || link.classList.contains('active')) {
      item.classList.add('submenu-open');
    }

    link.addEventListener('click', (e) => {
      e.preventDefault();
      item.classList.toggle('submenu-open');
    });
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.closest('.has-submenu') && link.parentElement.classList.contains('has-submenu')) return;

    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link.active').forEach(el => el.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

/* ── Insurer submenu — coming soon (except compulsory Indara) ── */
function initDevelopingInsurerLinks() {
  const nav = document.querySelector('.sidebar-nav[data-agent-sidebar]');
  if (!nav || nav.dataset.devLinksBound) return;
  nav.dataset.devLinksBound = '1';

  nav.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-submenu .nav-sub-link');
    if (!link) return;

    const group = link.closest('[data-nav-group]');
    if (!group) return;

    const groupId = group.dataset.navGroup;
    if (groupId !== 'compulsory' && groupId !== 'voluntary' && groupId !== 'pa') return;
    if (groupId === 'compulsory' && link.dataset.nav === 'compulsory-indara') return;

    e.preventDefault();
    showDevelopingModal();
  });
}

function showDevelopingModal() {
  document.getElementById('portalDevelopingModal')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'portal-modal-overlay';
  overlay.id = 'portalDevelopingModal';
  overlay.innerHTML = `
    <div class="portal-modal" role="alertdialog" aria-modal="true" aria-labelledby="portalDevelopingTitle">
      <div class="portal-modal-body portal-modal-body--center">
        <div class="portal-modal-icon" aria-hidden="true"><i data-lucide="construction"></i></div>
        <h2 class="portal-modal-title" id="portalDevelopingTitle">กำลังพัฒนา</h2>
        <p class="portal-modal-text">ฟีเจอร์นี้อยู่ระหว่างการพัฒนา<br>ขออภัยในความไม่สะดวก</p>
      </div>
      <div class="portal-modal-footer">
        <button type="button" class="portal-modal-btn">ตกลง</button>
      </div>
    </div>
  `;

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('.portal-modal-btn')?.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  initLucideIcons();
  overlay.querySelector('.portal-modal-btn')?.focus();
}

window.showDevelopingModal = showDevelopingModal;

/* ── Balance Refresh ── */
function initBalanceRefresh() {
  const btn = document.getElementById('balanceRefresh');
  const amount = document.getElementById('balanceAmount');
  if (!btn || !amount) return;

  btn.addEventListener('click', async () => {
    btn.classList.add('spinning');

    try {
      const agentId = App.Session?.getAgentId();
      if (agentId && App.BalanceService) {
        const { balance } = await App.BalanceService.refreshBalance(agentId);
        amount.textContent = App.BalanceService.formatAmount(balance);
        App.Session.updateUser({ balance });
      } else {
        const current = parseFloat(amount.textContent.replace(/,/g, ''));
        const delta = (Math.random() - 0.5) * 200;
        const newVal = Math.max(0, current + delta);
        amount.textContent = newVal.toLocaleString('th-TH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    } finally {
      setTimeout(() => btn.classList.remove('spinning'), 700);
    }
  });
}

/* ── Chart Data ── */
const chartData = {
  prb: {
    labels: ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026'],
    values: [12000, 28000, 18000, 45000, 32000, 55000]
  },
  voluntary: {
    labels: ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026'],
    values: [0, 0, 0, 0, 0, 0]
  }
};

const chartThemes = {
  prb: { main: '#e85d5d', soft: 'rgba(232, 93, 93, 0.2)' },
  voluntary: { main: '#5b9fd4', soft: 'rgba(91, 159, 212, 0.2)' }
};

let revenueChart = null;

function makeChartGradient(ctx, color) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  return gradient;
}

function applyChartTheme(type) {
  if (!revenueChart) return;
  const canvas = document.getElementById('revenueChart');
  const ctx = canvas.getContext('2d');
  const theme = chartThemes[type] || chartThemes.prb;
  const ds = revenueChart.data.datasets[0];

  ds.borderColor = theme.main;
  ds.pointBorderColor = theme.main;
  ds.backgroundColor = makeChartGradient(ctx, theme.soft);
  revenueChart.update('active');
}

function initRevenueChart() {
  const canvas = document.getElementById('revenueChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const theme = chartThemes.prb;

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.prb.labels,
      datasets: [{
        label: 'พ.ร.บ.',
        data: chartData.prb.values,
        borderColor: theme.main,
        backgroundColor: makeChartGradient(ctx, theme.soft),
        borderWidth: 2.5,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: theme.main,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleFont: { family: 'Better Together', size: 13 },
          bodyFont: { family: 'Better Together', size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y.toLocaleString('th-TH')} บาท`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Better Together', size: 12 },
            color: '#9ca3af'
          }
        },
        y: {
          beginAtZero: true,
          max: 65000,
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          },
          ticks: {
            font: { family: 'Better Together', size: 12 },
            color: '#9ca3af',
            callback: (v) => v.toLocaleString('th-TH')
          }
        }
      }
    }
  });
}

function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const type = tab.dataset.chart;
      if (!revenueChart) return;

      const data = chartData[type];
      revenueChart.data.labels = data.labels;
      revenueChart.data.datasets[0].data = data.values;
      revenueChart.data.datasets[0].label = tab.textContent.trim();
      applyChartTheme(type);
    });
  });
}

/* ── Back to Top ── */
function initBackToTop() {
  document.getElementById('backToTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── Date Picker ── */
function initDatePicker() {
  const input = document.getElementById('dataDatePicker');
  if (!input) return;

  const today = new Date();
  input.value = formatDateInput(today);

  input.addEventListener('change', () => {
    document.dispatchEvent(new CustomEvent('dataDateChanged', {
      detail: { date: input.value }
    }));
  });
}

function formatDateInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* ── Agent Dashboard (mock / API) ── */
async function initAgentDashboard() {
  if (!document.querySelector('.summary-cards') || !window.App?.ReportService) return;

  const load = async (date) => {
    const data = await App.ReportService.getAgentDashboard(date);
    const cards = document.querySelectorAll('.stat-card .stat-value');
    if (cards[0]) cards[0].textContent = App.Shell.formatCurrency(data.summary.prb);
    if (cards[1]) cards[1].textContent = App.Shell.formatCurrency(data.summary.voluntary);
    if (cards[2]) cards[2].textContent = App.Shell.formatCurrency(data.summary.total);

    chartData.prb = data.charts.prb;
    chartData.voluntary = data.charts.voluntary;

    if (revenueChart) {
      const type = document.querySelector('.chart-tab.active')?.dataset.chart || 'prb';
      revenueChart.data.labels = chartData[type].labels;
      revenueChart.data.datasets[0].data = chartData[type].values;
      applyChartTheme(type);
    }
  };

  const input = document.getElementById('dataDatePicker');
  await load(input?.value);
  document.addEventListener('dataDateChanged', (e) => load(e.detail.date));
}
