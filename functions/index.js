const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/v2");
const { status: pingMinecraft } = require("minecraft-server-util");

const MC_ADDRESS = process.env.MC_ADDRESS || "nodexsus63hsugn5.minecraft.surf";
const MC_PORT = parseInt(process.env.MC_PORT || "25565", 10);

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "emv9acj2hq3z5d73vitn5ye4tugk1b";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || "rnnl9fjg4zpsb6z045od1xrus8z1x0";

// Cache for app access token
let appAccessToken = null;
let tokenExpiry = 0;

async function getAppAccessToken() {
  const now = Date.now();
  if (appAccessToken && now < tokenExpiry - 60000) {
    return appAccessToken;
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error("Failed to get Twitch app access token", { error });
    throw new Error("Failed to authenticate with Twitch");
  }

  const data = await response.json();
  appAccessToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  return appAccessToken;
}

// ===== MINECRAFT SERVER ONLINE STATUS =====
// Returns current status: online flag, version, player count and nicknames.
// Minecraft Server List Ping over TCP (works with SRV records like minecraft.surf).
exports.serverStatus = onRequest(
  { cors: true, timeoutSeconds: 20 },
  async (req, res) => {
    try {
      const result = await pingMinecraft(MC_ADDRESS, MC_PORT, { timeout: 6000 });
      res.json({
        online: true,
        address: MC_ADDRESS,
        version: (result.version && result.version.name) || "",
        onlineCount: (result.players && result.players.online) || 0,
        maxPlayers: (result.players && result.players.max) || 0,
        players: (result.players && result.players.sample || []).map((p) => p.name),
      });
    } catch (err) {
      logger.warn("Minecraft ping failed", { error: err.message, address: MC_ADDRESS });
      res.json({
        online: false,
        address: MC_ADDRESS,
        version: "",
        onlineCount: 0,
        maxPlayers: 0,
        players: [],
      });
    }
  }
);

exports.getTwitchStreams = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const logins = req.query.logins;
      if (!logins) {
        return res.status(400).json({ error: "Missing 'logins' query parameter" });
      }

      const loginList = logins.split(",").map((l) => l.trim()).filter(Boolean);
      if (loginList.length === 0) {
        return res.json({ data: [] });
      }

      const token = await getAppAccessToken();
      const queryParams = loginList.map((l) => `user_login=${encodeURIComponent(l)}`).join("&");

      const response = await fetch(`https://api.twitch.tv/helix/streams?${queryParams}`, {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error("Twitch API error", { status: response.status, error });
        return res.status(502).json({ error: "Twitch API error" });
      }

      const data = await response.json();

      // Also get user info for display names and profile images
      const userQueryParams = loginList.map((l) => `login=${encodeURIComponent(l)}`).join("&");
      const userResponse = await fetch(`https://api.twitch.tv/helix/users?${userQueryParams}`, {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          "Authorization": `Bearer ${token}`,
        },
      });

      let userData = { data: [] };
      if (userResponse.ok) {
        userData = await userResponse.json();
      }

      // Merge stream data with user data
      const userMap = new Map(userData.data.map((u) => [u.login.toLowerCase(), u]));
      const enrichedData = (data.data || []).map((stream) => ({
        ...stream,
        user_info: userMap.get(stream.user_login.toLowerCase()) || null,
      }));

      res.json({ data: enrichedData });
    } catch (err) {
      logger.error("Error in getTwitchStreams", { error: err.message });
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
