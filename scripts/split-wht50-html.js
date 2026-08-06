const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const outDir = process.argv[3];

const html = fs.readFileSync(src, 'utf8');

const styleOpen = html.search(/<STYLE>/i);
const styleClose = html.search(/<\/STYLE>/i);
if (styleOpen < 0 || styleClose < 0) {
  console.error('STYLE block not found');
  process.exit(1);
}

// Exact CSS content between tags (preserve every character)
const css = html.slice(styleOpen + 7, styleClose); // length of '<STYLE>' is 7
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'style.css'), css, 'utf8');

const before = html.slice(0, styleOpen);
const after = html.slice(styleClose + 8); // '</STYLE>'

const scriptRe = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const scripts = after.match(scriptRe) || [];
const jsParts = scripts.map((block) =>
  block.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '')
).filter((s) => s.trim().length > 0);

const js = jsParts.length
  ? jsParts.join('\n\n') + '\n'
  : '/* Original PDF→HTML conversion had no JavaScript. */\n';
fs.writeFileSync(path.join(outDir, 'script.js'), js, 'utf8');

let bodyPart = after.replace(scriptRe, '');

// Insert stylesheet link where STYLE was; keep surrounding markup intact
let out = before + '<link rel="stylesheet" href="style.css">' + bodyPart;

// Add script before </body> without altering other markup
if (/<\/body>/i.test(out)) {
  out = out.replace(/<\/body>/i, '\t<script src="script.js"><\/script>\n\t</body>');
} else if (/<\/html>/i.test(out)) {
  out = out.replace(/<\/html>/i, '\t<script src="script.js"><\/script>\n</html>');
} else {
  out += '\n<script src="script.js"></script>\n';
}

// Light head cleanup only: ensure charset once + meaningful title (no layout impact)
if (!/<meta\s+charset=/i.test(out)) {
  out = out.replace(/<head>/i, '<head>\n\t\t<meta charset="utf-8" />');
}
out = out.replace(/<title>\s*<\/title>/i, '<title>หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)</title>');

// Indent head open tags for readability — do NOT touch body absolute-position markup
out = out
  .replace(/<!DOCTYPE html><!--\[if IE\]>/i, '<!DOCTYPE html>\n<!--[if IE]>')
  .replace(/<html class="pdf24_ie"> <!\[endif\]-->\s*<html>/i, '<html class="pdf24_ie"> <![endif]-->\n<html lang="th">');

fs.writeFileSync(path.join(outDir, 'index.html'), out, 'utf8');

console.log(JSON.stringify({
  outDir,
  cssBytes: fs.statSync(path.join(outDir, 'style.css')).size,
  jsBytes: fs.statSync(path.join(outDir, 'script.js')).size,
  htmlBytes: fs.statSync(path.join(outDir, 'index.html')).size,
  scriptsFound: scripts.length
}, null, 2));
