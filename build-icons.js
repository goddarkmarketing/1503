// Generates css/icons-lucide.css : replaces broken icon background-images with inline Lucide SVG icons.
const fs = require('fs');
const path = require('path');

// Lucide icon path snippets (inner SVG markup). Source: https://lucide.dev/icons/
const I = {
  facebook: "<path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'/>",
  x: "<path d='M18 6 6 18'/><path d='m6 6 12 12'/>",
  rss: "<path d='M4 11a9 9 0 0 1 9 9'/><path d='M4 4a16 16 0 0 1 16 16'/><circle cx='5' cy='19' r='1'/>",
  instagram: "<rect width='20' height='20' x='2' y='2' rx='5' ry='5'/><path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/><line x1='17.5' x2='17.51' y1='6.5' y2='6.5'/>",
  youtube: "<path d='M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17'/><path d='m10 15 5-3-5-3z'/>",
  search: "<circle cx='11' cy='11' r='8'/><path d='m21 21-4.3-4.3'/>",
  globe: "<circle cx='12' cy='12' r='10'/><path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'/><path d='M2 12h20'/>",
  arrowUp: "<path d='m5 12 7-7 7 7'/><path d='M12 19V5'/>",
  arrowRight: "<path d='M5 12h14'/><path d='m12 5 7 7-7 7'/>",
  chevronDown: "<path d='m6 9 6 6 6-6'/>",
  chevronUp: "<path d='m18 15-6-6-6 6'/>",
  chevronRight: "<path d='m9 18 6-6-6-6'/>",
  chevronLeft: "<path d='m15 18-6-6 6-6'/>",
  plus: "<path d='M5 12h14'/><path d='M12 5v14'/>",
  x2: "<path d='M18 6 6 18'/><path d='m6 6 12 12'/>",
  play: "<polygon points='6 3 20 12 6 21 6 3'/>",
  building2: "<path d='M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z'/><path d='M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2'/><path d='M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2'/><path d='M10 6h4'/><path d='M10 10h4'/><path d='M10 14h4'/><path d='M10 18h4'/>",
  users: "<path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/>",
  messageSquare: "<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/>",
  messageCircle: "<path d='M7.9 20A9 9 0 1 0 4 16.1L2 22Z'/>",
  calendarCheck: "<path d='M8 2v4'/><path d='M16 2v4'/><rect width='18' height='18' x='3' y='4' rx='2'/><path d='M3 10h18'/><path d='m9 16 2 2 4-4'/>",
  calendarDays: "<path d='M8 2v4'/><path d='M16 2v4'/><rect width='18' height='18' x='3' y='4' rx='2'/><path d='M3 10h18'/><path d='M8 14h.01'/><path d='M12 14h.01'/><path d='M16 14h.01'/><path d='M8 18h.01'/><path d='M12 18h.01'/><path d='M16 18h.01'/>",
  bookOpen: "<path d='M12 7v14'/><path d='M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'/>",
  briefcase: "<path d='M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/><rect width='20' height='14' x='2' y='6' rx='2'/>",
  clipboardList: "<rect width='8' height='4' x='8' y='2' rx='1' ry='1'/><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/><path d='M12 11h4'/><path d='M12 16h4'/><path d='M8 11h.01'/><path d='M8 16h.01'/>",
  bell: "<path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/><path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'/>",
  library: "<path d='m16 6 4 14'/><path d='M12 6v14'/><path d='M8 8v12'/><path d='M4 4v16'/>",
  book: "<path d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20'/>",
  image: "<rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/>",
  heart: "<path d='M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z'/>",
  usersRound: "<path d='M18 21a8 8 0 0 0-16 0'/><circle cx='10' cy='8' r='5'/><path d='M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3'/>",
  fileText: "<path d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'/><path d='M14 2v4a2 2 0 0 0 2 2h4'/><path d='M16 13H8'/><path d='M16 17H8'/><path d='M10 9H8'/>",
  megaphone: "<path d='m3 11 18-5v12L3 14v-3z'/><path d='M11.6 16.8a3 3 0 1 1-5.8-1.6'/>",
  sparkles: "<path d='M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z'/>",
  graduationCap: "<path d='M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z'/><path d='M22 10v6'/><path d='M6 12.5V16a6 3 0 0 0 12 0v-3.5'/>",
  lightbulb: "<path d='M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5'/><path d='M9 18h6'/><path d='M10 22h4'/>",
  music: "<path d='M9 18V5l12-2v13'/><circle cx='6' cy='18' r='3'/><circle cx='18' cy='16' r='3'/>",
  dumbbell: "<path d='M14.4 14.4 9.6 9.6'/><path d='M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z'/><path d='m21.5 21.5-1.4-1.4'/><path d='M3.9 3.9 2.5 2.5'/><path d='M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z'/>",
  landmark: "<line x1='3' x2='21' y1='22' y2='22'/><line x1='6' x2='6' y1='18' y2='11'/><line x1='10' x2='10' y1='18' y2='11'/><line x1='14' x2='14' y1='18' y2='11'/><line x1='18' x2='18' y1='18' y2='11'/><polygon points='12 2 20 7 4 7'/>",
  printer: "<path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'/><path d='M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6'/><rect width='12' height='8' x='6' y='14'/>",
  squarePen: "<path d='M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z'/>",
  plane: "<path d='M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 4.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'/>",
  car: "<path d='M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2'/><circle cx='7' cy='17' r='2'/><path d='M9 17h6'/><circle cx='17' cy='17' r='2'/>",
  building: "<rect width='16' height='20' x='4' y='2' rx='2' ry='2'/><path d='M9 22v-4h6v4'/><path d='M8 6h.01'/><path d='M16 6h.01'/><path d='M12 6h.01'/><path d='M12 10h.01'/><path d='M12 14h.01'/><path d='M16 10h.01'/><path d='M16 14h.01'/><path d='M8 10h.01'/><path d='M8 14h.01'/>",
  bot: "<path d='M12 8V4H8'/><rect width='16' height='12' x='4' y='8' rx='2'/><path d='M2 14h2'/><path d='M20 14h2'/><path d='M15 13v2'/><path d='M9 13v2'/>",
  calculator: "<rect width='16' height='20' x='4' y='2' rx='2'/><line x1='8' x2='16' y1='6' y2='6'/><line x1='16' x2='16' y1='14' y2='18'/><path d='M16 10h.01'/><path d='M12 10h.01'/><path d='M8 10h.01'/><path d='M12 14h.01'/><path d='M8 14h.01'/><path d='M12 18h.01'/><path d='M8 18h.01'/>",
  smile: "<circle cx='12' cy='12' r='10'/><path d='M8 14s1.5 2 4 2 4-2 4-2'/><line x1='9' x2='9.01' y1='9' y2='9'/><line x1='15' x2='15.01' y1='9' y2='9'/>",
  shieldAlert: "<path d='M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'/><path d='M12 8v4'/><path d='M12 16h.01'/>",
  shield: "<path d='M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'/>",
  eye: "<path d='M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0'/><circle cx='12' cy='12' r='3'/>",
  utensils: "<path d='M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2'/><path d='M7 2v20'/><path d='M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'/>",
  flag: "<path d='M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'/><line x1='4' x2='4' y1='22' y2='15'/>",
  map: "<path d='M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z'/><path d='M15 5.764v15'/><path d='M9 3.236v15'/>",
  mapPin: "<path d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'/><circle cx='12' cy='10' r='3'/>",
  list: "<line x1='8' x2='21' y1='6' y2='6'/><line x1='8' x2='21' y1='12' y2='12'/><line x1='8' x2='21' y1='18' y2='18'/><line x1='3' x2='3.01' y1='6' y2='6'/><line x1='3' x2='3.01' y1='12' y2='12'/><line x1='3' x2='3.01' y1='18' y2='18'/>",
  volume2: "<path d='M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z'/><path d='M16 9a5 5 0 0 1 0 6'/><path d='M19.364 18.364a9 9 0 0 0 0-12.728'/>",
  externalLink: "<path d='M15 3h6v6'/><path d='M10 14 21 3'/><path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/>",
  layoutGrid: "<rect width='7' height='7' x='3' y='3' rx='1'/><rect width='7' height='7' x='14' y='3' rx='1'/><rect width='7' height='7' x='14' y='14' rx='1'/><rect width='7' height='7' x='3' y='14' rx='1'/>",
};

