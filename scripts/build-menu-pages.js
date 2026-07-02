/**
 * Generate plan sub-pages and utility pages for header menu links.
 * Run: node scripts/build-menu-pages.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const CACHE = '20260702n';

const planHead = (title, desc) => `<!DOCTYPE html>
<html lang="th">
<head>
<title>${title} | แผนประกันแนะนำ | กล้าดีโบรคเกอร์</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="../css/6723.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/6720.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/3802.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/3803.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/6714.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/header-kladee.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/6918.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/icons-lucide.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/plans.css?v=${CACHE}">
</head>
<body class="chrome-pending subpage subpage--plan" data-page="plan" data-base="../">
<ul id="skip_navi">
<li><a href="#content">ข้ามไปยังเนื้อหาหลัก</a></li>
<li><a href="#gnb">ข้ามไปยังเมนูหลัก</a></li>
</ul>
<div id="wrapper">
<div id="site-header-slot"></div>
<div id="container">
<div id="content">
`;

const planFoot = `<img src="#" style="width:0px;height:0px;display:none;" alt="สถิติผู้เข้าชม">
</div>
<script type="text/javascript" src="../js/3804.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/3805.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/6717.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/6719.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/site-chrome.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/float-mascot.js?v=${CACHE}"></script>
</body>
</html>
`;

function renderPlanPage(cfg) {
  const crumbs = cfg.crumbs.map((c, i) => {
    if (i === cfg.crumbs.length - 1) return `<span>${c.label}</span>`;
    return `<a href="${c.href}">${c.label}</a><span>/</span>`;
  }).join('');

  const sections = cfg.sections.map((s) => {
    if (s.type === 'list') {
      return `<section class="planSection">
\t\t<div class="planSection__head"><h2>${s.title}</h2>${s.sub ? `<p>${s.sub}</p>` : ''}</div>
\t\t<ul class="planAudience">${s.items.map((li) => `<li>${li}</li>`).join('\n\t\t\t')}</ul>
\t</section>`;
    }
    if (s.type === 'conds') {
      return `<section class="planSection">
\t\t<div class="planSection__head"><h2>${s.title}</h2></div>
\t\t<div class="planConds">${s.items.map((c) => `<div class="planCond"><strong>${c.t}</strong><p>${c.p}</p></div>`).join('\n\t\t\t')}</div>
\t</section>`;
    }
    if (s.type === 'faq') {
      return `<section class="planSection">
\t\t<div class="planSection__head"><h2>${s.title}</h2></div>
\t\t<div class="planFaq">${s.items.map((f) => `<details class="planFaq__item"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n\t\t\t')}</div>
\t</section>`;
    }
    return '';
  }).join('\n\n\t');

  const related = (cfg.related || []).map((r) =>
    `<a href="${r.href}" class="${r.active ? 'is-active' : ''}">${r.label}</a>`
  ).join('\n\t\t\t');

  return `${planHead(cfg.metaTitle, cfg.metaDesc)}
<main class="planPage">
\t<nav class="planCrumb" aria-label="breadcrumb">
\t\t<a href="../index.html">หน้าแรก</a><span>/</span>
\t\t${crumbs}
\t</nav>

\t<section class="planHero">
\t\t<span class="planHero__badge">${cfg.badge}</span>
\t\t<h1 class="planHero__title">${cfg.h1}</h1>
\t\t<p class="planHero__desc">${cfg.desc}</p>
\t</section>

\t${sections}

\t<section class="planSection planCta">
\t\t<div class="planCta__text">
\t\t\t<h2>${cfg.ctaTitle || 'สอบถามเบี้ยและความคุ้มครอง'}</h2>
\t\t\t<p>ปรึกษาฟรี ไม่มีค่าใช้จ่าย ทีมงานช่วยเปรียบเทียบแผนและนัดทำรายการกับเจ้าหน้าที่โดยตรง</p>
\t\t</div>
\t\t<div class="planCta__actions">
\t\t\t<a class="planCta__btn planCta__btn--primary" href="tel:0826164555">โทร 082-616-4555</a>
\t\t\t<a class="planCta__btn planCta__btn--ghost" href="../contact.html">ติดต่อเรา</a>
\t\t</div>
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head"><h2>หน้าที่เกี่ยวข้อง</h2></div>
\t\t<div class="planCats">${related}</div>
\t</section>
</main>

</div>
</div>
<div id="site-footer-slot"></div>
${planFoot}`;
}

const carRelated = [
  { href: 'car.html', label: 'ภาพรวมประกันรถ' },
  { href: 'car-compare.html', label: 'เปรียบเทียบเบี้ย' },
  { href: 'car-class1.html', label: 'ชั้น 1' },
  { href: 'car-class2plus.html', label: 'ชั้น 2+ / 3+' },
  { href: 'car-class23.html', label: 'ชั้น 2 / 3' },
  { href: 'compulsory.html', label: 'พ.ร.บ.' },
];

const healthRelated = [
  { href: 'health.html', label: 'ภาพรวมสุขภาพ' },
  { href: 'health-ipd.html', label: 'ผู้ป่วยใน (IPD)' },
  { href: 'health-opd.html', label: 'ผู้ป่วยนอก (OPD)' },
];

const lifeRelated = [
  { href: 'life.html', label: 'ภาพรวมชีวิต' },
  { href: 'life-whole.html', label: 'แบบตลอดชีพ' },
  { href: 'life-savings.html', label: 'แบบสะสมทรัพย์' },
  { href: 'life-term.html', label: 'แบบชั่วระยะเวลา' },
  { href: 'pension.html', label: 'แบบบำนาญ' },
];

const planPages = [
  {
    file: 'car-compare.html',
    metaTitle: 'เปรียบเทียบเบี้ยประกันรถ',
    metaDesc: 'เปรียบเทียบเบี้ยประกันรถยนต์ชั้น 1 / 2+ / 3+ จากหลายบริษัท กล้าดีโบรคเกอร์ช่วยคัดแผนที่เหมาะกับงบและการใช้งาน',
    crumbs: [{ href: 'car.html', label: 'ประกันรถยนต์' }, { label: 'เปรียบเทียบเบี้ย' }],
    badge: 'เปรียบเทียบ',
    h1: 'เปรียบเทียบเบี้ยประกันรถ',
    desc: 'ดูเบี้ยและความคุ้มครองจากหลายบริษัทในที่เดียว ช่วยเลือกชั้นประกันและทุนที่เหมาะกับรถและงบประมาณของคุณ',
    sections: [
      { type: 'list', title: 'ทำไมควรเปรียบเทียบก่อนตัดสินใจ', items: [
        'เบี้ยและเงื่อนไขต่างกันตามบริษัท แม้ชั้นประกันเดียวกัน',
        'เลือกความคุ้มครองที่ใช้จริง ไม่จ่ายเกินความจำเป็น',
        'จับคู่ พ.ร.บ. กับภาคสมัครใจได้ในครั้งเดียว',
      ]},
      { type: 'conds', title: 'ข้อมูลที่ใช้ประเมินเบี้ย', items: [
        { t: 'ยี่ห้อ / รุ่น / ปีรถ', p: 'อายุรถและมูลค่าส่งผลต่อเบี้ย' },
        { t: 'การใช้งาน', p: 'ส่วนตัว หรือใช้ในการค้า/ส่งของ' },
        { t: 'ประวัติเคลม', p: 'อาจมีผลต่อส่วนลดหรือเงื่อนไขรับประกัน' },
        { t: 'ชั้นประกัน', p: 'ชั้น 1, 2+, 3+, 2, 3 หรือ พ.ร.บ. อย่างเดียว' },
      ]},
      { type: 'faq', title: 'คำถามที่พบบ่อย', items: [
        { q: 'ใช้เวลานานแค่ไหนในการเปรียบเทียบ?', a: 'โดยทั่วไปได้ใบเสนอราคาเบื้องต้นภายใน 1 วันทำการ หลังได้รับข้อมูลรถครบ' },
        { q: 'เปรียบเทียบฟรีไหม?', a: 'ปรึกษาและเปรียบเทียบผ่านกล้าดีโบรคเกอร์ไม่มีค่าใช้จ่าย' },
      ]},
    ],
    related: carRelated.map((r) => ({ ...r, active: r.href === 'car-compare.html' })),
  },
  {
    file: 'car-class1.html',
    metaTitle: 'ประกันรถยนต์ชั้น 1',
    metaDesc: 'ประกันรถยนต์ชั้น 1 คุ้มครองรอบคัน ชน หาย ไฟไหม้ น้ำท่วม ซ่อมห้าง — เปรียบเทียบเบี้ยกับกล้าดีโบรคเกอร์',
    crumbs: [{ href: 'car.html', label: 'ประกันรถยนต์' }, { label: 'ชั้น 1' }],
    badge: 'ชั้น 1',
    h1: 'ประกันรถยนต์ชั้น 1',
    desc: 'คุ้มครองรอบคัน ครอบคลุมรถคุณ ไฟไหม้ น้ำท่วม ลูกเห็บ รถสูญหาย และคู่กรณี — เหมาะกับรถใหม่และผู้ต้องการความอุ่นใจสูงสุด',
    sections: [
      { type: 'list', title: 'ความคุ้มครองหลัก', items: [
        'รถเสียหายจากอุบัติเหตุ ไฟไหม้ น้ำท่วม ลูกเห็บ',
        'รถสูญหาย / ถูกขโมย',
        'คู่กรณี (บุคคลที่สาม) ทั้งชีวิตและทรัพย์สิน',
        'ซ่อมศูนย์หรืออู่ตามเงื่อนไขกรมธรรม์',
      ]},
      { type: 'conds', title: 'เหมาะกับใคร', items: [
        { t: 'รถใหม่ / รถผ่อน', p: 'ต้องการคุ้มครองเต็มที่ตามมูลค่ารถ' },
        { t: 'ใช้รถทุกวัน', p: 'ลดความเสี่ยงค่าใช้จ่ายซ่อมก้อนใหญ่' },
        { t: 'ต้องการซ่อมห้าง', p: 'หลายแผนรองรับการซ่อมศูนย์อนุญาต' },
      ]},
    ],
    related: carRelated.map((r) => ({ ...r, active: r.href === 'car-class1.html' })),
  },
  {
    file: 'car-class2plus.html',
    metaTitle: 'ประกันรถยนต์ชั้น 2+ / 3+',
    metaDesc: 'ประกันรถยนต์ชั้น 2+ และ 3+ เบี้ยประหยัด คุ้มครองคู่กรณี — เปรียบเทียบแผนจากหลายบริษัท',
    crumbs: [{ href: 'car.html', label: 'ประกันรถยนต์' }, { label: 'ชั้น 2+ / 3+' }],
    badge: 'ชั้น 2+ / 3+',
    h1: 'ประกันรถยนต์ชั้น 2+ / 3+',
    desc: 'เบี้ยเบากว่าชั้น 1 แต่ยังคุ้มครองคู่กรณีครบ นิยมสำหรับรถใช้งานประจำที่ต้องการสมดุลระหว่างเบี้ยและความคุ้มครอง',
    sections: [
      { type: 'list', title: 'จุดเด่น', items: [
        'เบี้ยต่ำกว่าชั้น 1 โดยยังคุ้มครองคู่กรณี',
        'ชั้น 2+ คุ้มครองรถตนเองจากการชนบางกรณี',
        'ชั้น 3+ เน้นคู่กรณีเป็นหลัก เหมาะงบจำกัด',
      ]},
      { type: 'faq', title: 'คำถามที่พบบ่อย', items: [
        { q: '2+ กับ 3+ ต่างกันอย่างไร?', a: 'ชั้น 2+ มักคุ้มครองรถตนเองเมื่อชนคู่กรณีและมีคู่กรณี ชั้น 3+ เน้นคู่กรณีเป็นหลัก' },
      ]},
    ],
    related: carRelated.map((r) => ({ ...r, active: r.href === 'car-class2plus.html' })),
  },
  {
    file: 'car-class23.html',
    metaTitle: 'ประกันรถยนต์ชั้น 2 / 3',
    metaDesc: 'ประกันรถยนต์ชั้น 2 และชั้น 3 เบี้ยประหยัด คุ้มครองตามเงื่อนไขกรมธรรม์ — สอบถามเบี้ยกับกล้าดีโบรคเกอร์',
    crumbs: [{ href: 'car.html', label: 'ประกันรถยนต์' }, { label: 'ชั้น 2 / 3' }],
    badge: 'ชั้น 2 / 3',
    h1: 'ประกันรถยนต์ชั้น 2 / 3',
    desc: 'แผนเบี้ยประหยัดสำหรับรถเก่าหรือผู้ที่ต้องการความคุ้มครองพื้นฐานตามกฎหมายและคู่กรณีในระดับที่กำหนด',
    sections: [
      { type: 'list', title: 'ลักษณะความคุ้มครอง', items: [
        'ชั้น 3 คุ้มครองคู่กรณีเป็นหลัก',
        'ชั้น 2 มีความคุ้มครองรถตนเองบางส่วนตามแผน',
        'เหมาะกับรถอายุมากหรือใช้งานในพื้นที่เสี่ยงต่ำ',
      ]},
    ],
    related: carRelated.map((r) => ({ ...r, active: r.href === 'car-class23.html' })),
  },
  {
    file: 'health-ipd.html',
    metaTitle: 'ประกันสุขภาพผู้ป่วยใน (IPD)',
    metaDesc: 'ประกันสุขภาพผู้ป่วยใน IPD คุ้มครองค่ารักษาพยาบาลในโรงพยาบาล — เปรียบเทียบแผนเหมาจ่ายและแผนเบิกจ่าย',
    crumbs: [{ href: 'health.html', label: 'ประกันสุขภาพ' }, { label: 'ผู้ป่วยใน (IPD)' }],
    badge: 'IPD',
    h1: 'ประกันสุขภาพผู้ป่วยใน (IPD)',
    desc: 'คุ้มครองค่ารักษาพยาบาลเมื่อนอนโรงพยาบาล ทั้งค่าห้อง ค่าผ่าตัด ยา และหัตถการตามวงเงินกรมธรรม์',
    sections: [
      { type: 'list', title: 'ความคุ้มครองทั่วไป', items: [
        'ค่าห้องและค่าอาหารผู้ป่วยใน',
        'ค่าผ่าตัดและหัตถการ',
        'ค่ายาและเวชภัณฑ์ระหว่างนอน',
        'ค่าตรวจวินิจฉัยก่อน/หลังการรักษา (ตามแผน)',
      ]},
    ],
    related: healthRelated.map((r) => ({ ...r, active: r.href === 'health-ipd.html' })),
  },
  {
    file: 'health-opd.html',
    metaTitle: 'ประกันสุขภาพผู้ป่วยนอก (OPD)',
    metaDesc: 'ประกันสุขภาพผู้ป่วยนอก OPD คุ้มครองค่าตรวจและรักษาโดยไม่ต้องนอนโรงพยาบาล',
    crumbs: [{ href: 'health.html', label: 'ประกันสุขภาพ' }, { label: 'ผู้ป่วยนอก (OPD)' }],
    badge: 'OPD',
    h1: 'ประกันสุขภาพผู้ป่วยนอก (OPD)',
    desc: 'คุ้มครองค่าตรวจรักษา ยา และหัตถการเล็กน้อยเมื่อไปพบแพทย์โดยไม่นอนโรงพยาบาล เหมาะกับผู้ที่ต้องการดูแลสุขภาพเชิงป้องกัน',
    sections: [
      { type: 'list', title: 'ความคุ้มครองทั่วไป', items: [
        'ค่าตรวจแพทย์และค่ายา',
        'ค่าตรวจแล็บและ X-ray บางรายการ',
        'จำกัดจำนวนครั้งหรือวงเงินต่อปีตามแผน',
      ]},
    ],
    related: healthRelated.map((r) => ({ ...r, active: r.href === 'health-opd.html' })),
  },
  {
    file: 'life-whole.html',
    metaTitle: 'ประกันชีวิตแบบตลอดชีพ',
    metaDesc: 'ประกันชีวิตแบบตลอดชีพ คุ้มครองตลอดชีพ มีมูลค่าเงินสด วางแผนมรดกและความมั่นคงระยะยาว',
    crumbs: [{ href: 'life.html', label: 'ประกันชีวิต' }, { label: 'แบบตลอดชีพ' }],
    badge: 'ตลอดชีพ',
    h1: 'ประกันชีวิตแบบตลอดชีพ',
    desc: 'คุ้มครองชีวิตตลอดไป มีมูลค่าเงินสดสะสม เหมาะสำหรับวางแผนมรดกและความมั่นคงทางการเงินระยะยาวของครอบครัว',
    sections: [
      { type: 'list', title: 'จุดเด่น', items: [
        'คุ้มครองชีวิตตลอดอายุกรมธรรม์',
        'สะสมมูลค่าเงินสดตามเงื่อนไขบริษัท',
        'ใช้เป็นส่วนหนึ่งของการวางแผนมรดก',
      ]},
    ],
    related: lifeRelated.map((r) => ({ ...r, active: r.href === 'life-whole.html' })),
  },
  {
    file: 'life-savings.html',
    metaTitle: 'ประกันชีวิตแบบสะสมทรัพย์',
    metaDesc: 'ประกันชีวิตแบบสะสมทรัพย์ ผสมความคุ้มครองและการออม รับเงินครบสัญญา',
    crumbs: [{ href: 'life.html', label: 'ประกันชีวิต' }, { label: 'แบบสะสมทรัพย์' }],
    badge: 'สะสมทรัพย์',
    h1: 'ประกันชีวิตแบบสะสมทรัพย์',
    desc: 'ผสมความคุ้มครองชีวิตกับการออมระยะยาว รับเงินครบกำหนดสัญญา เหมาะกับผู้ที่ต้องการวางแผนการเงินไปพร้อมความคุ้มครอง',
    sections: [
      { type: 'list', title: 'จุดเด่น', items: [
        'มีระยะเวลาสัญญาที่ชัดเจน',
        'รับเงินครบกำหนดเมื่อสัญญาครบ',
        'มีความคุ้มครองชีวิตระหว่างสัญญา',
      ]},
    ],
    related: lifeRelated.map((r) => ({ ...r, active: r.href === 'life-savings.html' })),
  },
  {
    file: 'life-term.html',
    metaTitle: 'ประกันชีวิตแบบชั่วระยะเวลา',
    metaDesc: 'ประกันชีวิตแบบชั่วระยะเวลา เบี้ยต่ำ ความคุ้มครองสูง ระยะเวลาที่กำหนด',
    crumbs: [{ href: 'life.html', label: 'ประกันชีวิต' }, { label: 'แบบชั่วระยะเวลา' }],
    badge: 'ชั่วระยะเวลา',
    h1: 'ประกันชีวิตแบบชั่วระยะเวลา',
    desc: 'คุ้มครองชีวิตในช่วงเวลาที่กำหนด เบี้ยประกันต่ำเมื่อเทียบทุนประกัน เหมาะกับวัยทำงานที่มีภาระครอบครัว',
    sections: [
      { type: 'list', title: 'จุดเด่น', items: [
        'เบี้ยต่ำ ทุนประกันสูงในช่วงที่ต้องการ',
        'เลือกระยะเวลาคุ้มครองได้ เช่น 10 / 20 ปี',
        'เหมาะกับผู้มีภาระหนี้หรือบุตรที่ยังเล็ก',
      ]},
    ],
    related: lifeRelated.map((r) => ({ ...r, active: r.href === 'life-term.html' })),
  },
];

const plansDir = path.join(root, 'plans');
planPages.forEach((cfg) => {
  const out = path.join(plansDir, cfg.file);
  fs.writeFileSync(out, renderPlanPage(cfg), 'utf8');
  console.log('built', cfg.file);
});

console.log('Done:', planPages.length, 'plan sub-pages');
