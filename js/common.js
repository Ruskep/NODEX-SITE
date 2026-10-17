/* Общие настройки + шапка/подвал для всех страниц */
window.NODEX = {
  ip: 'nodexsus63hsugn5.minecraft.surf',   // основной IP (статус и график берутся с него)
  ip2: 'er4wgr35rg3rg3w.aboba.host',        // дополнительный IP — Simple Voice Chat на нём не работает
  version: '1.21.11',
  discord: 'https://discord.gg/jUmXexAkNY',
  youtube: 'https://www.youtube.com/channel/UC7D3ZjVNYPNYoheauzTGGDw',
  vk: 'https://vk.com/nodexmine',
  shop: 'https://nodex.easydonate.ru/',
  api: '/api/online',
  nav: [
    ['/', 'Главная', 'home'],
    ['/about', 'О сервере', 'about'],
    ['/news', 'Новости', 'news'],
    ['/seasons', 'Сезоны', 'seasons'],
    ['/players', 'Персонал', 'players'],
    ['/join', 'Как попасть', 'join'],
    ['/wiki', 'Вики', 'wiki'],
    ['/mods', 'Моды', 'mods'],
    ['/links', 'Ссылки', 'links'],
    ['/faq', 'FAQ', 'faq']
  ]
};
(function () {
  const N = window.NODEX;
  const page = document.body.dataset.page || '';

  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'nav-shell';
    header.innerHTML = `
      <nav class="nav" aria-label="Основная навигация">
        <a class="brand" href="/"><img src="/img/logo.png" alt="" width="28" height="28">Nodex</a>
        <div class="nav-links" id="navLinks">
          ${N.nav.map(([href, label, key]) => `<a href="${href}" class="${key === page ? 'active' : ''}">${label}</a>`).join('')}
        </div>
        <div class="nav-cta">
          <a class="btn btn-sm btn-ghost" href="${N.shop}" target="_blank" rel="noopener">Магазин</a>
          <a class="btn btn-sm btn-accent" href="/join">Подать заявку</a>
        </div>
        <button class="burger" id="burger" aria-label="Меню" aria-expanded="false"><span></span></button>
      </nav>`;
    const burger = document.getElementById('burger');
    const links = document.getElementById('navLinks');
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <a class="brand" href="/"><img src="/img/logo.png" alt="" width="28" height="28">Nodex</a>
            <p>Приватный Minecraft сервер с уникальным лором, сезонами и дружным комьюнити.</p>
          </div>
          <div><h4>Разделы</h4><ul>
            <li><a href="/about">О сервере</a></li><li><a href="/news">Новости</a></li><li><a href="/seasons">Сезоны</a></li>
            <li><a href="/players">Персонал</a></li><li><a href="/join">Как попасть</a></li>
            <li><a href="/wiki">Вики</a></li><li><a href="/faq">FAQ</a></li><li><a href="/mods">Моды</a></li>
          </ul></div>
          <div><h4>Сообщество</h4><ul>
            <li><a href="${N.discord}" data-bind-href="discord" target="_blank" rel="noopener">Discord</a></li>
            <li><a href="${N.youtube}" target="_blank" rel="noopener">YouTube</a></li>
            <li><a href="${N.vk}" target="_blank" rel="noopener">VK</a></li>
            <li><a href="/links">Все ссылки</a></li>
          </ul></div>
          <div><h4>Подключение</h4><ul>
            <li><a href="#" class="js-copy-ip" data-copy="ip" data-bind="ip">${N.ip}</a></li>
            <li><a href="#" class="js-copy-ip" data-copy="ip2" data-bind="ip2">${N.ip2}</a> <span class="muted" style="font-size:12px">без голосового чата</span></li>
            <li><span class="muted" style="font-size:13px">Java Edition · <span data-bind="version">${N.version}</span></span></li>
            <li><a href="${N.shop}" target="_blank" rel="noopener">Магазин</a></li>
          </ul></div>
        </div>
        <div class="foot-bottom">
          <span>Nodex © 2026. Не связано с Mojang или Microsoft.</span>
          <a href="https://zakonodatelnaya-baza-nodex.gitbook.io/nodex-docs" target="_blank" rel="noopener">Правила сервера</a>
        </div>
      </div>`;
  }

  /* копирование IP */
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);
  window.nodexToast = (t) => {
    toast.textContent = t;
    toast.classList.add('show');
    clearTimeout(window.__tt);
    window.__tt = setTimeout(() => toast.classList.remove('show'), 1800);
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.js-copy-ip');
    if (!el) return;
    e.preventDefault();
    const ip = window.NODEX[el.dataset.copy || 'ip'];
    (navigator.clipboard ? navigator.clipboard.writeText(ip) : Promise.reject())
      .then(() => window.nodexToast('IP скопирован: ' + ip))
      .catch(() => window.nodexToast('Скопируй вручную: ' + ip));
  });
})();

/* настройки из админки: IP, версия, Discord */
fetch('/api/content', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
  var s = d.settings || {};
  ['ip', 'ip2', 'version', 'discord'].forEach(function (k) { if (s[k]) window.NODEX[k] = s[k]; });
  document.querySelectorAll('[data-bind]').forEach(function (el) { el.textContent = window.NODEX[el.dataset.bind]; });
  document.querySelectorAll('[data-bind-href]').forEach(function (el) { el.href = window.NODEX[el.dataset.bindHref]; });
}).catch(function () {});

/* подключаем анимации на всех страницах */
(function () {
  var s = document.createElement('script');
  s.src = '/js/motion.js';
  document.body.appendChild(s);
})();
