const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cache = '20260628l';

const headCommon = (title, description) => `<!DOCTYPE html>
<html lang="th">
<head>
<title>${title}</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="css/6723.css?v=${cache}">
<link rel="stylesheet" type="text/css" href="css/6720.css?v=${cache}">
<link rel="stylesheet" type="text/css" href="css/3802.css?v=${cache}">
<link rel="stylesheet" type="text/css" href="css/3803.css?v=${cache}">
<link rel="stylesheet" type="text/css" href="css/6714.css?v=${cache}">
<link rel="stylesheet" type="text/css" href="css/6918.css?v=${cache}">
<link rel="stylesheet" type="text/css" href="css/icons-lucide.css?v=${cache}">
<link rel="stylesheet" type="text/css" href="css/pages.css?v=${cache}">
</head>`;

const bodyStart = (page) => `<body class="chrome-pending subpage" data-page="${page}">
<ul id="skip_navi">
<li><a href="#content">ข้ามไปยังเนื้อหาหลัก</a></li>
<li><a href="#gnb">ข้ามไปยังเมนูหลัก</a></li>
</ul>
<div id="wrapper">
<div id="site-header-slot"></div>
<div id="container">
<div id="content">
`;

const bodyEnd = `<img src="#" style="width:0px;height:0px;display:none;" alt="สถิติผู้เข้าชม">
</div>
<script type="text/javascript" src="js/3804.js?v=${cache}"></script>
<script type="text/javascript" src="js/3805.js?v=${cache}"></script>
<script type="text/javascript" src="js/6717.js?v=${cache}"></script>
<script type="text/javascript" src="js/6719.js?v=${cache}"></script>
<script type="text/javascript" src="js/site-chrome.js?v=${cache}"></script>
<script type="text/javascript" src="js/pages.js?v=${cache}"></script>
</body>
</html>
`;

function extractMain(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const m = html.match(/<main class="pageMain">([\s\S]*?)<\/main>/);
  if (!m) throw new Error('main not found in ' + filePath);
  return m[0];
}

function build(page, title, description, srcFile, outFile) {
  const main = extractMain(srcFile);
  const html = [
    headCommon(title, description),
    bodyStart(page),
    main,
    '\n</div>\n</div>\n<div id="site-footer-slot"></div>\n',
    bodyEnd,
  ].join('\n');
  fs.writeFileSync(outFile, html);
  console.log('built', outFile);
}

build(
  'news',
  'ข่าวสาร | กล้าดี โบรกเกอร์',
  'ข่าวสาร โปรโมชัน บทความน่ารู้ กิจกรรม และประกาศรับสมัครนายหน้าจากกล้าดี โบรกเกอร์ — อัปเดตล่าสุดทุกเดือน',
  path.join(root, 'news.html'),
  path.join(root, 'news.html')
);

build(
  'contact',
  'ติดต่อเรา | กล้าดี โบรกเกอร์',
  'ติดต่อกล้าดี โบรกเกอร์ ปรึกษาประกันภัย สมัครนายหน้า แจ้งเคลม — โทร 082-616-4555 อีเมล kladee.broker@gmail.com LINE @kladeebroker',
  path.join(root, 'contact.html'),
  path.join(root, 'contact.html')
);
