//공통 이미지 변경
function mimgOn(item){
 item.src = item.src.replace("_off.gif", "_on.gif");
}
function mimgOff(item){
 item.src = item.src.replace("_on.gif", "_off.gif");
}

function main_show1(value1){
	$("#"+value1+"").show();
}
function main_hide1(value1){
	$("#"+value1+"").hide();
}

//상단 검색 셀렉트 디자인스크립트
jQuery(function($) {
	
	// Common
	var top_select_root = $('div.top_select');
	var top_select_value = $('.myValue');
	var top_select_a = $('div.top_select>ul>li>a');
	var top_select_input = $('div.top_select>ul>li>input[type=radio]');
	var top_select_label = $('div.top_select>ul>li>label');
	
	// Radio Default Value
	$('div.myValue').each(function(){
		var default_value = $(this).next('.iList').find('input[checked]').next('label').text();
		$(this).append(default_value);
	});
	
	// Line
	top_select_value.bind('focusin',function(){$(this).addClass('outLine');});
	top_select_value.bind('focusout',function(){$(this).removeClass('outLine');});
	top_select_input.bind('focusin',function(){$(this).parents('div.top_select').children('div.myValue').addClass('outLine');});
	top_select_input.bind('focusout',function(){$(this).parents('div.top_select').children('div.myValue').removeClass('outLine');});
	
	// Show
	$('.top_select .myValue').attr('title','통합검색 항목선택 열기');
	function show_option(){
		$(this).parents('div.top_select:first,div.m_top_select:first').toggleClass('open');
		if($('.top_select').hasClass('open')){
			$('.top_select .myValue').attr('title','통합검색 항목선택 닫기');
		}else{
			$('.top_select .myValue').attr('title','통합검색 항목선택 열기');
		}
	}
	
	// Hover
	function i_hover(){
		$(this).parents('ul:first').children('li').removeClass('hover');
		$(this).parents('li:first').toggleClass('hover');
	}
	
	// Hide
	function hide_option(){
		var t = $(this);
		setTimeout(function(){
			t.parents('div.top_select:first').removeClass('open');
		}, 1);
	}
	
	// Set Input
	function set_label(){
		var v = $(this).next('label').text();
		$(this).parents('ul:first').prev('.myValue').text('').append(v);
		$(this).parents('ul:first').prev('.myValue').addClass('top_selected');
	}
	
	// Set Anchor
	function set_anchor(){
		var v = $(this).text();
		$(this).parents('ul:first').prev('.myValue').text('').append(v);
		$(this).parents('ul:first').prev('.myValue').addClass('top_selected');
	}

	// Anchor Focus Out
	$('*:not("div.top_select a")').focus(function(){
		$('.aList').parent('.top_select').removeClass('open');
	});
	
	top_select_value.click(show_option);
	top_select_root.find('ul').css('position','absolute');
	top_select_root.removeClass('open');
	top_select_a.click(set_anchor).click(hide_option).focus(i_hover).hover(i_hover);
	top_select_input.change(set_label).focus(set_label);
	top_select_label.hover(i_hover).click(hide_option);
	
	// Form Reset
	$('input[type="reset"], button[type="reset"]').click(function(){
		$(this).parents('form:first').find('.myValue').each(function(){
			var origin = $(this).next('ul:first').find('li:first label').text();
			$(this).text(origin).removeClass('top_selected');
		});
	});
	
	//상단 패밀리사이트 열기
	$('.btn_fam').click(function(){
		$(".famSite_pop").attr('tabindex', '0').fadeIn('fast').focus();
		$('.famSite_pop .btnClose').click(function(){
			$(".famSite_pop").fadeOut('fast');
		});
	});

	//하단 페밀리 사이트 열기
	$('.famBtn').click(function(){
		$('.famSite .link .siteView').slideUp('fast');
		if($(this).hasClass('on')){
			$('.famSite .link .siteView').slideUp('fast');
			$('.famSite .link .famBtn').removeClass("on");
			$(this).attr("title","펼치기");
		}else{
			$('.famSite .link .famBtn').removeClass("on");
			$('+ .siteView',this).slideDown("fast").focus();
			$('.famBtn').attr("title","펼치기");
			$(this).addClass("on");
			$(this).attr("title","접기");
		}
		return false;
	});

	$('.btnLang button').on('click', function(){
		$(this).toggleClass('on');
		$('.btnLang ul').stop().slideToggle(300,'easeOutExpo');
		$('.g_lnag_select').removeClass('on');
		$('.btnLang > ul').toggleClass('on');
		if($('.btnLang > ul').hasClass('on')){
			$('.btnLang button').attr('title','언어선택 닫기');
		}else{
			$('.btnLang button').attr('title','언어선택 열기')
		}
	});
	$('.btnLang .g_lang > a').attr('title','언어선택 열기')
	$('.btnLang .g_lang').on('click', function(){
		$('.g_lnag_select').toggleClass('on');
		if($('.g_lnag_select').hasClass('on')){
			$('.btnLang .g_lang > a').attr('title','언어선택 닫기');
		}else{
			$('.btnLang .g_lang > a').attr('title','언어선택 열기')
		}
	});

	//하단 위로가기
	$(window).scroll(function () {
		if($(document).scrollTop()>150){ 
			$('.botBtTop').addClass('on');
		}else {
			$('.botBtTop').removeClass('on');
		}
	})
	$('.botBtTop').click(function(e){
		$('html, body').animate({scrollTop:0},300,'easeInOutExpo');
		return false;
	});

	$('.link_btn').click(function() {
		clipBoard();
	});

});

