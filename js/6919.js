$(function(){

	//팝업 big 슬라이드
	var $mpopBSlide = $('.mCon1');
	var $slidContrb1 = $mpopBSlide.find('.control2');
	var swiper1 = new Swiper('.mSlide1', {
		navigation: {
          nextEl: ".nextSlide1",
          prevEl: ".prevSlide1",
        },
		autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
		speed: 500,
		autoplayDisableOnInteraction: false,
		//2025-12-16 수정
		pagination: {
          el: ".vPage",
		  clickable: true,
		  renderBullet: function (index, className) {
			return '<button type="button" class="' + className + '">' + (index + 1) + "</button>";
		  },
        },
		loop: true,
		
		on: {
			slideChangeTransitionStart: function () { //접근성 추가 - tab 포커스이동
				$('.mSlide1 li').find('a').attr('tabindex', -1);
				$('.mSlide1 li.swiper-slide-active, .mSlide1 li.swiper-slide-active ~ li').find('a').attr('tabindex', 0);
			},
			transitionEnd: function () {
				$(".mCon1 .control2 .lineBar .line").addClass('on');
			},
			transitionStart: function () {
				$(".mCon1 .control2 .lineBar .line").removeClass('on');
			},
			
		},
	});
	$slidContrb1.find( '.startSlide1' ).on( 'click', function () {
		swiper1.autoplay.start();
		$(this).hide().prev().show().focus();
		$(".mCon1 .control2 .lineBar .line").addClass('on');
	});
	$slidContrb1.find( '.stopSlide1' ).on( 'click', function () {
		swiper1.autoplay.stop();
		$(this).hide().next().show().focus();
		$(".mCon1 .control2 .lineBar .line").removeClass('on');
	});
	$( '.mSlide1 li' ).focusin( function () {
		swiper1.autoplay.stop();
		$slidContrb1.find( '.stopSlide1' ).hide().next().show();
	});

	//링크 슬라이드
	var swiper2 = new Swiper('.mSlide2', {
		navigation: {
			nextEl: ".nextSlide2",
			prevEl: ".prevSlide2",
		  },
		slidesPerView: 2,
		loop: false,
		spaceBetween: 0,
		breakpoints: {
			1200: {
				slidesPerView: 8,
				spaceBetween: 0
			},
			1024: {
				slidesPerView: 6,
			},
			650: {
				slidesPerView: 4,
			},
			500: {
				slidesPerView: 3,
			},
			400: {
				slidesPerView: 2,
			},
		},
		
	});

	

	//팝업 smal 슬라이드
	var $mpopSSlide = $('.mCon5');
	var $slidContrb2 = $mpopSSlide.find('.control');
	var swiper3 = new Swiper('.mSlide3', {
		navigation: {
          nextEl: ".nextSlide3",
          prevEl: ".prevSlide3",
        },
		autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
		speed: 700,
		autoplayDisableOnInteraction: false,
		pagination: {
          el: ".pPage",
          type: "fraction",
        },
		loop: true,
		slidesPerView: 1,
		spaceBetween: 0,
		on: {
			slideChangeTransitionStart: function () { //접근성 추가 - tab 포커스이동
				$('.mSlide3 li').find('a').attr('tabindex', -1);
				$('.mSlide3 li.swiper-slide-active').find('a').attr('tabindex', 0);
			}
		},
	});
	$slidContrb2.find( '.startSlide3' ).on( 'click', function () {
		swiper3.autoplay.start();
		$(this).hide().prev().show().focus();
	});
	$slidContrb2.find( '.stopSlide3' ).on( 'click', function () {
		swiper3.autoplay.stop();
		$(this).hide().next().show().focus();
	});
	$( '.mSlide3 li' ).focusin( function () {
		swiper3.autoplay.stop();
		$slidContrb2.find( '.stopSlide3' ).hide().next().show();
	});


	//공지사항 텝메뉴
	$('.mNoticeTab > li > a').on("click focusin", function () {
		$('.mNoticeTab > li').removeClass("on");
		$('.mNoticeTab > li > a').attr("title","");
		$(this).parent().addClass("on");
		$(this).attr("title","선택됨");
		$('.mNoticeTab .mTabCon').hide();
		$(this).parent().find('.mTabCon').show();
		return false;
	});

	//교육금정
	$(".mCon6 .con1 ul").on('mouseenter focusin', function(){
		$(".mCon6 .con1 ul li").removeClass('on');
	}).on('mouseleave focusout', function(){
		$(".mCon6 .con1 ul li:first-child").addClass('on');
	});

	//민원/참여
	var swiper6 = new Swiper('.mSlide4', {
		pagination: {
			el: ".iPage",
			clickable: true,
			renderBullet: function (index, className) {
				if(index == 0){
					return '<button type="button" class="' + className + '" title="선택됨">' + (index + 1) + "</button>";
				}else{
					return '<button type="button" class="' + className + '">' + (index + 1) + "</button>";
				}
			},
		  },
		loop: false,
		slidesPerView: 3,
		slidesPerGroup: 3,
		spaceBetween: 0,
		on: {
			slideChangeTransitionStart: function () { //접근성 추가 - tab 포커스이동
				$('.mSlide4 > .iPage').find('button').attr('title', "");
				$('.mSlide4 > .iPage > .swiper-pagination-bullet-active').attr('title', "선택됨");
			}
		}
	});

	//แผนประกันแนะนำ
	var swiper4 = new Swiper('.mSlide5', {
		navigation: {
          nextEl: ".nextSlide4",
          prevEl: ".prevSlide4",
        },
		autoplayDisableOnInteraction: false,
		loop: false,
		slidesPerView: 1,
		slidesPerGroup: 1,
		spaceBetween: 14,
		breakpoints: {
			768: {
				slidesPerView: 2,
				slidesPerGroup: 2,
				spaceBetween: 16,
			},
			1200: {
				slidesPerView: 3,
				slidesPerGroup: 3,
				spaceBetween: 20,
			},
		},
		observer: true,
		observeParents: true,
	});

	
	//문화관광 이미지
	var swiper7 = new Swiper('.mSlide7', {
		effect: "fade",
		speed: 700,
		navigation: {
			nextEl: ".nextSlide7",
			prevEl: ".prevSlide7",
		},
		loop: true,
		simulateTouch: false,
		touchRatio: 0,
	});

	//문화관광 제목
	var tourTxt = new Swiper('.mSlide8', {
		direction: 'horizontal',
		autoHeight: true,
		centeredSlides: true,
		slidesPerView: 1,
		spaceBetween: 0,
		speed: 700,
		loop: true,
		navigation: {
			nextEl: ".nextSlide7",
			prevEl: ".prevSlide7",
		},
		on: {
			slideChangeTransitionStart: function () { //접근성 추가 - tab 포커스이동
				$('.mSlide8 li').find('a').attr('tabindex', -1);
				$('.mSlide8 li.swiper-slide-visible').find('a').attr('tabindex', 0);
				$('.mSlide8 li .tit > .hidden').remove();
				$(".mSlide8 .swiper-slide-active .tit").append('<span class="hidden">선택됨</span>');
			}
		},
		breakpoints: {
			850: {
				direction: 'vertical',
				slidesPerView: 5,
				
			},
			640: {
				direction: 'horizontal',
				slidesPerView: 3,
				
			},
			
		},
		simulateTouch: false,
		touchRatio: 0,
	});
	
	//swiper7.controller.control = tourTxt;
    //tourTxt.controller.control = swiper7;

	//배너모음 슬라이드
	if ($('.mBanner').length && $('.mbanSlide').length) {
	var $banSlide = $('.mBanner');
	var $slidContrb4 = $banSlide.find('.control');
	var swiper8 = new Swiper('.mbanSlide', {
		navigation: {
          nextEl: ".nextSlide_b",
          prevEl: ".prevSlide_b",
        },
		autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
		speed: 700,
		autoplayDisableOnInteraction: false,
		loop: true,
		slidesPerView: 'auto',
		spaceBetween: 0,
		on: {
			slideChangeTransitionStart: function () { //접근성 추가 - tab 포커스이동
				$('.mbanSlide li').find('a').attr('tabindex', -1);
				$('.mbanSlide li.swiper-slide-active, .mbanSlide li.swiper-slide-active ~ li').find('a').attr('tabindex', 0);
			}
		},
	});
	$slidContrb4.find( '.startSlide_b' ).on( 'click', function () {
		swiper8.autoplay.start()
		$(this).hide().prev().show().focus();
	});
	$slidContrb4.find( '.stopSlide_b' ).on( 'click', function () {
		swiper8.autoplay.stop()
		$(this).hide().next().show().focus();
	});
	$( '.mbanSlide li' ).focusin( function () {
		swiper8.autoplay.stop()
		$slidContrb4.find( '.stopSlide_b' ).hide().next().show();
	});
	}


	//메인 비주얼 슬라이드 더보기 열기
	$('.moreSlide1').click(function(){
		$(".slide_list_pop").attr('tabindex', '0').fadeIn('fast').focus();
		$('.slide_list_pop .btnClose').click(function(){
			$(".slide_list_pop").fadeOut('fast');
		});
	});

});         