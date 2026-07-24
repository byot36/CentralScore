// CentralScore — proxy Cloudflare Worker pentru API-urile de fotbal + sistem
// de push notifications (Firebase Cloud Messaging), care funcționează chiar
// și cu aplicația Android complet închisă.
//
// Rutare API:
//   /sportmonks/<path>   -> https://api.sportmonks.com/v3/football/<path>
//   /footballdata/<path> -> https://api.football-data.org/v4/<path>
//   /apifootball/<path>  -> https://v3.football.api-sports.io/<path>
//
// Push notifications:
//   POST /push/register  -> înregistrează un token FCM + echipele favorite
//   (Cron Trigger, la fiecare minut) -> verifică meciurile live ale
//   echipelor favorite înregistrate și trimite notificări prin FCM.

const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';
const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

const ALLOWED_ORIGIN = '*';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/push/register' && request.method === 'POST') {
      return handleRegisterPush(request, env, corsHeaders);
    }

    let targetUrl;
    let upstreamHeaders = { Accept: 'application/json' };

    if (url.pathname.startsWith('/footballdata/')) {
      const subPath = url.pathname.replace('/footballdata', '');
      targetUrl = new URL(FOOTBALL_DATA_BASE + subPath);
      url.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));
      upstreamHeaders['X-Auth-Token'] = env.FOOTBALL_DATA_TOKEN;
    } else if (url.pathname.startsWith('/apifootball/')) {
      const subPath = url.pathname.replace('/apifootball', '');
      targetUrl = new URL(API_FOOTBALL_BASE + subPath);
      url.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));
      upstreamHeaders['x-apisports-key'] = env.API_FOOTBALL_KEY;
    } else {
      // Compatibilitate: /sportmonks/<path> sau direct /<path> (comportament vechi).
      const subPath = url.pathname.startsWith('/sportmonks/')
        ? url.pathname.replace('/sportmonks', '')
        : url.pathname;
      targetUrl = new URL(SPORTMONKS_BASE + subPath);
      url.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));
      targetUrl.searchParams.set('api_token', env.SPORTMONKS_TOKEN);
    }

    const upstream = await fetch(targetUrl.toString(), { headers: upstreamHeaders });
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15',
      },
    });
  },

  // Rulează la fiecare minut (configurat ca Cron Trigger în Cloudflare).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkFavoriteMatches(env));
    ctx.waitUntil(checkForAppUpdate(env));
  },
};

