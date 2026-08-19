/**
 * Lucide 0.46+ UMD requires createIcons({ icons: lucide }).
 * Patch the global so existing createIcons() calls keep working.
 */
(function () {
  const L = window.lucide;
  if (!L || typeof L.createIcons !== 'function' || L.createIcons.__kladeePatched) return;
  const orig = L.createIcons.bind(L);
  L.createIcons = function (opts) {
    const options = opts && typeof opts === 'object' ? opts : {};
    if (!options.icons) options.icons = L;
    return orig(options);
  };
  L.createIcons.__kladeePatched = true;
})();
