/**
 * Convert amount (THB) to Thai baht text, e.g. 1795 -> "หนึ่งพันเจ็ดร้อยเก้าสิบห้าบาทถ้วน"
 */
(function (global) {
  const DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const POSITIONS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function readTwoDigits(n) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    let text = '';
    if (ten > 1) text += DIGITS[ten] + 'สิบ';
    else if (ten === 1) text += 'สิบ';
    if (unit === 1 && ten > 0) text += 'เอ็ด';
    else if (unit > 0) text += DIGITS[unit];
    return text;
  }

  function readIntegerPart(n) {
    if (n === 0) return 'ศูนย์';
    const parts = [];
    let num = n;
    while (num > 0) {
      const chunk = num % 1000000;
      num = Math.floor(num / 1000000);
      if (chunk === 0) continue;
      let chunkText = '';
      const digits = String(chunk).padStart(6, '0').split('').map(Number);
      digits.forEach((d, i) => {
        const pos = 5 - i;
        if (d === 0) return;
        if (pos === 1 && d === 1) chunkText += 'สิบ';
        else if (pos === 1 && d === 2) chunkText += 'ยี่สิบ';
        else if (pos === 0 && d === 1 && chunk > 10) chunkText += 'เอ็ด';
        else chunkText += DIGITS[d] + POSITIONS[pos];
      });
      if (num > 0) chunkText += 'ล้าน';
      parts.unshift(chunkText);
    }
    return parts.join('');
  }

  function bahtText(amount) {
    const n = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
    if (!Number.isFinite(n)) return '';
    const negative = n < 0;
    const abs = Math.abs(n);
    const baht = Math.floor(abs);
    const satang = Math.round((abs - baht) * 100);
    let text = (negative ? 'ลบ' : '') + readIntegerPart(baht) + 'บาท';
    if (satang === 0) text += 'ถ้วน';
    else text += readTwoDigits(satang) + 'สตางค์';
    return text;
  }

  global.BahtText = { toText: bahtText };
})(typeof window !== 'undefined' ? window : globalThis);
