/**
 * Shared site header/footer loader for subpages.
 * Requires jQuery (3804.js) and easing (3805.js) loaded first.
 */
(function (window, $) {
  'use strict';

  if (!$) return;

  var CACHE = '20260630t';

  function getAssetBase() {
    if (document.body.hasAttribute('data-base')) {
      return document.body.getAttribute('data-base');
    }
    if (/\/plans\//i.test(window.location.pathname)) return '../';
    return '';
  }

  function prefixRelativeUrls(html, base) {
    if (!base) return html;
    return html.replace(
      /\b(href|src)=["'](?!https?:|\/\/|mailto:|tel:|#|data:|javascript:)([^"']*)["']/gi,
      function (match, attr, url) {
        if (!url || url.indexOf('../') === 0 || url.charAt(0) === '/') return match;
        var fixed = url.indexOf('plans/') === 0 ? url.slice(6) : base + url;
        return attr + '="' + fixed + '"';
      }
    );
  }

  function getPlanSlug() {
    var match = window.location.pathname.match(/\/plans\/([^/.]+)\.html/i);
    return match ? match[1] : '';
  }

  function applyActivePage(page) {
    var slug = getPlanSlug();
    var carSlugs = {
      car: 1, compulsory: 1, 'car-compare': 1, 'car-class1': 1,
      'car-class2plus': 1, 'car-class23': 1
    };
    var lifeSlugs = {
      life: 1, pension: 1, 'life-whole': 1, 'life-savings': 1, 'life-term': 1,
      health: 1, 'health-ipd': 1, 'health-opd': 1, critical: 1, education: 1,
      pa: 1, home: 1, travel: 1, business: 1, cargo: 1, group: 1
    };

    if (page === 'plan' || slug) {
      if (carSlugs[slug]) {
        $('#menu_1 > a').addClass('action');
      } else if (slug) {
        if (lifeSlugs[slug]) {
          $('#menu_2 > a').addClass('action');
        }
      }
    } else if (page === 'news') {
      $('#menu_5').addClass('on');
    } else if (page === 'contact') {
      $('#menu_7 > a').addClass('action');
    } else if (page === 'claims') {
      $('#menu_8 > a').addClass('action');
    } else if (page === 'join' || page === 'experts') {
      $('#menu_7 > a').addClass('action');
    } else if (page === 'about' || /^about-/.test(page) || page === 'experts') {
      $('#menu_6 > a').addClass('action');
    } else if (page === 'home') {
      $('#menu_2 > a').attr('href', '#plans');
    }
  }

  function initChromeScripts() {
    if (typeof window.initGnbHover === 'function') {
      window.initGnbHover();
    } else if (typeof window.overGNB === 'function' && typeof window.closeGnb === 'function') {
      $('[id^=menu_]:not(.kbHeader__navItem--plain)').off('mouseenter.gnb mouseleave.gnb').on('mouseenter.gnb', window.overGNB).on('mouseleave.gnb', window.closeGnb);
      $('#gnbArea, .gnb_Bg').off('mouseenter.gnb mouseleave.gnb').on('mouseenter.gnb', window.nofunction).on('mouseleave.gnb', window.closeGnb);
    }
    $('[id^=menu_] > a')
      .off('keyup.chrome')
      .on('keyup.chrome', function () {
        var mid = $(this).parent().attr('id');
        $('#' + mid).mouseover();
      });
    if (!$('.shadow_device').length) {
      $('#header').after('<div class="shadow_device"></div>');
    }
    $('.shadow_device').off('click.gnb').on('click.gnb', window.closeGnb);

    $('.btn_fam')
      .off('click.chrome')
      .on('click.chrome', function () {
        $('.famSite_pop').attr('tabindex', '0').fadeIn('fast').focus();
      });
    $('.famSite_pop .btnClose')
      .off('click.chrome')
      .on('click.chrome', function () {
        $('.famSite_pop').fadeOut('fast');
      });
  }

  function ensureMobileMenu() {
    return new Promise(function (resolve) {
      if (window.KladeeMobileMenu) {
        resolve();
        return;
      }
      var base = getAssetBase();
      var script = document.createElement('script');
      script.src = base + 'js/mobile-menu.js?v=' + CACHE;
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  function initMobileMenu() {
    ensureMobileMenu().then(function () {
      if (window.KladeeMobileMenu) {
        window.KladeeMobileMenu.init();
      }
    });
  }

  function loadFloatMascot(base) {
    if (window.KladeeFloatMascot) {
      window.KladeeFloatMascot.init();
      return;
    }
    if (document.getElementById('float-mascot-js')) return;
    var script = document.createElement('script');
    script.id = 'float-mascot-js';
    script.src = base + 'js/float-mascot.js?v=' + CACHE;
    script.onload = function () {
      if (window.KladeeFloatMascot) window.KladeeFloatMascot.init();
    };
    document.body.appendChild(script);
  }

  function loadChrome() {
    var page = document.body.getAttribute('data-page') || '';
    var base = getAssetBase();
    var headerSlot = document.getElementById('site-header-slot');
    var footerSlot = document.getElementById('site-footer-slot');
    if (!headerSlot || !footerSlot) return Promise.resolve();

    return Promise.all([
      fetch(base + 'partials/site-header.html?v=' + CACHE).then(function (r) {
        if (!r.ok) throw new Error('header');
        return r.text();
      }),
      fetch(base + 'partials/site-footer.html?v=' + CACHE).then(function (r) {
        if (!r.ok) throw new Error('footer');
        return r.text();
      }),
    ])
      .then(function (parts) {
        headerSlot.outerHTML = prefixRelativeUrls(parts[0], base);
        footerSlot.outerHTML = prefixRelativeUrls(parts[1], base);
        applyActivePage(page);
        initChromeScripts();
        initMobileMenu();
        document.body.classList.remove('chrome-pending');
        document.dispatchEvent(new CustomEvent('siteChromeReady'));
        loadFloatMascot(base);
      })
      .catch(function () {
        document.body.classList.remove('chrome-pending');
      });
  }

  window.KladeeSiteChrome = { load: loadChrome, getAssetBase: getAssetBase };

  $(function () {
    loadChrome();
    /* Safety: never leave subpages invisible if fetch hangs */
    window.setTimeout(function () {
      document.body.classList.remove('chrome-pending');
    }, 5000);
  });
})(window, window.jQuery);
