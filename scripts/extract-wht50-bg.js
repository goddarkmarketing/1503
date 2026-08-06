const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const outDir = process.argv[3] || path.join(__dirname, '../assets/wht50');
const html = fs.readFileSync(src);
const text = html.toString('utf8');
const m = text.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
if (!m) {
  console.error('No PNG found');
  process.exit(1);
}
const buf = Buffer.from(m[1], 'base64');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'form-blank-bg.png');
fs.writeFileSync(out, buf);
console.log(JSON.stringify({
  out,
  bytes: buf.length,
  width: buf.readUInt32BE(16),
  height: buf.readUInt32BE(20),
  pngSig: buf.slice(0, 8).toString('hex')
}, null, 2));