function svg(name, color) {
  const inner = I[name];
  const s = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='" + color +
    "' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" + inner + "</svg>";
  return "url(\"data:image/svg+xml," + encodeURIComponent(s) + "\")";
}

const out = [];
function rule(sel, name, color, opts) {
  opts = opts || {};
  const size = opts.size || 'contain';
  const pos = opts.pos || 'center';
  let css = sel + "{background-image:" + svg(name, color) + " !important;background-repeat:no-repeat !important;background-position:" + pos + " !important;background-size:" + size + " !important;";
  if (opts.extra) css += opts.extra;
  css += "}";
  out.push(css);
}

const WHITE = "#ffffff";
const NAVY = "#1f379d";
const NAVY2 = "#17257b";
const PURPLE = "#532884";
const GREEN = "#047c5d";
const DARK = "#2a303e";

out.push("/* Auto-generated icon overrides using Lucide icons (https://lucide.dev/icons/). */");

/* ---- header SNS (white icon on brand-colored rounded square) ---- */
const sns = [
  ["ic1", "facebook", "#1877f2"],
  ["ic2", "x", "#111111"],
  ["ic3", "rss", "#03c75a"],
  ["ic4", "instagram", "#e1306c"],
  ["ic5", "youtube", "#ff0000"],
];
for (const [cls, name, bg] of sns) {
  rule("#header .head_box .topSns li." + cls + " a", name, WHITE, { size: "17px", extra: "background-color:" + bg + " !important;" });
  rule("#total_m_lay .topSns li." + cls + " a", name, WHITE, { size: "17px", extra: "background-color:" + bg + " !important;" });
}

