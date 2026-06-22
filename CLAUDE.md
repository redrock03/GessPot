# CLAUDE.md — מוקד הניחושים (Mundial Predictor PWA)

> כלי חיזוי **אישי** למונדיאל 2026, לשימוש של רן בלבד. PWA. אין auth, אין משתמשים, אין DB, אין שרת-אפליקציה.
> זהו מקור האמת היחיד לאדריכלות, להחלטות ולאבני הדרך. עדכוני התקדמות חיים ב-`MEMORY.md`.

---

## 1. עקרון הליבה

המוצר לא רק מנבא — הוא **מכוון את רן לניחוש**. לכל משחק הוא מציג **שתי הצעות מקבילות**:

- **הצעת כיוון** — התוצאה שממקסמת את הסיכוי לקלוע _לפחות לכיוון_ (הדרך הבטוחה לנקודה), עם ירייה חופשית לבול אם תיפול.
- **הצעת בול** — התוצאה המדויקת הסבירה ביותר (התא המודאלי במטריצה) — הירייה למלוא הניקוד.

לכל הצעה מוצגים: סיכוי-כיוון, סיכוי-בול, ותוחלת-נקודות (EV). כשהשתיים מתלכדות — דגל ביטחון גבוה. רן בוחר פר-משחק. רדיפת בול היא בעלת EV מעט נמוך מהמשחק הבטוח, אך נכונה אם המטרה היא לנצח את הפול (שונות וגג גבוה) — לכן מציגים את שתיהן בשקיפות מלאה ולא מחביאים את ה-EV.

המודיעין שמזין את שתי ההצעות בא משלושה מנועים (§8–§10): מצב ההעפלה (מוטיבציה), היסטוריה (בסיס עוצמה), והיעדרויות (התאמות). הכול מתכנס למטריצת תוצאות אחת, וממנה נגזרות שתי ההצעות.

---

## 2. מה לא בונים (Non-goals)

כללים מחייבים. אין לחרוג בלי אישור מפורש מרן:

- **אין** משתמשים, הרשמה, התחברות, הרשאות.
- **אין** בסיס נתונים או שרת-אפליקציה. ההתמדה כולה בדפדפן (`IndexedDB` / `localStorage`).
- **אין** native — היעד הוא **PWA בלבד** (מותקנת למסך הבית, עובדת אופליין).
- **אין** ניחושי בונוס (אלופה/סגנית/מלך שערים) — הם **נעולים** בפול, אז מחוץ לסקופ. (טראקר read-only של מרוץ מלך השערים הוא nice-to-have עתידי בלבד, לא ליבה.)
- **אין** תכונות חברתיות/שיתוף/קבוצות. כלי לעיני רן בלבד.
- הרכיבים השרתיים היחידים המותרים הם **שתי Edge Functions חסרות-מצב** (Deno, ללא DB/auth/אחסון): `apifootball-proxy` (§7) ו-`claude-analyst` (§10.5 — מנוע ה-LLM). שתיהן קבצי-פונקציה בודדים שמזריקים מפתח ומחזירים תשובה, לא אפליקציות.

---

## 3. שיטת הניקוד של הפול

ניחוש לכל משחק הוא **או כיוון או בול** (לא מצטברים). אין דרגת הפרש-שערים נפרדת. **כל המשחקים מנוקדים לפי תוצאת 90 דקות בלבד** — תיקו ב-90 הוא כיוון תקף גם בנוקאאוט; הארכה ופנדלים לא נספרים.

```ts
type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';
const SCORING: Record<Stage, { tendency: number; exact: number }> = {
  group: { tendency: 1, exact: 3 }, // יחס 3:1
  r32: { tendency: 2, exact: 4 }, // 2:1
  r16: { tendency: 3, exact: 6 }, // 2:1
  qf: { tendency: 4, exact: 8 }, // 2:1
  sf: { tendency: 5, exact: 10 }, // 2:1
  third: { tendency: 5, exact: 10 }, // משחק מקום 3/4
  final: { tendency: 6, exact: 12 }, // 2:1
};
```

**שתי רגימות אופטימיזציה בלבד:** שלב הבתים (3:1, רודף בול אגרסיבי יותר) וכל הנוקאאוט (2:1). הסקאלה העולה לא משנה את הניחוש בתוך משחק בודד, אבל קובעת אילו משחקים שווים-יותר לטבלה — סמן משחקי ערך-גבוה.

