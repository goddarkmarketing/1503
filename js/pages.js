(function () {
	'use strict';

	/* ---- News: filter by category ---- */
	var newsTabs = document.querySelectorAll('.newsTab');
	var newsCards = document.querySelectorAll('.newsCard');
	var newsCount = document.getElementById('newsCount');

	function filterNews(cat) {
		var visible = 0;
		newsCards.forEach(function (card) {
			var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
			var show = cat === 'all' || cats.indexOf(cat) >= 0;
			card.classList.toggle('is-hidden', !show);
			if (show) visible++;
		});
		if (newsCount) {
			newsCount.textContent = 'แสดง ' + visible + ' รายการ';
		}
	}

	if (newsTabs.length && newsCards.length) {
		function applyNewsFilter(cat) {
			newsTabs.forEach(function (t) {
				t.classList.toggle('is-active', t.getAttribute('data-cat') === cat);
			});
			filterNews(cat);
		}

		newsTabs.forEach(function (tab) {
			tab.addEventListener('click', function () {
				applyNewsFilter(tab.getAttribute('data-cat'));
			});
		});

		var params = new URLSearchParams(window.location.search);
		var urlCat = params.get('cat');
		var urlView = params.get('view');

		if (urlView === 'newsfeed') {
			var feedVisible = 0;
			newsCards.forEach(function (card) {
				var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
				var show = cats.indexOf('article') < 0;
				card.classList.toggle('is-hidden', !show);
				if (show) feedVisible++;
			});
			newsTabs.forEach(function (t) { t.classList.remove('is-active'); });
			if (newsCount) newsCount.textContent = 'แสดง ' + feedVisible + ' รายการ (ข่าวสารและกิจกรรม)';
		} else if (urlCat) {
			var matchTab = document.querySelector('.newsTab[data-cat="' + urlCat + '"]');
			applyNewsFilter(matchTab ? urlCat : 'all');
			if (!matchTab) {
				var customVisible = 0;
				newsCards.forEach(function (card) {
					var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
					var show = cats.indexOf(urlCat) >= 0;
					card.classList.toggle('is-hidden', !show);
					if (show) customVisible++;
				});
				if (newsCount) newsCount.textContent = 'แสดง ' + customVisible + ' รายการ';
			}
		} else {
			var initial = document.querySelector('.newsTab.is-active');
			filterNews(initial ? initial.getAttribute('data-cat') : 'all');
		}

		var hash = location.hash.replace('#', '');
		if (hash) {
			var target = document.getElementById(hash);
			if (target) {
				setTimeout(function () {
					target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 300);
			}
		}
	}

	/* ---- Contact form ---- */
	var form = document.getElementById('contactForm');
	var success = document.getElementById('formSuccess');

	if (form) {
		var topicField = form.querySelector('[name="topic"]');
		if (topicField && /[?&]topic=claim/i.test(window.location.search)) {
			topicField.value = 'แจ้งเคลม / ติดตามเคลม';
		}
		if (topicField && /[?&]topic=feedback/i.test(window.location.search)) {
			topicField.value = 'เสนอแนะ / ติชม';
		}

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var name = form.querySelector('[name="name"]').value.trim();
			var phone = form.querySelector('[name="phone"]').value.trim();
			var email = form.querySelector('[name="email"]').value.trim();
			var topic = form.querySelector('[name="topic"]').value;
			var message = form.querySelector('[name="message"]').value.trim();

			if (!name || !phone || !message) return;

			var subject = encodeURIComponent('[กล้าดีโบรคเกอร์] ' + topic + ' — ' + name);
			var body = encodeURIComponent(
				'ชื่อ-นามสกุล: ' + name + '\n' +
				'โทรศัพท์: ' + phone + '\n' +
				'อีเมล: ' + (email || '-') + '\n' +
				'หัวข้อ: ' + topic + '\n\n' +
				message
			);

			if (success) {
				success.classList.add('is-show');
				success.innerHTML = 'ส่งคำขอเรียบร้อยแล้ว ทีมงานจะติดต่อกลับภายใน 1 วันทำการ (จันทร์–เสาร์) หรือโทร <a href="tel:0826164555">082-616-4555</a> ได้ทันที';
			}

			window.location.href = 'mailto:kladee.broker@gmail.com?subject=' + subject + '&body=' + body;
			form.reset();
		});
	}

	/* ---- Claims: hash scroll to section ---- */
	if (document.body.getAttribute('data-page') === 'claims') {
		var claimHash = location.hash.replace('#', '');
		if (claimHash) {
			var claimTarget = document.getElementById(claimHash);
			if (claimTarget) {
				setTimeout(function () {
					claimTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 400);
			}
		}
	}

	/* ---- About: side nav + hash scroll ---- */
	var aboutNav = document.getElementById('aboutNav');
	if (aboutNav) {
		var aboutLinks = aboutNav.querySelectorAll('a[href^="#"]');
		aboutLinks.forEach(function (link) {
			link.addEventListener('click', function () {
				aboutLinks.forEach(function (l) { l.classList.remove('is-active'); });
				link.classList.add('is-active');
			});
		});
		var hash = location.hash.replace('#', '');
		if (hash) {
			var target = document.getElementById(hash);
			if (target) {
				aboutLinks.forEach(function (l) {
					l.classList.toggle('is-active', l.getAttribute('href') === '#' + hash);
				});
				setTimeout(function () {
					target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 400);
			}
		}
	}

	/* ---- Newsletter mini forms ---- */
	document.querySelectorAll('.sideForm').forEach(function (f) {
		f.addEventListener('submit', function (e) {
			e.preventDefault();
			var input = f.querySelector('input[type="email"]');
			if (!input || !input.value.trim()) return;
			alert('ขอบคุณที่สมัครรับข่าวสาร เราจะส่งอัปเดตไปที่ ' + input.value.trim());
			input.value = '';
		});
	});

	/* ---- Site search ---- */
	var searchForm = document.getElementById('siteSearchForm');
	var searchInput = document.getElementById('siteSearchInput');
	var searchResults = document.getElementById('siteSearchResults');
	var searchMeta = document.getElementById('siteSearchMeta');

	if (searchForm && searchInput && searchResults) {
		var searchIndex = [
			{ title: 'ประกันรถยนต์', href: 'plans/car.html', tag: 'ผลิตภัณฑ์', keywords: 'รถยนต์ ชั้น1 2+ 3+ พรบ' },
			{ title: 'เปรียบเทียบเบี้ยประกันรถ', href: 'plans/car-compare.html', tag: 'ผลิตภัณฑ์', keywords: 'เปรียบเทียบ รถ' },
			{ title: 'ประกันชั้น 1', href: 'plans/car-class1.html', tag: 'ผลิตภัณฑ์', keywords: 'ชั้น1 รถ' },
			{ title: 'ประกันชั้น 2+ / 3+', href: 'plans/car-class2plus.html', tag: 'ผลิตภัณฑ์', keywords: '2+ 3+ รถ' },
			{ title: 'ประกันชั้น 2 / 3', href: 'plans/car-class23.html', tag: 'ผลิตภัณฑ์', keywords: 'ชั้น2 ชั้น3 รถ' },
			{ title: 'พ.ร.บ. รถยนต์', href: 'plans/compulsory.html', tag: 'ผลิตภัณฑ์', keywords: 'พรบ ภาคบังคับ' },
			{ title: 'ประกันสุขภาพ', href: 'plans/health.html', tag: 'ผลิตภัณฑ์', keywords: 'สุขภาพ IPD OPD' },
			{ title: 'ผู้ป่วยใน (IPD)', href: 'plans/health-ipd.html', tag: 'ผลิตภัณฑ์', keywords: 'ipd ผู้ป่วยใน' },
			{ title: 'ผู้ป่วยนอก (OPD)', href: 'plans/health-opd.html', tag: 'ผลิตภัณฑ์', keywords: 'opd ผู้ป่วยนอก' },
			{ title: 'ประกันชีวิต', href: 'plans/life.html', tag: 'ผลิตภัณฑ์', keywords: 'ชีวิต ตลอดชีพ สะสมทรัพย์' },
			{ title: 'แบบตลอดชีพ', href: 'plans/life-whole.html', tag: 'ผลิตภัณฑ์', keywords: 'whole life ตลอดชีพ' },
			{ title: 'แบบสะสมทรัพย์', href: 'plans/life-savings.html', tag: 'ผลิตภัณฑ์', keywords: 'สะสมทรัพย์ เงินคืน' },
			{ title: 'แบบชั่วระยะเวลา', href: 'plans/life-term.html', tag: 'ผลิตภัณฑ์', keywords: 'term ชั่วระยะ' },
			{ title: 'ประกันอุบัติเหตุ (PA)', href: 'plans/pa.html', tag: 'ผลิตภัณฑ์', keywords: 'pa อุบัติเหตุ' },
			{ title: 'ประกันบ้าน/ทรัพย์สิน', href: 'plans/home.html', tag: 'ผลิตภัณฑ์', keywords: 'บ้าน ทรัพย์สิน' },
			{ title: 'สมัครเป็นนายหน้า', href: 'join.html', tag: 'บริการ', keywords: 'สมัคร นายหน้า ตัวแทน' },
			{ title: 'เข้าสู่ระบบนายหน้า', href: 'login.html', tag: 'บริการ', keywords: 'login เข้าสู่ระบบ' },
			{ title: 'ติดต่อเจ้าหน้าที่', href: 'contact.html', tag: 'บริการ', keywords: 'ติดต่อ สอบถาม' },
			{ title: 'แจ้งเคลม', href: 'claims.html', tag: 'บริการ', keywords: 'เคลม claim' },
			{ title: 'ข่าวสารและกิจกรรม', href: 'news.html?view=newsfeed', tag: 'ข่าวสาร', keywords: 'ข่าว กิจกรรม' },
			{ title: 'บทความน่ารู้', href: 'news.html?cat=article', tag: 'ข่าวสาร', keywords: 'บทความ ความรู้' },
			{ title: 'แนะนำบริษัท', href: 'about-intro.html', tag: 'บริษัท', keywords: 'about แนะนำ กล้าดี' },
			{ title: 'ประวัติความเป็นมา', href: 'about-history.html', tag: 'บริษัท', keywords: 'ประวัติ history' },
			{ title: 'วิสัยทัศน์และพันธกิจ', href: 'about-vision.html', tag: 'บริษัท', keywords: 'vision mission ค่านิยม' },
			{ title: 'ทีมงานของเรา', href: 'about-team.html', tag: 'บริษัท', keywords: 'ทีม team ผู้บริหาร' },
			{ title: 'สาส์นจากผู้บริหาร', href: 'about-message.html', tag: 'บริษัท', keywords: 'สาส์น message' },
			{ title: 'เกี่ยวกับเรา', href: 'about.html', tag: 'บริษัท', keywords: 'about กล้าดี' },
			{ title: 'แผนผังเว็บไซต์', href: 'sitemap.html', tag: 'เว็บไซต์', keywords: 'sitemap แผนผัง' }
		];

		function runSearch(query) {
			var q = (query || '').trim().toLowerCase();
			searchResults.innerHTML = '';
			if (!q) {
				if (searchMeta) searchMeta.textContent = 'พิมพ์คำค้นหาแล้วกดปุ่มค้นหา';
				return;
			}
			var hits = searchIndex.filter(function (item) {
				var hay = (item.title + ' ' + item.keywords).toLowerCase();
				return hay.indexOf(q) >= 0 || q.split(/\s+/).some(function (word) {
					return word && hay.indexOf(word) >= 0;
				});
			});
			if (searchMeta) {
				searchMeta.textContent = hits.length
					? 'พบ ' + hits.length + ' รายการสำหรับ “' + query.trim() + '”'
					: 'ไม่พบผลลัพธ์สำหรับ “' + query.trim() + '” — ลองคำอื่นหรือ <a href="contact.html">ติดต่อเจ้าหน้าที่</a>';
			}
			hits.forEach(function (item) {
				var li = document.createElement('li');
				li.innerHTML =
					'<a href="' + item.href + '">' + item.title + '</a>' +
					'<p>' + item.keywords + '</p>' +
					'<span class="siteSearchTag">' + item.tag + '</span>';
				searchResults.appendChild(li);
			});
		}

		searchForm.addEventListener('submit', function (e) {
			e.preventDefault();
			var q = searchInput.value.trim();
			if (q) {
				var url = 'search.html?q=' + encodeURIComponent(q);
				if (window.location.pathname.indexOf('search.html') >= 0) {
					window.history.replaceState(null, '', url);
					runSearch(q);
				} else {
					window.location.href = url;
				}
			}
		});

		var initialQ = new URLSearchParams(window.location.search).get('q');
		if (initialQ) {
			searchInput.value = initialQ;
			runSearch(initialQ);
		}
	}
})();
