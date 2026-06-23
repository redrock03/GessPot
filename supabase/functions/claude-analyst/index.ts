// מנוע האנליסט (Claude LLM) — חצי ה-I/O של המנוע ההיברידי (CLAUDE.md §4 / מנוע 0).
// מקבל חבילת סטטיסטיקות (AnalystInput) של משחק, מבקש מ-Claude תחזית מכוילת ומובנית
// (structured output), ומחזיר אותה. ה-λ (expectedGoals) מוזן אצל הלקוח למתמטיקה הטהורה.
// חסר-מצב: ללא DB/auth/אחסון. המפתח חי ב-secrets, לעולם לא בלקוח.
// פריסה: supabase functions deploy claude-analyst --no-verify-jwt
// סוד נדרש: ANTHROPIC_KEY. אופציונלי: ALLOWED_ORIGIN, APP_SHARED_SECRET.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_KEY') ?? '';
const APP_SHARED_SECRET = Deno.env.get('APP_SHARED_SECRET') ?? ''; // אם מוגדר — נדרש header x-app-secret תואם

const MODEL = 'claude-opus-4-8';

// רשימת מקורות מורשים (מופרדת בפסיקים) — פיתוח (localhost) + פרודקשן (github.io). '*' = פתוח.
const ALLOWED = (Deno.env.get('ALLOWED_ORIGIN') ?? '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowOrigin = ALLOWED.includes('*') ? '*' : ALLOWED.includes(origin) ? origin : ALLOWED[0] ?? '';
  return {
    'access-control-allow-origin': allowOrigin,
    vary: 'Origin',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, apikey, x-app-secret',
    'access-control-max-age': '86400',
  };
}

// סכמת הפלט המובנה — structured outputs לא תומך min/max, לכן מנרמלים/חוסמים בקוד אח"כ.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['oneXtwo', 'expectedGoals', 'confidence', 'keyFactors', 'rationale'],
  properties: {
    oneXtwo: {
      type: 'object',
      additionalProperties: false,
      required: ['home', 'draw', 'away'],
      properties: {
        home: { type: 'number' },
        draw: { type: 'number' },
        away: { type: 'number' },
      },
    },
    expectedGoals: {
      type: 'object',
      additionalProperties: false,
      required: ['home', 'away'],
      properties: { home: { type: 'number' }, away: { type: 'number' } },
    },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    keyFactors: { type: 'array', items: { type: 'string' } },
    rationale: { type: 'string' },
  },
} as const;

const SYSTEM = `אתה אנליסט-על לכדורגל המתמחה במונדיאל 2026. אתה מפיק תחזיות מכוילות היטב למשחק יחיד.
שקול את כל האותות שסופקו יחד: בסיס 1X2 של ה-API, xG וסטטיסטיקות מתקדמות, כושר וסגנון, הסתברויות שוק (odds),
ראש-בראש, היעדרויות והשעיות, ומצב ההעפלה (מוטיבציה: חייבת ניצחון / תיקו-מספיק / משחק חסר-משמעות / גובה ומנוחה).
היה מכויל אך אל תהיה שמרני-יתר: expectedGoals ריאליסטיים — בד"כ 0.5–2.6 לכל צד במשחק שקול,
אך במפגש לא-שקול (פייבוריט ברור מול חלשה לפי odds/1X2) הפייבוריט צריך להגיע ל-2.8–3.6 והחלשה ל-0.3–0.7;
שקף את גודל הפער שבשוק ואל תכווץ ניצחונות-ענק ל-2.4/2.0. oneXtwo מסתכם ל-1 ועקבי עם השערים הצפויים.
כתוב keyFactors (2–4 פריטים) ו-rationale קצר — בעברית בלבד. החזר אך ורק את האובייקט המובנה.`;

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

Deno.serve(async (req: Request): Promise<Response> => {
  const cors = corsFor(req);
  const json = (payload: unknown, status: number): Response =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...cors, 'content-type': 'application/json; charset=utf-8' },
    });

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!ANTHROPIC_KEY) return json({ error: 'ANTHROPIC_KEY missing in function secrets' }, 500);
  if (APP_SHARED_SECRET && req.headers.get('x-app-secret') !== APP_SHARED_SECRET) {
    return json({ error: 'unauthorized' }, 401);
  }

  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return json({ error: 'body must be JSON (AnalystInput)' }, 400);
  }

  const body = {
    model: MODEL,
    max_tokens: 12000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: SCHEMA },
    },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `נתוני המשחק (JSON):\n${JSON.stringify(input)}\n\nהפק תחזית מכוילת לפי הסכמה.`,
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return json({ error: 'anthropic fetch failed', detail: String(err) }, 502);
  }

  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    return json({ error: 'anthropic error', status: res.status, detail: raw }, 502);
  }
  if (raw?.stop_reason === 'refusal') {
    return json({ error: 'model refused', detail: raw?.stop_details ?? null }, 422);
  }

  // הפלט המובנה מגיע כבלוק טקסט (אחרי בלוקי thinking).
  const blocks: Array<{ type: string; text?: string }> = raw?.content ?? [];
  const textBlock = [...blocks].reverse().find((b) => b.type === 'text' && b.text);
  if (!textBlock?.text) {
    return json({ error: 'no structured output in response', detail: raw }, 502);
  }

  let pred: {
    oneXtwo?: { home?: number; draw?: number; away?: number };
    expectedGoals?: { home?: number; away?: number };
    confidence?: string;
    keyFactors?: string[];
    rationale?: string;
  };
  try {
    pred = JSON.parse(textBlock.text);
  } catch {
    return json({ error: 'structured output not valid JSON', detail: textBlock.text }, 502);
  }

  // נרמול/חסימה — מבטיחים קלט שפוי למנוע.
  const h = Math.max(0, pred.oneXtwo?.home ?? 0);
  const d = Math.max(0, pred.oneXtwo?.draw ?? 0);
  const a = Math.max(0, pred.oneXtwo?.away ?? 0);
  const sum = h + d + a || 1;
  const prediction = {
    oneXtwo: { home: h / sum, draw: d / sum, away: a / sum },
    expectedGoals: {
      home: clamp(pred.expectedGoals?.home ?? 1.3, 0.05, 6),
      away: clamp(pred.expectedGoals?.away ?? 1.1, 0.05, 6),
    },
    confidence: (['low', 'medium', 'high'].includes(pred.confidence ?? '')
      ? pred.confidence
      : 'medium') as 'low' | 'medium' | 'high',
    keyFactors: Array.isArray(pred.keyFactors) ? pred.keyFactors.slice(0, 6) : [],
    rationale: typeof pred.rationale === 'string' ? pred.rationale : '',
  };

  return json({ prediction, usage: raw?.usage ?? null }, 200);
});
