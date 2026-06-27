/////////////////////////////////////////////
//레프트메뉴 관련 스크립트
////////////////////////////////////////////
//var lm_height;
//var lm_height2;


function lm_3th_show(data){
	//3차메뉴 높이줄이기
	

	//3차메뉴 높이늘이기	
	if(jQuery(data).parent().find(">ul").length > 0){
		jQuery("#lnb > li > ul").hide();	
		//jQuery(data).parent().show();
		jQuery(data).parent().find(">ul").show();
	} else {
		
	}
}

function lm_4th_show(data){
	//4차메뉴 높이줄이기
	jQuery("#lnb > li > ul > li > ul").hide();
	
	jQuery("#lnb > li > ul > li").removeClass("minus");
	
	if(jQuery(data).parent().find(">ul").css("display")=="none"){
		jQuery(data).parent().addClass("minus");
	}

	//4차메뉴 높이늘이기	
	if(jQuery(data).parent().find(">ul").length > 0){
		jQuery(data).parent().find(">ul").show();
		jQuery(data).parent().addClass("plus");
	} else {
		//jQuery(data).parent().removeClass("plus");
	}
	
}


function lm_check(lm1,lm2,lm3){
	lm1--;
	lm2--;
	lm3--;
	if(jQuery("#lnb > li").eq(lm1).find(">ul").length > 0){
		jQuery("#lnb > li").eq(lm1).find(">ul").show();
	}

	if(jQuery("#lnb > li").eq(lm1).find(">ul>li").eq(lm2).length > 0){
		jQuery("#lnb > li").eq(lm1).find(">ul>li").eq(lm2).find("ul").show();
		//jQuery("#lnb > li").eq(lm1).find(">ul>li").eq(lm2).addClass("plus");
	}

	if(jQuery("#lnb > li").eq(lm1).find(">ul>li").eq(lm2).find("ul").css("display")=="block"){
		jQuery("#lnb > li").eq(lm1).find(">ul>li").eq(lm2).addClass("minus");
	}else{
		jQuery("#lnb > li").eq(lm1).find(">ul>li").removeClass("minus");
	}

	jQuery("#lnb > li").eq(lm1).find(">a").toggleClass("link_2th_ov");
	jQuery("#lnb > li").eq(lm1).find(">ul>li").eq(lm2).find(">a").toggleClass("link_3th_ov");
	jQuery("#lnb > li").eq(lm1).find(">ul>li").eq(lm2).find(">ul>li").eq(lm3).find(">a").toggleClass("link_4th_ov");
}


                                                 