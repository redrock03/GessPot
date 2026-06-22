// שכבת ה-HTTP לגבול ה-API-Football. כל קריאה עוברת דרך envelope + ולידציית zod (CLAUDE.md §14).
// מעבר לגבול הזה — רק domain types. כאן בלבד יודעים על צורת התשובה הגולמית.
import { z } from 'zod';
import { API_BASE } from '../config';
import { ApiError } from './errors';

export type QueryValue = string | number | boolean | undefined;

/**
 * מעטפת התשובה האחידה של API-Football:
 * { get, parameters, errors, results, paging, response: [...] }.
 * `errors` הוא [] כשאין שגיאות, או אובייקט {field: message} כשיש.
 */
const errorsSchema = z.union([z.array(z.string()), z.record(z.string(), z.string())]);

function envelope<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    errors: errorsSchema.optional().default([]),
    results: z.number().optional(),
    response: z.array(item),
  });
}


function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, String(v));
    }
  }
  const query = qs.toString();
  const base = API_BASE.replace(/\/$/, '');
  return `${base}${path}${query ? `?${query}` : ''}`;
}

function apiErrorsToMessage(errors: z.infer<typeof errorsSchema>): string | null {
  if (Array.isArray(errors)) return errors.length ? errors.join('; ') : null;
  const entries = Object.entries(errors);
  return entries.length ? entries.map(([k, v]) => `${k}: ${v}`).join('; ') : null;
}

/**
 * GET טיפוסי: בונה URL, מושך, מאמת envelope + item schema, ומחזיר את מערך ה-response.
 * זורק `ApiError` ממובחן בכל כשל (רשת / HTTP / שגיאת-API / ולידציה).
 */
async function fetchRaw(path: string, params?: Record<string, QueryValue>): Promise<unknown> {
  const url = buildUrl(path, params);
  let res: Response;
  try {
    res = await fetch(url, { headers: { accept: 'application/json' } });
  } catch (err) {
    throw new ApiError('network', 'קריאת הרשת נכשלה', { detail: err });
  }
  if (!res.ok) {
    throw new ApiError('http', `HTTP ${res.status}`, { status: res.status });
  }
  try {
    return await res.json();
  } catch (err) {
    throw new ApiError('validation', 'התשובה אינה JSON תקין', { detail: err });
  }
}

export async function apiGet<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  params?: Record<string, QueryValue>,
): Promise<T[]> {
  const raw = await fetchRaw(path, params);
  const parsed = envelope(itemSchema).safeParse(raw);
  if (!parsed.success) {
    throw new ApiError('validation', 'התשובה לא תאמה את הסכמה', { detail: parsed.error.issues });
  }
  const apiMsg = apiErrorsToMessage(parsed.data.errors);
  if (apiMsg) {
    throw new ApiError('api', apiMsg);
  }
  return parsed.data.response;
}

/** כמו apiGet אך ל-endpoints שבהם `response` הוא אובייקט יחיד (למשל /teams/statistics). */
export async function apiGetObject<S extends z.ZodTypeAny>(
  path: string,
  itemSchema: S,
  params?: Record<string, QueryValue>,
): Promise<z.infer<S>> {
  const raw = await fetchRaw(path, params);
  const parsed = z
    .object({ errors: errorsSchema.optional().default([]), response: itemSchema })
    .safeParse(raw);
  if (!parsed.success) {
    throw new ApiError('validation', 'התשובה לא תאמה את הסכמה', { detail: parsed.error.issues });
  }
  const apiMsg = apiErrorsToMessage(parsed.data.errors);
  if (apiMsg) {
    throw new ApiError('api', apiMsg);
  }
  return parsed.data.response as z.infer<S>;
}
