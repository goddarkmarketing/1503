/**

 * Article-style plan page (FWD-like): sticky section nav + scrollable content blocks.

 */

function esc(s) {

  return String(s)

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;');

}

function sectionId(text) {

  return String(text)

    .replace(/\s+/g, '-')

    .replace(/[^a-zA-Z0-9ก-๙\-]/g, '')

    .slice(0, 64) || 'section';

}

const FEAT_ICONS = [

  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',

  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',

  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',

  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',

  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',

  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',

];

const FAQ_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.5 18h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5Zm.05-3h-1.05a.5.5 0 0 1-.5-.47c.18-1.64 1.17-2.3 1.92-2.8.6-.4.94-.63 1.03-1.3.12-.92-.53-1.8-1.4-1.96-1-.22-1.9.44-2.06 1.33a.5.5 0 0 1-.49.41H8.54a.5.5 0 0 1-.49-.57c.31-2.19 2.41-3.62 4.78-3.15 2.02.4 3.34 2.28 3.17 4.34-.14 1.72-1.17 2.4-1.93 2.91-.59.39-.93.62-1.03 1.24a.5.5 0 0 1-.49.42ZM12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Z" fill="currentColor"/></svg>';

const DEFAULT_PROMO = [

  { t: 'ปรึกษาฟรี ไม่มีค่าใช้จ่าย', p: 'ทีมกล้าดีโบรคเกอร์ช่วยเปรียบเทียบแผนจากหลายบริษัทให้เหมาะกับงบและความต้องการของคุณ' },

  { t: 'บริการหลังการขายครบ', p: 'เตือนต่ออายุ ช่วยเคลม และตอบคำถามตลอดอายุกรมธรรม์' },

];

function shortTitle(text) {

  if (text.length <= 32) return text;

  const idx = text.indexOf('ที่');

  if (idx > 4 && idx < 30) return text.slice(0, idx).trim();

  return `${text.slice(0, 30).trim()}…`;

}

function normalizeItem(item) {

  if (typeof item === 'string') {

    return {

      t: shortTitle(item),

      p: item,

      d: [item, 'กลุ่มเป้าหมายนี้มักต้องการแผนที่สมดุลระหว่างเบี้ยประกันและความคุ้มครอง', '• ปรึกษาทีมกล้าดีโบรคเกอร์ฟรีเพื่อรับคำแนะนำเฉพาะราย'],

    };

  }

  const d = item.d

    ? (Array.isArray(item.d) ? item.d : [item.d])

    : [item.p || item.text || ''];

  return {

    t: item.t || item.title || item.label,

    p: item.p || item.text || '',

    d,

  };

}

function renderBullets(lines) {

  const bullets = lines.filter((l) => typeof l === 'string' && l.startsWith('• '));

  if (!bullets.length) return '';

  return `<ul class="planArticleFeat__list">${bullets.map((l) => `<li>${esc(l.slice(2))}</li>`).join('')}</ul>`;

}

function renderParas(lines) {

  return lines

    .filter((l) => typeof l === 'string' && !l.startsWith('• '))

    .map((l) => `<p>${esc(l)}</p>`)

    .join('');

}

function renderFeatures(items) {

  return items

    .map((raw, i) => {

      const item = normalizeItem(raw);

      const icon = FEAT_ICONS[i % FEAT_ICONS.length];

      const extra = renderParas(item.d.slice(1));

      const bullets = renderBullets(item.d);

      return `<article class="planArticleFeat">

\t\t\t<div class="planArticleFeat__icon" aria-hidden="true">${icon}</div>

\t\t\t<div class="planArticleFeat__body">

\t\t\t\t<h3 class="planArticleFeat__title">${esc(item.t)}</h3>

\t\t\t\t<p class="planArticleFeat__text">${esc(item.p)}</p>

\t\t\t\t${extra}${bullets}

\t\t\t</div>

\t\t</article>`;

    })

    .join('\n\t\t');

}

