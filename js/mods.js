(function () {
  var B = window.BUILDS, M = window.MODS;
  var grid = document.getElementById('buildGrid');
  var detail = document.getElementById('buildDetail');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var sel = 'min';

  /* 3D-иконка: объёмный куб или сфера, в каждом цвете сборки */
  function icon3d(b, id) {
    var c = b.color, g = 'g' + id;
    var defs = '<defs>' +
      '<linearGradient id="' + g + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>' +
      '<linearGradient id="' + g + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient>' +
      '<linearGradient id="' + g + 'c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>' +
      '<radialGradient id="' + g + 's" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[2] + '"/></radialGradient>' +
      '</defs>';
    if (id === 'blog') {
      return '<svg viewBox="0 0 120 120" aria-hidden="true">' + defs +
        '<ellipse cx="60" cy="108" rx="34" ry="6" fill="#000" opacity=".35"/>' +
        '<circle cx="60" cy="58" r="44" fill="url(#' + g + 's)"/>' +
        '<path d="M50 40 L80 58 L50 76 Z" fill="#fff" opacity=".95"/>' +
        '<path d="M50 40 L80 58 L50 58 Z" fill="#fff" opacity=".4"/>' +
        '</svg>';
    }
    if (id === 'max') {
      return '<svg viewBox="0 0 120 120" aria-hidden="true">' + defs +
        '<ellipse cx="60" cy="110" rx="44" ry="6" fill="#000" opacity=".35"/>' +
        '<polygon points="60,8 92,26 60,44 28,26" fill="' + c[0] + '"/>' +
        '<polygon points="28,26 60,44 60,80 28,62" fill="url(#' + g + 'a)"/>' +
        '<polygon points="92,26 60,44 60,80 92,62" fill="url(#' + g + 'b)"/>' +
        '<polygon points="60,44 92,62 60,80 28,62" fill="url(#' + g + 'c)" opacity=".0"/>' +
        '<polygon points="30,70 60,86 60,116 30,100" fill="' + c[2] + '"/>' +
        '<polygon points="60,86 90,70 90,100 60,116" fill="' + c[1] + '"/>' +
        '<polygon points="30,70 60,54 90,70 60,86" fill="' + c[0] + '"/>' +
        '</svg>';
    }
    return '<svg viewBox="0 0 120 120" aria-hidden="true">' + defs +
      '<ellipse cx="60" cy="108" rx="34" ry="6" fill="#000" opacity=".35"/>' +
      '<polygon points="60,18 98,40 60,62 22,40" fill="' + c[0] + '"/>' +
      '<polygon points="22,40 60,62 60,104 22,82" fill="url(#' + g + 'a)"/>' +
      '<polygon points="98,40 60,62 60,104 98,82" fill="url(#' + g + 'b)"/>' +
      '</svg>';
  }

  function renderGrid() {
    grid.innerHTML = B.map(function (b) {
      return '<button type="button" class="build-card' + (b.id === sel ? ' active' : '') + '" role="radio" aria-checked="' + (b.id === sel) + '" data-id="' + b.id + '" style="--c1:' + b.color[0] + ';--c2:' + b.color[1] + '">' +
        '<span class="b-glow"></span>' +
        '<span class="b-icon">' + icon3d(b, b.id) + '</span>' +
        '<span class="b-tag">' + esc(b.tag) + '</span>' +
        '<span class="b-name">' + esc(b.name) + '</span>' +
        '<span class="b-desc">' + esc(b.desc) + '</span>' +
        '<ul class="b-specs">' + b.specs.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
        '<span class="b-pick">' + (b.id === sel ? 'Выбрано' : 'Выбрать') + '</span>' +
        '</button>';
    }).join('');
  }

  function modCard(m) {
    var img = m.icon ? '<img src="' + esc(m.icon) + '" alt="" loading="lazy">' : '<span class="m-letter">' + esc(m.name.charAt(0)) + '</span>';
    return '<article class="m-card' + (m.custom ? ' custom' : '') + '">' +
      '<div class="m-top"><div class="m-ico">' + img + '</div>' +
      '<div><h3>' + esc(m.name) + ' ' +
      (m.custom ? '<span class="pill">Кастомный</span>' : '') +
      (m.lib ? '<span class="pill lib">Библиотека</span>' : '') + '</h3>' +
      '<div class="ver">' + (m.ver ? '1.21.11 · ' + esc(m.ver) : '1.21.11') + '</div></div></div>' +
      '<p>' + esc(m.desc) + '</p>' +
      (m.url ? '<a href="' + esc(m.url) + '" target="_blank" rel="noopener">Открыть на Modrinth →</a>' : '') +
      '</article>';
  }

  function renderDetail() {
    var b = B.filter(function (x) { return x.id === sel; })[0];
    var list = (b.mods || []).map(function (k) { return M[k]; }).filter(Boolean);
    var hasMods = list.length > 0;
    var nodex = M['nodex-mod'];
    var all = [nodex].concat(list);
    var dl = b.download
      ? '<a class="btn btn-accent btn-lg dl-btn" href="' + esc(b.download) + '" download>Скачать сборку «' + esc(b.name) + '»</a>'
      : '<span class="btn btn-lg dl-btn is-disabled">Скачивание скоро</span>';

    detail.innerHTML =
      '<div class="detail-head">' +
        '<div><span class="pill">Сборка</span><h2>' + esc(b.name) + '</h2><p class="lead">' + esc(b.desc) + '</p></div>' +
        '<div class="detail-dl">' + dl + '<span class="muted small">Версия 1.21.11 · Fabric</span></div>' +
      '</div>' +
      '<div class="steps-row">' +
        '<div class="step"><b>1</b><span>Установи Fabric Loader 1.21.11</span></div>' +
        '<div class="step"><b>2</b><span>Скачай архив и распакуй в папку <code>.minecraft</code> (или в экземпляр Prism)</span></div>' +
        '<div class="step"><b>3</b><span>Запусти игру и выбери профиль Fabric 1.21.11</span></div>' +
      '</div>' +
      '<h3 class="list-title">Моды в сборке</h3>' +
      (hasMods
        ? '<div class="mods-grid">' + all.filter(Boolean).map(modCard).join('') + '</div>'
        : '<div class="mods-grid">' + (nodex ? modCard(nodex) : '') + '</div>' +
          '<div class="placeholder soon"><h3>Остальной список скоро</h3>Моды для этой сборки добавляются. Nodex-MOD входит во все сборки.</div>');
  }

  grid.addEventListener('click', function (e) {
    var c = e.target.closest('.build-card');
    if (!c) return;
    sel = c.dataset.id;
    renderGrid();
    renderDetail();
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  renderGrid();
  renderDetail();
})();
