/* 포탈pc메뉴 */
function overGNB(){
	//$('[id^=gnb2th_]').attr('class','gnbsingle');
	var gnbMM = $(this).attr('id');
	var gnbHeight = "H"+gnbMM;
	$(".shadow_device").stop(true,true).fadeIn('slow');
	$('.gnb_Bg').show();
	$('.gnbsingle').hide();
	$('.action').removeClass();
	$(this).children().show();
	if (gnbHeight == "Hmenu_1"){
		$('#menu_1>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"920px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_2"){
		$('#menu_2>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"1200px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_3"){
		$('#menu_3>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"1160px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_4"){
		$('#menu_4>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"600px"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_5"){
		$('#menu_5>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"0"},200, 'easeOutExpo');
	} else if (gnbHeight == "Hmenu_6"){
		$('#menu_6>a').addClass('action');
		$('.gnb_Bg').stop().animate({height:"420px"},200, 'easeOutExpo');
	} 
		
}
function closeGnb(){
	$('.gnb_Bg').stop(true,true).animate({height:"0"},300, 'easeOutExpo', function(){ $(this).hide(); });
	$('.gnbsingle').stop(true,true).hide();
	$('.action').removeClass();
	$('.shadow_device').stop(true,true).fadeOut();
}


function nofunction(){
}

jQuery(function(){
	$('[id^=menu_]').off('mouseenter.gnb mouseleave.gnb').on('mouseenter.gnb', overGNB).on('mouseleave.gnb', nofunction);
	$('#gnbArea, .gnb_Bg').off('mouseenter.gnb mouseleave.gnb').on('mouseenter.gnb', nofunction).on('mouseleave.gnb', closeGnb);
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