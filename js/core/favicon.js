/** Inject Kladee favicon when pages omit <link rel="icon"> */
(function () {
  if (document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')) return;

  const base = document.body?.dataset?.basePath || '';
  const head = document.head;
  const v = '20260811k';

  const png = document.createElement('link');
  png.rel = 'icon';
  png.type = 'image/png';
  png.href = `${base}images/favicon.png?v=${v}`;
  head.appendChild(png);

  const ico = document.createElement('link');
  ico.rel = 'icon';
  ico.href = `${base}favicon.ico?v=${v}`;
  ico.sizes = 'any';
  head.appendChild(ico);
})();
