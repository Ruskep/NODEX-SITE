(function () {
  const data = window.WIKI;
  const flat = [];
  data.forEach((g) => g.items.forEach((a) => flat.push(Object.assign({ group: g.group }, a))));

  const nav = document.getElementById('sideNav');
  const art = document.getElementById('article');
  const q = document.getElementById('q');
  const side = document.getElementById('side');
  const toggle = document.getElementById('sideToggle');

  const strip = (h) => h.replace(/<[^>]+>/g, ' ');
  flat.forEach((a) => (a._text = (a.title + ' ' + a.sub + ' ' + strip(a.html)).toLowerCase()));

  function renderNav(filter) {
    const f = (filter || '').trim().toLowerCase();
    let html = '', any = false;
    data.forEach((g) => {
      const items = g.items.filter((a) => !f || flat.find((x) => x.id === a.id)._text.includes(f));
      if (!items.length) return;
      any = true;
      html += '<div class="side-group"><h4>' + g.group + '</h4>' +
        items.map((a) => '<a class="side-link" href="#' + a.id + '" data-id="' + a.id + '"><span>' + a.title + '</span>' +
          (a.isNew ? '<span class="tag-new">NEW</span>' : '') + '</a>').join('') + '</div>';
    });
    nav.innerHTML = any ? html : '<div class="side-empty">Ничего не найдено</div>';
    markActive();
  }

  function markActive() {
    const id = currentId();
    nav.querySelectorAll('.side-link').forEach((l) => l.classList.toggle('active', l.dataset.id === id));
  }

  function currentId() {
    const h = decodeURIComponent(location.hash.replace('#', ''));
    return flat.some((a) => a.id === h) ? h : flat[0].id;
  }

  function renderArticle() {
    const id = currentId();
    const i = flat.findIndex((a) => a.id === id);
    const a = flat[i], prev = flat[i - 1], next = flat[i + 1];
    document.title = a.title + ' — Вики Nodex';
    art.innerHTML =
      '<div class="crumbs">Вики / ' + a.group + ' / <b>' + a.title + '</b></div>' +
      '<div class="banner"><h1>' + a.title + '</h1><small>nodex</small></div>' +
      '<p class="sub">' + a.sub + '</p>' + a.html +
      '<div class="pager">' +
        (prev ? '<a href="#' + prev.id + '"><small>Назад</small>' + prev.title + '</a>' : '<a class="ghost"></a>') +
        (next ? '<a href="#' + next.id + '"><small>Дальше</small>' + next.title + '</a>' : '<a class="ghost"></a>') +
      '</div>';
    markActive();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    side.classList.remove('open');
  }

  q.addEventListener('input', () => renderNav(q.value));
  window.addEventListener('hashchange', renderArticle);
  toggle.addEventListener('click', () => side.classList.toggle('open'));

  renderNav('');
  renderArticle();
})();