function renderHighlights(items) {

  return items

    .slice(0, 3)

    .map((raw, i) => {

      const item = normalizeItem(raw);

      const icon = FEAT_ICONS[i % FEAT_ICONS.length];

      return `<article class="planArticleHi">
\t\t\t<div class="planArticleHi__icon" aria-hidden="true">${icon}</div>
\t\t\t<div class="planArticleHi__body">
\t\t\t\t<h3 class="planArticleHi__title">${esc(item.t)}</h3>
\t\t\t\t<p class="planArticleHi__text">${esc(item.p)}</p>
\t\t\t</div>
\t\t</article>`;

    })

    .join('\n\t\t');

}

function renderKvRows(items) {

  return items

    .map((raw) => {

      const item = normalizeItem(raw);

      return `<div class="planArticleKv__row">

\t\t\t<dt class="planArticleKv__label">${esc(item.t)}</dt>

\t\t\t<dd class="planArticleKv__value">${esc(item.p)}</dd>

\t\t</div>`;

    })

    .join('\n\t\t');

}

function renderCondAccord(items) {

  return items

    .map((raw) => {

      const item = normalizeItem(raw);

      const body = item.d.length > 1

        ? `<ul>${item.d.slice(1).map((l) => `<li>${esc(l.replace(/^•\s*/, ''))}</li>`).join('')}</ul>`

        : '';

      return `<details class="planArticleAccord__item">

\t\t\t<summary>${esc(item.t)}</summary>

\t\t\t<div class="planArticleAccord__body"><p>${esc(item.p)}</p>${body}</div>

\t\t</details>`;

    })

    .join('\n\t\t');

}

function renderSteps(items) {

  return items

    .map((raw, i) => {

      const item = normalizeItem(raw);

      const extra = renderBullets(item.d) || renderParas(item.d.slice(1));

      return `<article class="planArticleStep">

\t\t\t<span class="planArticleStep__num">${i + 1}</span>

\t\t\t<div class="planArticleStep__body">

\t\t\t\t<h3 class="planArticleStep__title">${esc(item.t)}</h3>

\t\t\t\t<p class="planArticleStep__text">${esc(item.p)}</p>

\t\t\t\t${extra}

\t\t\t</div>

\t\t</article>`;

    })

    .join('\n\t\t');

}

function renderFaqItems(items) {

  return items

    .map((f) => `<article class="planArticleFaq__item">

\t\t\t<div class="planArticleFaq__icon" aria-hidden="true">${FAQ_ICON}</div>

\t\t\t<div class="planArticleFaq__body">

\t\t\t\t<h3 class="planArticleFaq__q">Q: ${esc(f.q)}</h3>

\t\t\t\t<p class="planArticleFaq__a">A: ${esc(f.a)}</p>

\t\t\t</div>

\t\t</article>`)

    .join('\n\t\t');

}

function renderPromoCards(items) {

  const promos = items || DEFAULT_PROMO;

  return promos

    .map((raw) => {

      const item = normalizeItem(raw);

      return `<article class="planArticlePromo">

\t\t\t<h3 class="planArticlePromo__title">${esc(item.t)}</h3>

\t\t\t<p class="planArticlePromo__text">${esc(item.p)}</p>

\t\t</article>`;

    })

    .join('\n\t\t');

}

function renderCompareTable(cov) {

  const head = cov.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join('');

  const rows = cov.rows

    .map((row) => {

      const cells = row

        .map((cell, i) => {

          const cls = i === 0 ? 'planArticleTable__feat' : (cell === '✓' ? 'planArticleTable__yes' : (cell === '—' || cell === '-' ? 'planArticleTable__no' : ''));

          return `<td${cls ? ` class="${cls}"` : ''}>${esc(cell)}</td>`;

        })

        .join('');

      return `<tr>${cells}</tr>`;

    })

    .join('\n\t\t\t\t');

  return `<div class="planArticleTableWrap">

\t\t\t<table class="planArticleTable">

\t\t\t\t<thead><tr>${head}</tr></thead>

\t\t\t\t<tbody>${rows}</tbody>

\t\t\t</table>

\t\t</div>`;

}

