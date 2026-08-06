/* Original PDF→HTML conversion had no JavaScript.
 * Keep Clear Data hidden when opening reference HTML. */
(function () {
  function hideClearData() {
    document.querySelectorAll('.pdf24_01').forEach(function (el) {
      if (/Clear Data/i.test(el.textContent || '')) {
        el.style.visibility = 'hidden';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideClearData);
  } else {
    hideClearData();
  }
})();