**בונוסים (נעולים, לא לחישוב):** אלופה 10, סגנית 5, מלך שערים 10.

---

## 4. שתי ההצעות — החוזה המדויק

בהינתן מטריצת תוצאות `M` (אחרי התאמות מוטיבציה והיעדרויות) ונקודות השלב `(T, E)`:

```
pOut(home)=Σ_{i>j} M[i][j] ; pOut(draw)=Σ_{i=j} ; pOut(away)=Σ_{i<j}
לכל תוצאה s=(i,j):
  Pexact(s) = M[i][j]
  Pout(s)   = pOut(sign(i−j))
  EV(s)     = E·M[i][j] + T·(Pout(s) − M[i][j])   // נופל לכיוון אם לא בול

הצעת בול   = argmax_s Pexact(s)                    // התא המודאלי
הצעת כיוון = o* = argmax_o pOut(o) ; ואז argmax_{s∈o*} M[s]
             // התוצאה הסבירה ביותר, עם הסיכוי הטוב לבול בתוכה

לכל הצעה מציגים: התוצאה, Pexact, Pout, EV.
אם השתיים שוות → דגל "התכנסות" (ביטחון גבוה).
```

תוספות אופציונליות: חוגת-סיכון `α∈[0,1]` שמשלבת בין השתיים, והתאמת אגרסיביות לפי הפער של רן מהמוביל בפול (מאחור → דחוף לבול; מוביל → כיוון בטוח).

---

## 5. סטאק טכנולוגי

| תפקיד               | טכנולוגיה                                    | הערה                                               |
| ------------------- | -------------------------------------------- | -------------------------------------------------- |
| Build / dev         | `Vite` + `TypeScript` (strict)               | אתר סטטי, ללא SSR                                  |
| UI                  | `React` 18                                   | RTL, עברית                                         |
| PWA                 | `vite-plugin-pwa` (`Workbox`)                | manifest + service worker + offline                |
| נתונים ו-cache      | `@tanstack/react-query`                      | persistence ל-`IndexedDB`                          |
| התמדת cache         | `idb-keyval` + query persister               | שורד reload                                        |
| State (הגדרות)      | `zustand` + persist ל-`localStorage`         |                                                    |
| ולידציה בגבול       | `zod`                                        | אימות תגובות API                                   |
| ניתוב               | `react-router-dom`                           |                                                    |
| בדיקות              | `vitest`                                     | מכסה את המנוע הטהור                                |
| איכות               | `eslint` + `prettier` + `tsc --noEmit`       |                                                    |
| Proxy (חסר-מצב)     | `Supabase Edge Function` (Deno)              | reuse של תשתית הפול; חלופה: Cloudflare/Vercel Edge |
| מנוע אנליסט (§10.5) | `Claude` `claude-opus-4-8` דרך Edge Function | structured output; מפתח ב-secrets; היברידי         |
| אירוח               | static host                                  | `Cloudflare Pages` / `Vercel` / `Netlify`          |

**תקציב קריאות נדיב:** התוכנית בתשלום נותנת 7,500 קריאות ביום, מתוכן 1,440 מוקצות למוצר הזה. אין צורך לקמץ — מושכים predictions, injuries, lineups, h2h וסטטיסטיקות ביד נדיבה. ה-cache הוא ליעילות, לא להישרדות. אין להוסיף תלות חדשה בלי לשאול את רן.

---

## 6. מבנה תיקיות ושכבות

```
src/
  api/              # client טיפוסי ל-API-Football + סכמות zod (גבול חיצוני)
  mappers/          # תגובת API גולמית → domain types (נקודת ההחלפה היחידה)
  domain/
    types.ts        # מודלי הליבה
    engine/         # מנוע טהור, ללא I/O, נבדק ביחידות
      poisson.ts    #   pmf, buildMatrix, Dixon-Coles
      lambdas.ts    #   deriveLambdas + כיול לאחוזי ה-API
      suggest.ts    #   הצעת כיוון + הצעת בול
      qualify.ts    #   מנוע מצב ההעפלה (§8)
      stakes.ts     #   מוטיבציה → λ
      absences.ts   #   היעדרויות/השעיות → λ
      history.ts    #   שקלול עבר → בסיס λ
  data/             # hooks של react-query
  state/            # zustand: הגדרות + ניחושים שמורים
  ui/
    screens/        # Fixtures, Match, Group, Settings
    components/      # SuggestionPair, ProbBars, ScorelineHeatmap, QualPanel, AbsenceList...
    theme.ts        # טוקנים RTL/עברית
  main.tsx
supabase/
  functions/
    apifootball-proxy/  # פרוקסי חסר-מצב (Deno) — passthrough ל-API-Football
      index.ts
    claude-analyst/     # מנוע ה-LLM ההיברידי (Deno) — Claude structured output (§10.5)
      index.ts
  config.toml         # verify_jwt=false לשתי הפונקציות (PWA ללא auth)
```