function tableRowsToFeatures(cov) {

  return cov.rows.map((row) => {

    const feat = row[0];

    const vals = row.slice(1).filter((v) => v && v !== '—' && v !== '-');

    const summary = vals.length

      ? `${cov.headers.slice(1).filter((_, i) => row[i + 1] && row[i + 1] !== '—').join(', ')}: ${vals.join(' / ')}`

      : 'ดูรายละเอียดในตารางเปรียบเทียบด้านล่าง';

    return { t: feat, p: summary };

  });

}

function sectionBlock(id, title, sub, inner) {

  const subHtml = sub ? `<p class="planArticleSec__sub">${esc(sub)}</p>` : '';

  return {

    id,

    title,

    html: `<section class="planArticleSec" id="${id}">

\t\t<h2 class="planArticleSec__title">${esc(title)}</h2>

\t\t${subHtml}

\t\t${inner}

\t</section>`,

  };

}

function wrapPlanArticle(blocks) {

  if (!blocks.length) return '';

  const navItems = blocks

    .map((b, i) => `<a href="#${b.id}" class="planArticleNav__link${i === 0 ? ' is-active' : ''}"><span class="planArticleNav__text">${esc(b.title)}</span></a>`)

    .join('\n\t\t\t');

  const body = blocks.map((b) => b.html).join('\n\n\t\t');

  const firstTitle = blocks[0].title;

  return `<div class="planArticle" data-plan-article>

\t<button type="button" class="planArticleMobNav" aria-expanded="false" aria-controls="planArticleMobPanel">

\t\t<svg viewBox="0 0 14 20" width="14" height="20" aria-hidden="true"><path d="M12.645 11.645a1.5 1.5 0 0 1 0 2.12L7 19.415 1.355 13.77a1.5 1.5 0 0 1 0-2.12l.355-.355L7 16.585l5.295-5.295.35.355zm-10.94-2.94L7 3.415l5.295 5.295.355-.355a1.5 1.5 0 0 0 0-2.12L7 .585 1.355 6.23a1.5 1.5 0 0 0 0 2.12l.35.355z" fill="currentColor"/></svg>

\t\t<span class="planArticleMobNav__label">${esc(firstTitle)}</span>

\t</button>

\t<div class="planArticleMobNav__backdrop" hidden></div>

\t<div class="planArticleMobNav__panel" id="planArticleMobPanel" hidden>

\t\t<div class="planArticleMobNav__head">

\t\t\t<p>เลือกหัวข้อ</p>

\t\t\t<button type="button" class="planArticleMobNav__close" aria-label="ปิด">×</button>

\t\t</div>

\t\t<nav class="planArticleNav planArticleNav--mobile" aria-label="สารบัญเนื้อหา (มือถือ)">${navItems}</nav>

\t</div>

\t<aside class="planArticle__aside">

\t\t<nav class="planArticleNav planArticleNav--desktop" aria-label="สารบัญเนื้อหา">${navItems}</nav>

\t</aside>

\t<div class="planArticle__body">

\t\t${body}

\t</div>

</div>`;

}

function collectSections(sections) {

  const map = {};

  sections.forEach((s) => {

    map[s.type] = s;

  });

  return map;

}

/** Build article from sub-page section configs (build-menu-pages.js) */

