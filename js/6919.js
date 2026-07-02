$(function(){

	//팝업 big 슬라이드
	var swiper1 = new Swiper('.mSlide1', {
		navigation: {
          nextEl: ".nextSlide1",
          prevEl: ".prevSlide1",
        },
		pagination: {
			el: '.mSlide1Dots',
			clickable: true,
			bulletClass: 'heroDot',
			bulletActiveClass: 'is-active',
		},
		autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
		speed: 500,
		autoplayDisableOnInteraction: false,
		loop: true,
		on: {
			slideChangeTransitionStart: function () {
				$('.mSlide1 li').find('a').attr('tabindex', -1);
				$('.mSlide1 li.swiper-slide-active, .mSlide1 li.swiper-slide-active ~ li').find('a').attr('tabindex', 0);
			},
		},
	});
	$( '.mSlide1 li' ).focusin( function () {
		swiper1.autoplay.stop();
	});

	//พันธมิตรประกันภัย — แถบโลโก้ต่อเนื่อง (mCon3)
	if (document.querySelector('.mSlide2--partners')) {
		var swiper2 = new Swiper('.mSlide2--partners', {
			slidesPerView: 'auto',
			spaceBetween: 0,
			loop: true,
			speed: 700,
			autoplay: {
				delay: 1600,
				disableOnInteraction: false,
			},
			allowTouchMove: true,
			loopAdditionalSlides: 10,
		});
	}

	

	//팝업 smal 슬라이드 (mCon5 ถ้ามีในหน้า)
	if ($('.mSlide3').length) {
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
				slideChangeTransitionStart: function () {
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
	}


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
		autoplay: {
			delay: 3500,
			disableOnInteraction: false,
		},
		speed: 700,
		autoplayDisableOnInteraction: false,
		loop: true,
		slidesPerView: 1,
		slidesPerGroup: 1,
		spaceBetween: 14,
		breakpoints: {
			768: {
				slidesPerView: 2,
				slidesPerGroup: 1,
				spaceBetween: 16,
			},
			1200: {
				slidesPerView: 4,
				slidesPerGroup: 1,
				spaceBetween: 20,
			},
		},
		observer: true,
		observeParents: true,
	});

	var $planDots = $('#plans .planDot');
	function planSlideTotal() {
		return document.querySelectorAll('.mSlide5 .swiper-slide:not(.swiper-slide-duplicate)').length;
	}
	function slideToPlanDot(realIndex, total) {
		if (realIndex < total / 3) return 0;
		if (realIndex < (total * 2) / 3) return 1;
		return 2;
	}
	function planDotToSlide(dot, total) {
		if (dot === 0) return 0;
		if (dot === 1) return Math.floor(total / 3);
		return Math.floor((total * 2) / 3);
	}
	function updatePlanDots(swiper) {
		var total = planSlideTotal();
		var idx = slideToPlanDot(swiper.realIndex, total);
		$planDots.removeClass('is-active').attr({ 'aria-selected': 'false', title: '' });
		$planDots.eq(idx).addClass('is-active').attr({ 'aria-selected': 'true', title: 'เลือกอยู่' });
	}
	swiper4.on('slideChange', function () { updatePlanDots(swiper4); });
	updatePlanDots(swiper4);
	$planDots.on('click', function () {
		var dot = parseInt($(this).data('plan-dot'), 10);
		var total = planSlideTotal();
		swiper4.slideToLoop(planDotToSlide(dot, total));
	});

	//ความประทับใจของสมาชิก
	if ($('.kbMemberReviews__slider').length) {
		new Swiper('.kbMemberReviews__slider', {
			navigation: {
				nextEl: '.kbMemberReviews__nav--next',
				prevEl: '.kbMemberReviews__nav--prev',
			},
			pagination: {
				el: '.kbMemberReviews__dots',
				clickable: true,
				bulletClass: 'kbReviewDot',
				bulletActiveClass: 'is-active',
			},
			autoplay: {
				delay: 4200,
				disableOnInteraction: false,
			},
			speed: 650,
			autoplayDisableOnInteraction: false,
			loop: true,
			slidesPerView: 1,
			slidesPerGroup: 1,
			spaceBetween: 20,
			loopAdditionalSlides: 3,
			breakpoints: {
				768: {
					slidesPerView: 2,
					spaceBetween: 22,
				},
				1100: {
					slidesPerView: 3,
					spaceBetween: 24,
				},
			},
			observer: true,
			observeParents: true,
		});
	}

	
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


	//메인 비주얼 슬라이드 더보기 열기 (ปุ่มถูกถอดออกจาก hero — คง handler ไว้ถ้ามีปุ่มอื่นในอนาคต)
	if ($('.moreSlide1').length) {
		$('.moreSlide1').click(function(){
			$(".slide_list_pop").attr('tabindex', '0').fadeIn('fast').focus();
			$('.slide_list_pop .btnClose').click(function(){
				$(".slide_list_pop").fadeOut('fast');
			});
		});
	}

});         