> `api/analyst.ts` (לקוח האנליסט) + `useMatchAdvice` ב-`data/` הם חצי-הלקוח של מנוע ה-LLM. `domain/engine` נשאר טהור.

**עיקרון הזהב:** `domain/engine` טהור לחלוטין — מספרים נכנסים, מספרים יוצאים. בלי `fetch`, בלי `React`, בלי `Date.now()`. כל ה-I/O ב-`api/` וב-`data/`.

---

## 7. מקור הנתונים — API-Football (api-sports.io)

- בסיס: `https://v3.football.api-sports.io`. אימות: header `x-apisports-key`.
- מונדיאל: `league=1`, `season=2026`. נתונים חיים. **שלב הבתים מסתיים 27 ביוני 2026.**
- **fixture.id הוא המפתח הראשי** — ממנו נפתחים predictions, h2h, events, lineups, statistics.
- **בדיקת coverage לפני כל קריאה תלוית-coverage:** `GET /leagues?id=1&season=2026`, בודקים את אובייקט ה-`coverage`. הזמינות עשויה להשתנות ממשחק למשחק בתחילת הטורניר.

### Endpoints

| endpoint                                                 | למה                                         |
| -------------------------------------------------------- | ------------------------------------------- |
| `GET /leagues?id=1&season=2026`                          | coverage                                    |
| `GET /standings?league=1&season=2026`                    | כל 12 הבתים בקריאה אחת (כולל מרוץ השלישיות) |
| `GET /fixtures?league=1&season=2026`                     | לוח + תוצאות                                |
| `GET /fixtures/rounds?league=1&season=2026&current=true` | השלב הפעיל                                  |
| `GET /fixtures/headtohead?h2h={a}-{b}`                   | ראש בראש                                    |
| `GET /predictions?fixture={id}`                          | אחוזי 1X2 + השוואה — קלט מרכזי למנוע        |
| `GET /fixtures/statistics?fixture={id}`                  | xG, בעיטות, החזקה                           |
| `GET /fixtures/lineups?fixture={id}`                     | הרכב משוער/סופי                             |
| `GET /injuries?fixture={id}`                             | פצועים/מורחקים                              |
| `GET /fixtures/events?fixture={id}`                      | כרטיסים (לחיזוי השעיות + ציון התנהגות)      |

### CORS וה-proxy

קריאה ישירה מהדפדפן צפויה להיחסם (אין `Access-Control-Allow-Origin`, header מותאם מפעיל preflight; אי אפשר לתקן מצד הלקוח). הפתרון: **Supabase Edge Function** חסרת-מצב יחידה (`apifootball-proxy`) שמזריקה את המפתח, מוסיפה את header ה-CORS ומעבירה הלאה — **passthrough בלבד, ללא DB/auth/אחסון** (נשארים בתוך §2). reuse של מפתח ה-API-Football שכבר חי ב-Secrets של פרויקט הפול (אותה תוכנית Pro; תקציב 1,440/7,500 כבר הניח מפתח משותף). נקודת תצורה אחת `API_BASE` (= כתובת הפונקציה) קובעת proxy מול ישיר — המקום היחיד שתלוי בהחלטה הזו.

> **חובה:** לפונקציה זו `verify_jwt = false` (PWA ללא auth; אחרת ה-gateway של Supabase יחסום ב-401). זו פונקציית קריאה-בלבד, GET, ללא תופעות לוואי.

```ts
// supabase/functions/apifootball-proxy/index.ts (Deno)
const UPSTREAM = 'https://v3.football.api-sports.io';
const API_KEY = Deno.env.get('APISPORTS_KEY')!;
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const cors = {
  'access-control-allow-origin': ALLOWED_ORIGIN,
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const url = new URL(req.url);
  // מסירים את קידומת הפונקציה ומעבירים את השאר ל-upstream
  const path = url.pathname.replace(/^.*\/apifootball-proxy/, '');
  const r = await fetch(UPSTREAM + path + url.search, {
    headers: { 'x-apisports-key': API_KEY },
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
});
```