function buildArticleFromSections(sections, defaultSteps, planTitle) {

  const map = collectSections(sections);

  const blocks = [];

  const name = planTitle || 'แผนประกันนี้';

  const coverageItems = map.coverage ? map.coverage.items : [];

  const highlightItems = map.highlights

    ? map.highlights.items

    : coverageItems.slice(0, 3);

  if (highlightItems.length) {

    blocks.push(sectionBlock(

      sectionId('จุดเด่น'),

      map.highlights ? map.highlights.title : `จุดเด่นของ${name}`,

      null,

      `<div class="planArticleHis">${renderHighlights(highlightItems)}</div>`

    ));

  }

  if (coverageItems.length) {

    blocks.push(sectionBlock(

      sectionId('ตารางผลประโยชน์'),

      'ตารางผลประโยชน์และความคุ้มครอง',

      'สรุปภาพรวมเพื่อเปรียบเทียบเบื้องต้น รายละเอียดจริงขึ้นกับบริษัทและแผนที่เลือก',

      `<div class="planArticleFeats">${renderFeatures(coverageItems)}</div>`

    ));

  }

  if (map.compare && map.compare.table) {

    blocks.push(sectionBlock(

      sectionId('เปรียบเทียบ'),

      map.compare.title || 'เปรียบเทียบแผนความคุ้มครอง',

      null,

      renderCompareTable(map.compare.table)

    ));

  }

  blocks.push(sectionBlock(

    sectionId('โปรโมชัน'),

    'โปรโมชัน',

    null,

    `<div class="planArticlePromos">${renderPromoCards(map.promo ? map.promo.items : null)}</div>`

  ));

  const condItems = map.conds ? map.conds.items : [];

  const steps = (map.steps && map.steps.items) || defaultSteps;

  if (condItems.length || steps.length) {

    const policyInner = [

      condItems.length ? `<dl class="planArticleKv">${renderKvRows(condItems)}</dl>` : '',

      condItems.length ? `<div class="planArticleAccord">${renderCondAccord(condItems)}</div>` : '',

      steps.length ? `<div class="planArticleSteps planArticleSteps--policy"><h3 class="planArticleSteps__head">ขั้นตอนทำประกันกับเรา</h3>${renderSteps(steps)}</div>` : '',

    ].filter(Boolean).join('\n\t\t');

    blocks.push(sectionBlock(

      sectionId('เงื่อนไขกรมธรรม์'),

      'รายละเอียดและเงื่อนไขกรมธรรม์',

      null,

      policyInner

    ));

  }

  if (map.list && map.list.items.length) {

    blocks.push(sectionBlock(

      sectionId('เหมาะกับใคร'),

      `${name} เหมาะกับใคร?`,

      null,

      `<div class="planArticleFeats">${renderFeatures(map.list.items)}</div>`

    ));

  }

  blocks.push(sectionBlock(

    sectionId('ทำไมต้องมี'),

    map.why ? map.why.title : 'ทำไมต้องมีแผนประกันที่เหมาะสม?',

    null,

    `<div class="planArticleFeats">${renderFeatures(

      map.why ? map.why.items : [

        { t: 'ลดความเสี่ยงทางการเงิน', p: 'ช่วยกระจายภาระค่าใช้จ่ายเมื่อเกิดเหตุไม่คาดฝัน แทนการจ่ายก้อนใหญ่จากกระเป๋าเอง' },

        { t: 'วางแผนได้อย่างมั่นใจ', p: 'เลือกความคุ้มครองให้สอดคล้องกับชีวิต ครอบครัว และงบประมาณของคุณ' },

        { t: 'ได้คำแนะนำจากมืออาชีพ', p: 'ทีมกล้าดีโบรคเกอร์ช่วยเปรียบเทียบแผนจากหลายบริษัทโดยไม่มีค่าใช้จ่าย' },

      ]

    )}</div>`

  ));

  if (map.faq && map.faq.items.length) {

    blocks.push(sectionBlock(

      sectionId('FAQ'),

      map.faq.title && map.faq.title !== 'คำถามที่พบบ่อย' ? map.faq.title : 'คำถามที่พบบ่อย (FAQ)',

      null,

      `<div class="planArticleFaq">${renderFaqItems(map.faq.items)}</div>`

    ));

  }

  return wrapPlanArticle(blocks);

}

/** Build article for main category pages (build-plans.js) */

