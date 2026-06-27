const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function extract(re, src) {
  const m = src.match(re);
  if (!m) throw new Error('not found: ' + re);
  return m[1];
}

let header = extract(/<header id="header">([\s\S]*?)<\/header>/, index);
let footer = extract(/<footer id="footer">([\s\S]*?)<\/footer>/, index);

const fixes = [
  [/href="\/"/g, 'href="index.html"'],
  [/href="#recruit"/g, 'href="index.html#recruit"'],
  [/href="#agent"/g, 'href="index.html#agent"'],
  [/href="#products"/g, 'href="index.html#plans"'],
  [
    /<li class="on"><a href="#" title="เลือกอยู่">หน้าแรก<\/a><\/li>/,
    '<li><a href="index.html" title="หน้าแรก">หน้าแรก</a></li>',
  ],
];

for (const [re, rep] of fixes) {
  header = header.replace(re, rep);
  footer = footer.replace(re, rep);
}

const partialsDir = path.join(root, 'partials');
fs.mkdirSync(partialsDir, { recursive: true });
fs.writeFileSync(path.join(partialsDir, 'site-header.html'), '<header id="header">' + header + '</header>');
fs.writeFileSync(path.join(partialsDir, 'site-footer.html'), '<footer id="footer">' + footer + '</footer>');
console.log('partials written');
