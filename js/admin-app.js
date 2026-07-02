/**
 * Admin portal shared init — sidebar, charts, shell.
 */
document.addEventListener('DOMContentLoaded', () => {
  const basePath = document.body.dataset.basePath || '../';

  if (window.App) {
    App.RoleGuard.enforce('admin', { basePath });
    App.Shell.init({ basePath, hideBalance: true });
  }

  if (typeof window.renderAdminSidebarNav === 'function') {
    window.renderAdminSidebarNav();
  }

  const adminNav = document.querySelector('.sidebar-nav[data-admin-sidebar]');
  if (adminNav) markAdminNavActive(adminNav);

  initLucideIcons();
  initSidebar();
  initNavDropdowns();
  initAdminDashboard();
  initBackToTop();
  initDatePicker();
});

function initLucideIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+$/, '') || '/';
}

function markAdminNavActive(navRoot) {
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
  if (parentSubmenu) parentSubmenu.classList.add('submenu-open');
}

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
}

function initNavDropdowns() {
  document.querySelectorAll('.nav-item.has-submenu').forEach((item) => {
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
}

const chartData = { prb: { labels: [], values: [] }, voluntary: { labels: [], values: [] } };
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
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleFont: { family: 'Better Together', size: 13 },
          bodyFont: { family: 'Better Together', size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y.toLocaleString('th-TH')} บาท` }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Better Together', size: 12 }, color: '#9ca3af' }
        },
        y: {
          beginAtZero: true,
          max: 70000,
          grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
          ticks: {
            font: { family: 'Better Together', size: 12 },
            color: '#9ca3af',
            callback: (v) => v.toLocaleString('th-TH')
          }
        }
      }
    }
  });

  document.querySelectorAll('.chart-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.dataset.chart;
      const data = chartData[type];
      revenueChart.data.labels = data.labels;
      revenueChart.data.datasets[0].data = data.values;
      revenueChart.data.datasets[0].label = tab.textContent.trim();
      applyChartTheme(type);
    });
  });
}

async function initAdminDashboard() {
  if (!document.querySelector('.summary-cards')) return;

  const load = async (date) => {
    const data = await App.ReportService.getAdminDashboard(date);
    const cards = document.querySelectorAll('.stat-card .stat-value');
    if (cards[0]) cards[0].textContent = App.Shell.formatCurrency(data.summary.prb);
    if (cards[1]) cards[1].textContent = App.Shell.formatCurrency(data.summary.voluntary);
    if (cards[2]) cards[2].textContent = App.Shell.formatCurrency(data.summary.total);

    chartData.prb = data.charts.prb;
    chartData.voluntary = data.charts.voluntary;

    if (!revenueChart) initRevenueChart();
    else {
      const type = document.querySelector('.chart-tab.active')?.dataset.chart || 'prb';
      revenueChart.data.labels = chartData[type].labels;
      revenueChart.data.datasets[0].data = chartData[type].values;
      applyChartTheme(type);
    }
  };

  const input = document.getElementById('dataDatePicker');
  if (input) {
    const today = new Date();
    input.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    input.addEventListener('change', () => load(input.value));
  }

  await load(input?.value);

  if (App.AuditService && document.getElementById('statActiveAgents')) {
    const stats = await App.AuditService.getAdminStats();
    document.getElementById('statActiveAgents').textContent = stats.activeAgents;
    document.getElementById('statTotalBalance').textContent = App.Shell.formatCurrency(stats.totalBalance);
    document.getElementById('statPoliciesToday').textContent = stats.policiesToday;
    document.getElementById('statPendingPolicies').textContent = stats.pendingPolicies;
    const pendingCredit = document.getElementById('statPendingCredit');
    const expiring = document.getElementById('statExpiring');
    if (pendingCredit) pendingCredit.textContent = stats.pendingCreditRequests ?? 0;
    if (expiring) expiring.textContent = stats.expiringPolicies ?? 0;
  }
}

function initBackToTop() {
  document.getElementById('backToTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initDatePicker() {
  /* handled in initAdminDashboard */
}

(function () {
  const btn = document.getElementById('mobileMenuBtn');
  if (!btn) return;
  function check() { btn.style.display = window.innerWidth <= 768 ? 'flex' : 'none'; }
  check();
  window.addEventListener('resize', check);
})();
