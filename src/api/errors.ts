// שגיאות גבול חיצוני — מובחנות לפי סוג כדי שה-UI יציג הודעה עברית מתאימה.
export type ApiErrorKind = 'network' | 'http' | 'api' | 'validation';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly detail?: unknown;

  constructor(kind: ApiErrorKind, message: string, opts?: { status?: number; detail?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = opts?.status;
    this.detail = opts?.detail;
  }
}

/** הודעת משתמש קצרה בעברית לפי סוג השגיאה. */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.kind) {
      case 'network':
        return 'אין חיבור לשרת הנתונים. בדוק את החיבור ונסה שוב.';
      case 'http':
        return `שגיאת שרת (${err.status ?? '?'}). ננסה שוב בעוד רגע.`;
      case 'api':
        return `ה-API החזיר שגיאה: ${err.message}`;
      case 'validation':
        return 'מבנה התשובה מה-API לא תאם את הצפוי. ייתכן שינוי בצד ה-API.';
    }
  }
  return 'שגיאה לא צפויה.';
}
