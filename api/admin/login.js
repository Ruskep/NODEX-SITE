const { passwordOk, makeToken } = require('../../lib/store');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Метод не поддерживается' });
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: 'Не задан ADMIN_PASSWORD в настройках Vercel' });
  await new Promise((r) => setTimeout(r, 400)); // небольшая пауза против перебора
  const pw = req.body && req.body.password;
  if (!passwordOk(pw)) return res.status(401).json({ error: 'Неверный пароль' });
  res.status(200).json({ token: makeToken(12) });
};
