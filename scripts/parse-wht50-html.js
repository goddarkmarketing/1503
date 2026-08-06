const fs = require('fs');
const u = fs.readFileSync(process.argv[2], 'utf8');
const re = /style="left:([0-9.]+)em;top:([0-9.]+)em[^"]*"[^>]*>\s*<span[^>]*>([^<]{1,120})<\/span>/g;
const rows = [];
let m;
while ((m = re.exec(u))) {
  const t = m[3].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length >= 1) rows.push({ l: +m[1], t: +m[2], text: t });
}
rows.sort((a, b) => a.t - b.t || a.l - b.l);
const interesting = rows.filter((x) => x.text.length >= 2 && /[0-9A-Za-z\u0E00-\u0E7F?]/.test(x.text));
console.log('total', rows.length, 'interesting', interesting.length);
interesting
  .filter((x) => x.text.length > 2 || /[0-9]/.test(x.text))
  .slice(0, 100)
  .forEach((x) => console.log(`${x.t.toFixed(2).padStart(7)} ${x.l.toFixed(2).padStart(7)} | ${x.text}`));
