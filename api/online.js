/**
 * /api/online — статус Minecraft сервера + история онлайна за сутки.
 *
 * Переменные окружения (Vercel → Settings → Environment Variables):
 *   SERVER_IP                  — адрес сервера (необязательно: по умолчанию nodexsus63hsugn5.minecraft.surf)
 *   UPSTASH_REDIS_REST_URL     — для истории онлайна (бесплатно: Vercel → Storage → Upstash Redis)
 *   UPSTASH_REDIS_REST_TOKEN   — (также подходят KV_REST_API_URL / KV_REST_API_TOKEN)
 *
 * Без Redis статус работает, но график будет пустым: негде хранить историю.
 * Замер пишется не чаще раза в 5 минут. Чтобы график не имел дыр ночью, пингуй
 * /api/online каждые 5 минут бесплатным cron-job.org (на Hobby Vercel cron раз в сутки).
 */
const IP = process.env.SERVER_IP || 'nodexsus63hsugn5.minecraft.surf';
const RURL = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.KV_REST_API_URL;
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = 'nodex:online';
const STEP = 5 * 60 * 1000;
const KEEP = 30 * 24 * 12;          // 30 суток замеров по 5 минут
const DAY = 24 * 60 * 60 * 1000;

async function redis(cmd) {
  const r = await fetch(RURL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RTOK, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
    signal: AbortSignal.timeout(4000)
  });
  const j = await r.json();
  return j.result;
}

async function getStatus() {
  const res = await fetch('https://api.mcstatus.io/v2/status/java/' + encodeURIComponent(IP), {
    signal: AbortSignal.timeout(7000),
    headers: { 'User-Agent': 'nodex-site' }
  });
  const j = await res.json();
  return {
    online: !!j.online,
    players: j.players ? j.players.online : 0,
    max: j.players ? j.players.max : 0,
    version: j.version ? j.version.name_clean : ''
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  if (!IP) return res.status(500).json({ error: 'SERVER_IP не задан' });

  let st;
  try { st = await getStatus(); }
  catch (e) { st = { online: false, players: 0, max: 0, version: '' }; }

  const out = { ip: IP, ...st, history: [], uptime: null };

  if (RURL && RTOK) {
    try {
      const now = Date.now();
      // формат замера: "время,online(0/1),игроков"
      const last = await redis(['LINDEX', KEY, 0]);
      const lastT = last ? Number(String(last).split(',')[0]) : 0;
      if (now - lastT >= STEP - 15000) {
        await redis(['LPUSH', KEY, now + ',' + (st.online ? 1 : 0) + ',' + st.players]);
        await redis(['LTRIM', KEY, 0, KEEP - 1]);
      }
      const raw = (await redis(['LRANGE', KEY, 0, KEEP - 1])) || [];
      const rows = raw.map((s) => s.split(',').map(Number)).reverse(); // по возрастанию времени
      out.history = rows.filter((r) => r[0] >= now - DAY).map((r) => [r[0], r[2]]);
      if (rows.length >= 12) {
        out.uptime = (rows.filter((r) => r[1] === 1).length / rows.length) * 100;
      }
    } catch (e) { /* историю не отдаём, статус остаётся */ }
  }

  res.status(200).json(out);
};
