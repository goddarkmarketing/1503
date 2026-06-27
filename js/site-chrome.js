/**
 * Shared site header/footer loader for subpages.
 * Requires jQuery (3804.js) and easing (3805.js) loaded first.
 */
(function (window, $) {
  'use strict';

  if (!$) return;

  var CACHE = '20260628q';

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

  function applyActivePage(page) {
    if (page === 'news') {
      $('#menu_5').addClass('on');
    } else if (page === 'contact') {
      $('#menu_6').addClass('on');
    } else if (page === 'about') {
      $('#menu_1 > a').addClass('action');
    } else if (page === 'plan') {
      $('#menu_2 > a').addClass('action');
    } else if (page === 'home') {
      $('.topFamSite ul li').first().addClass('on');
    }
  }

  function initChromeScripts() {
    if (typeof window.overGNB === 'function' && typeof window.closeGnb === 'function') {
      $('[id^=menu_]').off('mouseenter.gnb mouseleave.gnb').on('mouseenter.gnb', window.overGNB).on('mouseleave.gnb', window.nofunction);
      $('#gnbArea, .gnb_Bg').off('mouseenter.gnb mouseleave.gnb').on('mouseenter.gnb', window.nofunction).on('mouseleave.gnb', window.closeGnb);
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
    }

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

  function initMobileMenu() {
    $.ajax({
      type: 'post',
      url: '/totalmenu/totalmenu2.html',
      dataType: 'html',
      success: function (data) {
        $('#total_m_lay').empty().append(data);

        var page = '0_0_0_0'.split('_');
        var depth1 = page[0] - 1;
        var depth2 = page[1] - 1;
        var depth3 = page[2] - 1;
        var depth4 = page[3] - 1;

        $('.total_m > ul > li.on').addClass('selected');
        $('.total_m > ul > li.selected > ul').show();
        $('.total_m > ul > li.has-sub.on').addClass('selected');
        $('.total_m > ul > li.has-sub.selected > ul').show();

        $('.total_m > ul > li > button').on('click', function () {
          $('.total_m').addClass('on');
          $('.total_m > ul > li').removeClass('selected');
          $(this).parent('li').addClass('selected');
          $('.total_m > ul > li > ul').hide();
          $(this).parent('li').children('ul').show();
          return false;
        });

        $('.total_m li.has-sub > button').on('click', function () {
          var element = $(this).parent('li');
          var element1 = $(this);
          element.siblings('li.has-sub').children('a').attr('title', 'กางเมนู');
          if (element.hasClass('selected')) {
            element.removeClass('selected');
            element1.attr('title', 'กางเมนู');
            element.find('li').removeClass('selected');
            element.find('ul').slideUp('fast');
          } else {
            element.addClass('selected');
            element1.attr('title', 'พับเมนู');
            element.children('ul').slideDown('fast');
            element.siblings('li').children('ul').slideUp('fast');
            element.siblings('li').removeClass('selected');
            element.siblings('li').find('li').removeClass('selected');
            element.siblings('li').find('ul').slideUp('fast');
          }
          return false;
        });

        $('.btnMenu').off('click.chrome').on('click.chrome', function () {
          $('.fix_bg').show();
          $('#total_m_lay').addClass('mOpen');
          $('#wrapper').addClass('wra_box');
          $('.total_m').after('<button type="button" class="btnMenuClose">ปิด</button>').show();
          if ($('.total_m > ul > li').hasClass('selected')) {
            $('.total_m').addClass('on');
          } else {
            $('.total_m').removeClass('on');
          }

          $('.fix_bg, .btnMenuClose').off('click.chrome touchstart.chrome').on('click.chrome touchstart.chrome', function () {
            $('.btnMenuClose').remove();
            $('#total_m_lay').removeClass('mOpen');
            $('#wrapper').removeClass('wra_box');
            $('.fix_bg').hide();
            $('.btnMenu').focus();
            return false;
          });
          return false;
        });

        var mGnbD1 = $('.total_m > ul > li:eq(' + depth1 + ')');
        var mGnbD2 = $('.total_m > ul > li:eq(' + depth1 + ') > ul > li:eq(' + depth2 + ')');
        var mGnbD3 = $('.total_m > ul > li:eq(' + depth1 + ') > ul > li:eq(' + depth2 + ') > ul > li:eq(' + depth3 + ')');
        var mGnbD4 = $('.total_m > ul > li:eq(' + depth1 + ') > ul > li:eq(' + depth2 + ') > ul > li:eq(' + depth3 + ') > ul > li:eq(' + depth4 + ')');

        if (page[1] != 0) {
          mGnbD1.addClass('selected');
          mGnbD2.addClass('selected');
          mGnbD3.addClass('selected');
          mGnbD4.addClass('on');
        }

        $('.total_m > ul > li.selected > ul').css('display', 'block');
        $('.total_m > ul > li > ul > li.selected > ul').css('display', 'block');
        $('.total_m > ul > li > ul > li > ul > li.selected > ul').css('display', 'block');
      },
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