/* ---- search & language ---- */
rule(".topSearch .searForm .btn", "search", WHITE, { size: "24px" });
rule("#header .head_box .topLink .topInfor .btnLang button", "globe", "#555555", { size: "16px", pos: "left center" });

/* ---- footer ---- */
rule("#footer .footWrap .botBtTop button", "arrowUp", WHITE, { size: "22px" });
rule("#footer .famSite .link .famBtn::after", "chevronDown", WHITE, { size: "16px 9px" });
rule("#footer .famSite .link .famBtn.on::after", "chevronDown", WHITE, { size: "16px 9px" });

/* ---- mCon2 mayor quick (white on gradient) ---- */
rule(".mCon2 .con2 ul li.ic1 a", "building2", WHITE, { size: "24px", pos: "left center" });
rule(".mCon2 .con2 ul li.ic2 a", "users", WHITE, { size: "24px", pos: "left center" });
rule(".mCon2 .con2 ul li.ic3 a", "messageSquare", WHITE, { size: "24px", pos: "left center" });
rule(".mCon2 .con1 ul li a::after", "chevronRight", "#047c5d", { size: "7px 12px" });
rule(".mCon2 .con1 .mayer_home a::after", "arrowRight", WHITE, { size: "14px" });

/* ---- mCon3 quick links (navy icon, 86x86 box) ---- */
const m1 = ["calendarCheck","bookOpen","briefcase","clipboardList","bell","library","book","image","heart","usersRound","fileText","megaphone","sparkles"];
m1.forEach((n, idx) => {
  rule(".mCon3 .mSlide2 ul li.ic" + (idx + 1) + " a::after", n, NAVY, { size: "52px" });
});
rule(".mCon3 .control .prevSlide2::before", "chevronLeft", "#333333", { size: "12px" });
rule(".mCon3 .control .nextSlide2::before", "chevronRight", "#333333", { size: "12px" });

/* ---- mCon4 news arrows ---- */
rule(".mCon4 .mNotice .mNoticeTab > li .mTabCon ul li .more span::after", "chevronRight", "#888888", { size: "14px" });
rule(".mCon4 .mNotice .mNoticeTab > li .mTabCon ul li a:hover .more span::after", "chevronRight", WHITE, { size: "14px" });
rule(".mCon4 .mNotice .mNoticeTab > li .mTabCon .btnMore a", "plus", WHITE, { size: "14px" });

