# מוקד הניחושים — Mundial Predictor PWA

כלי חיזוי **אישי** למונדיאל 2026. לכל משחק האפליקציה לא רק מנבאת — היא מציגה **שתי הצעות מקבילות**:

- **הצעת כיוון** — התוצאה שממקסמת את הסיכוי לקלוע לפחות לכיוון (הדרך הבטוחה לנקודה).
- **הצעת בול** — התוצאה המדויקת הסבירה ביותר (מלוא הניקוד).

לכל הצעה מוצגים סיכוי-כיוון, סיכוי-בול ותוחלת-נקודות (EV); כששתיהן מתלכדות — דגל ביטחון גבוה.

PWA בלבד — מותקנת למסך הבית, עובדת אופליין. ללא הרשמה, ללא חשבון, ללא בסיס נתונים: כל ההתמדה בדפדפן.

## איך זה עובד

המודיעין נאסף מ-API-Football (מצב העפלה, היסטוריה, היעדרויות/השעיות) ומסונתז ע"י **אנליסט Claude** (`claude-opus-4-8`, structured output) לפלט מכויל — שערים צפויים (λ). ה-λ מוזן ל**מנוע מתמטי טהור** (Poisson + Dixon-Coles) שגוזר את מטריצת התוצאות ואת שתי ההצעות. הארכיטקטורה המלאה ב-[CLAUDE.md](CLAUDE.md); שפת העיצוב ב-[DESIGN.md](DESIGN.md).

## סטאק

Vite · React 18 · TypeScript (strict) · vite-plugin-pwa (Workbox) · @tanstack/react-query · zustand · zod · react-router · vitest. שני רכיבי קצה חסרי-מצב (Supabase Edge Functions, Deno): פרוקסי ל-API-Football ופונקציית האנליסט — מזריקות מפתח ומחזירות תשובה, המפתחות ב-secrets בלבד.

## הרצה מקומית

```bash
npm install
cp .env.example .env.local      # מלאו את כתובות הפונקציות (ריק = מצב מושבת)
npm run dev
```

| פקודה | פעולה |
| --- | --- |
| `npm run dev` | שרת פיתוח |
| `npm run build` | build לפרודקשן (אתר סטטי) |
| `npm run preview` | תצוגה מקדימה של ה-build |
| `npm run test` | בדיקות (vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | eslint |

המפתחות (Anthropic / API-Football) חיים אך ורק ב-secrets של פונקציות הקצה — לעולם לא ב-bundle של הלקוח.
