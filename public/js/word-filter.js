/* ===== WordFilter: библиотека фильтра мата и оскорблений =====
   Использование:
     WordFilter.sanitizeName(ник, maxLen=16) -> { ok, value | reason }
     WordFilter.hasProfanity(text) -> true|false
   reason: 'empty' | 'short' | 'long' | 'badword'
*/
(function (global) {
  'use strict';

  function collapse(s) {
    return s.replace(/(.)\1+/g, '$1');
  }

  // нормализация под кириллицу: унификация похожих букв + снятие повторов
  function normCy(input) {
    return collapse(String(input == null ? '' : input)
      .toLowerCase()
      .replace(/[aа]/g, 'а').replace(/[eеё]/g, 'е').replace(/[oо0]/g, 'о')
      .replace(/[bв]/g, 'в').replace(/[kк]/g, 'к').replace(/[xх]/g, 'х')
      .replace(/[cсs]/g, 'с').replace(/[tт]/g, 'т').replace(/[mм]/g, 'м')
      .replace(/[hн]/g, 'н').replace(/[yуu]/g, 'у').replace(/[pр]/g, 'р')
      .replace(/[з3z]/g, 'з').replace(/[иi1l]/g, 'и').replace(/[д]/g, 'д')
      .replace(/[ъь]/g, '')
      .replace(/[^а-яё]/g, ''));
  }

  // вариант без цифр — ловит "ху0й", "п3зд" и т.п.
  function normCyDrop(input) {
    return collapse(String(input == null ? '' : input)
      .toLowerCase()
      .replace(/[aа]/g, 'а').replace(/[eеё]/g, 'е').replace(/[oо]/g, 'о')
      .replace(/[bв]/g, 'в').replace(/[kк]/g, 'к').replace(/[xх]/g, 'х')
      .replace(/[cсs]/g, 'с').replace(/[tт]/g, 'т').replace(/[mм]/g, 'м')
      .replace(/[hн]/g, 'н').replace(/[yуu]/g, 'у').replace(/[pр]/g, 'р')
      .replace(/[зz]/g, 'з').replace(/[иil]/g, 'и').replace(/[д]/g, 'д')
      .replace(/[ъь\d]/g, '')
      .replace(/[^а-яё]/g, ''));
  }

  // нормализация под латиницу: лёгкий leet + снятие повторов
  function normEn(input) {
    return collapse(String(input == null ? '' : input)
      .toLowerCase()
      .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
      .replace(/5/g, 's').replace(/7/g, 't').replace(/@/g, 'a').replace(/\$/g, 's')
      .replace(/[^a-z]/g, ''));
  }

  var BANNED_CY = [
    'хуй', 'хуя', 'хуе', 'хуи', 'хуем', 'хуйло', 'хуесос', 'хуесо', 'хуета', 'хуйня',
    'пизд', 'пиздец', 'пиздуй', 'бля', 'бляд', 'блят',
    'еб', 'еба', 'ебал', 'выеб', 'наеб', 'заеб', 'проеб', 'ебан', 'ебу', 'ёб', 'ебл', 'еблан',
    'сука', 'сук', 'гандон', 'гандош', 'шлюх', 'шлюш', 'мудак', 'мудил', 'мудозвон',
    'залуп', 'манда', 'пидор', 'пидра', 'пидр', 'пидарас', 'пидорас',
    'дебил', 'даун', 'идиот', 'сволоч', 'тварь', 'твари', 'урод', 'уродк', 'быдло',
    'мраз', 'падла', 'падло', 'шалава', 'курва', 'чмо', 'дурак', 'дурач',
    'жопа', 'жопе', 'жопы', 'жопо', 'засран', 'осран', 'говно', 'говня', 'нахуй', 'похуй', 'охуй', 'ахуй',
    'пенис', 'пениса', 'письк', 'писюн', 'письк', 'член'
  ];

  var BANNED_EN = [
    'fuck', 'fuk', 'fuxk', 'fack', 'shit', 'bitch', 'bich', 'dick', 'cock', 'cunt', 'pussy',
    'asshole', 'damn', 'slut', 'whore', 'nigga', 'nigger', 'fag', 'faggot', 'retard',
    'bastard', 'motherfucker', 'bullshit', 'wanker', 'dipshit', 'dumbass', 'fucker', 'penis', 'dick', 'boner'
  ];

  function hasProfanity(input) {
    if (input == null) return false;
    var cy = normCy(input);
    var cy2 = normCyDrop(input);
    for (var i = 0; i < BANNED_CY.length; i++) {
      if (cy.indexOf(BANNED_CY[i]) !== -1 || cy2.indexOf(BANNED_CY[i]) !== -1) return true;
    }
    var en = normEn(input);
    for (var j = 0; j < BANNED_EN.length; j++) {
      if (en.indexOf(BANNED_EN[j]) !== -1) return true;
    }
    return false;
  }

  function sanitizeName(input, maxLen) {
    maxLen = maxLen || 16;
    var value = String(input == null ? '' : input).replace(/\s+/g, ' ').trim();
    if (!value) return { ok: false, reason: 'empty' };
    if (value.length < 2) return { ok: false, reason: 'short' };
    if (value.length > maxLen) return { ok: false, reason: 'long' };
    if (hasProfanity(value)) return { ok: false, reason: 'badword' };
    return { ok: true, value: value };
  }

  global.WordFilter = {
    hasProfanity: hasProfanity,
    sanitizeName: sanitizeName,
    normalize: function (s) { return normCy(s); }
  };
})(typeof window !== 'undefined' ? window : this);