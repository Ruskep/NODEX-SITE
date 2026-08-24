// ===== MAINTENANCE MODE =====
(function() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  firebase.firestore().collection('settings').doc('maintenance').get().then(function(doc) {
    if (!doc.exists || !doc.data().enabled) return;
    if (localStorage.getItem('nodex_admin') === 'true') return;
    var el = document.createElement('div');
    el.id = 'maintOverlay';
    Object.assign(el.style, {
      position:'fixed',inset:'0',zIndex:'99999',
      background:'#060403',
      display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',
      padding:'32px',textAlign:'center',
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"
    });
    var msg = doc.data().message || 'Сайт временно недоступен. Мы уже работаем над этим!';
    el.innerHTML =
      '<style>' +
        '@keyframes mSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}' +
        '@keyframes mDrift{0%{transform:translateY(0) scale(1);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh) scale(0);opacity:0}}' +
        '@keyframes mIn{0%{opacity:0;transform:scale(.95) translateY(10px)}100%{opacity:1;transform:scale(1) translateY(0)}}' +
        '@keyframes mBreath{0%,100%{opacity:.5}50%{opacity:.8}}' +
        '@keyframes mGlow{0%,100%{box-shadow:0 0 40px rgba(217,119,6,.08),0 0 80px rgba(217,119,6,.04)}50%{box-shadow:0 0 60px rgba(217,119,6,.15),0 0 120px rgba(217,119,6,.08)}}' +
        '@keyframes mScan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}' +
        '@keyframes mDot{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.4;transform:scale(1.3)}}' +
      '</style>' +

      '<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">' +
        '<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(217,119,6,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(217,119,6,.03) 1px,transparent 1px);background-size:60px 60px;opacity:.5"></div>' +
        '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 20%,rgba(217,119,6,.08) 0%,transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(245,158,11,.05) 0%,transparent 50%)"></div>' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(217,119,6,.15),transparent);animation:mScan 4s linear infinite"></div>' +
        '<div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(217,119,6,.08),transparent);animation:mScan 4s linear infinite;animation-delay:2s"></div>' +
      '</div>' +

      '<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none" id="maintParticles"></div>' +

      '<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;animation:mIn .8s ease-out both">' +
        '<div style="margin-bottom:28px;width:88px;height:88px;border-radius:50%;border:1.5px solid rgba(217,119,6,.12);display:flex;align-items:center;justify-content:center;background:rgba(217,119,6,.02);animation:mSpin 12s linear infinite,mGlow 3s ease-in-out infinite">' +
          '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' +
        '</div>' +
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:6px;color:rgba(163,142,122,.35);font-weight:600;margin-bottom:14px">Технические работы</div>' +
        '<div style="font-size:30px;font-weight:900;color:#f59e0b;margin-bottom:6px;letter-spacing:-.5px">Скоро вернёмся</div>' +
        '<div style="font-size:12px;color:#7a6a5a;max-width:420px;line-height:1.7;margin-bottom:18px">' + msg + '</div>' +

        '<div style="width:min(720px,92vw);position:relative;z-index:1" id="gooseHost"></div>' +
      '</div>';

    document.body.prepend(el);

    // Particles
    var pContainer = document.getElementById('maintParticles');
    if (pContainer) {
      for (var i = 0; i < 30; i++) {
        (function() {
          var p = document.createElement('div');
          var size = Math.random() * 3 + 1;
          Object.assign(p.style, {
            position:'absolute',left:(Math.random()*100)+'%',bottom:'-10px',
            width:size+'px',height:size+'px',borderRadius:'50%',
            background:['#d97706','#f59e0b','#fbbf24','rgba(217,119,6,.4)'][Math.floor(Math.random()*4)],
            animation:'mDrift '+(Math.random()*8+6)+'s linear '+(Math.random()*5)+'s infinite',
            pointerEvents:'none'
          });
          pContainer.appendChild(p);
        })();
      }
    }

    // ===== DINO GAME (Гусь-беглец) — подключается через модуль goose-game.js =====
    if (typeof GooseGame !== 'undefined' && GooseGame.build) {
      var gooseHost = document.getElementById('gooseHost');
      if (gooseHost) GooseGame.build(gooseHost);
    }
    }).catch(function(){});
})();