async function handleRegisterPush(request, env, corsHeaders) {
  try {
    const { token, teams } = await request.json();
    if (!token || !Array.isArray(teams)) {
      return new Response(JSON.stringify({ error: 'token și teams sunt obligatorii' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    await env.PUSH_TOKENS.put(token, JSON.stringify({ teams, updatedAt: Date.now() }), {
      expirationTtl: 60 * 60 * 24 * 30, // token expiră singur dacă app nu mai reîmprospătează 30 zile
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// ---- Verificare meciuri + trimitere notificări ----

async function checkFavoriteMatches(env) {
  const tokenList = await env.PUSH_TOKENS.list();
  if (tokenList.keys.length === 0) return;

  const tokenTeams = new Map(); // teamName(lowercase) -> Set<fcmToken>
  for (const key of tokenList.keys) {
    const raw = await env.PUSH_TOKENS.get(key.name);
    if (!raw) continue;
    const { teams } = JSON.parse(raw);
    for (const t of teams) {
      const norm = String(t).toLowerCase();
      if (!tokenTeams.has(norm)) tokenTeams.set(norm, new Set());
      tokenTeams.get(norm).add(key.name);
    }
  }
  if (tokenTeams.size === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/matches?dateFrom=${today}&dateTo=${today}`,
    { headers: { 'X-Auth-Token': env.FOOTBALL_DATA_TOKEN, Accept: 'application/json' } }
  );
  if (!res.ok) return;
  const data = await res.json();
  const matches = data.matches ?? [];

  const accessToken = await getFcmAccessToken(env);
  if (!accessToken) return;

  for (const m of matches) {
    const homeNorm = m.homeTeam.name.toLowerCase();
    const awayNorm = m.awayTeam.name.toLowerCase();
    const interested = new Set([
      ...(tokenTeams.get(homeNorm) ?? []),
      ...(tokenTeams.get(awayNorm) ?? []),
    ]);
    if (interested.size === 0) continue;

    const stateKey = `match-${m.id}`;
    const prevRaw = await env.MATCH_STATE.get(stateKey);
    const prev = prevRaw ? JSON.parse(prevRaw) : null;
    const status = m.status;
    const homeScore = m.score.fullTime.home ?? 0;
    const awayScore = m.score.fullTime.away ?? 0;

    const events = [];
    if ((status === 'IN_PLAY' || status === 'PAUSED') && (!prev || prev.status === 'TIMED' || prev.status === 'SCHEDULED')) {
      events.push({ title: 'CentralScore', body: `${m.homeTeam.name} - ${m.awayTeam.name} a început!`, sound: 'whistle_start' });
    }
    if (status === 'FINISHED' && prev && prev.status !== 'FINISHED') {
      events.push({ title: 'CentralScore', body: `Final: ${m.homeTeam.name} ${homeScore} - ${awayScore} ${m.awayTeam.name}`, sound: 'whistle_end' });
    }
    if (prev && (homeScore !== prev.homeScore || awayScore !== prev.awayScore) && status !== 'FINISHED') {
      const scorer = homeScore > prev.homeScore ? m.homeTeam.name : m.awayTeam.name;
      events.push({ title: 'CentralScore', body: `⚽ GOL! ${scorer} — ${homeScore}-${awayScore}`, sound: 'goal_sound' });
    }

    for (const evt of events) {
      for (const fcmToken of interested) {
        await sendFcmPush(env, accessToken, fcmToken, evt);
      }
    }

    await env.MATCH_STATE.put(stateKey, JSON.stringify({ status, homeScore, awayScore }), {
      expirationTtl: 60 * 60 * 12,
    });
  }
}

// ---- Verificare versiune nouă de APK + push la toate telefoanele înregistrate ----

async function checkForAppUpdate(env) {
  // GitHub API permite 60 cereri/oră neautentificat — verificăm o dată la
  // ~10 minute (nu la fiecare rulare de minut a cron-ului) ca să nu depășim.
  const lastCheckRaw = await env.MATCH_STATE.get('app-update-last-check');
  const now = Date.now();
  if (lastCheckRaw && now - Number(lastCheckRaw) < 10 * 60_000) return;
  await env.MATCH_STATE.put('app-update-last-check', String(now), { expirationTtl: 3600 });

  try {
    const res = await fetch('https://api.github.com/repos/byot36/CentralScore/releases/latest', {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CentralScore-Worker' },
    });
    if (!res.ok) return;
    const release = await res.json();
    const latestTag = release.tag_name;
    const asset = (release.assets ?? []).find((a) => a.name === 'CentralScore.apk');
    if (!latestTag || !asset) return;

    const knownTag = await env.MATCH_STATE.get('app-latest-known-version');
    if (knownTag === latestTag) return;
    const isFirstRun = knownTag === null;
    await env.MATCH_STATE.put('app-latest-known-version', latestTag, { expirationTtl: 60 * 60 * 24 * 90 });
    if (isFirstRun) return; // nu trimitem push la prima rulare a Worker-ului, doar reținem versiunea curentă

    const tokenList = await env.PUSH_TOKENS.list();
    if (tokenList.keys.length === 0) return;
    const accessToken = await getFcmAccessToken(env);
    if (!accessToken) return;

    const version = latestTag.replace(/^v/, '');
    const evt = {
      title: 'CentralScore',
      body: `Versiunea ${version} este disponibilă. Apasă pentru a actualiza.`,
      sound: 'whistle_start',
    };
    for (const key of tokenList.keys) {
      await sendFcmPush(env, accessToken, key.name, evt);
    }
  } catch {
    // eroare de rețea/API — reîncercăm la următoarea verificare programată
  }
}

async function sendFcmPush(env, accessToken, token, { title, body, sound }) {
  try {
    await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: { notification: { sound: `${sound}.wav`, channel_id: 'centralscore-live' } },
        },
      }),
    });
  } catch {
    // token invalid/expirat — ignorăm, va fi reîmprospătat sau expiră singur din KV
  }
}

// ---- OAuth2 pentru Firebase Admin (JWT semnat cu cheia de Service Account) ----

let cachedAccessToken = null;
let cachedAccessTokenExpiry = 0;

async function getFcmAccessToken(env) {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiry - 60_000) return cachedAccessToken;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const b64url = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64urlStr = (str) => b64url(encoder.encode(str));

  const unsigned = `${b64urlStr(JSON.stringify(header))}.${b64urlStr(JSON.stringify(claims))}`;

  const pemKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const pemBody = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(unsigned));
  const jwt = `${unsigned}.${b64url(signature)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokenRes.ok) return null;
  const tokenData = await tokenRes.json();
  cachedAccessToken = tokenData.access_token;
  cachedAccessTokenExpiry = Date.now() + tokenData.expires_in * 1000;
  return cachedAccessToken;
}