function buildCategoryArticle(details, steps, benefitsHtml, planTitle) {

  const blocks = [];

  const name = planTitle || 'แผนประกันนี้';

  const cov = details.coverage;

  let highlightItems = details.highlights || [];

  if (!highlightItems.length && cov) {

    if (cov.type === 'list') {

      highlightItems = cov.items.slice(0, 3).map((i) => ({ t: i.title, p: i.text }));

    } else if (cov.rows) {

      highlightItems = cov.rows.slice(0, 3).map((row) => ({ t: row[0], p: row.slice(1).join(' · ') }));

    }

  }

  if (!highlightItems.length && details.audience) {

    highlightItems = details.audience.slice(0, 3).map((a) => normalizeItem(a));

  }

  if (highlightItems.length) {

    blocks.push(sectionBlock(

      sectionId('จุดเด่น'),

      `จุดเด่นของ${name}`,

      null,

      `<div class="planArticleHis">${renderHighlights(highlightItems)}</div>`

    ));

  }

  if (cov) {

    const benefitInner = cov.type === 'list'

      ? `<div class="planArticleFeats">${renderFeatures(cov.items.map((i) => ({ t: i.title, p: i.text, d: i.d })))}</div>`

      : `<div class="planArticleFeats">${renderFeatures(tableRowsToFeatures(cov))}</div>`;

    blocks.push(sectionBlock(

      sectionId('ตารางผลประโยชน์'),

      'ตารางผลประโยชน์และความคุ้มครอง',

      'สรุปภาพรวมเพื่อเปรียบเทียบเบื้องต้น รายละเอียดจริงขึ้นกับบริษัทและแผนที่เลือก',

      benefitInner

    ));

    if (cov.type !== 'list' && cov.headers && cov.rows) {

      blocks.push(sectionBlock(

        sectionId('เปรียบเทียบ'),

        'เปรียบเทียบแผนความคุ้มครอง',

        null,

        renderCompareTable(cov)

      ));

    }

  }

  blocks.push(sectionBlock(

    sectionId('โปรโมชัน'),

    'โปรโมชัน',

    null,

    `<div class="planArticlePromos">${renderPromoCards(details.promo)}</div>`

  ));

  if ((details.conditions && details.conditions.length) || (steps && steps.length)) {

    const items = (details.conditions || []).map((c) => ({ t: c.label, p: c.text, d: c.d }));

    const stepItems = (steps || []).map((s) => ({ t: s.title, p: s.text, d: s.d }));

    const policyInner = [

      items.length ? `<dl class="planArticleKv">${renderKvRows(items)}</dl>` : '',

      items.length ? `<div class="planArticleAccord">${renderCondAccord(items)}</div>` : '',

      stepItems.length ? `<div class="planArticleSteps planArticleSteps--policy"><h3 class="planArticleSteps__head">ขั้นตอนทำประกันกับเรา</h3>${renderSteps(stepItems)}</div>` : '',

    ].filter(Boolean).join('\n\t\t');

    blocks.push(sectionBlock(

      sectionId('เงื่อนไขกรมธรรม์'),

      'รายละเอียดและเงื่อนไขกรมธรรม์',

      null,

      policyInner

    ));

  }

  if (details.audience && details.audience.length) {

    blocks.push(sectionBlock(

      sectionId('เหมาะกับใคร'),

      `${name} เหมาะกับใคร?`,

      null,

      `<div class="planArticleFeats">${renderFeatures(details.audience)}</div>`

    ));

  }

  if (benefitsHtml) {

    blocks.push(sectionBlock(

      sectionId('ทำไมต้องเลือก'),

      'ทำไมต้องเลือกผ่านกล้าดีโบรคเกอร์',

      null,

      benefitsHtml

    ));

  }

  if (details.faq && details.faq.length) {

    blocks.push(sectionBlock(

      sectionId('FAQ'),

      'คำถามที่พบบ่อย (FAQ)',

      null,

      `<div class="planArticleFaq">${renderFaqItems(details.faq)}</div>`

    ));

  }

  return wrapPlanArticle(blocks);

}

module.exports = {

  esc,

  buildArticleFromSections,

  buildCategoryArticle,

  renderFeatures,

  renderFaqItems,

  wrapPlanArticle,

  sectionBlock,

};