// ===== PAGE TRANSITIONS =====
(function() {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.prepend(overlay);

  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    if (link.hasAttribute('target')) return;
    if (link.hasAttribute('download')) return;
    if (link.hostname !== location.hostname && link.href.startsWith('http')) return;
    if (link.pathname === location.pathname && link.search === location.search) return;
    if (link.getAttribute('href')?.startsWith('#')) return;

    e.preventDefault();
    overlay.classList.add('active');
    setTimeout(() => { window.location.href = link.href; }, 250);
  });

  window.addEventListener('pageshow', () => {
    overlay.classList.remove('active');
  });
})();

// ===== HEADER PILL ON SCROLL =====
(function() {
  const header = document.querySelector('.header');
  const ticker = document.querySelector('.ticker-wrap');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!header) return;
    if (!ticking) {
      requestAnimationFrame(() => {
        const threshold = ticker ? ticker.offsetHeight + 12 : 40;
        if (window.scrollY > threshold) {
          header.classList.add('header--pill');
        } else {
          header.classList.remove('header--pill');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ===== TICKER =====
(function() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  var TWITCH_PROXY_URL = 'https://nodex-twitch-proxy.nodex-twitch.workers.dev';

  let tickerRAF = null;

  function startTicker() {
    if (tickerRAF) cancelAnimationFrame(tickerRAF);
    const oneWidth = track.scrollWidth / 2;
    if (oneWidth < 1) return;
    const pxPerFrame = oneWidth / 32 / 60;
    let pos = 0;
    let running = true;

    function animate() {
      if (!running) return;
      pos -= pxPerFrame;
      if (Math.abs(pos) >= oneWidth) pos += oneWidth;
      track.style.transform = 'translateX(' + pos + 'px)';
      tickerRAF = requestAnimationFrame(animate);
    }
    tickerRAF = requestAnimationFrame(animate);

    track._stopTicker = function() { running = false; };
    track._resumeTicker = function() { if (!running) { running = true; animate(); } };
    track._addCopies = function() {
      var wrap = track.parentElement;
      if (!wrap) return;
      var avail = wrap.scrollWidth;
      var cur = track.scrollWidth;
      if (cur < avail * 2) {
        var needed = Math.ceil(avail * 2 / (cur / 2)) - 2;
        if (needed > 0) {
          var clones = [];
          for (var i = 0; i < needed; i++) {
            var el = document.createElement('div');
            el.className = 'ticker-inner';
            el.innerHTML = track.children[i % 2].innerHTML;
            clones.push(el);
          }
          for (var j = 0; j < clones.length; j++) track.appendChild(clones[j]);
        }
      }
    };
    track._addCopies();
  }

  function renderTicker(items) {
    if (tickerRAF) { cancelAnimationFrame(tickerRAF); tickerRAF = null; }
    track.style.transform = '';
    if (items.length === 0) {
      var m = '<span class="ticker-item" style="color:var(--text-faint)">Пока тут пусто!</span>';
      var f = Array(20).fill(m).join('<span class="ticker-div"></span>');
      track.innerHTML = '<div class="ticker-inner">' + f + '</div><div class="ticker-inner">' + f + '</div>';
    } else {
      var html = items.map(function(n) {
        return '<span class="ticker-item">' + (n.html || '<span class="ticker-date">' + (n.date || '') + '</span><span>' + (n.title || '') + '</span>') + '</span>';
      }).join('<span class="ticker-div"></span>');
      track.innerHTML = '<div class="ticker-inner">' + html + '</div><div class="ticker-inner">' + html + '</div>';
    }
    requestAnimationFrame(startTicker);
    setTimeout(function() { track.classList.add('ticker-track--loaded'); }, 50);

    var wrap = track.parentElement;
    if (wrap) {
      wrap.addEventListener('mouseenter', function() { if (track._stopTicker) track._stopTicker(); });
      wrap.addEventListener('mouseleave', function() { if (track._resumeTicker) track._resumeTicker(); });
    }
  }

  function loadStreamerList(callback) {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
      firebase.firestore().collection('streamers').get().then(function(snap) {
        if (snap.empty) {
          fetch('/data/content.json').then(function(r) { return r.json(); }).then(function(data) {
            callback(data.streamers || []);
          }).catch(function() { callback([]); });
        } else {
          callback(snap.docs.map(function(d) { return d.data(); }));
        }
      }).catch(function() {
        fetch('/data/content.json').then(function(r) { return r.json(); }).then(function(data) {
          callback(data.streamers || []);
        }).catch(function() { callback([]); });
      });
    } else {
      fetch('/data/content.json').then(function(r) { return r.json(); }).then(function(data) {
        callback(data.streamers || []);
      }).catch(function() { callback([]); });
    }
  }

  function addLiveStreamersToTicker(newsItems, callback) {
    loadStreamerList(function(streamers) {
      if (streamers.length === 0) { callback(newsItems); return; }
      var logins = streamers.map(function(s) { return s.username; });
      return fetch(TWITCH_PROXY_URL + '/streams?logins=' + logins.join(','))
        .then(function(r) { return r.json(); }).then(function(json) {
        var liveStreamers = (json.data || []).filter(function(s) { return s.type === 'live'; });
        liveStreamers.forEach(function(s) {
          newsItems.push({
            html: '<span class="ticker-dot"></span><span class="ticker-live">LIVE</span> <a href="https://twitch.tv/' + s.user_name + '" target="_blank" class="ticker-name" style="text-decoration:none">' + s.user_name + '</a>'
          });
        });
        callback(newsItems);
      }).catch(function() { callback(newsItems); });
    });
  }

  if (typeof firebase !== 'undefined' && firebase.apps.length) {
    var db = firebase.firestore();
    db.collection('news').orderBy('ts', 'desc').limit(10).get()
      .then(function(snap) {
        var items = snap.docs.map(function(d) { return d.data(); });
        addLiveStreamersToTicker(items, function(merged) { renderTicker(merged); });
      })
      .catch(function() {
        addLiveStreamersToTicker([], function(merged) { renderTicker(merged); });
      });
  } else {
    addLiveStreamersToTicker([], function(merged) { renderTicker(merged); });
  }
})();

// ===== REVEAL ON SCROLL =====
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((el, i) => {
      if (el.isIntersecting) {
        setTimeout(() => el.target.classList.add('on'), i * 100);
      }
    });
  }, { threshold: 0.1 });

  // Elements to animate: section headers and reveal elements (but not .card elements)
  document.querySelectorAll('.container > .section__tag:not(.reveal), .container > .section__title:not(.reveal), .container > .section__desc:not(.reveal), .reveal:not(.card)').forEach(el => observer.observe(el));
})();

// ===== MOBILE MENU =====
(function() {
  const burger = document.getElementById('burgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => mobileNav.classList.toggle('open'));
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
  }
})();

// ===== MYSTERY BUTTON =====
(function() {
  var btn = document.createElement('a');
  btn.href = '/mystery';
  btn.textContent = '???';
  btn.setAttribute('aria-label', '???');
  Object.assign(btn.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '999',
    width: '44px', height: '44px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', borderRadius: '50%', fontWeight: '900',
    fontSize: '16px', letterSpacing: '1px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-faint)',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.2s, color 0.2s, background 0.2s'
  });
  btn.addEventListener('mouseenter', function() {
    btn.style.borderColor = 'var(--amber)';
    btn.style.color = 'var(--amber)';
    btn.style.background = 'rgba(217,119,6,0.06)';
  });
  btn.addEventListener('mouseleave', function() {
    btn.style.borderColor = 'var(--border)';
    btn.style.color = 'var(--text-faint)';
    btn.style.background = 'var(--surface)';
  });
  document.body.appendChild(btn);
})();
