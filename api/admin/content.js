const { getContent, saveContent, clean, checkToken } = require('../../lib/store');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!checkToken(token)) return res.status(401).json({ error: 'Нужен вход' });
  try {
    if (req.method === 'GET') return res.status(200).json(await getContent());
    if (req.method === 'PUT') {
      const data = clean(req.body);
      await saveContent(data);
      return res.status(200).json({ ok: true, saved: data });
    }
    return res.status(405).json({ error: 'Метод не поддерживается' });
  } catch (e) {
    if (e.message === 'NO_STORE') return res.status(503).json({ error: 'Не подключён Upstash Redis (переменные UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN)' });
    if (e.message === 'BAD_BODY') return res.status(400).json({ error: 'Некорректные данные' });
    return res.status(500).json({ error: 'Ошибка сервера: ' + e.message });
  }
};
