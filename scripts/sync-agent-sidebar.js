/**
 * Inline agent sidebar nav into all portal pages (single source: partials/agent-sidebar-nav.html)
 * Run: node scripts/sync-agent-sidebar.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTIAL = path.join(ROOT, 'partials', 'agent-sidebar-nav.html');

const PAGES = [
  'agent/index.html',
  'agent/inquiry.html',
  'agent/reports.html',
  'agent/policies.html',
  'agent/profile.html',
  'agent/renew.html',
  'agent/team.html',
  'agent/receipt/issue.html',
  'agent/receipt/inquiry.html',
  'agent/receipt/daily-summary.html',
  'agent/receipt/daily-detail.html',
  'agent/reports/daily-policies.html',
  'agent/reports/daily-summary.html',
  'agent/reports/monthly.html',
  'agent/reports/team.html',
  'agent/commission.html',
  'agent/credit.html',
  'compulsory/indara.html'
];

function indentNav(html, spaces) {
  const pad = ' '.repeat(spaces);
  return html
    .trim()
    .split(/\r?\n/)
    .map((line) => pad + line)
    .join('\n');
}

function buildNavBlock(base, indent) {
  const inner = fs.readFileSync(PARTIAL, 'utf8').replace(/\{\{BASE\}\}/g, base);
  return `<nav class="sidebar-nav" data-agent-sidebar>\n${indentNav(inner, indent)}\n${' '.repeat(indent - 2)}</nav>`;
}

function syncFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn('skip (missing):', relPath);
    return;
  }

  const base = (relPath.includes('agent/receipt/') || relPath.includes('agent/reports/')) ? '../../' : '../';
  let html = fs.readFileSync(filePath, 'utf8');

  const navMatch = html.match(/<nav class="sidebar-nav" data-agent-sidebar[\s\S]*?<\/nav>/);
  if (!navMatch) {
    console.warn('skip (no nav):', relPath);
    return;
  }

  const marker = '<!-- AGENT_SIDEBAR_V3 -->';
  const lineStart = html.lastIndexOf('\n', html.indexOf(navMatch[0])) + 1;
  const indent = html.slice(lineStart, html.indexOf('<nav', lineStart)).length;
  const newNav = marker + '\n' + buildNavBlock(base, indent + 2);

  html = html.replace(/<nav class="sidebar-nav" data-agent-sidebar[\s\S]*?<\/nav>/, newNav);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('synced:', relPath);
}

PAGES.forEach(syncFile);
