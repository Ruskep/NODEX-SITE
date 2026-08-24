export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/streams" && url.searchParams.has("logins")) {
      const logins = url.searchParams
        .get("logins")
        .split(",")
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean);

      if (logins.length === 0) {
        return json(cors, { data: [] });
      }

      const token = await getAppToken(env);

      const streamParams = logins.map((l) => `user_login=${encodeURIComponent(l)}`).join("&");
      const streamUrl = `https://api.twitch.tv/helix/streams?${streamParams}`;

      const streamRes = await fetch(streamUrl, {
        headers: twitchHeaders(env, token),
      });

      if (!streamRes.ok) {
        return json(cors, { data: [], error: "Twitch API error" }, streamRes.status);
      }

      const streamData = await streamRes.json();
      return json(cors, { data: streamData.data || [] });
    }

    return json(cors, { error: "Not found" }, 404);
  },
};

function json(headers, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });
}

function twitchHeaders(env, token) {
  return {
    "Client-ID": env.TWITCH_CLIENT_ID,
    Authorization: `Bearer ${token}`,
  };
}

let cachedToken = null;
let tokenExpiry = 0;

async function getAppToken(env) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60000) {
    return cachedToken;
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Twitch auth failed: ${detail}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600) * 1000;
  return cachedToken;
}