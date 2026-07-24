// CentralScore — proxy Cloudflare Worker pentru API-urile de fotbal.
// Ține cheile API secrete (setate ca "secret" în Cloudflare, nu în cod) și
// expune endpoint-uri publice sigure pe care le apelează frontend-ul static.
//
// Rutare:
//   /sportmonks/<path>   -> https://api.sportmonks.com/v3/football/<path>
//   /footballdata/<path> -> https://api.football-data.org/v4/<path>
//   /apifootball/<path>  -> https://v3.football.api-sports.io/<path>

const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';
const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

const ALLOWED_ORIGIN = '*';

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
};
