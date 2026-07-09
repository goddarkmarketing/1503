/**
 * Sticky section nav: smooth scroll, active highlight, mobile drawer.
 */
(function () {
  function setActive(links, activeLink) {
    links.forEach((l) => l.classList.remove('is-active'));
    if (activeLink) activeLink.classList.add('is-active');
  }

  function syncNavLabels(root, label) {
    if (!label) return;
    const mobLabel = root.querySelector('.planArticleMobNav__label');
    if (mobLabel) mobLabel.textContent = label.textContent;
  }

  function closeMobilePanel(root) {
    const btn = root.querySelector('.planArticleMobNav');
    const panel = root.querySelector('.planArticleMobNav__panel');
    const backdrop = root.querySelector('.planArticleMobNav__backdrop');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (panel) panel.hidden = true;
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('planArticle-nav-open');
  }

  function openMobilePanel(root) {
    const btn = root.querySelector('.planArticleMobNav');
    const panel = root.querySelector('.planArticleMobNav__panel');
    const backdrop = root.querySelector('.planArticleMobNav__backdrop');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (panel) panel.hidden = false;
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add('planArticle-nav-open');
  }

  function initArticle(root) {
    const allLinks = root.querySelectorAll('.planArticleNav__link');
    const sections = [];
    allLinks.forEach((link) => {
      const id = (link.getAttribute('href') || '').replace('#', '');
      const el = document.getElementById(id);
      if (!el) return;
      if (!sections.find((s) => s.el === el)) sections.push({ link, el });
      link.addEventListener('click', (e) => {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const href = link.getAttribute('href');
        root.querySelectorAll(`.planArticleNav__link[href="${href}"]`).forEach((l) => {
          allLinks.forEach((x) => x.classList.remove('is-active'));
          l.classList.add('is-active');
        });
        syncNavLabels(root, link.querySelector('.planArticleNav__text') || link);
        closeMobilePanel(root);
      });
    });

    const mobBtn = root.querySelector('.planArticleMobNav');
    const mobClose = root.querySelector('.planArticleMobNav__close');
    const mobBackdrop = root.querySelector('.planArticleMobNav__backdrop');
    if (mobBtn) {
      mobBtn.addEventListener('click', () => {
        const expanded = mobBtn.getAttribute('aria-expanded') === 'true';
        if (expanded) closeMobilePanel(root);
        else openMobilePanel(root);
      });
    }
    if (mobClose) mobClose.addEventListener('click', () => closeMobilePanel(root));
    if (mobBackdrop) mobBackdrop.addEventListener('click', () => closeMobilePanel(root));

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const match = sections.find((s) => s.el === entry.target);
          if (!match) return;
          const href = match.link.getAttribute('href');
          root.querySelectorAll(`.planArticleNav__link[href="${href}"]`).forEach((l) => {
            allLinks.forEach((x) => x.classList.remove('is-active'));
            l.classList.add('is-active');
          });
          syncNavLabels(root, match.link.querySelector('.planArticleNav__text') || match.link);
        });
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s.el));
  }

  function boot() {
    document.querySelectorAll('[data-plan-article]').forEach(initArticle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
