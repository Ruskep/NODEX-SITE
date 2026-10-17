# Nodex 3.0 — новый дизайн (стиль VNext)

Что внутри
- index.html — главная: hero, живой статус, график онлайна за сутки, «С чего начать», CTA
- wiki.html + js/wiki-data.js + js/wiki.js — вики (все статьи «Кодекса» перенесены, картинки из /img/kb/)
- api/online.js — серверная функция Vercel: статус сервера + история онлайна
- css/style.css — единый стиль. Цвет акцента: переменная --accent (янтарный; для зелёного как у VNext: #3ee38d)
- js/common.js — шапка, подвал, ссылки (меняются в одном месте)

Подключение онлайна (Vercel → Settings → Environment Variables)
1. SERVER_IP = nodexsus63hsugn5.minecraft.surf (можно не задавать: это значение по умолчанию)
2. Vercel → Storage → создать Upstash Redis (бесплатно), подключить к проекту.
   Переменные UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN добавятся сами.
3. Redeploy.
4. Чтобы график не имел дыр, когда на сайте никого нет: cron-job.org -> GET https://ВАШ-САЙТ/api/online каждые 5 минут.

Как добавить статью в вики: новый объект в js/wiki-data.js.

## Страницы нового дизайна
index (Главная) · about (О сервере) · join (Как попасть) · faq · wiki · useful (Моды и карта)
Новости, Сезоны, Персонал, Ссылки (Firebase) остаются как есть — их файлы не трогай, шапка и подвал ведут на них.
Если в старом проекте уже есть useful.html / index.html / kb.html — новые перезапишут их (сделай копию).
