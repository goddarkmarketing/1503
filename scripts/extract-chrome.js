/**
 * Extract footer from index.html into partials/.
 * Header: edit partials/site-header.html then run: node scripts/sync-header-to-index.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function extract(re, src) {
  const m = src.match(re);
  if (!m) throw new Error('not found: ' + re);
  return m[1];
}

let footer = extract(/<footer id="footer">([\s\S]*?)<\/footer>/, index);

const fixes = [
  [/href="\/"/g, 'href="index.html"'],
  [/href="index.html#recruit"/g, 'href="join.html"'],
  [/href="index.html#agent"/g, 'href="login.html"'],
  [/href="#recruit"/g, 'href="join.html"'],
  [/href="#agent"/g, 'href="login.html"'],
  [/href="#products"/g, 'href="index.html#plans"'],
];

for (const [re, rep] of fixes) {
  footer = footer.replace(re, rep);
}

const partialsDir = path.join(root, 'partials');
fs.mkdirSync(partialsDir, { recursive: true });
fs.writeFileSync(path.join(partialsDir, 'site-footer.html'), '<footer id="footer">' + footer + '</footer>');
console.log('site-footer.html written (header: edit partials/site-header.html + sync-header-to-index.js)');