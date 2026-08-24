/* ===== NODEX LIVE EFFECTS (no dependencies) ===== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. CURSOR PARTICLES ---------- */
  function startCursorParticles() {
    if (window.nxCursorFxRunning) return;
    window.nxCursorFxRunning = true;
    if (prefersReduced) return;
    var layer = document.createElement('div');
    layer.id = 'nxCursorFx';
    document.body.appendChild(layer);
    var last = 0;
    document.addEventListener('mousemove', function (e) {
      var now = performance.now();
      if (now - last < 28) return;
      last = now;
      var p = document.createElement('div');
      var size = Math.random() * 7 + 3;
      p.style.cssText =
        'position:absolute;left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
        'width:' + size + 'px;height:' + size + 'px;border-radius:50%;' +
        'pointer-events:none;background:rgba(245,158,11,' + (Math.random() * 0.25 + 0.1) + ');' +
        'box-shadow:0 0 8px rgba(217,119,6,0.5);' +
        'transition:opacity 0.7s ease-out, transform 0.7s ease-out;';
      layer.appendChild(p);
      requestAnimationFrame(function () {
        p.style.opacity = '0';
        p.style.transform = 'translate(' + (Math.random() * 40 - 20) + 'px,' + (Math.random() * 30 - 40) + 'px) scale(0.3)';
      });
      setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 720);
    });
  }

  /* ---------- 4. SOUND HOVER (WebAudio synth) ---------- */
  var audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function hoverTick(vol) {
    if (prefersReduced) return;
    var ctx = ensureAudio();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660 + Math.random() * 80;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  }
  function startSoundHover() {
    var armed = false;
    window.addEventListener('pointerdown', function () { ensureAudio(); armed = true; }, { once: true });
    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest ? e.target.closest('a,button,.player-card,.news-card,.season-card,.link-card') : null;
      if (!el || !armed) return;
      if (e.target.closest('svg,.player-card__soc,a')) playHoverSoft();
      else playHover(el);
    });
    function playHover(el) {
      var ctx = ensureAudio();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 520 + Math.random() * 160;
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    }
  }

  /* ---------- 5. LIVE TAB TITLE ---------- */
  function startTabTitle() {
    var docTitle = document.title;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        document.title = '·· Вернись в Nodex...';
      } else {
        document.title = docTitle;
        setTimeout(function () { document.title = docTitle; }, 1600);
      }
    });
  }

  /* ---------- 6. SCROLL PROGRESS BAR ---------- */
  function startProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'nxProgress';
    document.body.appendChild(bar);
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- 7. BACK TO TOP ---------- */
  function startBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'nxTopBtn';
    btn.setAttribute('aria-label', 'Наверх');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/></svg>';
    document.body.appendChild(btn);
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', (window.scrollY || document.documentElement.scrollTop) > 320);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 8. REVEAL ON SCROLL ---------- */
  function startReveal() {
    var els = document.querySelectorAll('.nx-reveal');
    if (!els.length || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('on'); }); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('on'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- 9. HERO PARALLAX ---------- */
  function startHeroParallax() {
    if (prefersReduced) return;
    var hero = document.querySelector('.nx-hero-bg, .home-hero, .players-hero, .seasons-hero');
    if (!hero) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = (window.scrollY || document.documentElement.scrollTop) || 0;
        if (y < window.innerHeight) {
          hero.style.transform = 'translateY(' + (y * 0.25) + 'px)';
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- 10. SKELETON FOR CARDS ---------- */
  function skeletonGrid() {
    var grid = document.getElementById('playersGrid');
    if (!grid) return;
    if (!grid.getAttribute('data-skeleton')) return;
    var count = Math.min(grid.getAttribute('data-skeleton') || 6, 9);
    var html = '';
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="nx-skeleton-card" style="padding:6px 14px 18px">' +
          '<div class="nx-skeleton-head"></div>' +
          '<div class="nx-skeleton-line w60"></div>' +
          '<div class="nx-skeleton-line w40"></div>' +
        '</div>';
    }
    grid.insertAdjacentHTML('afterbegin', html);
    window.nxSkeletonGrid = grid;
  }
  function killSkeletons() {
    var g = window.nxSkeletonGrid;
    if (!g) return;
    var sk = g.querySelectorAll('.nx-skeleton-card');
    sk.forEach(function (el) { el.remove(); });
    window.nxSkeletonGrid = null;
  }

  /* ---------- BOOT ---------- */
  function boot() {
    if (!prefersReduced) {
      startCursorParticles();
      startSoundHover();
    }
    startTabTitle();
    startProgressBar();
    startBackToTop();
    startReveal();
    startHeroParallax();
    skeletonGrid();

    // Hide skeletons once grid is actually rendered
    setTimeout(function () {
      var g = document.getElementById('playersGrid');
      if (g && g.children.length && g.querySelector('.player-card')) killSkeletons();
    }, 2200);
    var origRender = null;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Export helper so pages can clear skeletons after render
  window.nxEffects = { killSkeletons: killSkeletons };
})();