$(window).load(function(){ 
	//게시판 상단 탭메뉴
	$(".tab_txt01 ul li .on").attr("title","선택됨");
	//탭메뉴
	$(".geum_tab_con").hide(); 
	$("ul.geum_tab_menu li a:first").addClass("on").show();
	$("ul.geum_tab_menu li a:first").attr("title","선택됨");
	$(".geum_tab_con:first").show(); 
	$("ul.geum_tab_menu li a").click(function() {
		$("ul.geum_tab_menu li a").removeClass("on");
		$(this).parent().parent().find('li > a').attr("title","");
		$(this).addClass("on"); 
		$(this).attr("title","선택됨");
		$(".geum_tab_con").hide(); 
		var activeTab = $(this).attr("href");
		$(activeTab).show(); 
		return false;
	});
});

$(window).load(function(){ 
	//탭메뉴
	$(".geum_tab_con_1").hide(); 
	$("ul.geum_tab_menu_1 li a:first").addClass("on").show();
	$("ul.geum_tab_menu_1 li a:first").attr("title","선택됨");
	$(".geum_tab_con_1:first").show(); 
	$("ul.geum_tab_menu_1 li a").click(function() {
		$("ul.geum_tab_menu_1 li a").removeClass("on");
		$(this).parent().parent().find('li > a').attr("title","");
		$(this).addClass("on"); 
		$(this).attr("title","선택됨");
		$(".geum_tab_con_1").hide(); 
		var activeTab = $(this).attr("href");
		$(activeTab).show(); 
		return false;
	});
});

$(window).load(function(){ 
	//탭메뉴
	$(".geum_tab_con_2").hide(); 
	$("ul.geum_tab_menu_2 li a:first").addClass("on").show();
	$("ul.geum_tab_menu_2 li a:first").attr("title","선택됨");
	$(".geum_tab_con_2:first").show(); 
	$("ul.geum_tab_menu_2 li a").click(function() {
		$("ul.geum_tab_menu_2 li a").removeClass("on");
		$(this).parent().parent().find('li > a').attr("title","");
		$(this).addClass("on"); 
		$(this).attr("title","선택됨");
		$(".geum_tab_con_2").hide(); 
		var activeTab = $(this).attr("href");
		$(activeTab).show(); 
		return false;
	});
});


