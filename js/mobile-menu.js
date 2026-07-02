/**
 * Mobile drawer menu — full-screen white panel
 * Requires jQuery.
 */
(function (window, $) {
  'use strict';

  if (!$) return;

  var CACHE = '20260630u';
  var menuBound = false;
  var MQ = window.matchMedia('(max-width: 768px)');

  function getAssetBase() {
    if (document.body.hasAttribute('data-base')) {
      return document.body.getAttribute('data-base');
    }
    if (/\/plans\//i.test(window.location.pathname)) return '../';
    return '';
  }

  function getMenuUrl() {
    return getAssetBase() + 'totalmenu/totalmenu2.html?v=' + CACHE;
  }

  function isMobileDrawer() {
    return MQ.matches;
  }

  function ensureCloseButton() {
    var $slot = $('#kbDrawerSlot');
    var $close = $('#total_m_lay .btnMenuClose');
    if (!$close.length) {
      $close = $(
        '<button type="button" class="btnMenuClose" aria-label="ปิดเมนู"><span aria-hidden="true"></span></button>'
      );
    }
    if ($slot.length) {
      if (!$close.parent().is($slot)) {
        $slot.append($close);
      }
      return;
    }
    if (!$('#total_m_lay > .btnMenuClose').length) {
      $('#total_m_lay').prepend($close);
    }
  }

  function openMenu() {
    ensureCloseButton();
    $('body').addClass('kbMenuOpen');
    $('#total_m_lay').addClass('mOpen');
    $('#wrapper').addClass('wra_box');
    var mascot = document.getElementById('floatMascot');
    if (mascot) {
      mascot.classList.remove('is-open', 'is-bubble-hidden');
      var mascotBtn = document.getElementById('floatMascotBtn');
      var mascotPanel = document.getElementById('floatMascotPanel');
      if (mascotBtn) mascotBtn.setAttribute('aria-expanded', 'false');
      if (mascotPanel) mascotPanel.setAttribute('aria-hidden', 'true');
    }
  }

  function closeMenu() {
    $('.btnMenuClose').remove();
    $('body').removeClass('kbMenuOpen');
    $('#total_m_lay').removeClass('mOpen');
    $('#wrapper').removeClass('wra_box');
    $('.fix_bg').hide();
    $('.btnMenu').focus();
  }

  function bindMenuToggle() {
    if (menuBound) return;
    menuBound = true;

    $(document)
      .off('click.kbMenu', '.btnMenu')
      .on('click.kbMenu', '.btnMenu', function (e) {
        e.preventDefault();
        openMenu();
        return false;
      });

    $(document)
      .off('click.kbMenu', '.btnMenuClose')
      .on('click.kbMenu', '.btnMenuClose', function (e) {
        e.preventDefault();
        closeMenu();
        return false;
      });
  }

  function bindMenuAccordion() {
    $('#total_m_lay .kbMobNav__item.has-sub > .kbMobNav__link')
      .off('click.kbMenu')
      .on('click.kbMenu', function (e) {
        if (!isMobileDrawer()) return;
        e.preventDefault();
        var $li = $(this).closest('.kbMobNav__item');
        var $sub = $li.children('.kbMobNav__sub, ul').first();
        var isOpen = $li.hasClass('is-open');

        $li.siblings('.kbMobNav__item').removeClass('is-open').children('.kbMobNav__sub, ul').slideUp(180);

        if (isOpen) {
          $li.removeClass('is-open');
          $sub.slideUp(180);
        } else {
          $li.addClass('is-open');
          $sub.slideDown(180);
        }
        return false;
      });

    /* Legacy menu fallback (tablet) */
    $('.total_m > ul > li > button')
      .off('click.kbMenu')
      .on('click.kbMenu', function () {
        if (isMobileDrawer()) return false;
        $('.total_m').addClass('on');
        $('.total_m > ul > li').removeClass('selected');
        $(this).parent('li').addClass('selected');
        $('.total_m > ul > li > ul').hide();
        $(this).parent('li').children('ul').show();
        return false;
      });
  }

  function prefixMenuLinks() {
    var base = getAssetBase();
    if (!base) return;
    $('#total_m_lay a[href]').each(function () {
      var href = $(this).attr('href');
      if (
        href &&
        href.indexOf('../') !== 0 &&
        href.charAt(0) !== '/' &&
        !/^(https?:|mailto:|tel:|#|javascript:)/i.test(href)
      ) {
        $(this).attr('href', base + href);
      }
    });
  }

  function cleanupDrawerDuplicates() {
    $('#total_m_lay > .topSns').remove();
  }

  function applyMenuState() {
    cleanupDrawerDuplicates();
    $('#total_m_lay .kbMobNav__sub, #total_m_lay .kbMobNav__item > ul').hide();
    $('#total_m_lay .kbMobNav__item').removeClass('is-open selected');
    bindMenuAccordion();
  }

  function ensureFooter($lay) {
    var $footer = $lay.find('#kbDrawerFooter');
    if (!$footer.length) {
      $footer = $('<div id="kbDrawerFooter" class="kbDrawerFooter"></div>');
      $lay.append($footer);
    }
    return $footer;
  }

  function layoutDrawer() {
    var header = document.getElementById('header');
    var totalLay = document.getElementById('total_m_lay');
    var drawerSlot = document.getElementById('kbDrawerSlot');
    if (!header || !totalLay || !drawerSlot) return;

    var search = header.querySelector('.kbHeader__top .topSearch');
    var tools = header.querySelector('.kbHeader__topTools');
    var slotSearch = header.querySelector('[data-kb-slot="search"]');
    var slotTools = header.querySelector('[data-kb-slot="tools"]');
    if (!search || !tools || !slotSearch || !slotTools) return;

    var contact = tools.querySelector('.kbHeader__contact');
    var sns = tools.querySelector('.kbHeader__sns--top');
    var portal = tools.querySelector('.kbHeader__portal--mobile');

    if (isMobileDrawer()) {
      ensureCloseButton();
      var closeBtn = drawerSlot.querySelector('.btnMenuClose');
      if (search.parentNode !== drawerSlot) {
        drawerSlot.insertBefore(search, closeBtn || null);
      }

      var footer = ensureFooter($('#total_m_lay'))[0];

      if (portal) {
        if (portal.parentNode !== footer) {
          footer.insertBefore(portal, footer.firstChild);
        }
      }

      var contactWrap = footer.querySelector('.kbDrawerFooter__contact');
      if (!contactWrap) {
        contactWrap = document.createElement('div');
        contactWrap.className = 'kbDrawerFooter__contact';
        var label = document.createElement('p');
        label.className = 'kbDrawerFooter__label';
        label.textContent = 'ติดต่อเรา';
        contactWrap.appendChild(label);
        footer.appendChild(contactWrap);
      }

      if (contact && contact.parentNode !== contactWrap) {
        contactWrap.appendChild(contact);
      }
      if (sns && sns.parentNode !== contactWrap) {
        contactWrap.appendChild(sns);
      }

      return;
    }

    if (search.parentNode !== slotSearch.parentNode || search.nextElementSibling !== slotTools) {
      slotSearch.parentNode.insertBefore(search, slotTools);
    }
    if (tools.parentNode !== slotSearch.parentNode || tools.nextElementSibling !== slotTools) {
      slotSearch.parentNode.insertBefore(tools, slotTools);
    }
    if (contact && contact.parentNode !== tools) {
      tools.insertBefore(contact, tools.firstChild);
    }
    if (sns && portal) {
      if (sns.parentNode !== tools) {
        tools.insertBefore(sns, portal);
      }
    } else if (sns && sns.parentNode !== tools) {
      tools.appendChild(sns);
    }
    if (portal && portal.parentNode !== tools) {
      tools.appendChild(portal);
    }

    $('#kbDrawerFooter').remove();
  }

  function notifyReady() {
    layoutDrawer();
    document.dispatchEvent(new CustomEvent('kbMobileMenuReady'));
  }

  function loadMenu() {
    var $lay = $('#total_m_lay');
    if (!$lay.length) {
      notifyReady();
      return;
    }

    var $drawer = $('#kbDrawerSlot').detach();
    var $footer = $('#kbDrawerFooter').detach();

    $.ajax({
      type: 'GET',
      url: getMenuUrl(),
      dataType: 'html',
      success: function (data) {
        $lay.empty().append(data);
        if ($drawer.length) {
          $lay.prepend($drawer);
        }
        if ($footer.length) {
          $lay.append($footer);
        }
        prefixMenuLinks();
        applyMenuState();
        notifyReady();
      },
      error: function () {
        if ($drawer.length) {
          $lay.prepend($drawer);
        }
        if ($footer.length) {
          $lay.append($footer);
        }
        if (!$lay.find('.total_m').length) {
          $lay.append(
            '<div class="total_m main kbMobNav"><ul class="allmenu kbMobNav__list"><li><a href="index.html">หน้าแรก</a></li></ul></div>'
          );
        }
        applyMenuState();
        notifyReady();
      },
    });
  }

  function init() {
    bindMenuToggle();
    loadMenu();
    MQ.addEventListener('change', layoutDrawer);
  }

  window.KladeeMobileMenu = {
    init: init,
    open: openMenu,
    close: closeMenu,
    layoutDrawer: layoutDrawer,
  };

  $(function () {
    if ($('#header .btnMenu').length && !document.getElementById('site-header-slot')) {
      init();
    }
  });
})(window, window.jQuery);