/* ---- mCon5 popup-zone arrows + more ---- */
rule(".mCon5 .control .prevSlide3::after", "chevronLeft", "#333333", { size: "12px" });
rule(".mCon5 .control .nextSlide3::after", "chevronRight", "#333333", { size: "12px" });
rule(".mCon5 .control .moreSlide3", "layoutGrid", "#333333", { size: "16px" });

/* ---- mCon6 education (white icons on dark) ---- */
const edu = ["graduationCap","lightbulb","music","dumbbell","landmark"];
edu.forEach((n, idx) => rule(".mCon6 .con1 ul li.ic" + (idx + 1) + " a::before", n, WHITE, { size: "26px", pos: "left center" }));
rule(".mCon6 .con1 ul li a::after", "chevronRight", WHITE, { size: "7px 12px" });

/* ---- mCon6 col1 (민원/참여) navy ---- */
const m2 = ["messageCircle","printer","squarePen","plane","car","building","bot","calculator"];
m2.forEach((n, idx) => rule(".mCon6 .con2.col1 ul li.ic" + (idx + 1) + " a::before", n, NAVY2, { size: "26px", pos: "left center" }));

/* ---- mCon6 col2 (신고/상담) purple ---- */
const m3 = ["smile","shieldAlert","eye","utensils","shield","flag","fileText","clipboardList"];
m3.forEach((n, idx) => rule(".mCon6 .con2.col2 ul li.ic" + (idx + 1) + " a::before", n, PURPLE, { size: "26px", pos: "left center" }));

/* col headings small icons */
rule(".mCon6 .con2.col1 h2::before", "messageCircle", WHITE, { size: "20px" });
rule(".mCon6 .con2.col2 h2::before", "shieldAlert", WHITE, { size: "20px" });

/* ---- mCon7 media video play overlay (keep dark overlay) ---- */
out.push(".mCon7 ul li.part1 .photo::before,.mCon7 ul li.part2 .photo::before{background-image:" + svg("play", WHITE) + " !important;background-repeat:no-repeat !important;background-position:center !important;background-size:42px !important;background-color:rgba(0,0,0,0.5) !important;}");

/* ---- mCon8 news_infor links ---- */
rule(".mCon8 .news_infor ul li.ic2 a", "list", "#333333", { size: "20px", pos: "10px center" });
rule(".mCon8 .news_infor ul li.ic3 a", "volume2", "#333333", { size: "20px", pos: "10px center" });

/* ---- tour ---- */
const tour = ["map","calendarDays","mapPin"];
tour.forEach((n, idx) => rule(".mCon9 .tourLink ul li.ic" + (idx + 1) + " a::before", n, NAVY, { size: "26px", pos: "left center" }));
rule(".mCon9 .tourLink ul li a::after", "chevronRight", "#999999", { size: "16px 10px" });
rule(".mCon9 .tourLink ul li a:hover::after", "chevronRight", NAVY, { size: "16px 10px" });
rule(".mCon9 .tourLink .tour_go a::after", "externalLink", WHITE, { size: "14px" });
/* tour slider arrows (CSS already rotates nextSlide7 180deg) */
rule(".mCon9 .tourCon .con2 .control button", "chevronUp", WHITE, { size: "20px" });

/* ---- popups close buttons ---- */
rule(".slide_list_pop .box .btnClose", "x", "#333333", { size: "22px" });
rule(".famSite_pop .box .btnClose", "x", WHITE, { size: "22px" });

/* ---- mCon1 visual slider controls ---- */
rule(".mCon1 .control1 .prevSlide1::before", "chevronLeft", "#333333", { size: "13px 21px" });
rule(".mCon1 .control1 .nextSlide1::before", "chevronRight", "#333333", { size: "13px 21px" });
rule(".mCon1 .control2 .moreSlide1::after", "layoutGrid", WHITE, { size: "13px" });

const css = out.join("\n") + "\n";
fs.writeFileSync(path.join(__dirname, "css", "icons-lucide.css"), css, "utf8");
console.log("Wrote css/icons-lucide.css (" + out.length + " rules).");