$(function(){

	/* 외국어 */
	$('.lang_box .btn_lang').on('click', function(){
		$('.lang_box ul').stop().slideToggle(300,'easeOutExpo');
		$('.g_lnag_select').removeClass('on');
		$('.lang_box > ul').toggleClass('on');
		if($('.lang_box > ul').hasClass('on')){
			$('.lang_box .btn_lang').attr('title','언어선택 닫기');
		}else{
			$('.lang_box .btn_lang').attr('title','언어선택 열기')
		}
	});
	$('.lang_box .g_lang > a').attr('title','구글 언어선택 열기')
	$('.lang_box .g_lang').on('click', function(){
		$('.g_lnag_select').toggleClass('on');
		if($('.g_lnag_select').hasClass('on')){
			$('.lang_box .g_lang > a').attr('title','구글 언어선택 닫기');
		}else{
			$('.lang_box .g_lang > a').attr('title','구글 언어선택 열기')
		}
	});

	//셀렉트 바로가기
	$(".mb_tab").each(function(){
		var mbstr = $("ul li a.on",this).html();
		$(".selet_txt",this).html(mbstr);
		$(".selet_txt",this).click(function(){
			$("+ul",this).slideToggle("fast");
			$(this).toggleClass("on");
			//모바일일때 한페이지 이동시
			$("+ul li a",this).click(function(){
				var mbstr2 = $(this).html();
				$(this).parent().parent().siblings('.selet_txt').html(mbstr2);
				$(this).parent().parent().hide();
				$(".selet_txt").removeClass('on');
			});
			return false;
		});
	});
});

//페이지 만족도 한줄쓰기 안내글
function Change(target,type)
{
 if (target.value == target.defaultValue && type==0) target.value = "";
 if (!target.value && type==1) target.value = target.defaultValue;
}

function check_form(chk_v,chk_name){
	if(document.getElementById(chk_v)){
		if(document.getElementById(chk_v).value=="" && document.getElementById(chk_v).type!= "hidden"){
			alert(chk_name+" 을 입력해주세요.");
			document.getElementById(chk_v).focus();
			return "1";
		}
	}
}

//동주민센터 메뉴
$(function(){

	$('.dong_menu .has_sub').on('mouseenter focusin', function(){
		$(this).find('ul').addClass('on');
	});
	$('.dong_menu .has_sub').siblings('li').on('focusin', function(){
		$(this).siblings('li').find('ul').removeClass('on');
	});
	$('.dong_menu .has_sub').on('mouseleave', function(){
		$(this).find('ul').removeClass('on');
	});

});

//체크박스 선택확인 라디오 선택값 가져오기
function radio_checkbox_chk(qqq){
	var radio_v=document.getElementsByName(qqq);
	var bbb;
	for(i_i=0;i_i<radio_v.length;i_i++){
		if(radio_v[i_i].checked) {
			bbb=radio_v[i_i].value;
			break;
		}else{
			bbb="";
		}
	}
	return bbb;
}

function radio_checkbox_chk_value(qqq){
	var radio_v=document.getElementsByName(qqq);
	var bbb="";
	for(i_i=0;i_i<radio_v.length;i_i++){
		if(radio_v[i_i].checked) {
			bbb=radio_v[i_i].value+"|"+bbb;
		}
	}
	return bbb;
}

function isNull( s ) { 
	if( s == null ) return true; 

	var result = s.replace(/(^\s*)|(\s*$)/g, ""); 

	if( result ) return false; 
	else return true; 
}

function search_select(value){

	document.serch_form.category.value = value;

}

function search_btn_go(){
if(document.serch_form.category.value=="lib"){
  document.lib_searchform.value1.value = document.serch_form.kwd.value;
  document.lib_searchform.submit();
}else{
  document.serch_form.submit();
}

}

function cookieVal(cookieName) {
	var thisCookie = document.cookie.split("; ");
	for ( i = 0; i < thisCookie.length; i++) {
		if (cookieName == thisCookie[i].split("=")[0]) {
			return thisCookie[i].split("=")[1];
		}
	}
	return "x";
}


function setCookie( name, value, expiredays ) { 
    var todayDate = new Date(); 
    todayDate.setDate( todayDate.getDate() + expiredays ); 
    document.cookie = name + "=" + escape( value ) + "; path=/; expires=" + todayDate.toGMTString() + ";" 
} 

