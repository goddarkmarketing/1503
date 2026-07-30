/** Inject Kladee favicon when pages omit <link rel="icon"> */
(function () {
  if (document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')) return;

  const base = document.body?.dataset?.basePath || '';
  const head = document.head;

  const svg = document.createElement('link');
  svg.rel = 'icon';
  svg.type = 'image/svg+xml';
  svg.href = `${base}images/favicon.svg`;
  head.appendChild(svg);

  const ico = document.createElement('link');
  ico.rel = 'icon';
  ico.href = `${base}favicon.ico`;
  ico.sizes = 'any';
  head.appendChild(ico);
})();
