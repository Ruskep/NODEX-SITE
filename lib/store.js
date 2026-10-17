/* Хранилище контента (Upstash Redis) + вход в админку.
   Переменные Vercel: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ADMIN_PASSWORD, ADMIN_SECRET */
const crypto = require('crypto');

const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = 'nodex:content';

const DEFAULTS = {
  settings: {
    ip: 'nodexsus63hsugn5.minecraft.surf',
    ip2: 'er4wgr35rg3rg3w.aboba.host',
    version: '1.21.11',
    discord: 'https://discord.gg/jUmXexAkNY'
  },
  seasons: [
    {
      num: 1,
      title: 'Новая история начинается',
      date: '31 июля 2026, 15:00 МСК',
      text: 'Сезон 1 открыт! Присоединяйся, пока история только пишется: выбирай свою роль и оставляй след в летописи Nodex.',
      img: '/img/seasons/season1_cover.png',
      status: 'now'
    }
  ],
  news: [],
  staff: []
};

const clone = (x) => JSON.parse(JSON.stringify(x));
const defaultContent = () => clone(DEFAULTS);

async function redis(args) {
  if (!REST_URL || !REST_TOKEN) throw new Error('NO_STORE');
  const r = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REST_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(5000)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

/* Читает контент. Без Redis возвращает значения по умолчанию. */
async function getContent() {
  const base = defaultContent();
  let raw;
  try { raw = await redis(['GET', KEY]); }
  catch (e) { if (e.message === 'NO_STORE') return base; throw e; }
  if (!raw) return base;
  let saved;
  try { saved = JSON.parse(raw); } catch (e) { return base; }
  return {
    settings: { ...base.settings, ...(saved.settings || {}) },
    seasons: Array.isArray(saved.seasons) ? saved.seasons : base.seasons,
    news: Array.isArray(saved.news) ? saved.news : base.news,
    staff: Array.isArray(saved.staff) ? saved.staff : base.staff
  };
}

async function saveContent(content) {
  await redis(['SET', KEY, JSON.stringify(content)]);
}

/* ---------- очистка входящих данных ---------- */
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const safeUrl = (v) => { const t = str(v, 300); return /^(https?:\/\/|\/)/.test(t) ? t : ''; };
const arr = (v, max) => (Array.isArray(v) ? v : []).filter((x) => x && typeof x === 'object').slice(0, max);

function clean(input) {
  if (!input || typeof input !== 'object') throw new Error('BAD_BODY');
  const s = input.settings || {};
  return {
    settings: {
      ip: str(s.ip, 120),
      ip2: str(s.ip2, 120),
      version: str(s.version, 30),
      discord: safeUrl(s.discord)
    },
    seasons: arr(input.seasons, 50).map((x) => ({
      num: Number(x.num) || 0,
      title: str(x.title, 120),
      date: str(x.date, 80),
      text: str(x.text, 1000),
      img: safeUrl(x.img),
      status: ['now', 'done', 'soon'].includes(x.status) ? x.status : 'soon'
    })),
    news: arr(input.news, 300).map((x) => ({
      date: /^\d{4}-\d{2}-\d{2}$/.test(x.date) ? x.date : '',
      title: str(x.title, 160),
      text: str(x.text, 2000),
      img: safeUrl(x.img),
      link: safeUrl(x.link)
    })),
    staff: arr(input.staff, 100).map((x) => {
      const l = x.links && typeof x.links === 'object' ? x.links : {};
      return {
        nick: str(x.nick, 32),
        role: str(x.role, 60),
        text: str(x.text, 600),
        avatar: safeUrl(x.avatar),
        links: { youtube: safeUrl(l.youtube), twitch: safeUrl(l.twitch), discord: safeUrl(l.discord) }
      };
    })
  };
}

/* ---------- вход ---------- */
const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';

function passwordOk(p) {
  const pw = process.env.ADMIN_PASSWORD || '';
  if (!pw || typeof p !== 'string') return false;
  const a = crypto.createHash('sha256').update(p).digest();
  const b = crypto.createHash('sha256').update(pw).digest();
  return crypto.timingSafeEqual(a, b);
}

function makeToken(hours) {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + hours * 3600e3 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + sig;
}

function checkToken(token) {
  if (!token || !secret()) return false;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return false;
  const good = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now(); }
  catch (e) { return false; }
}

module.exports = { DEFAULTS, defaultContent, getContent, saveContent, clean, passwordOk, makeToken, checkToken };
