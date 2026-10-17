/* Онлайн сервера: статус + график за последние 24 часа. Данные: /api/online */
(function () {
  const $ = (id) => document.getElementById(id);
  const REFRESH = 60 * 1000;
  const DAY = 24 * 3600 * 1000;
  const GAP = 20 * 60 * 1000;   // разрыв больше 20 минут = линия прерывается

  function setStatus(d) {
    const on = d && d.online;
    $('statusDot').className = 'dot ' + (on ? 'on' : 'off');
    $('statusText').textContent = on ? 'Сервер онлайн' : 'Сервер оффлайн';
    $('statusPlayers').textContent = on ? '· ' + d.players + ' из ' + d.max + ' игроков' : '';
    $('statusVersion').textContent = d.version ? '· версия ' + d.version : '';
    $('nowCount').textContent = on ? d.players : '0';
    $('nowLabel').textContent = on ? 'сейчас на сервере' : 'сервер недоступен';
    $('iStatus').textContent = on ? 'Онлайн' : 'Оффлайн';
    $('iPlayers').textContent = on ? d.players + ' / ' + d.max : '—';
    $('iVersion').textContent = d.version || window.NODEX.version;
    $('uptime').innerHTML = d.uptime != null ? 'аптайм за месяц <b>' + d.uptime.toFixed(1) + '%</b>' : '';
  }

  const fmt = (t) => new Date(t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  /* сглаженная кривая (Catmull-Rom → Bezier) */
  function smooth(pts) {
    if (pts.length < 2) return '';
    let d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
    }
    return d;
  }

  function drawChart(history) {
    const box = $('chart');
    const empty = $('chartEmpty');
    box.querySelectorAll('svg,.chart-tip').forEach((n) => n.remove());

    const t1 = Date.now(), t0 = t1 - DAY;               // окно: последние 24 часа
    const data = (history || []).filter((h) => h[0] >= t0 && h[0] <= t1 + 60000);
    if (data.length < 2) {
      empty.style.display = 'flex';
      empty.textContent = 'Собираем статистику за последние 24 часа. График заполнится за день.';
      return;
    }
    empty.style.display = 'none';

    const W = 700, H = 210, L = 28, R = 10, T = 12, B = 26;
    const maxV = Math.max(2, Math.max.apply(null, data.map((h) => h[1])));
    const yMax = Math.ceil(maxV / 2) * 2;
    const X = (t) => L + ((t - t0) / DAY) * (W - L - R);
    const Y = (v) => T + (1 - v / yMax) * (H - T - B);

    /* разбиваем на отрезки без больших разрывов */
    const runs = [[data[0]]];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] - data[i - 1][0] > GAP) runs.push([]);
      runs[runs.length - 1].push(data[i]);
    }
    let paths = '';
    runs.forEach((run) => {
      if (run.length < 2) return;
      const pts = run.map((h) => [X(h[0]), Y(h[1])]);
      const line = smooth(pts);
      const area = line + ' L' + pts[pts.length - 1][0] + ',' + (H - B) + ' L' + pts[0][0] + ',' + (H - B) + ' Z';
      paths += '<path d="' + area + '" fill="url(#g)"/>' +
               '<path d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
    });

    let grid = '';
    for (let i = 0; i <= 3; i++) {
      const v = (yMax / 3) * i, yy = Y(v);
      grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--line)" stroke-dasharray="3 5"/>' +
        '<text x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end" fill="var(--muted)" font-size="11">' + Math.round(v) + '</text>';
    }
    let xl = '';
    for (let i = 0; i <= 6; i++) {
      const t = t0 + (DAY / 6) * i;
      xl += '<text x="' + X(t) + '" y="' + (H - 6) + '" text-anchor="middle" fill="var(--muted)" font-size="11">' + fmt(t) + '</text>';
    }
    const last = data[data.length - 1];
    const lastPt = '<circle cx="' + X(last[0]) + '" cy="' + Y(last[1]) + '" r="4.5" fill="var(--accent)"/>';

    box.insertAdjacentHTML('beforeend',
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Онлайн за последние 24 часа">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>' +
      grid + xl + paths + lastPt + '</svg>');

    /* подсказка при наведении */
    const tip = document.createElement('div');
    tip.className = 'chart-tip';
    box.appendChild(tip);
    const move = (clientX) => {
      const r = box.getBoundingClientRect();
      const px = ((clientX - r.left) / r.width) * W;
      let best = data[0], bd = 1e9;
      data.forEach((h) => { const dd = Math.abs(X(h[0]) - px); if (dd < bd) { bd = dd; best = h; } });
      tip.textContent = fmt(best[0]) + ' · ' + best[1] + ' онлайн';
      tip.style.left = (X(best[0]) / W) * 100 + '%';
      tip.style.top = (Y(best[1]) / H) * 100 + '%';
      tip.style.opacity = 1;
    };
    box.onmousemove = (e) => move(e.clientX);
    box.ontouchmove = (e) => move(e.touches[0].clientX);
    box.onmouseleave = () => (tip.style.opacity = 0);
  }

  function explain(status) {
    if (status === 401) return 'сайт закрыт Vercel Authentication — отключи защиту или войди в аккаунт';
    if (status === 404) return 'функция /api/online не найдена — проверь, что папка api/ задеплоена';
    if (status === 500 || status === 503) return 'ошибка на сервере — проверь переменные Upstash в Vercel';
    return 'нет связи с сервером данных';
  }

  async function load() {
    try {
      const r = await fetch(window.NODEX.api, { cache: 'no-store' });
      if (!r.ok) { const e = new Error(r.status); e.status = r.status; throw e; }
      const d = await r.json();
      setStatus(d);
      drawChart(d.history);
    } catch (e) {
      $('statusText').textContent = 'Нет данных о сервере';
      $('statusDot').className = 'dot';
      $('chartEmpty').style.display = 'flex';
      $('chartEmpty').textContent = 'Не удалось получить данные: ' + explain(e.status) + '.';
    }
  }
  load();
  setInterval(load, REFRESH);
})();
