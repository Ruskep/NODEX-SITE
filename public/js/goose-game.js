/* ===== GooseGame: игра «Гусь-беглец» (самостоятельный модуль) =====
   Использование:
     <div id="gooseHost"></div>
     GooseGame.build(document.getElementById('gooseHost'));
   Зависимости (необязательные): firebase/firestore, WordFilter (word-filter.js)
*/
(function (global) {
  'use strict';

  function ic(name, size) {
    if (typeof global.nxIcon === 'function') return global.nxIcon(name, size);
    return '';
  }

  function sprite() {
    if (typeof global.NX_ICON_BASE === 'string') return global.NX_ICON_BASE;
    return 'img/icons.svg';
  }

  function build(container) {
    if (!container) return;
    container.innerHTML = '';

    var style = document.createElement('style');
    style.textContent =
      '.gg-rate{display:flex;align-items:center;justify-content:space-between;padding:0 2px 9px;}' +
      '.gg-title{font-size:12px;font-weight:800;color:#f59e0b;letter-spacing:3px;}' +
      '.gg-sub{font-size:10px;color:rgba(163,142,122,.4);letter-spacing:1.5px;margin-left:10px;}' +
      '.gg-hi{font-size:12px;font-weight:700;color:#8a7560;letter-spacing:1px;}' +
      '.gg-hi b{color:#f59e0b;}' +
      '.gg-stage{position:relative;border:1px solid rgba(217,119,6,.18);border-radius:16px;background:rgba(217,119,6,.02);overflow:hidden;}' +
      '.gg-stage canvas{display:block;width:100%;height:auto;cursor:pointer;}' +
      '.gg-center{display:flex;justify-content:center;padding-top:12px;}' +
      '.gg-btn{display:none;padding:10px 30px;border-radius:999px;border:1px solid rgba(245,158,11,.4);background:linear-gradient(180deg,#d97706,#b45309);color:#0f0c08;font-size:14px;font-weight:800;letter-spacing:.5px;cursor:pointer;font-family:inherit;}' +
      '.gg-row{margin-top:14px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:flex-start;}' +
      '.gg-box{flex:1 1 250px;max-width:340px;border:1px solid rgba(217,119,6,.16);border-radius:12px;background:rgba(217,119,6,.02);padding:12px;text-align:left;}' +
      '.gg-box__t{font-size:10px;font-weight:800;color:#f59e0b;letter-spacing:2px;margin-bottom:8px;}' +
      '.gg-list{font-size:12px;color:#8a7560;line-height:1.8;max-height:200px;overflow:auto;}' +
      '.gg-save{display:none;}' +
      '.gg-in{width:100%;box-sizing:border-box;padding:9px 12px;border-radius:10px;border:1px solid rgba(245,158,11,.3);background:rgba(6,4,3,.6);color:#ece6de;font-size:13px;outline:none;font-family:inherit;}' +
      '.gg-go{margin-top:10px;width:100%;padding:9px 0;border-radius:10px;border:1px solid rgba(245,158,11,.4);background:linear-gradient(180deg,#d97706,#b45309);color:#0f0c08;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;}' +
      '.gg-msg{font-size:11px;color:#d97706;margin-top:8px;min-height:14px;}' +
      '.gg-line{display:flex;justify-content:space-between;gap:10px;}' +
      '.gg-line--me{background:rgba(217,119,6,.12);border-radius:6px;padding:0 6px;}' +
      '.gg-rank{font-weight:700;min-width:22px;}' +
      '.gg-medal{width:14px;height:14px;fill:currentColor;stroke:none;vertical-align:-2px;}' +
      '.gg-name{flex:1;color:#ece6de;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.gg-me{color:#f59e0b;font-size:10px;}' +
      '.gg-score{color:#f59e0b;font-weight:800;}';

    container.appendChild(style);

    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;z-index:1;';
    wrap.innerHTML =
      '<div class="gg-stage">' +
        '<canvas id="ggCanvas" width="900" height="260"></canvas>' +
      '</div>' +
      '<div class="gg-center"><button id="ggBtn" class="gg-btn">Играть</button></div>' +
      '<div class="gg-row">' +
        '<div class="gg-box">' +
          '<div class="gg-box__t">' + ic('trophy') + ' ТОП-10 ГУСЕЙ</div>' +
          '<div id="ggList" class="gg-list">Топ пока пуст — стань первым!</div>' +
        '</div>' +
        '<div class="gg-box gg-save" id="ggSave">' +
          '<div class="gg-box__t">' + ic('flame') + ' НОВЫЙ РЕЗУЛЬТАТ</div>' +
          '<input id="ggName" class="gg-in" maxlength="16" placeholder="Твой ник" autocomplete="off">' +
          '<button id="ggGo" class="gg-go">В ТОП!</button>' +
          '<div id="ggMsg" class="gg-msg"></div>' +
        '</div>' +
      '</div>' +
      '<div class="gg-rate" style="margin-top:12px"><span class="gg-hi">РЕКОРД <b id="ggHi">0</b></span><span style="font-size:10px;color:rgba(163,142,122,.4);letter-spacing:1.5px">ПРОБЕЛ · КЛИК · СТРЕЛКА ВВЕРХ</span></div>';

    container.appendChild(wrap);

    var canvas = document.getElementById('ggCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 900, H = 260, GROUND = 220;
    var hi = parseInt(localStorage.getItem('nodex_dino_hi') || '0', 10) || 0;
    var hiEl = document.getElementById('ggHi');
    var btn = document.getElementById('ggBtn');
    var lbList = document.getElementById('ggList');
    var lbSave = document.getElementById('ggSave');
    var lbName = document.getElementById('ggName');
    var lbGo = document.getElementById('ggGo');
    var lbMsg = document.getElementById('ggMsg');
    if (hiEl) hiEl.textContent = hi;

    var baseSpeed = 5, speed = 5, score = 0, frames = 0, legSwing = 0;
    var state = 'idle';
    var obstacles = [], spawnTimer = 0;
    var goose = { x: 80, w: 40, h: 46, y: GROUND - 46, vy: 0, onGround: true };

    var board = [];
    var savedName = localStorage.getItem('nodex_dino_name') || '';
    var myUid = localStorage.getItem('nodex_dino_uid') || '';
    var pendingScore = 0;

    function reset() {
      speed = baseSpeed; score = 0; frames = 0;
      obstacles = []; spawnTimer = 50;
      goose.y = GROUND - goose.h; goose.vy = 0; goose.onGround = true;
      state = 'run';
    }
    function jump() {
      if (!goose.onGround) return;
      goose.vy = -13.5;
      goose.onGround = false;
    }
    function spawnObstacle() {
      var kinds = ['cactus1', 'cactus2', 'block'];
      var kind = kinds[Math.floor(Math.random() * kinds.length)];
      var h = kind === 'cactus1' ? 34 : (kind === 'cactus2' ? 48 : 40);
      var w = kind === 'cactus1' ? 16 : (kind === 'cactus2' ? 22 : 30);
      obstacles.push({ kind: kind, x: W + 40, y: GROUND - h, w: w, h: h });
    }
    function collides() {
      for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        var gx = goose.x + 6, gw = goose.w - 10;
        var gy = goose.y + 8, gh = goose.h - 10;
        if (gx < o.x + o.w - 4 && gx + gw > o.x + 4 && gy < o.y + o.h && gy + gh > o.y) return true;
      }
      return false;
    }
    function drawGoose() {
      var g = goose, a = legSwing;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(13, g.h - 4, 4, 5 + Math.sin(a) * 2);
      ctx.fillRect(23, g.h - 4, 4, 5 + Math.sin(a + Math.PI) * 2);
      ctx.fillStyle = '#ece6de';
      ctx.beginPath();
      ctx.moveTo(4, 16); ctx.lineTo(-2, 6); ctx.lineTo(12, 12); ctx.closePath();
      ctx.moveTo(2, 22); ctx.lineTo(-6, 14); ctx.lineTo(10, 20); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(18, 26, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(217,119,6,.5)';
      ctx.strokeStyle = 'rgba(180,83,9,.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(13, 33);
      ctx.quadraticCurveTo(13, 20, 24, 19);
      ctx.quadraticCurveTo(31, 20, 29, 30);
      ctx.quadraticCurveTo(25, 36, 13, 33);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ece6de';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(28, 8, 8, 20, 4) : ctx.fillRect(28, 8, 8, 20);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(33, 9, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(40, 5); ctx.lineTo(47, 9); ctx.lineTo(40, 12); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(40, 12); ctx.lineTo(46, 12); ctx.lineTo(40, 14); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f0c08';
      ctx.beginPath();
      ctx.arc(35, 7, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fillRect(35.4, 6.4, .8, .8);
      ctx.restore();
    }
    function drawObstacle(o) {
      if (o.kind === 'cactus1' || o.kind === 'cactus2') {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(o.x + 3, o.y, 7, o.h);
        ctx.fillRect(o.x + 3, o.y, 13, o.h - 10);
        ctx.fillRect(o.x - 2, o.y + 6, 8, 6);
        ctx.fillRect(o.x + 7, o.y + o.h - 16, 8, 6);
        ctx.fillStyle = 'rgba(217,119,6,.55)';
        ctx.fillRect(o.x, o.y + 2, 3, 4);
        ctx.fillRect(o.x + 9, o.y + 6, 3, 4);
      } else {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = 'rgba(245,158,11,.9)';
        ctx.fillRect(o.x + 6, o.y + 6, 6, 6);
        ctx.fillRect(o.x + 18, o.y + 14, 6, 6);
        ctx.fillRect(o.x + 2, o.y + 22, 6, 6);
        ctx.fillStyle = 'rgba(15,12,8,.5)';
        ctx.fillRect(o.x, o.y + o.h - 6, o.w, 6);
      }
    }
    function gameOver() {
      state = 'over';
      if (score > hi) {
        hi = Math.floor(score);
        localStorage.setItem('nodex_dino_hi', String(hi));
        if (hiEl) hiEl.textContent = hi;
      }
      if (Math.floor(score) >= 30 && lbSave) showSavePanel();
    }
    function update() {
      if (state !== 'run') return;
      frames++;
      legSwing += 0.35;
      score += speed * 0.1;
      speed = baseSpeed + Math.pow(frames / 700, 2);

      goose.vy += 0.6;
      if (goose.vy > 10) goose.vy = 10;
      goose.y += goose.vy;
      if (goose.y >= GROUND - goose.h) { goose.y = GROUND - goose.h; goose.vy = 0; goose.onGround = true; }

      spawnTimer -= 1;
      if (spawnTimer <= 0) {
        spawnObstacle();
        spawnTimer = 50 + Math.random() * 60 - Math.min(40, frames * 0.02);
      }

      for (var i = 0; i < obstacles.length; i++) obstacles[i].x -= speed;
      obstacles = obstacles.filter(function(o) { return o.x + o.w > -50; });

      if (collides()) gameOver();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(217,119,6,.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 2); ctx.lineTo(W, GROUND + 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(217,119,6,.3)';
      for (var d = 0; d < W; d += 40) {
        var dx = ((d - (frames * speed) % 40) + W) % W;
        ctx.fillRect(dx, GROUND + 12, 18, 2);
      }
      ctx.fillStyle = 'rgba(236,230,222,.06)';
      for (var c = 0; c < 3; c++) {
        var cx = (c * 320 - (frames * speed * 0.4) % (W + 200) + (W + 200)) % (W + 200) - 100;
        var cy = 40 + c * 30;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy + 4, 14, 0, Math.PI * 2);
        ctx.arc(cx - 20, cy + 4, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      for (var i = 0; i < obstacles.length; i++) drawObstacle(obstacles[i]);
      drawGoose();
      ctx.fillStyle = 'rgba(236,230,222,.85)';
      ctx.font = '700 22px "Segoe UI",system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.floor(score)), W - 24, 34);
      if (state === 'idle') {
        ctx.fillStyle = 'rgba(236,230,222,.9)';
        ctx.font = '800 26px "Segoe UI",system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Прыгни, чтобы начать', W / 2, H / 2 - 30);
        ctx.fillStyle = 'rgba(138,117,96,.6)';
        ctx.font = '600 13px "Segoe UI",system-ui,sans-serif';
        ctx.fillText('ПРОБЕЛ · КЛИК · СТРЕЛКА ВВЕРХ', W / 2, H / 2);
      }
      if (state === 'over') {
        ctx.fillStyle = 'rgba(6,4,3,.55)';
        ctx.fillRect(0, 60, W, 90);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '800 24px "Segoe UI",system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, 96);
        ctx.fillStyle = 'rgba(236,230,222,.85)';
        ctx.font = '600 15px "Segoe UI",system-ui,sans-serif';
        ctx.fillText('Счёт ' + Math.floor(score) + '  ·  Рекорд ' + hi, W / 2, 124);
      }
      if (btn) {
        if (state === 'idle') { btn.style.display = 'inline-block'; btn.textContent = 'Играть'; }
        else if (state === 'over') { btn.style.display = 'inline-block'; btn.textContent = 'Играть ещё'; }
        else btn.style.display = 'none';
      }
    }
    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }
    function key(e) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        if (state === 'idle' || state === 'over') reset();
        else if (state === 'run') jump();
      }
    }
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function ensureUid() {
      if (myUid) return myUid;
      myUid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('nodex_dino_uid', myUid);
      return myUid;
    }
    function loadBoard() {
      if (typeof firebase === 'undefined' || !firebase.firestore) return;
      firebase.firestore().collection('leaderboard').orderBy('score', 'desc').limit(10).get()
        .then(function(snap) {
          board = [];
          snap.forEach(function(d) {
            var data = d.data();
            board.push({ name: data.name, score: data.score, uid: data.uid || '' });
          });
          renderBoard();
        })
        .catch(function() {});
    }
    function renderBoard() {
      if (!lbList) return;
      if (!board.length) {
        lbList.innerHTML = '<span style="opacity:.6">Топ пока пуст — стань первым!</span>';
        return;
      }
      lbList.innerHTML = board.slice(0, 10).map(function(e, i) {
        var medal = i === 0 ? '<svg class="gg-medal" style="color:#f59e0b"><use href="' + sprite() + '#i-medal"/></svg>'
          : (i === 1 ? '<svg class="gg-medal" style="color:#b8c4cf"><use href="' + sprite() + '#i-medal"/></svg>'
          : (i === 2 ? '<svg class="gg-medal" style="color:#cd7f32"><use href="' + sprite() + '#i-medal"/></svg>'
          : (i + 1) + '.'));
        var mine = e.uid && e.uid === myUid;
        return '<div class="gg-line' + (mine ? ' gg-line--me' : '') + '">' +
          '<span class="gg-rank" style="display:inline-flex;align-items:center;gap:3px;color:' + (i < 3 ? '#f59e0b' : '#8a7560') + '">' + medal + '</span>' +
          '<span class="gg-name">' + esc(e.name) + (mine ? ' <span class="gg-me">ты</span>' : '') + '</span>' +
          '<span class="gg-score">' + Math.floor(e.score) + '</span>' +
        '</div>';
      }).join('');
    }
    function showSavePanel() {
      pendingScore = Math.floor(score);
      lbMsg.textContent = '';
      lbName.value = savedName;
      lbSave.className = 'gg-box gg-save'; // keep display via inline
      lbSave.style.display = 'block';
      lbName.focus();
    }
    function submitScore() {
      var res = (typeof WordFilter !== 'undefined' && WordFilter.sanitizeName)
        ? WordFilter.sanitizeName(lbName.value, 16)
        : { ok: true, value: String(lbName.value || '').trim() };
      if (!res.ok) {
        lbMsg.textContent = res.reason === 'badword' ? 'Такой ник не пропустим!' : 'Ник должен быть 2–16 символов';
        return;
      }
      if (savedName && savedName !== res.value) {
        lbMsg.textContent = 'Ник закреплён за этим устройством';
        return;
      }
      savedName = res.value;
      localStorage.setItem('nodex_dino_name', savedName);
      ensureUid();
      lbGo.disabled = true;
      lbMsg.textContent = 'Записываем…';
      firebase.firestore().collection('leaderboard').where('uid', '==', myUid).limit(1).get()
        .then(function(snap) {
          var existing = null;
          snap.forEach(function(d) { existing = d; });
          if (existing) {
            var oldScore = existing.data().score || 0;
            if (pendingScore <= oldScore) return null;
            return firebase.firestore().collection('leaderboard').doc(existing.id).update({
              score: pendingScore,
              ts: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
          return firebase.firestore().collection('leaderboard').add({
            name: savedName,
            score: pendingScore,
            uid: myUid,
            ts: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .then(function() {
          loadBoard();
          lbMsg.textContent = 'Готово! Твой топ обновлён';
          lbSave.style.display = 'none';
          lbGo.disabled = false;
        })
        .catch(function() {
          lbMsg.textContent = 'Не сохранилось. Попробуй ещё раз';
          lbGo.disabled = false;
        });
    }

    document.addEventListener('keydown', key);
    canvas.addEventListener('pointerdown', function() {
      if (state === 'idle' || state === 'over') reset();
      else if (state === 'run') jump();
    });
    if (btn) btn.addEventListener('click', function() { reset(); });
    if (lbGo) lbGo.addEventListener('click', submitScore);
    if (lbName) lbName.addEventListener('keydown', function(e) { if (e.key === 'Enter') submitScore(); });

    loadBoard();
    loop();
  }

  global.GooseGame = { build: build };
})(typeof window !== 'undefined' ? window : this);