function getCookie(name) 
{ 
	var arg = name + "="; 
	var alen = arg.length; 
	var clen = document.cookie.length; 
	var i = 0; while(i< clen) 
	{ 
		var j = i + alen; 
		if(document.cookie.substring(i,j)==arg)
			{ 
			var end = document.cookie.indexOf(";",j); 
			if(end == -1) end = document.cookie.length;
			return unescape(document.cookie.substring(j,end)); 
			} 
		i=document.cookie.indexOf(" ",i)+1; 
		if (i==0) break; 
	} 
	return null; 
}

function open_in_frame(url, layer ) {
	$(layer).attr('src', url);
}


//서브 sns링크
$(function(){
	var snsLink = $('.sns_link_btn');
	snsLink.on('click', function(){
		$('.sns_link_box ul').slideToggle(200, 'easeOutExpo');
	})

	$('#kwd').on('input keyup change focus focusout', toggleClear);
});    

//검색 삭제
function kwd_del(){
	$("#kwd").val("");
	$("#kwd").focus();
}
    
function toggleClear(){
	if ($.trim($('#kwd').val()) !== '') {
		$(".btn_clear").show();
	}else{
		$(".btn_clear").hide();
	}
}



function sendSns(sns) {

    var o;
    var _url = encodeURIComponent(location.href);
    var _txt = encodeURIComponent(document.getElementsByTagName('TITLE')[0].text);
    var _br  = encodeURIComponent('\r\n');
	var _br2  = encodeURIComponent('\n');

    switch(sns) {

        case 'facebook':
            o = {
                method:'popup',
                url:'http://www.facebook.com/sharer/sharer.php?u=' + _url
            };
            break;

        case 'twitter':
            o = {
                method:'popup',
                url:'http://twitter.com/intent/tweet?text=' + _txt + '&url=' + _url
            };
            break;

        case 'me2day':
            o = {
                method:'popup',
                url:'http://me2day.net/posts/new?new_post[body]=' + _txt + _br + _url + '&new_post[tags]=epiloum'
            };
            break;
        case "naver":
       o = {
                method:'popup',
	       url:'http://blog.naver.com/openapi/share?title=' + _txt + '&url='+_url
            };
			break;
        case 'kakaotalk':
            o = {
                method:'web2app',
                param:'sendurl?msg=' + _txt + '&url=' + _url + '&type=link&apiver=2.0.1&appver=2.0&appid=dev.epiloum.net&appname=' + encodeURIComponent('Epiloum 개발노트'),
                a_store:'itms-apps://itunes.apple.com/app/id362057947?mt=8',
                g_store:'market://details?id=com.kakao.talk',
                a_proto:'kakaolink://',
                g_proto:'scheme=kakaolink;package=com.kakao.talk'
            };
            break;

        case 'kakaostory':
	   o = {
		method:'popup2',
                url:'https://story.kakao.com/s/share?url=' + _url +'&text='+ _txt
           };
            break; 
        case 'band':
            o = {
               
			     method:'popup2',
                url:'http://www.band.us/plugin/share?body='+ _txt +''+ _br2 + '' +_url + '&route=www.gjfac.org'

           };
            break;

        default:
            alert('지원하지 않는 SNS입니다.');
            return false;
    }

    switch(o.method) {

        case 'popup':
            window.open(o.url);
            break;
	case 'popup2':
            window.open(o.url,'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
            break;
        case 'web2app':
            if(navigator.userAgent.match(/android/i))
            {
                // Android
                setTimeout(function(){ location.href = 'intent://' + o.param + '#Intent;' + o.g_proto + ';end'}, 100);
            }
            else if(navigator.userAgent.match(/(iphone)|(ipod)|(ipad)/i))
            {
                // Apple
                setTimeout(function(){ location.href = o.a_store; }, 200);
                setTimeout(function(){ location.href = o.a_proto + o.param }, 100);
            }
            else
            {
                alert('이 기능은 모바일에서만 사용할 수 있습니다.');
            }
            break;
    }
}

function clipBoard() {
	let dummy = document.createElement("input");
	const url = location.href;
	
	document.body.appendChild(dummy);
	dummy.value = url;
	dummy.select();
	document.execCommand("copy"); 
	alert("URL을 클립보드에 복사했습니다.");
	document.body.removeChild(dummy);
}      