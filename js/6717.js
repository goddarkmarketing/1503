/* 포탈pc메뉴 */
var gnbCloseTimer = null;
var GNB_CLOSE_DELAY = 350;

function cancelGnbClose() {
	if (gnbCloseTimer) {
		clearTimeout(gnbCloseTimer);
		gnbCloseTimer = null;
	}
}

function scheduleGnbClose() {
	cancelGnbClose();
	gnbCloseTimer = setTimeout(closeGnb, GNB_CLOSE_DELAY);
}

function isGnbHoverNode(node) {
	if (!node || node === document) return false;
	return $(node).closest(
		'#gnbArea, .gnb_Bg, .gnbsingle--mega, [id^=menu_]:not(.kbHeader__navItem--plain)'
	).length > 0;
}

function onGnbZoneLeave(e) {
	if (isGnbHoverNode(e.relatedTarget)) return;
	scheduleGnbClose();
}

function positionKbMega($li) {
	var $mega = $li.children('.gnbsingle--mega');
	if (!$mega.length) return;
	var $area = $mega.closest('.kbHeader__navWrap');
	if (!$area.length) $area = $('#gnbArea');
	var $link = $li.children('a').first();
	if (!$area.length || !$link.length) return;
	var areaLeft = $area.offset().left;
	var areaWidth = $area.outerWidth();
	var arrowLeft = $link.offset().left + ($link.outerWidth() / 2) - areaLeft;
	$mega.css('--mega-arrow-left', arrowLeft + 'px');
	var $panel = $mega.children('.kbMega').first();
	if ($mega.hasClass('gnbsingle--megaCompact') && $panel.length) {
		var panelW = $panel.outerWidth() || 360;
		var panelLeft = Math.max(12, Math.min(arrowLeft - (panelW / 2), areaWidth - panelW - 12));
		$panel.css({ marginLeft: panelLeft + 'px', marginRight: 'auto' });
	} else if ($panel.length) {
		$panel.css({ marginLeft: 'auto', marginRight: 'auto' });
	}
}

function overGNB(){
	//$('[id^=gnb2th_]').attr('class','gnbsingle');
	if (!$(this).find('.gnbsingle').length) return;
	var gnbMM = $(this).attr('id');
	var gnbHeight = "H"+gnbMM;
	$(".shadow_device").stop(true,true).fadeOut('fast');
	if (!$('.kbHeader').length) {
		$(".shadow_device").stop(true,true).fadeIn('slow');
	}
	$('.gnb_Bg').show();
	$('.gnbsingle').hide();
	$('.action').removeClass();
	$(this).children().show();
	positionKbMega($(this));
	setTimeout(function () { positionKbMega($(this)); }.bind(this), 0);
	if (gnbHeight == "Hmenu_1"){
		$('#menu_1>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"340px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_2"){
		$('#menu_2>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"460px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_4"){
		$('#menu_4>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"600px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_5"){
		$('#menu_5>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"200px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_6"){
		$('#menu_6>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"340px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_7"){
		$('#menu_7>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"220px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_8"){
		$('#menu_8>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"260px"},200, 'easeOutExpo');
	} 
		
}
function closeGnb(){
	cancelGnbClose();
	$('.gnb_Bg').stop(true,true).animate({height:"0"},300, 'easeOutExpo', function(){ $(this).hide(); });
	$('.gnbsingle').stop(true,true).hide();
	$('.gnbsingle--mega > .kbMega').css({ marginLeft: '', marginRight: '' });
	$('.action').removeClass();
	$('.shadow_device').stop(true,true).fadeOut();
}


function nofunction(){
}

function initGnbHover() {
	var $menus = $('[id^=menu_]:not(.kbHeader__navItem--plain)');

	$menus
		.off('mouseenter.gnb mouseleave.gnb')
		.on('mouseenter.gnb', function () {
			cancelGnbClose();
			overGNB.call(this);
		});

	if ($('.kbHeader').length) {
		// Kladee mega menu: ไม่ปิดทันทีเมื่อออกจากแต่ละรายการเมนู
		// รอจนกว่าเมาส์จะออกจากโซน nav + dropdown จริง ๆ
		$('#gnbArea, .gnb_Bg, .gnbsingle--mega')
			.off('mouseenter.gnb mouseleave.gnb')
			.on('mouseenter.gnb', cancelGnbClose)
			.on('mouseleave.gnb', onGnbZoneLeave);
	} else {
		$menus.on('mouseleave.gnb', scheduleGnbClose);
		$('#gnbArea, .gnb_Bg')
			.off('mouseenter.gnb mouseleave.gnb')
			.on('mouseenter.gnb', cancelGnbClose)
			.on('mouseleave.gnb', scheduleGnbClose);
	}
}

jQuery(function(){
	initGnbHover();
	$('[id^=menu_] > a').keyup(function(){
		var mid = $(this).parent().attr('id');
		$('#'+mid).mouseover();
	});
	if (!$('.shadow_device').length) {
		$('#header').after('<div class="shadow_device"></div>');
	}
	$('.shadow_device').off('click.gnb').on('click.gnb', closeGnb);
	$('.btnSitemap > a').hover(closeGnb);
	$('.btnSitemap > a').focus(closeGnb);
});

window.initGnbHover = initGnbHover;
window.overGNB = overGNB;
window.closeGnb = closeGnb;
window.nofunction = nofunction;