---

## 8. מנוע 1 — מצב ההעפלה (מלא)

הלב. פורמט 2026: 12 בתים של 4, **2 ראשונות מכל בית + 8 שלישיות מיטביות** → שלב 32.

### סולם שובר השוויון בתוך הבית (2026 — ראש-בראש תחילה!)

1. נקודות (כללי)
2. נקודות בין הנבחרות השוות (ראש-בראש)
3. הפרש שערים בין השוות
4. שערים שהובקעו בין השוות
5. הפרש שערים כללי
6. שערים כללי
7. ציון התנהגות (פייר-פליי: צהוב 1−, אדום עקיף 3−, אדום ישיר 4−, צהוב+אדום ישיר 5−)
8. דירוג פיפ"א
9. הגרלה

**דקה קריטית:** בשוויון של שלוש נבחרות, טבלת הראש-בראש נבנית רק מהתוצאות ביניהן; כשנבחרת נפרדת — מחשבים מחדש מראש הסולם. רוב הכלים טועים בזה. המנוע _חייב_ ליישם את הסולם המדויק, כולל הראש-בראש-תחילה (שינוי לעומת מהדורות קודמות).

### סולם השלישיות (חוצה-בתים, ללא ראש-בראש)

נקודות → הפרש שערים → שערים → ציון התנהגות → דירוג פיפ"א → הגרלה.

### מה המנוע מחשב

- **שני מצבי הרצה:** גס (W/D/L) לכותרת; **עדין (תוצאה/מרווח שערים)** למקרי גבול — כי כשהפרש/שערים/ראש-בראש מכריעים, התשובה היא "נצח ב-2+" או "1-1 מדיח אבל 2-2 מציל", לא סתם "נצח".
- **שלושת השערים** לכל נבחרת: מקום 1-2 מובטח; שלישית-מספיק-טובה (מותנה); הדחה.
- **פותר מרוץ השלישיות:** מ-`/standings` (כל 12 הבתים) בונה את טבלת 12 השלישיות החיה, מזהה קו-חתך 8/9, ומחשב לנבחרת שצפויה שלישית מה נדרש לעבור את הקו (הצהרה מותנית בתוצאות בתים אחרים).
- **טבלת שיבוץ R32:** מנצחי הבתים A, C, D, E, G, I, K, L משובצים מול שלישיות; היריב הספציפי לפי טבלת השיבוץ הקבועה מראש (495 צירופים). מזה נגזר **מודיעין שיבוץ** — האם 1 מול 2 משנה את היריב הצפוי בשלב הבא.
- **זיהוי מצבים המשנים התנהגות** (מזינים את `stakes.ts`): משחק חסר-משמעות (רוטציה, עצימות נמוכה), תיקו-שמשרת-את-שתיהן (משחק זהיר, סיכוי תיקו גבוה), שיקולי שיבוץ.

_אזהרה ל-UI:_ החישוב מבוסס נקודות/מרווח; יש לסמן מקרים תלויי-הפרש-שערים או תלויי-ראש-בראש כרגישים.

---

## 9. מנוע 2 — היסטוריה ומשחקי עבר (מלא)

