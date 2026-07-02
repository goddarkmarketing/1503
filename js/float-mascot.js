/**
 * Floating mascot contact widget — bottom-right on all pages.
 */
(function (window, document) {
  'use strict';

  var CACHE = '20260630t';

  function iconChat() {
    return '<svg class="floatMascot__btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';
  }
  var ROOT_ID = 'floatMascot';

  function getBase() {
    if (document.body && document.body.hasAttribute('data-base')) {
      return document.body.getAttribute('data-base');
    }
    if (/\/plans\//i.test(window.location.pathname)) return '../';
    return '';
  }

  function asset(path) {
    return getBase() + path;
  }

  function ensureStyles(base) {
    if (document.getElementById('float-mascot-css')) return;
    var link = document.createElement('link');
    link.id = 'float-mascot-css';
    link.rel = 'stylesheet';
    link.href = base + 'css/float-mascot.css?v=' + CACHE;
    document.head.appendChild(link);
  }

  function iconPhone() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  }

  function iconLine() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';
  }

  function iconMail() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
  }

  function iconForm() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>';
  }

  function buildWidget() {
    var b = getBase();
    var wrap = document.createElement('div');
    wrap.id = ROOT_ID;
    wrap.className = 'floatMascot';
    wrap.innerHTML =
      '<div class="floatMascot__panel" id="floatMascotPanel" role="dialog" aria-label="ช่องทางติดต่อ" aria-hidden="true">' +
      '<p class="floatMascot__panelTitle">ติดต่อเรา</p>' +
      '<a class="floatMascot__action" href="tel:0826164555">' +
      iconPhone() +
      '<span>โทร 082-616-4555</span></a>' +
      '<a class="floatMascot__action floatMascot__action--line" href="https://line.me/R/ti/p/@kladeebroker" target="_blank" rel="noopener noreferrer">' +
      iconLine() +
      '<span>LINE @kladeebroker</span></a>' +
      '<a class="floatMascot__action" href="mailto:kladee.broker@gmail.com">' +
      iconMail() +
      '<span>kladee.broker@gmail.com</span></a>' +
      '<a class="floatMascot__action" href="' +
      asset('contact.html') +
      '">' +
      iconForm() +
      '<span>แบบฟอร์มติดต่อ</span></a>' +
      '</div>' +
      '<div class="floatMascot__bubble" id="floatMascotBubble" role="status">สวัสดีครับ มีอะไรให้เราช่วยเหลือไหมครับ?</div>' +
      '<button type="button" class="floatMascot__btn" id="floatMascotBtn" aria-label="เปิดช่องทางติดต่อ" aria-expanded="false" aria-controls="floatMascotPanel">' +
      iconChat() +
      '<span class="floatMascot__btnLabel">ติดต่อเรา</span>' +
      '</button>';
    return wrap;
  }

  function init() {
    if (document.getElementById(ROOT_ID)) return;

    var base = getBase();
    ensureStyles(base);

    var root = buildWidget();
    document.body.appendChild(root);

    var btn = document.getElementById('floatMascotBtn');
    var panel = document.getElementById('floatMascotPanel');
    var bubble = document.getElementById('floatMascotBubble');

    function setOpen(open) {
      root.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) {
        root.classList.add('is-bubble-hidden');
      } else {
        root.classList.remove('is-bubble-hidden');
      }
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!root.classList.contains('is-open'));
    });

    document.addEventListener('click', function (e) {
      if (!root.classList.contains('is-open')) return;
      if (!root.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('is-open')) {
        setOpen(false);
        btn.focus();
      }
    });

    /* Hide bubble after 12s if panel still closed */
    var bubbleTimer = window.setTimeout(function () {
      if (!root.classList.contains('is-open')) {
        root.classList.add('is-bubble-hidden');
      }
    }, 12000);

    btn.addEventListener('click', function () {
      window.clearTimeout(bubbleTimer);
    }, { once: true });
  }

  window.KladeeFloatMascot = { init: init, getBase: getBase };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
