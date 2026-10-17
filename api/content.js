/* Публичный контент сайта: новости, сезоны, персонал, настройки */
const { getContent, defaultContent } = require('../lib/store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  try {
    res.status(200).json(await getContent());
  } catch (e) {
    res.status(200).json(defaultContent());
  }
};
