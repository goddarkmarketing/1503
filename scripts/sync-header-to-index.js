const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let header = fs.readFileSync(path.join(root, 'partials/site-header.html'), 'utf8');

header = header.replace('index.html#plans', '#plans');

const re = /<header id="header"[\s\S]*?<\/header>/;
if (!re.test(index)) {
  console.error('header not found in index.html');
  process.exit(1);
}

index = index.replace(re, header.trim());
fs.writeFileSync(path.join(root, 'index.html'), index);
console.log('index header updated');