- **כושר משוקלל** — לא רק 5 אחרונים, אלא לפי עדכניות _ולפי עוצמת היריב_ (ניצחון על חלשה ≠ על מעצמה).
- **ביצועי הטורניר הנוכחי** — קצב שערים בעד/נגד, xG מ-`/fixtures/statistics`.
- **ראש בראש** — מ-`/fixtures/headtohead`; בנבחרות לרוב דליל/ישן → שקלול מתון, הצגה כהקשר; להבדיל עימות עדכני מידידות עתיקה.
- **סגנון** — ממוצע שערים (נטיית over/under), שיעור שער-נקי → מזין λ וסך השערים.
- **מגרש, גובה, מנוחה** — ייחודי ל-2026: גובה מקסיקו סיטי (~2,240 מ'), נסיעות בין-ערים, ימי מנוחה. מסומן מ-`venue` ומתאריכי המשחקים.

---

## 10. מנוע 3 — היעדרויות, השעיות וכרטיסים (מלא)

- **`/injuries?fixture={id}`** — פצועים ומורחקים.
- **חיזוי השעיות** — מעקב צבירת צהובים (2 = הרחקה למשחק הבא) ואדומים מ-`/fixtures/events`. התרעות: "במרחק כרטיס מהשעיה", "מושעה למשחק הזה". מידע צפוי וחזק.
- **שקלול חשיבות** — היעדרות שווה לפי משקל השחקן (דקות, דירוג, שערים/בישולים, שוער/קפטן). אובדן שוער/חלוץ ראשון ≠ מחליף. ציון-חשיבות → התאמת λ מכוילת.
- **הרכב משוער** — `/fixtures/lineups` קרוב לפתיחה; לפני כן פציעות+השעיות+מרכיבים אחרונים כפרוקסי.
- **חיבור מערכתי:** הכרטיסים מזינים _גם_ השעיות _וגם_ את שובר ההתנהגות במנוע ההעפלה — אותו רכיב נתונים, שני מנועים. משמעת היא יתרון תחרותי אמיתי.

---

## 10.5. מנוע 0 — האנליסט (Claude LLM, היברידי)

**ההחלטה (אושרה ע"י רן):** שכבת LLM של Claude היא "האנליסט" שמסנתז את כל המודיעין ומפיק את הקלט המכויל למתמטיקה. הוא לא מחליף את המנוע הטהור — הוא **מאחד ומחליף בפועל את מנועים 1–3** (§8–§10) כמקור ה-λ.

- **איפה הוא חי:** ב-I/O בלבד — Edge Function `claude-analyst` (Deno) + לקוח ב-`api/analyst.ts` + hook ב-`data/`. **`domain/engine` נשאר טהור ולא נגוע** (§6/§14). זה התנאי המחייב.
- **מה הוא מקבל:** `AnalystInput` — חבילת סטטיסטיקות מ-§7 (1X2 בסיסי, xG וסטטיסטיקות, odds, h2h, הרכבים, היעדרויות, מצב העפלה, גובה/מנוחה). רק `fixture` חובה; השאר מתמלא ככל שנבנים hooks.
- **מה הוא מחזיר (structured output מאומת ב-zod):** `AnalystPrediction` = `oneXtwo` (1X2 מכויל) + **`expectedGoals` (λ_home, λ_away)** + `confidence` + `keyFactors[]` + `rationale` (עברית).
- **החיבור למתמטיקה:** `expectedGoals` → `adviseFromLambdas(λ_home, λ_away, stage)` → `buildMatrix` (עם Dixon-Coles) → `suggest` → שתי ההצעות + EV + דגל התכנסות (§4). **קפדנות ה-EV והבדיקות נשמרות במלואן.**
- **מודל:** `claude-opus-4-8` · adaptive thinking · effort=medium · structured output. מפתח Anthropic ב-secrets של הפונקציה, לעולם לא בלקוח. עלות ~$0.015/משחק (מאומת חי). `VITE_ANALYST_BASE` ריק = כבוי (נופלים ל-`adviseFrom1x2` ממסלול `/predictions`).
- **חשיפה:** הפונקציה `verify_jwt=false` (PWA ללא auth) — בולעת מפתח Anthropic. אופציונלי `APP_SHARED_SECRET` ב-env לשמירה רכה מול URL שדלף; cache פר-משחק להגבלת עלות.

---

## 11. ההתכנסות לחיזוי

```
מסלול האנליסט (היברידי, ברירת מחדל כשמופעל):
  כל הסטטיסטיקות (§7) → claude-analyst (§10.5) → expectedGoals (λ) ──┐
                                                                      ↓
                                              adviseFromLambdas(λ, stage)
                                                                      ↓
מסלול דטרמיניסטי (fallback כשהאנליסט כבוי):                          │
  מצב העפלה → stakes.ts  ┐                                           │
  עבר       → history.ts ├→ lambdas.ts: כיול λ לאחוזי /predictions ─┤
  היעדרויות → absences.ts ┘                                          │
                                                                      ↓
                                  poisson.ts → מטריצת תוצאות M (עם Dixon-Coles)
                                                                      ↓
                                  suggest.ts → הצעת כיוון + הצעת בול (§4)
```

### החוזה המתמטי

- `poisson(k, λ) = e^{-λ} λ^k / k!`; מטריצה `M[i][j]=poisson(i,λ_home)·poisson(j,λ_away)` ל-`i,j∈0..8`, עם תיקון Dixon-Coles לתאים `(0,0),(0,1),(1,0),(1,1)` (פרמטר `rho`), ונרמול לסכום 1.
- **`deriveLambdas`** — מכייל `(λ_home, λ_away)` כך שהתפלגות הפואסון תשחזר את אחוזי ה-1X2 מ-`/predictions`, seed מציפיית השערים שלהם. _Fallback_ כש-predictions כבוי: גזירה מ-GF/GA בטורניר מול עוצמת היריב.
- **`suggest`** — כמפורט ב-§4.

---

## 12. טיפוסי הליבה (`domain/types.ts`)

```ts
type Outcome = 'home' | 'draw' | 'away';
type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';
interface TeamRef {
  id: number;
  name: string;
  logo?: string;
}

interface GroupRow {
  team: TeamRef;
  group: string;
  rank: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  conduct: number;
}
interface Fixture {
  id: number;
  group?: string;
  stage: Stage;
  kickoff: string;
  home: TeamRef;
  away: TeamRef;
  status: 'scheduled' | 'live' | 'finished';
  goalsHome?: number;
  goalsAway?: number;
}
interface Suggestion {
  kind: 'tendency' | 'exact';
  score: { home: number; away: number };
  pExact: number;
  pOutcome: number;
  ev: number;
}
interface MatchAdvice {
  tendencyPick: Suggestion;
  exactPick: Suggestion;
  converged: boolean; // השתיים מתלכדות
  outcomeProb: { home: number; draw: number; away: number };
  rationale: string;
}
interface QualNeed {
  team: TeamRef;
  win: 'guaranteed' | 'possible' | 'eliminated';
  draw: 'guaranteed' | 'possible' | 'eliminated';
  loss: 'guaranteed' | 'possible' | 'eliminated';
  mustWin: boolean;
  drawOk: boolean;
  minWinMargin?: number; // "נצח ב-2+"
  thirdPlaceWatch: boolean;
  gdSensitive: boolean; // דגל רגישות הפרש-שערים/ראש-בראש
}
interface AbsenceImpact {
  team: TeamRef;
  out: Array<{ name: string; reason: 'injury' | 'suspension'; importance: number }>;
  oneBookingFromBan: string[];
  lambdaDelta: number;
}
```

---

## 13. מסכים

1. **Fixtures** — משחקי היום/הקרובים, לפי בית ושלב, עם סימון משחקי ערך-גבוה.
2. **Match** — לב המוצר: זוג ההצעות (כיוון + בול) עם Pexact/Pout/EV לכל אחת ודגל התכנסות, מדי 1X2, מפת-חום, מנוע ההעפלה לשתי הנבחרות (כולל "נצח ב-2+"), כושר, ראש-בראש, רשימת היעדרויות והתרעות השעיה.
3. **Group** — טבלת הבית עם ציוני התנהגות + מה כל נבחרת צריכה; טבלת מרוץ השלישיות עם קו-החתך.
4. **Settings** — מפתח/proxy, פרמטרי מודל, חוגת-סיכון אופציונלית, יומן ניחושים שמורים.

---

## 14. מוסכמות קוד

- TypeScript strict. אין `any` ללא הצדקה כתובה.
- `domain/engine` טהור: בלי `fetch`, בלי `Date.now()`, בלי React. כל קלט כפרמטר.
- ולידציית `zod` בכל גבול חיצוני; מעבר לגבול — רק domain types.
- המפתח לעולם לא ב-bundle של הלקוח אם משתמשים ב-proxy.
- RTL: `dir="rtl"`, `lang="he"`. כל ה-UI בעברית. מספרים בפונט mono עם `tabular-nums`.
- מצבי ריק/שגיאה/טעינה בעברית, ענייניים.
- כל לוגיקת מנוע חדשה מגיעה עם בדיקת `vitest`. במיוחד: מנוע ההעפלה חייב מקרי-בדיקה לסולם שובר השוויון (כולל ראש-בראש של שלוש נבחרות) ולמרוץ השלישיות.
- בסוף כל סשן עבודה — **לעדכן את `MEMORY.md`**.

---

## 15. אבני דרך (Milestones)

### M0 — שלד ותשתית

scaffold Vite+React+TS, vite-plugin-pwa, react-router, react-query, zustand, zod, vitest, eslint/prettier.
**קבלה:** `npm run dev` פותח מעטפת עברית-RTL; Lighthouse "installable"; `typecheck`+`lint` עוברים.

### M1 — שכבת הנתונים

api client + סכמות zod + (proxy או ישיר) ל-coverage/standings/fixtures/rounds/h2h/predictions/statistics/lineups/injuries/events. mappers → domain types. react-query עם התמדת IndexedDB.
**קבלה:** מציג טבלאות מונדיאל חיות ומשחקים קרובים; cache שורד reload.

### M2 — מנוע החיזוי הבסיסי

poisson + Dixon-Coles + deriveLambdas/כיול + suggest (כיוון/בול) עם בדיקות.
**קבלה:** בדיקות מאמתות שהמטריצה מסתכמת ל-1, ששתי ההצעות נגזרות נכון, ושהכיול משחזר את אחוזי ה-API.

### M3 — מסך החיזוי

רשימת משחקים → מסך משחק עם זוג ההצעות, מחובר ל-predictions חיים.
**קבלה:** בחירת משחק אמיתי מציגה הצעת כיוון + הצעת בול עם הסתברויות ו-EV מנתונים חיים.

### M4 — מנוע ההעפלה (מלא)

qualify.ts: סולם שובר השוויון 2026 (ראש-בראש תחילה) + הרצה גסה/עדינה + פותר מרוץ השלישיות על 12 הבתים + מודיעין שיבוץ; חיבור stakes למנוע; מסך Group.
**קבלה:** לבית עם משחקים שנותרו, האפליקציה אומרת נכון מה כל נבחרת צריכה כולל מרווחי שערים; מקרי-בדיקה לשוברי שוויון עוברים; "חייבת ניצחון" מסיט את ההצעות.

### M5 — היעדרויות והיסטוריה

absences.ts (פציעות + חיזוי השעיות מכרטיסים + שקלול חשיבות) + history.ts (כושר משוקלל, סגנון, גובה/מנוחה); חיבורם ל-λ.
**קבלה:** היעדרות שחקן מפתח מזיזה את λ ומופיעה במסך; התרעת "במרחק כרטיס מהשעיה" עובדת.

### M6 — הגדרות, התמדה, ליטוש

ניחושים שמורים, חוגת-סיכון אופציונלית, מצבי קצה בעברית, שמירה על דגלי coverage, מעטפת אופליין.
**קבלה:** ניחושים נשמרים ושורדים reload; אפליקציה שמישה אופליין עם cache אחרון.

### M7 — פריסה

deploy ל-static host + proxy ל-edge; prompt התקנה.
**קבלה:** כתובת פרוסה שמתקינה למסך הבית; המפתח לא ב-bundle (במצב proxy).

---

## 16. פקודות

```bash
npm run dev          # שרת פיתוח
npm run build        # build לפרודקשן (אתר סטטי)
npm run preview      # תצוגה מקדימה
npm run test         # vitest
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
supabase functions serve apifootball-proxy   # proxy מקומי (Deno)
supabase functions deploy apifootball-proxy --no-verify-jwt   # פריסת הפרוקסי
```

---

## 17. כללים לקלוד בעבודה על הריפו

1. אל תוסיף auth, משתמשים, DB או שרת-אפליקציה — לעולם (§2).
2. אל תבנה ניחושי בונוס — הם נעולים.
3. שמור את `domain/engine` טהור ונבדק. כל שינוי מתמטי עם בדיקה.
4. מנוע ההעפלה חייב את הסולם המדויק של 2026 (ראש-בראש תחילה, מחשוב-מחדש בשוויון רב-נבחרתי). אל תפשט.
5. כל משחק מנוקד לפי 90 דקות בלבד.
6. בדוק דגל coverage לפני endpoint תלוי-coverage.
7. אל תוסיף תלות חדשה בלי לשאול את רן.
8. כל ה-UI בעברית ו-RTL.
9. `API_BASE` (proxy מול ישיר) הוא המקום היחיד שנוגע בהחלטת ה-CORS.
10. בסוף כל סשן — עדכן את `MEMORY.md`.
11. כשמשהו לא ודאי (פורמט תגובה, פרמטר) — אמת מול התיעוד החי של api-football לפני הנחה.
