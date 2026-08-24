// ===== SERVER ONLINE STATUS (mcstatus.io) =====
(function() {
  var STATUS_URL = 'https://api.mcstatus.io/v2/status/java/nodexsus63hsugn5.minecraft.surf';
  var HIDDEN_NICKS = ['WHO_IS_I', 'Qexar'];
  var cache = null;
  var inflight = null;

  function isHidden(name) {
    var low = String(name == null ? '' : name).trim().toLowerCase();
    return HIDDEN_NICKS.some(function(h) { return low === String(h).toLowerCase(); });
  }

  function normalize(d) {
    var names = ((d.players && d.players.list) || [])
      .map(function(p) { return p.name_clean || p.name_raw || ''; })
      .filter(Boolean);
    var visible = names.filter(function(n) { return !isHidden(n); });
    var rawOnline = (d.players && d.players.online) || 0;
    return {
      online: !!d.online,
      version: (d.version && (d.version.name_clean || d.version.name_raw || '')) || '',
      onlineCount: Math.max(0, rawOnline - (names.length - visible.length)),
      maxPlayers: (d.players && d.players.max) || 0,
      players: visible
    };
  }

  window.getServerStatus = function() {
    if (cache && Date.now() - cache.at < 45000) {
      return Promise.resolve(cache.data);
    }
    if (inflight) return inflight;
    inflight = fetch(STATUS_URL)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        cache = { at: Date.now(), data: normalize(data) };
        return cache.data;
      })
      .catch(function() {
        return { online: false, version: '', onlineCount: 0, maxPlayers: 0, players: [], failed: true };
      })
      .then(function(data) {
        inflight = null;
        return data;
      });
    return inflight;
  };

  // ===== HOMEPAGE STATUS PANEL =====
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderPanel() {
    var wrap = document.getElementById('serverLive');
    if (!wrap) return;

    function paint(s) {
      var dot = document.getElementById('scDot');
      var title = document.getElementById('scTitle');
      var meta = document.getElementById('scMeta');
      var players = document.getElementById('scPlayers');

      if (s.online) {
        dot.className = 'server-live__dot on';
        title.textContent = 'Сервер онлайн';
        title.classList.add('ok');
        meta.textContent = (s.version || 'Minecraft') + ' · ' + s.onlineCount + '/' + s.maxPlayers;
        if (s.players.length) {
          players.classList.remove('server-live__players--off');
          players.innerHTML = s.players.map(function(n) {
            return '<a class="server-live__player" href="/player?id=' + encodeURIComponent(n.toLowerCase()) + '">' + esc(n) + '</a>';
          }).join('');
        } else {
          players.classList.add('server-live__players--off');
          players.innerHTML = '<span class="server-live__empty">Сейчас на сервере никого нет</span>';
        }
      } else if (s.failed) {
        dot.className = 'server-live__dot off';
        title.classList.remove('ok');
        title.textContent = 'Не удалось проверить статус';
        meta.textContent = '';
        players.classList.add('server-live__players--off');
        players.innerHTML = '';
      } else {
        dot.className = 'server-live__dot off';
        title.classList.remove('ok');
        title.textContent = 'Сервер недоступен';
        meta.textContent = 'Возможно, идут технические работы';
        players.classList.add('server-live__players--off');
        players.innerHTML = '';
      }
    }

    window.getServerStatus().then(paint);
    setInterval(function() {
      cache = null;
      window.getServerStatus().then(paint);
    }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPanel);
  } else {
    renderPanel();
  }
})();
