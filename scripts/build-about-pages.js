/**
 * Generate separate About Us sub-pages.
 * Run: node scripts/build-about-pages.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const CACHE = '20260702o';

const NAV = [
  { href: 'about.html', label: 'ภาพรวมเกี่ยวกับเรา', slug: 'about' },
  { href: 'about-intro.html', label: 'แนะนำบริษัท', slug: 'about-intro' },
  { href: 'about-history.html', label: 'ประวัติความเป็นมา', slug: 'about-history' },
  { href: 'about-vision.html', label: 'วิสัยทัศน์และพันธกิจ', slug: 'about-vision' },
  { href: 'about-team.html', label: 'ทีมงานของเรา', slug: 'about-team' },
  { href: 'about-message.html', label: 'สาส์นจากผู้บริหาร', slug: 'about-message' },
  { href: 'experts.html', label: 'ผู้เชี่ยวชาญของเรา', slug: 'experts' },
];

function sideNav(activeSlug) {
  const items = NAV.map((n) => {
    const cls = n.slug === activeSlug ? ' class="is-active"' : '';
    return `\t\t\t\t\t<li><a href="${n.href}"${cls}>${n.label}</a></li>`;
  }).join('\n');
  return `<nav class="aboutSide" aria-label="เมนูเกี่ยวกับเรา">
\t\t\t<div class="sideBox">
\t\t\t\t<h3>เกี่ยวกับเรา</h3>
\t\t\t\t<ul class="aboutNav">
${items}
\t\t\t\t</ul>
\t\t\t</div>
\t\t\t<div class="sideBox sideBox--accent">
\t\t\t\t<h3>ปรึกษาเรา</h3>
\t\t\t\t<p>สนใจประกันภัยหรือสมัครเป็นนายหน้า ทีมงานพร้อมให้คำแนะนำฟรี</p>
\t\t\t\t<p><a href="tel:0826164555" style="color:#fff;font-weight:700;font-size:18px;">082-616-4555</a></p>
\t\t\t\t<a href="contact.html" style="display:inline-block;margin-top:8px;padding:10px 18px;font-size:14px;font-weight:600;color:#046550;background:#fff;border-radius:50px;">ติดต่อเจ้าหน้าที่</a>
\t\t\t</div>
\t\t</nav>`;
}

function pageShell(cfg) {
  const crumbTail = cfg.crumbLabel || cfg.heroTitle;
  return `<!DOCTYPE html>
<html lang="th">
<head>
<title>${cfg.title} | กล้าดีโบรคเกอร์</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${cfg.description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="css/6723.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="css/6720.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="css/3802.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="css/3803.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="css/6714.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="css/header-kladee.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="css/6918.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="css/icons-lucide.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="css/pages.css?v=${CACHE}">
</head>
<body class="chrome-pending subpage" data-page="${cfg.dataPage}">
<ul id="skip_navi">
<li><a href="#content">ข้ามไปยังเนื้อหาหลัก</a></li>
<li><a href="#gnb">ข้ามไปยังเมนูหลัก</a></li>
</ul>
<div id="wrapper">
<div id="site-header-slot"></div>
<div id="container">
<div id="content">
<main class="pageMain">
\t<nav class="pageCrumb" aria-label="breadcrumb">
\t\t<a href="index.html">หน้าแรก</a><span>/</span><a href="about.html">เกี่ยวกับเรา</a><span>/</span><span>${crumbTail}</span>
\t</nav>
\t<section class="pageHero">
\t\t<span class="pageHero__badge">${cfg.badge}</span>
\t\t<h1 class="pageHero__title">${cfg.heroTitle}</h1>
\t\t<p class="pageHero__desc">${cfg.heroDesc}</p>
\t</section>
${cfg.note ? `\t<p class="pageNote">${cfg.note}</p>\n` : ''}
\t<div class="aboutLayout">
${sideNav(cfg.slug)}
\t\t<div class="aboutMain">
${cfg.body}
\t\t</div>
\t</div>
</main>
</div>
</div>
<div id="site-footer-slot"></div>
<img src="#" style="width:0;height:0;display:none;" alt="">
</div>
<script src="js/3804.js?v=${CACHE}"></script>
<script src="js/3805.js?v=${CACHE}"></script>
<script src="js/6717.js?v=${CACHE}"></script>
<script src="js/6719.js?v=${CACHE}"></script>
<script src="js/site-chrome.js?v=${CACHE}"></script>
<script src="js/float-mascot.js?v=${CACHE}"></script>
<script src="js/pages.js?v=${CACHE}"></script>
</body>
</html>
`;
}

const pages = [
  {
    file: 'about-intro.html',
    slug: 'about-intro',
    dataPage: 'about-intro',
    title: 'แนะนำบริษัท',
    description: 'แนะนำกล้าดีโบรคเกอร์ นายหน้าประกันภัยครบวงจร เปรียบเทียบแผนจากบริษัทชั้นนำ ดูแลตลอดอายุกรมธรรม์',
    badge: 'Company',
    heroTitle: 'แนะนำบริษัท',
    heroDesc: 'กล้าดีโบรคเกอร์ (Kladee Broker) คือนายหน้าประกันภัยที่รวบรวมผลิตภัณฑ์จากบริษัทประกันชั้นนำหลายแห่ง ช่วยลูกค้าเปรียบเทียบเบี้ยและความคุ้มครองอย่างเป็นกลาง',
    note: 'เว็บไซต์นี้จัดทำเพื่อประชาสัมพันธ์และรับสมัครนายหน้า ไม่มีการขายกรมธรรม์จบบนระบบออนไลน์',
    body: `\t\t\t<div class="aboutStats aboutStats--inline">
\t\t\t\t<div class="aboutStat"><strong>10+</strong><span>บริษัทประกันพันธมิตร</span></div>
\t\t\t\t<div class="aboutStat"><strong>13</strong><span>หมวดประกันครบวงจร</span></div>
\t\t\t\t<div class="aboutStat"><strong>24 ชม.</strong><span>ช่องทางแจ้งเคลมฉุกเฉิน</span></div>
\t\t\t\t<div class="aboutStat"><strong>คปภ.</strong><span>กำกับดูแลตามกฎหมาย</span></div>
\t\t\t</div>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">แนะนำบริษัท</span>
\t\t\t\t<h2>กล้าดีโบรคเกอร์ — ที่ปรึกษาประกันภัยที่คุณวางใจ</h2>
\t\t\t\t<p>กล้าดีโบรคเกอร์ คือนายหน้าประกันภัยที่รวบรวมผลิตภัณฑ์จากบริษัทประกันชั้นนำหลายแห่งไว้ในที่เดียว ช่วยลูกค้าบุคคล ครอบครัว และองค์กรเปรียบเทียบเบี้ยและความคุ้มครองอย่างเป็นกลาง เลือกแผนที่เหมาะสมที่สุดกับความต้องการและงบประมาณ</p>
\t\t\t\t<p>เราไม่ได้มุ่งเน้นแค่การขายกรมธรรม์ แต่ดูแลลูกค้าตลอดอายุสัญญา ทั้งการต่ออายุ ปรับความคุ้มครอง ประสานงานเวลาเคลม และให้คำปรึกษาเมื่อสถานการณ์ชีวิตเปลี่ยนแปลง นอกจากนี้เรายังเปิดรับสมัครนายหน้าประกันภัย พร้อมระบบ ทีมพี่เลี้ยง และการอบรมเพื่อสร้างอาชีพที่ยั่งยืน</p>
\t\t\t\t<ul class="aboutList">
\t\t\t\t\t<li>รวมประกันหลากหลายประเภทไว้ครบในที่เดียว</li>
\t\t\t\t\t<li>เปรียบเทียบเบี้ยและความคุ้มครองอย่างเป็นกลาง ไม่ผูกกับบริษัทเดียว</li>
\t\t\t\t\t<li>บริการหลังการขายและช่วยประสานงานเวลาเคลม</li>
\t\t\t\t\t<li>ศูนย์สนับสนุนนายหน้าและการออกกรมธรรม์</li>
\t\t\t\t</ul>
\t\t\t</section>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ทำไมต้องเลือกเรา</span>
\t\t\t\t<h2>จุดเด่นที่ทำให้กล้าดีโบรคเกอร์ แตกต่าง</h2>
\t\t\t\t<div class="aboutFeatures">
\t\t\t\t\t<article class="aboutFeature">
\t\t\t\t\t\t<span class="aboutFeature__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg></span>
\t\t\t\t\t\t<h3>Trusted — ถูกต้องตามกฎหมาย</h3>
\t\t\t\t\t\t<p>ดำเนินงานภายใต้การกำกับของสำนักงาน คปภ. มีใบอนุญาตนายหน้าประกันภัย โปร่งใสและตรวจสอบได้</p>
\t\t\t\t\t</article>
\t\t\t\t\t<article class="aboutFeature">
\t\t\t\t\t\t<span class="aboutFeature__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span>
\t\t\t\t\t\t<h3>Choices — เปรียบเทียบหลายบริษัท</h3>
\t\t\t\t\t\t<p>ไม่ผูกกับบริษัทประกันเจ้าเดียว ช่วยคัดแผนที่เหมาะกับคุณจากพันธมิตรหลายแห่ง</p>
\t\t\t\t\t</article>
\t\t\t\t\t<article class="aboutFeature">
\t\t\t\t\t\t<span class="aboutFeature__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></span>
\t\t\t\t\t\t<h3>Care — ดูแลตลอดอายุกรมธรรม์</h3>
\t\t\t\t\t\t<p>ช่วยต่ออายุ ปรับความคุ้มครอง และประสานงานเคลม ไม่ทิ้งลูกค้าหลังออกกรมธรรม์</p>
\t\t\t\t\t</article>
\t\t\t\t\t<article class="aboutFeature">
\t\t\t\t\t\t<span class="aboutFeature__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
\t\t\t\t\t\t<h3>Speed — บริการรวดเร็ว</h3>
\t\t\t\t\t\t<p>ตอบกลับรวดเร็ว มีช่องทางโทร LINE และอีเมล รองรับการแจ้งเคลมฉุกเฉินนอกเวลาทำการ</p>
\t\t\t\t\t</article>
\t\t\t\t</div>
\t\t\t</section>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ข้อมูลบริษัท</span>
\t\t\t\t<h2>ข้อมูลทั่วไป</h2>
\t\t\t\t<table class="aboutTable">
\t\t\t\t\t<tbody>
\t\t\t\t\t\t<tr><th scope="row">ชื่อบริษัท</th><td>กล้าดีโบรคเกอร์ (Kladee Broker)</td></tr>
\t\t\t\t\t\t<tr><th scope="row">ประเภทธุรกิจ</th><td>นายหน้าประกันภัย / โบรกเกอร์ประกันภัย</td></tr>
\t\t\t\t\t\t<tr><th scope="row">การกำกับดูแล</th><td>สำนักงาน คปภ.</td></tr>
\t\t\t\t\t\t<tr><th scope="row">โทรศัพท์</th><td><a href="tel:0826164555">082-616-4555</a></td></tr>
\t\t\t\t\t\t<tr><th scope="row">อีเมล</th><td><a href="mailto:kladee.broker@gmail.com">kladee.broker@gmail.com</a></td></tr>
\t\t\t\t\t</tbody>
\t\t\t\t</table>
\t\t\t</section>
\t\t\t<section class="aboutPager">
\t\t\t\t<a class="aboutPager__link aboutPager__link--next" href="about-history.html">ถัดไป: ประวัติความเป็นมา <span aria-hidden="true">→</span></a>
\t\t\t</section>`,
  },
  {
    file: 'about-history.html',
    slug: 'about-history',
    dataPage: 'about-history',
    title: 'ประวัติความเป็นมา',
    description: 'ประวัติความเป็นมาของกล้าดีโบรคเกอร์ เส้นทางการให้บริการนายหน้าประกันภัยและศูนย์สนับสนุนนายหน้า',
    badge: 'History',
    heroTitle: 'ประวัติความเป็นมา',
    heroDesc: 'เส้นทางของกล้าดีโบรคเกอร์ จากที่ปรึกษาประกันภัยสู่โบรกเกอร์ครบวงจรที่รองรับลูกค้าและนายหน้าทั่วประเทศ',
    body: `\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ประวัติความเป็นมา</span>
\t\t\t\t<h2>เส้นทางของกล้าดีโบรคเกอร์</h2>
\t\t\t\t<p>กล้าดีโบรคเกอร์ ก่อตั้งขึ้นจากความตั้งใจที่จะทำให้การเข้าถึงประกันภัยเป็นเรื่องง่าย โปร่งใส และเป็นมิตรกับลูกค้ามากขึ้น เราเริ่มต้นด้วยการให้บริการที่ปรึกษาประกันภัยแบบตัวต่อตัว แล้วขยายสู่ระบบนายหน้าและช่องทางออนไลน์เพื่อรองรับลูกค้าและตัวแทนทั่วประเทศ</p>
\t\t\t\t<ol class="aboutTimeline">
\t\t\t\t\t<li><span class="aboutTimeline__year">จุดเริ่มต้น</span><p>เริ่มให้บริการที่ปรึกษาประกันภัยแก่ลูกค้ารายย่อยและ SME เน้นความเข้าใจง่ายและการดูแลหลังการขาย</p></li>
\t\t\t\t\t<li><span class="aboutTimeline__year">ขยายพันธมิตร</span><p>ร่วมมือกับบริษัทประกันวินาศภัยและประกันชีวิตชั้นนำ เพื่อให้ลูกค้าเปรียบเทียบแผนได้หลากหลายในที่เดียว</p></li>
\t\t\t\t\t<li><span class="aboutTimeline__year">ศูนย์นายหน้า</span><p>เปิดรับสมัครนายหน้าประกันภัย พร้อมระบบงาน ทีมพี่เลี้ยง และหลักสูตรอบรมเพื่อยกระดับมาตรฐานอาชีพ</p></li>
\t\t\t\t\t<li><span class="aboutTimeline__year">ปัจจุบัน</span><p>พัฒนาเว็บไซต์และช่องทางดิจิทัลเพื่อให้ข้อมูล ข่าวสาร และการติดต่อสะดวกขึ้น ภายใต้การกำกับของสำนักงาน คปภ.</p></li>
\t\t\t\t</ol>
\t\t\t</section>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ขอบเขตบริการ</span>
\t\t\t\t<h2>บริการที่เรามอบให้ลูกค้าและนายหน้า</h2>
\t\t\t\t<div class="aboutServices">
\t\t\t\t\t<div>
\t\t\t\t\t\t<h3>สำหรับลูกค้าทั่วไป</h3>
\t\t\t\t\t\t<ul class="aboutList">
\t\t\t\t\t\t\t<li>ประกันรถยนต์ / พ.ร.บ.</li>
\t\t\t\t\t\t\t<li>ประกันชีวิต / สุขภาพ / อุบัติเหตุ</li>
\t\t\t\t\t\t\t<li>ประกันบ้าน ทรัพย์สิน และธุรกิจ</li>
\t\t\t\t\t\t\t<li>ให้คำปรึกษา เปรียบเทียบเบี้ย และช่วยเคลม</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</div>
\t\t\t\t\t<div>
\t\t\t\t\t\t<h3>สำหรับนายหน้าในสังกัด</h3>
\t\t\t\t\t\t<ul class="aboutList">
\t\t\t\t\t\t\t<li>รับสมัครนายหน้า (ไม่จำกัดวุฒิ/ประสบการณ์)</li>
\t\t\t\t\t\t\t<li>ระบบศูนย์นายหน้า ออกกรมธรรม์และติดตามค่าคอมมิชชัน</li>
\t\t\t\t\t\t\t<li>ทีมพี่เลี้ยงและหลักสูตรอบรม</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</section>
\t\t\t<section class="aboutPager">
\t\t\t\t<a class="aboutPager__link aboutPager__link--prev" href="about-intro.html"><span aria-hidden="true">←</span> ก่อนหน้า: แนะนำบริษัท</a>
\t\t\t\t<a class="aboutPager__link aboutPager__link--next" href="about-vision.html">ถัดไป: วิสัยทัศน์และพันธกิจ <span aria-hidden="true">→</span></a>
\t\t\t</section>`,
  },
  {
    file: 'about-vision.html',
    slug: 'about-vision',
    dataPage: 'about-vision',
    title: 'วิสัยทัศน์และพันธกิจ',
    description: 'วิสัยทัศน์และพันธกิจของกล้าดีโบรคเกอร์ มุ่งเป็นโบรกเกอร์ที่คนไทยไว้วางใจ',
    badge: 'Vision',
    heroTitle: 'วิสัยทัศน์และพันธกิจ',
    heroDesc: 'มุ่งเป็นโบรกเกอร์ที่คนไทยไว้วางใจ ด้วยคำแนะนำที่เข้าใจง่าย โปร่งใส และยึดประโยชน์ของลูกค้าเป็นหลัก',
    body: `\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">วิสัยทัศน์และพันธกิจ</span>
\t\t\t\t<h2>มุ่งเป็นโบรกเกอร์ที่คนไทยไว้วางใจ</h2>
\t\t\t\t<div class="aboutCards">
\t\t\t\t\t<div class="aboutCard"><h3>วิสัยทัศน์</h3><p>ให้ทุกคนและทุกธุรกิจเข้าถึงความคุ้มครองที่เหมาะสม ด้วยคำแนะนำที่เข้าใจง่าย โปร่งใส และยึดประโยชน์ของลูกค้าเป็นหลัก</p></div>
\t\t\t\t\t<div class="aboutCard"><h3>พันธกิจ</h3><p>ให้คำปรึกษาอย่างมืออาชีพและเป็นกลาง ช่วยเปรียบเทียบแผนที่คุ้มค่า ดูแลตลอดอายุกรมธรรม์ และพัฒนานายหน้าให้มีความรู้ จริยธรรม และบริการระดับมาตรฐาน</p></div>
\t\t\t\t</div>
\t\t\t</section>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ค่านิยมองค์กร</span>
\t\t\t\t<h2>หลักการที่เรายึดถือในการทำงาน</h2>
\t\t\t\t<div class="aboutValues">
\t\t\t\t\t<div class="aboutValue"><strong>Integrity</strong><span>ซื่อสัตย์ โปร่งใส ทำตามจรรยาบรรณวิชาชีพ</span></div>
\t\t\t\t\t<div class="aboutValue"><strong>Customer First</strong><span>ยึดประโยชน์และความเข้าใจของลูกค้าเป็นที่ตั้ง</span></div>
\t\t\t\t\t<div class="aboutValue"><strong>Excellence</strong><span>พัฒนาความรู้และบริการอย่างต่อเนื่อง</span></div>
\t\t\t\t\t<div class="aboutValue"><strong>Partnership</strong><span>ร่วมเติบโตกับนายหน้าและพันธมิตรอย่างยั่งยืน</span></div>
\t\t\t\t</div>
\t\t\t</section>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ใบอนุญาต</span>
\t\t\t\t<h2>มาตรฐานและการกำกับดูแล</h2>
\t\t\t\t<p>กล้าดีโบรคเกอร์ ดำเนินธุรกิจนายหน้าประกันภัยภายใต้กฎหมายและการกำกับดูแลของสำนักงาน คปภ. ลูกค้าสามารถตรวจสอบใบอนุญาตนายหน้าได้ที่ <a href="https://www.oic.or.th/th/license-check" target="_blank" rel="noopener noreferrer">เว็บไซต์สำนักงาน คปภ.</a></p>
\t\t\t</section>
\t\t\t<section class="aboutPager">
\t\t\t\t<a class="aboutPager__link aboutPager__link--prev" href="about-history.html"><span aria-hidden="true">←</span> ก่อนหน้า: ประวัติความเป็นมา</a>
\t\t\t\t<a class="aboutPager__link aboutPager__link--next" href="about-team.html">ถัดไป: ทีมงานของเรา <span aria-hidden="true">→</span></a>
\t\t\t</section>`,
  },
  {
    file: 'about-team.html',
    slug: 'about-team',
    dataPage: 'about-team',
    title: 'ทีมงานของเรา',
    description: 'ทีมงานกล้าดีโบรคเกอร์ นายหน้าประกันภัย ที่ปรึกษา และเจ้าหน้าที่สนับสนุนลูกค้ามืออาชีพ',
    badge: 'Team',
    heroTitle: 'ทีมงานของเรา',
    heroDesc: 'ทีมมืออาชีพพร้อมดูแลคุณ — นายหน้าประกันภัย ที่ปรึกษาด้านความคุ้มครอง และเจ้าหน้าที่สนับสนุนลูกค้า',
    body: `\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ทีมงานของเรา</span>
\t\t\t\t<h2>ทีมมืออาชีพพร้อมดูแลคุณ</h2>
\t\t\t\t<p>ทีมงานกล้าดีโบรคเกอร์ประกอบด้วยนายหน้าประกันภัย ที่ปรึกษาด้านความคุ้มครอง และเจ้าหน้าที่สนับสนุนลูกค้า ที่ผ่านการอบรมด้านผลิตภัณฑ์ การบริการ และจริยธรรมวิชาชีพ <a href="experts.html" class="aboutLink">ดูผู้เชี่ยวชาญของเรา</a></p>
\t\t\t\t<ul class="aboutList">
\t\t\t\t\t<li>ที่ปรึกษาที่เข้าใจผลิตภัณฑ์และความต้องการของลูกค้า</li>
\t\t\t\t\t<li>ทีมสนับสนุนการออกกรมธรรม์ ต่ออายุ และติดตามเคลม</li>
\t\t\t\t\t<li>พี่เลี้ยงและระบบงานสำหรับนายหน้าในสังกัด</li>
\t\t\t\t\t<li>พัฒนาทักษะและความรู้อย่างต่อเนื่อง</li>
\t\t\t\t</ul>
\t\t\t</section>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">คณะผู้บริหาร</span>
\t\t\t\t<h2>ผู้บริหารและทิศทางองค์กร</h2>
\t\t\t\t<div class="aboutTeamGrid">
\t\t\t\t\t<article class="aboutTeamCard">
\t\t\t\t\t\t<div class="aboutTeamCard__avatar" aria-hidden="true">KB</div>
\t\t\t\t\t\t<h3>ผู้ก่อตั้ง / ผู้บริหาร</h3>
\t\t\t\t\t\t<p class="aboutTeamCard__role">กำกับทิศทางองค์กรและมาตรฐานบริการ</p>
\t\t\t\t\t\t<p>มุ่งเน้นการสร้างโบรกเกอร์ที่ลูกค้าและนายหน้าไว้วางใจ ด้วยระบบงานที่ใช้งานได้จริงและทีมที่เข้าใจลูกค้า</p>
\t\t\t\t\t</article>
\t\t\t\t\t<article class="aboutTeamCard">
\t\t\t\t\t\t<div class="aboutTeamCard__avatar" aria-hidden="true">OP</div>
\t\t\t\t\t\t<h3>ฝ่ายปฏิบัติการ</h3>
\t\t\t\t\t\t<p class="aboutTeamCard__role">ดูแลระบบงานและการสนับสนุนนายหน้า</p>
\t\t\t\t\t\t<p>รับผิดชอบการออกกรมธรรม์ ติดตามค่าคอมมิชชัน และประสานงานกับบริษัทประกันพันธมิตร</p>
\t\t\t\t\t</article>
\t\t\t\t\t<article class="aboutTeamCard">
\t\t\t\t\t\t<div class="aboutTeamCard__avatar" aria-hidden="true">CS</div>
\t\t\t\t\t\t<h3>ฝ่ายบริการลูกค้า</h3>
\t\t\t\t\t\t<p class="aboutTeamCard__role">ดูแลลูกค้าและการเคลม</p>
\t\t\t\t\t\t<p>ให้คำปรึกษา รับเรื่องเคลม และติดตามความคุ้มครองตลอดอายุกรมธรรม์</p>
\t\t\t\t\t</article>
\t\t\t\t</div>
\t\t\t</section>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ทีมที่ปรึกษา</span>
\t\t\t\t<h2>ที่ปรึกษาที่เข้าใจทั้งผลิตภัณฑ์และลูกค้า</h2>
\t\t\t\t<p>ทีมที่ปรึกษาประกันภัยของเราพร้อมช่วยวิเคราะห์ความเสี่ยง เปรียบเทียบแผน และอธิบายรายละเอียดกรมธรรม์ในภาษาที่เข้าใจง่าย</p>
\t\t\t\t<p><a href="experts.html" class="aboutLink">ดูรายละเอียดผู้เชี่ยวชาญแต่ละสายงาน →</a></p>
\t\t\t</section>
\t\t\t<section class="aboutPager">
\t\t\t\t<a class="aboutPager__link aboutPager__link--prev" href="about-vision.html"><span aria-hidden="true">←</span> ก่อนหน้า: วิสัยทัศน์และพันธกิจ</a>
\t\t\t\t<a class="aboutPager__link aboutPager__link--next" href="about-message.html">ถัดไป: สาส์นจากผู้บริหาร <span aria-hidden="true">→</span></a>
\t\t\t</section>`,
  },
  {
    file: 'about-message.html',
    slug: 'about-message',
    dataPage: 'about-message',
    title: 'สาส์นจากผู้บริหาร',
    description: 'สาส์นจากผู้บริหารกล้าดีโบรคเกอร์ มุ่งเป็นเพื่อนคู่คิดด้านความคุ้มครอง',
    badge: 'Message',
    heroTitle: 'สาส์นจากผู้บริหาร',
    heroDesc: 'มุมมองจากผู้บริหารกล้าดีโบรคเกอร์ ต่อการบริการลูกค้าและการเติบโตของนายหน้าในสังกัด',
    body: `\t\t\t<section class="aboutSection aboutSection--quote">
\t\t\t\t<span class="aboutSection__tag">สาส์นจากผู้บริหาร</span>
\t\t\t\t<blockquote class="aboutQuote">
\t\t\t\t\t<p>«ประกันภัยไม่ใช่แค่เอกสารที่ซื้อครั้งเดียว แต่คือความอุ่นใจที่ต้องได้รับการดูแลตลอดเวลา กล้าดีโบรคเกอร์ จึงมุ่งเป็นเพื่อนคู่คิดด้านความคุ้มครอง — ทั้งสำหรับลูกค้าและนายหน้าที่ร่วมเดินทางกับเรา»</p>
\t\t\t\t\t<footer>— ผู้บริหาร กล้าดีโบรคเกอร์</footer>
\t\t\t\t</blockquote>
\t\t\t</section>
\t\t\t<section class="aboutSection">
\t\t\t\t<span class="aboutSection__tag">ปณิธาน</span>
\t\t\t\t<h2>สิ่งที่เรายึดมั่น</h2>
\t\t\t\t<ul class="aboutList">
\t\t\t\t\t<li>ให้คำปรึกษาอย่างซื่อสัตย์ ไม่ขายเกินความจำเป็น</li>
\t\t\t\t\t<li>พัฒนาระบบและทีมงานให้นายหน้าทำงานได้จริง มีรายได้ยั่งยืน</li>
\t\t\t\t\t<li>ดูแลลูกค้าตลอดอายุกรมธรรม์ ไม่ทิ้งหลังออกกรมธรรม์</li>
\t\t\t\t\t<li>ปฏิบัติตามกฎหมายและมาตรฐานสำนักงาน คปภ. อย่างเคร่งครัด</li>
\t\t\t\t</ul>
\t\t\t</section>
\t\t\t<section class="aboutCta">
\t\t\t\t<h2>พร้อมเริ่มวางแผนความคุ้มครองกับเรา?</h2>
\t\t\t\t<p>ปรึกษาฟรี ไม่มีค่าใช้จ่าย หรือสมัครเป็นนายหน้าเพื่อสร้างรายได้กับทีมมืออาชีพ</p>
\t\t\t\t<div class="aboutCta__actions">
\t\t\t\t\t<a class="aboutCta__btn aboutCta__btn--primary" href="contact.html">ติดต่อเรา</a>
\t\t\t\t\t<a class="aboutCta__btn aboutCta__btn--ghost" href="join.html">สมัครนายหน้า</a>
\t\t\t\t</div>
\t\t\t</section>
\t\t\t<section class="aboutPager">
\t\t\t\t<a class="aboutPager__link aboutPager__link--prev" href="about-team.html"><span aria-hidden="true">←</span> ก่อนหน้า: ทีมงานของเรา</a>
\t\t\t\t<a class="aboutPager__link aboutPager__link--next" href="experts.html">ถัดไป: ผู้เชี่ยวชาญของเรา <span aria-hidden="true">→</span></a>
\t\t\t</section>`,
  },
];

const hubPage = pageShell({
  slug: 'about',
  dataPage: 'about',
  title: 'เกี่ยวกับเรา',
  description: 'รู้จักกล้าดีโบรคเกอร์ นายหน้าประกันภัยครบวงจร วิสัยทัศน์ พันธกิจ ทีมงาน และข้อมูลบริษัท',
  badge: 'About Kladee',
  heroTitle: 'เกี่ยวกับ กล้าดีโบรคเกอร์',
  heroDesc: 'นายหน้าประกันภัยครบวงจร ที่ปรึกษาด้านความคุ้มครองที่คุณวางใจ — เปรียบเทียบผลิตภัณฑ์จากบริษัทประกันชั้นนำ ดูแลตลอดอายุกรมธรรม์ และสนับสนุนนายหน้ามืออาชีพ',
  crumbLabel: 'เกี่ยวกับเรา',
  note: 'เว็บไซต์นี้จัดทำเพื่อประชาสัมพันธ์และรับสมัครนายหน้า ไม่มีการขายกรมธรรม์จบบนระบบออนไลน์',
  body: `\t\t\t<div class="aboutStats aboutStats--inline">
\t\t\t\t<div class="aboutStat"><strong>10+</strong><span>บริษัทประกันพันธมิตร</span></div>
\t\t\t\t<div class="aboutStat"><strong>13</strong><span>หมวดประกันครบวงจร</span></div>
\t\t\t\t<div class="aboutStat"><strong>24 ชม.</strong><span>ช่องทางแจ้งเคลมฉุกเฉิน</span></div>
\t\t\t\t<div class="aboutStat"><strong>คปภ.</strong><span>กำกับดูแลตามกฎหมาย</span></div>
\t\t\t</div>
\t\t\t<section class="aboutHub">
\t\t\t\t<h2 class="aboutHub__title">เลือกหัวข้อที่สนใจ</h2>
\t\t\t\t<div class="aboutHubGrid">
\t\t\t\t\t<a class="aboutHubCard" href="about-intro.html"><span class="aboutHubCard__tag">Company</span><h3>แนะนำบริษัท</h3><p>รู้จักกล้าดีโบรคเกอร์ จุดเด่น และข้อมูลทั่วไป</p></a>
\t\t\t\t\t<a class="aboutHubCard" href="about-history.html"><span class="aboutHubCard__tag">History</span><h3>ประวัติความเป็นมา</h3><p>เส้นทางการให้บริการและการขยายองค์กร</p></a>
\t\t\t\t\t<a class="aboutHubCard" href="about-vision.html"><span class="aboutHubCard__tag">Vision</span><h3>วิสัยทัศน์และพันธกิจ</h3><p>ทิศทางองค์กร ค่านิยม และมาตรฐานการดำเนินงาน</p></a>
\t\t\t\t\t<a class="aboutHubCard" href="about-team.html"><span class="aboutHubCard__tag">Team</span><h3>ทีมงานของเรา</h3><p>คณะผู้บริหาร ทีมสนับสนุน และที่ปรึกษา</p></a>
\t\t\t\t\t<a class="aboutHubCard" href="about-message.html"><span class="aboutHubCard__tag">Message</span><h3>สาส์นจากผู้บริหาร</h3><p>มุมมองและปณิธานต่อลูกค้าและนายหน้า</p></a>
\t\t\t\t\t<a class="aboutHubCard" href="experts.html"><span class="aboutHubCard__tag">Experts</span><h3>ผู้เชี่ยวชาญของเรา</h3><p>ที่ปรึกษาแยกตามสายงานประกันภัย</p></a>
\t\t\t\t</div>
\t\t\t</section>
\t\t\t<section class="aboutHub aboutHub--contact">
\t\t\t\t<h2 class="aboutHub__title">ติดต่อและร่วมงาน</h2>
\t\t\t\t<div class="aboutHubGrid aboutHubGrid--3">
\t\t\t\t\t<a class="aboutHubCard aboutHubCard--outline" href="contact.html"><h3>ติดต่อเจ้าหน้าที่</h3><p>สอบถามผลิตภัณฑ์ ขอใบเสนอราคา หรือแจ้งปัญหา</p></a>
\t\t\t\t\t<a class="aboutHubCard aboutHubCard--outline" href="join.html"><h3>สมัครเป็นนายหน้า</h3><p>เริ่มอาชีพนายหน้าประกันภัยกับทีมมืออาชีพ</p></a>
\t\t\t\t\t<a class="aboutHubCard aboutHubCard--outline" href="login.html"><h3>เข้าสู่ระบบนายหน้า</h3><p>ศูนย์นายหน้า ออกกรมธรรม์และติดตามค่าคอมมิชชัน</p></a>
\t\t\t\t</div>
\t\t\t</section>`,
});

// Fix hub breadcrumb - only 2 levels
const hubHtml = hubPage.replace(
  '<a href="index.html">หน้าแรก</a><span>/</span><a href="about.html">เกี่ยวกับเรา</a><span>/</span><span>เกี่ยวกับเรา</span>',
  '<a href="index.html">หน้าแรก</a><span>/</span><span>เกี่ยวกับเรา</span>'
);

pages.forEach((p) => {
  const html = pageShell(p);
  fs.writeFileSync(path.join(root, p.file), html, 'utf8');
  console.log('built', p.file);
});

fs.writeFileSync(path.join(root, 'about.html'), hubHtml, 'utf8');
console.log('built about.html (hub)');
console.log('Done:', pages.length + 1, 'about pages');
