// פרוקסי חסר-מצב יחיד ל-API-Football (CLAUDE.md §7).
// passthrough בלבד: מזריק את המפתח, מוסיף CORS, מעביר הלאה. ללא DB / auth / אחסון.
// פריסה: supabase functions deploy apifootball-proxy --no-verify-jwt
// סוד נדרש: APISPORTS_KEY (supabase secrets set APISPORTS_KEY=...). אופציונלי: ALLOWED_ORIGIN.

const UPSTREAM = 'https://v3.football.api-sports.io';
const API_KEY = Deno.env.get('APISPORTS_KEY') ?? '';
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';

const cors: Record<string, string> = {
  'access-control-allow-origin': ALLOWED_ORIGIN,
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, apikey, x-client-info',
  'access-control-max-age': '86400',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'GET') {
    return json({ error: 'method not allowed' }, 405);
  }
  if (!API_KEY) {
    return json({ error: 'APISPORTS_KEY missing in function secrets' }, 500);
  }

  const url = new URL(req.url);
  // מסירים את קידומת ה-routing של Supabase (…/functions/v1/apifootball-proxy)
  // ומעבירים את שארית הנתיב + ה-query הלאה ל-upstream.
  const path = url.pathname.replace(/^.*\/apifootball-proxy/, '') || '/';

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(UPSTREAM + path + url.search, {
      headers: { 'x-apisports-key': API_KEY, accept: 'application/json' },
    });
  } catch (err) {
    return json({ error: 'upstream fetch failed', detail: String(err) }, 502);
  }

  const body = await upstreamRes.text();
  return new Response(body, {
    status: upstreamRes.status,
    headers: { ...cors, 'content-type': 'application/json; charset=utf-8' },
  });
});

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'content-type': 'application/json; charset=utf-8' },
  });
}
