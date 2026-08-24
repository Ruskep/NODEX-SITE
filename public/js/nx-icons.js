/* NODEX icons helper — sprite: img/icons.svg */
(function () {
  function spriteBase() {
    var p = location.pathname;
    if (p.indexOf('/admin') === 0 || p.indexOf('/pages/') === 0) return '../img/icons.svg';
    return 'img/icons.svg';
  }
  window.NX_ICON_BASE = spriteBase();
  window.nxIcon = function (name, size) {
    var wh = size ? ' width="' + size + '" height="' + size + '"' : ' width="1em" height="1em"';
    return '<svg class="nx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + wh + '><use href="' + spriteBase() + '#i-' + name + '"/></svg>';
  };
})();
