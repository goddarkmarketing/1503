const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'assets', 'พันธมิตร');
const outDir = path.join(root, 'images', 'partners');

const partners = [
  { file: 'AIG.jpg', slug: 'aig', name: 'AIG' },
  { file: 'CHUBB.jpg', slug: 'chubb', name: 'CHUBB' },
  { file: 'ERGO.jpg', slug: 'ergo', name: 'ERGO' },
  { file: 'KPI.jpg', slug: 'kpi', name: 'KPI' },
  { file: 'MSIG.jpg', slug: 'msig', name: 'MSIG' },
  { file: 'TSI.jpg', slug: 'tsi', name: 'TSI' },
  { file: 'กรุงเทพประกันภัย.jpg', slug: 'bangkok-insurance', name: 'กรุงเทพประกันภัย' },
  { file: 'แอกซ่า.jpg', slug: 'axa', name: 'แอกซ่า' },
  { file: 'เทเวศ.jpg', slug: 'deves', name: 'เทเวศประกันภัย' },
  { file: 'ไทยวิวัฒน์.jpg', slug: 'thaivivat', name: 'ไทยวิวัฒน์ประกันภัย' },
  { file: 'ธนชาต.jpg', slug: 'thanachart', name: 'ธนชาตประกันภัย' },
  { file: 'อินทร.jpg', slug: 'indara', name: 'อินทรประกันภัย' },
  { file: 'นวกิจ.jpg', slug: 'navakij', name: 'นวกิจประกันภัย' },
  { file: 'บางกอกสห.jpg', slug: 'bangkok-union', name: 'บางกอกสหประกันภัย' },
  { file: 'ไอโออิ.jpg', slug: 'aioi', name: 'ไอโออิกรุงเทพประกันภัย' },
  { file: 'ทิพยะ.jpg', slug: 'dhipaya', name: 'ทิพยประกันภัย' },
  { file: 'โตเกียวมารีน.jpg', slug: 'tokyo-marine', name: 'โตเกียวมารีนประกันภัย' },
  { file: 'วิริยะ.jpg', slug: 'viriyah', name: 'วิริยะประกันภัย' },
  { file: 'อลิอันซ์.jpg', slug: 'allianz', name: 'อลิอันซ์ อยุธยา' },
  { file: 'เมืองไทย.jpg', slug: 'muang-thai', name: 'เมืองไทยประกันภัย' },
];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const slides = [];
for (const p of partners) {
  const src = path.join(srcDir, p.file);
  if (!fs.existsSync(src)) {
    console.warn('skip missing:', p.file);
    continue;
  }
  const ext = path.extname(p.file).toLowerCase();
  const destName = p.slug + ext;
  fs.copyFileSync(src, path.join(outDir, destName));
  slides.push({ ...p, src: 'images/partners/' + destName });
}

const slideHtml = slides
  .concat(slides)
  .map(
    (p) =>
      `\t\t\t\t\t<li class="swiper-slide"><div class="partnerSlide__item"><img loading="lazy" src="${p.src}" alt="${p.name}"></div></li>`
  )
  .join('\n');

const block = `\t\t<div class="mCon3 mCon3--partners">
\t\t\t<div class="swiper-container mSlide2 mSlide2--partners">
\t\t\t\t<ul class="swiper-wrapper">
${slideHtml}
\t\t\t\t</ul>
\t\t\t</div>
\t\t</div>`;

let index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const re = /\t\t<div class="mCon3[\s\S]*?\t\t<\/div>\n\t\t<div class="mConW2">/;
if (!re.test(index)) {
  console.error('mCon3 block not found in index.html');
  process.exit(1);
}
index = index.replace(re, block + '\n\t\t<div class="mConW2">');
fs.writeFileSync(path.join(root, 'index.html'), index);
console.log('Copied', slides.length, 'partner logos and updated index.html');
