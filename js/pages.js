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
		newsTabs.forEach(function (tab) {
			tab.addEventListener('click', function () {
				newsTabs.forEach(function (t) { t.classList.remove('is-active'); });
				tab.classList.add('is-active');
				filterNews(tab.getAttribute('data-cat'));
			});
		});
		var initial = document.querySelector('.newsTab.is-active');
		filterNews(initial ? initial.getAttribute('data-cat') : 'all');

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
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var name = form.querySelector('[name="name"]').value.trim();
			var phone = form.querySelector('[name="phone"]').value.trim();
			var email = form.querySelector('[name="email"]').value.trim();
			var topic = form.querySelector('[name="topic"]').value;
			var message = form.querySelector('[name="message"]').value.trim();

			if (!name || !phone || !message) return;

			var subject = encodeURIComponent('[กล้าดี โบรกเกอร์] ' + topic + ' — ' + name);
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
})();
