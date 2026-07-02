/**
 * Inline admin sidebar into all admin pages
 * Run: node scripts/sync-admin-sidebar.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTIAL = path.join(ROOT, 'partials', 'admin-sidebar-nav.html');

const PAGES = [
  'admin/index.html',
  'admin/agents.html',
  'admin/team.html',
  'admin/users.html',
  'admin/policies.html',
  'admin/pending.html',
  'admin/renew.html',
  'admin/credit-requests.html',
  'admin/credit-ledger.html',
  'admin/commission.html',
  'admin/reports/daily-policies.html',
  'admin/reports/daily-summary.html',
  'admin/reports/monthly.html',
  'admin/reports/team.html',
  'admin/receipt/inquiry.html',
  'admin/receipt/daily-summary.html',
  'admin/receipt/daily-detail.html',
  'admin/insurers.html',
  'admin/products.html',
  'admin/audit-log.html',
  'admin/reports.html'
];

function indentNav(html, spaces) {
  return html.trim().split(/\r?\n/).map((line) => ' '.repeat(spaces) + line).join('\n');
}

function buildNavBlock(base, indent) {
  const inner = fs.readFileSync(PARTIAL, 'utf8').replace(/\{\{BASE\}\}/g, base);
  return `<!-- ADMIN_SIDEBAR_V1 -->\n<nav class="sidebar-nav" data-admin-sidebar>\n${indentNav(inner, indent)}\n${' '.repeat(indent - 2)}</nav>`;
}

function buildSidebarHeaderBlock(base, indent) {
  const inner = sidebarHeaderHtml(base).trim().split(/\r?\n/).map((line) => ' '.repeat(indent) + line).join('\n');
  return inner;
}

function sidebarHeaderHtml(base) {
  return `<div class="sidebar-header">
        <a href="${base}admin/index.html" class="sidebar-brand" aria-label="กล้าดีโบรคเกอร์">
          <img src="${base}images/logo-kladee.png" alt="กล้าดีโบรคเกอร์" class="sidebar-brand__img" width="140" height="40">
        </a>
        <button class="sidebar-toggle" id="sidebarToggle" aria-label="สลับเมนู"><i data-lucide="menu"></i></button>
      </div>`;
}

function syncFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn('skip (missing):', relPath);
    return;
  }

  const depth = relPath.split('/').length - 1;
  const base = depth > 1 ? '../../' : '../';
  let html = fs.readFileSync(filePath, 'utf8');

  const asideMatch = html.match(/<aside class="sidebar" id="sidebar">/);
  const navIdx = html.indexOf('<nav class="sidebar-nav"');
  if (asideMatch && navIdx > -1) {
    const asideEnd = asideMatch.index + asideMatch[0].length;
    const headerBlock = buildSidebarHeaderBlock(base, 6);
    html = html.slice(0, asideEnd) + '\n' + headerBlock + '\n      ' + html.slice(navIdx);
  }

  const navMatch = html.match(/<nav class="sidebar-nav"[\s\S]*?<\/nav>/);
  if (!navMatch) {
    console.warn('skip (no nav):', relPath);
    return;
  }

  const lineStart = html.lastIndexOf('\n', html.indexOf(navMatch[0])) + 1;
  const indent = html.slice(lineStart, html.indexOf('<nav', lineStart)).length;
  const newNav = buildNavBlock(base, indent + 2);

  html = html.replace(/<nav class="sidebar-nav"[\s\S]*?<\/nav>/, newNav);

  const templateScript = `<script src="${base}js/admin-sidebar-nav-template.js?v=20260702a"></script>`;
  if (!html.includes('admin-sidebar-nav-template.js')) {
    html = html.replace(
      /(<script src="[^"]*load-admin\.js"><\/script>)/,
      `${templateScript}\n  $1`
    );
  }

  if (!html.includes('aria-label="การแจ้งเตือน"')) {
    const bell = '<button class="header-icon-btn" aria-label="การแจ้งเตือน"><i data-lucide="bell"></i><span class="notif-badge">0</span></button>';
    html = html.replace(/(<div class="user-profile")/, `${bell}\n        $1`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('synced:', relPath);
}

PAGES.forEach(syncFile);
