const fs = require('fs');
const path = require('path');

const origPath = process.argv[2];
const outDir = process.argv[3];

const orig = fs.readFileSync(origPath, 'utf8');
const css = fs.readFileSync(path.join(outDir, 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');

const styleOpen = orig.search(/<STYLE>/i);
const styleClose = orig.search(/<\/STYLE>/i);
const origCss = orig.slice(styleOpen + 7, styleClose);

const leftOrig = (orig.match(/style="left:/g) || []).length;
const leftNew = (html.match(/style="left:/g) || []).length;
const pdfOrig = (orig.match(/pdf24_01/g) || []).length;
const pdfNew = (html.match(/pdf24_01/g) || []).length;

console.log(JSON.stringify({
  cssIdentical: origCss === css,
  cssLenOrig: origCss.length,
  cssLenNew: css.length,
  leftStylesOrig: leftOrig,
  leftStylesNew: leftNew,
  pdf24_01_orig: pdfOrig,
  pdf24_01_new: pdfNew,
  hasStylesheetLink: /href="style.css"/.test(html),
  hasScript: /src="script.js"/.test(html),
  hasPng: /data:image\/png;base64,/.test(html)
}, null, 2));
