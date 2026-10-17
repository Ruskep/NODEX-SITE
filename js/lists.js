/* Рендер страниц «Новости», «Сезоны», «Персонал» из /api/content */
(async function () {
  var root = document.getElementById('list');
  if (!root) return;
  var page = document.body.dataset.page;
  var D = {};
  try { D = await fetch('/api/content', { cache: 'no-store' }).then(function (r) { return r.json(); }); } catch (e) {}
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var empty = function (t) { return '<div class="placeholder"><h3>' + t + '</h3>Скоро здесь появится информация.</div>'; };
  var STATUS = { now: 'Сейчас идёт', done: 'Завершён', soon: 'Скоро' };

  if (page === 'news') {
    var items = (D.news || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    root.innerHTML = items.length ? '<div class="news-grid">' + items.map(function (n) {
      var d = n.date ? new Date(n.date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      return '<article class="news-card">' +
        (n.img ? '<div class="news-img"><img src="' + esc(n.img) + '" alt="" loading="lazy"></div>' : '') +
        '<div class="news-body"><time>' + d + '</time><h3>' + esc(n.title) + '</h3><p>' + esc(n.text) + '</p>' +
        (n.link ? '<a class="more" href="' + esc(n.link) + '" target="_blank" rel="noopener">Подробнее →</a>' : '') +
        '</div></article>';
    }).join('') + '</div>' : empty('Новостей пока нет');
  }

  if (page === 'seasons') {
    var s = D.seasons || [];
    root.innerHTML = s.length ? '<div class="timeline">' + s.map(function (x) {
      return '<article class="season-row">' +
        '<div class="season-num">' + esc(x.num) + '</div>' +
        '<div class="season-info"><span class="pill">' + (STATUS[x.status] || '') + '</span>' +
        '<h3>' + esc(x.title) + '</h3><div class="muted season-date">' + esc(x.date) + '</div><p>' + esc(x.text) + '</p></div>' +
        (x.img ? '<div class="season-img"><img src="' + esc(x.img) + '" alt="" loading="lazy"></div>' : '') +
        '</article>';
    }).join('') + '</div>' : empty('Сезоны пока не добавлены');
  }

  if (page === 'players') {
    var st = D.staff || [];
    root.innerHTML = st.length ? '<div class="staff-grid">' + st.map(function (p) {
      var L = p.links || {};
      var links = [['youtube', 'YouTube'], ['twitch', 'Twitch'], ['discord', 'Discord']]
        .filter(function (k) { return L[k[0]]; })
        .map(function (k) { return '<a href="' + esc(L[k[0]]) + '" target="_blank" rel="noopener">' + k[1] + '</a>'; }).join('');
      return '<article class="staff-card">' +
        '<img class="avatar" src="' + esc(p.avatar || ('https://minotar.net/helm/' + encodeURIComponent(p.nick) + '/96.png')) + '" alt="" loading="lazy">' +
        '<div><h3>' + esc(p.nick) + '</h3><span class="pill">' + esc(p.role) + '</span>' +
        '<p>' + esc(p.text || '') + '</p><div class="staff-links">' + links + '</div></div></article>';
    }).join('') + '</div>' : empty('Персонал пока не добавлен');
  }
})();
