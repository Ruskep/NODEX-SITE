# Twitch Proxy Worker для NODEX

Прокси доступ к Twitch API, чтобы Twitch client secret не использовался на клиенте.

## Деплой (один раз)

1. `npm i -g wrangler` (или `npx wrangler`)
2. Войти: `wrangler login`
3. Создать Worker из папки `worker`:
   ```
   cd worker
   wrangler deploy
   ```
4. Задать секрет Twitch (хранится только на Cloudflare):
   ```
   wrangler secret put TWITCH_CLIENT_SECRET
   ```
5. Если Client-ID отличный от `emv9acj2hq3z5d73vitn5ye4tugk1b` — тоже задать:
   ```
   wrangler secret put TWITCH_CLIENT_ID
   ```

## Подключение к сайту

После деплоя Worker получит URL вида
`https://nodex-twitch-proxy.<аккаунт>.workers.dev`.

Замените URL-заглушку `<your-subdomain>` в двух местах:

- `public/js/main.js` → `var TWITCH_PROXY_URL = '...'`
- `public/pages/content.html` → `var base = '...'`

Проверка: откройте
`https://nodex-twitch-proxy.<аккаунт>.workers.dev/streams?logins=ruskep07,ivangrozniyyt`
— должен вернуться JSON `{ "data": [...] }` (или `{"data":[]}` если никто не стримит).

## Безопасность
- Секрет открыт через `npm run deploy` — нет. Он хранится только в Cloudflare Secrets.
- Client-ID (не секретен) остаётся во фронтенде — это нормально.
- Если секрет когда-либо утёк — перегенерируйте его в кабинете Twitch
  (https://dev.twitch.tv/console/apps) и обновите командой `wrangler secret put`.