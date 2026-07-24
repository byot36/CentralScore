// CentralScore — proxy Cloudflare Worker pentru API-ul Sportmonks.
// Ține cheia API secretă (setată ca "secret" în Cloudflare, nu în cod) și
// expune un endpoint public sigur pe care îl apelează frontend-ul static.
//
// Exemplu apel din frontend: GET https://<worker>.workers.dev/fixtures/date/2026-07-24
// Worker-ul adaugă automat api_token=<SPORTMONKS_TOKEN> și redirecționează cererea.

const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';

// Doar domeniul tău GitHub Pages poate folosi acest proxy.
const ALLOWED_ORIGIN = 'https://byot36.github.io';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Orice se află după domeniul worker-ului se transmite direct la Sportmonks.
    // ex: /fixtures/date/2026-07-24 -> https://api.sportmonks.com/v3/football/fixtures/date/2026-07-24
    const targetUrl = new URL(SPORTMONKS_BASE + url.pathname);
    url.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));
    targetUrl.searchParams.set('api_token', env.SPORTMONKS_TOKEN);

    const upstream = await fetch(targetUrl.toString(), {
      headers: { Accept: 'application/json' },
    });

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
};
