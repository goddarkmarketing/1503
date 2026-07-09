/**
 * Shared renderer: left nav cards + right detail panel for plan pages.
 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortTitle(text) {
  if (text.length <= 30) return text;
  const idx = text.indexOf('ที่');
  if (idx > 4 && idx < 28) return text.slice(0, idx).trim();
  return `${text.slice(0, 28).trim()}…`;
}

function normalizeSplitItem(item, index) {
  if (typeof item === 'string') {
    return {
      t: shortTitle(item),
      p: item,
      d: [
        item,
        'กลุ่มเป้าหมายนี้มักต้องการแผนที่สมดุลระหว่างเบี้ยประกันและความคุ้มครอง',
        '• ปรึกษาทีมกล้าดีโบรคเกอร์ฟรีเพื่อรับคำแนะนำเฉพาะราย',
      ],
    };
  }
  const d = item.d
    ? (Array.isArray(item.d) ? item.d : [item.d])
    : [
        item.p,
        'รายละเอียดและวงเงินขึ้นกับบริษัทประกันและแผนที่เลือก',
        '• สอบถามเพื่อรับใบเสนอราคาและเงื่อนไขที่ชัดเจน',
      ];
  return { t: item.t, p: item.p, d, num: item.num };
}

function renderDetailBody(lines) {
  return lines
    .map((line) => {
      if (typeof line === 'string' && line.startsWith('• ')) {
        return `<li>${esc(line.slice(2))}</li>`;
      }
      return `<p>${esc(line)}</p>`;
    })
    .join('\n\t\t\t\t\t');
}

function renderPlanSplit(sectionId, items, opts = {}) {
  if (!items || !items.length) return '';
  const sub = opts.sub ? `<p>${esc(opts.sub)}</p>` : '';
  const normalized = items.map(normalizeSplitItem);

  const nav = normalized
    .map((item, i) => {
      const num = item.num != null ? item.num : i + 1;
      const numHtml = opts.showNum
        ? `<span class="planSplitCard__num">${num}</span>`
        : '';
      return `<button type="button" class="planSplitCard${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" data-plan-tab="${i}" id="${sectionId}-tab-${i}" aria-controls="${sectionId}-panel-${i}">
\t\t\t${numHtml}
\t\t\t<span class="planSplitCard__title">${esc(item.t)}</span>
\t\t\t<span class="planSplitCard__brief">${esc(item.p)}</span>
\t\t</button>`;
    })
    .join('\n\t\t\t');

  const panels = normalized
    .map((item, i) => {
      const hasBullets = item.d.some((line) => typeof line === 'string' && line.startsWith('• '));
      const body = hasBullets
        ? `<ul class="planSplitDetail__list">${item.d.map((line) => (typeof line === 'string' && line.startsWith('• ') ? `<li>${esc(line.slice(2))}</li>` : `<li>${esc(line)}</li>`)).join('\n\t\t\t\t\t')}</ul>`
        : renderDetailBody(item.d);
      const num = item.num != null ? item.num : i + 1;
      const numBadge = opts.showNum ? `<span class="planSplitDetail__num">${num}</span>` : '';
      return `<div class="planSplitDetail${i === 0 ? ' is-active' : ''}" role="tabpanel" data-plan-panel="${i}" id="${sectionId}-panel-${i}" aria-labelledby="${sectionId}-tab-${i}"${i === 0 ? '' : ' hidden'}>
\t\t\t${numBadge}
\t\t\t<h3 class="planSplitDetail__title">${esc(item.t)}</h3>
\t\t\t<p class="planSplitDetail__lead">${esc(item.p)}</p>
\t\t\t<div class="planSplitDetail__body">${body}</div>
\t\t</div>`;
    })
    .join('\n\t\t\t');

  return `<section class="planSection">
\t\t<div class="planSection__head"><h2>${esc(opts.title || '')}</h2>${sub}</div>
\t\t<div class="planSplit" data-plan-split id="${sectionId}">
\t\t\t<div class="planSplit__nav" role="tablist" aria-label="${esc(opts.title || 'รายละเอียด')}">${nav}</div>
\t\t\t<div class="planSplit__panel">${panels}</div>
\t\t</div>
\t</section>`;
}

module.exports = { esc, renderPlanSplit, normalizeSplitItem };
