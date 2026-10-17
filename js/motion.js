/* Плавность и эффекты: появление блоков, прогресс-бар, курсорное свечение,
   подсветка карточек, магнитные кнопки, плавные переходы между страницами */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/css/motion.css';
  document.head.appendChild(css);
  document.documentElement.classList.add('js-motion');

  var bar = document.createElement('div');
  bar.className = 'scroll-bar';
  document.body.appendChild(bar);

  /* прогресс прокрутки и уплотнение шапки */
  function onScroll() {
    var h = document.documentElement;
    var p = h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1);
    bar.style.transform = 'scaleX(' + p + ')';
    var n = document.querySelector('.nav');
    if (n) n.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* появление блоков при прокрутке */
  var SEL = '.sec-head, .tiles, .tile, .card, .news-card, .season-row, .staff-card, .mod, .acc-item, .cta, .frame, .placeholder, .steps li, .checks li, .callout, .shot, .info-row, .a-item';
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function tag(root) {
    root.querySelectorAll(SEL).forEach(function (el) {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      var idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(idx, 6) * 90 + 'ms');
      if (reduce) el.classList.add('in');
      else io.observe(el);
    });
  }
  tag(document);

  /* блоки, которые подгружаются позже (новости, персонал) */
  var t;
  new MutationObserver(function () {
    clearTimeout(t);
    t = setTimeout(function () { tag(document); onScroll(); }, 80);
  }).observe(document.body, { childList: true, subtree: true });

  /* магнитные кнопки */
  if (fine && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (!b) return;
      var r = b.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) * 0.18;
      var y = (e.clientY - (r.top + r.height / 2)) * 0.25;
      b.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (b && !b.contains(e.relatedTarget)) b.style.transform = '';
    });
  }

  /* плавный переход между страницами */
  document.addEventListener('click', function (e) {
    if (reduce || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(function () { location.href = a.href; }, 220);
  });
  window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });

  document.body.classList.add('loaded');
})();
