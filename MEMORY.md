# MEMORY.md — יומן המשכיות

> מטרה: לשמר את הקשר ואת ההתקדמות בין סשני עבודה כדי שתהליך הפיתוח לא ילך לאיבוד.
> **קלוד מעדכן את הקובץ הזה בסוף כל סשן:** מוסיף ליומן ההחלטות, מעדכן סטטוס אבני-דרך, וכותב "מה הלאה".
> החלטות-על וארכיטקטורה חיות ב-`CLAUDE.md`; כאן רק _מצב_ ו*התקדמות*.

---

## מצב נוכחי

- **שלב:** M0 ✅ · **M1 ✅ אומת חי** · M2 ✅ (מנוע טהור) · **מנוע 0 — האנליסט ההיברידי ✅ פרוס ואומת חי** · **M3 ✅ — מסך המשחק + פאזת Design System (DESIGN.md) הושלמו ואומתו** (typecheck/lint/53 בדיקות/build נקיים + סקירה אדוורסרית).
- **מסמכים:** `CLAUDE.md` (ארכיטקטורה) + `MEMORY.md` + **`DESIGN.md` (מקור-האמת הוויזואלי).** `.impeccable.md` נוסף (הקשר עיצוב ל-skills).
- **תשתית Supabase:** **GessPot** ref `<project-ref>`. **שתי פונקציות פרוסות** (`verify_jwt=false`): `apifootball-proxy` (`APISPORTS_KEY`) + `claude-analyst` (`ANTHROPIC_KEY`). `.env.local` עם `VITE_API_BASE` + `VITE_ANALYST_BASE`. כל המפתחות ב-session memory (יבוטלו בסוף הסשן).
- **החלטת אירוח (רן):** ירצה גם בפלאפון → שומרים את הפונקציות ונארח את ה-PWA (Cloudflare Pages/Vercel) ב-M7. לפני פרוד: לצמצם `ALLOWED_ORIGIN` מ-`*` לכתובת הפרוסה.
- **M4 ✅ הושלם ואומת:** `qualify.ts` (`rankGroup` סולם-2026 + `qualNeeds` שערים + `rankThirds`/`thirdsRace` קו-חתך 8/9 + `buildGroupTables`) · `stakes.ts` (must-win/mutual-draw/dead-rubber → λ) מחובר ל-AnalystInput של מסך המשחק · מסך Group חי (טבלאות מדורגות + צ'יפ "מה צריך" + מרוץ שלישיות). 84 בדיקות; כל השערים נקיים; אומת ויזואלית (Edge).
- **M5 ✅ הושלם ואומת:** `history.ts` (כושר משוקלל לפי עדכניות×עוצמת-יריב + גובה/מנוחה) · `absences.ts` (התנהגות פייר-פליי §8 מדויק כולל אדום-עקיף 3−, `analyzeSquad` חשיבות+"במרחק כרטיס") · שכבת נתונים (players/teams-statistics/h2h/statistics + `apiGetObject`) · `mappers/enrichment.ts` + `useMatchEnrichment` (allSettled) → מזין כושר/h2h/סגל לאנליסט **(אומת חי: Claude מצטט שחקני-מפתח+h2h+ממוצעי שערים)** · פאנל "מודיעין" במסך המשחק (כושר/מפתח/התרעת השעיה/h2h). **108 בדיקות.** סקירה אדוורסרית (Workflow, 9 סוכנים) → 6 ממצאים תוקנו.
- **תיקון UX (רן):** Fixtures — משחקים שהסתיימו יורדים מתחת למחיצת "תוצאות" (מעומעמים); חיים+קרובים תמיד למעלה (הבא ביותר ראשון).
- **M6 ✅ הושלם ואומת:** `state/store.ts` (zustand+persist ל-localStorage: `riskAlpha` + `savedPicks`) · `recommendByRisk` (חוגת-סיכון §4) במנוע + בדיקות · מסך הגדרות (חוגת-סיכון, סטטוס חיבור, יומן ניחושים שמורים, אופליין) · שמירת ניחוש + badge "מומלץ לך" במסך המשחק · באנר אופליין ב-AppShell. **113 בדיקות.** אומת ויזואלית.
- **M7 ✅ הושלם — האפליקציה חיה:** **https://redrock03.github.io/GessPot/** (GitHub Pages, ענף `gh-pages`). הוקשח: `ALLOWED_ORIGIN` allowlist (github.io + localhost) בשתי הפונקציות, `claude-analyst` דורש `x-app-secret` (401 בלעדיו — אומת). Vite `base=/GessPot/` + hash-router (עמיד בתת-נתיב). אומת חי: האתר טוען נתונים אמיתיים מהפרוקסי המוקשח (screenshot). מותקן כ-PWA.
- **dev server רץ** (localhost:5173, רקע, HMR) — עדיין עובד (localhost ב-allowlist).
- **הצעד הבא:** הכל הושלם (M0–M7). שיפורים אופציונליים: תקרת-הוצאה ב-Anthropic (הגנת-עלות אמיתית) · M4.5 (R32 seeding 495) · conduct→דירוג הבתים (כרגע 0) · xG/odds פר-משחק.

---

## יומן החלטות

### 2026-06-21 — סשן תכנון

- **פלטפורמה:** PWA בלבד (לא native). Vite + React + TypeScript + vite-plugin-pwa.
- **סקופ:** משתמש יחיד (רן). אין auth, אין משתמשים, אין DB, אין שרת-אפליקציה.
- **API:** API-Football (api-sports.io), תוכנית בתשלום. תקציב 7,500 קריאות/יום, 1,440 מוקצות למוצר → נדיב, לא מקמצים.
- **מונדיאל:** `league=1`, `season=2026`. שלב הבתים מסתיים 27.6.2026.
- **CORS:** קריאה ישירה צפויה חסומה → `proxy` חסר-מצב יחיד (Cloudflare Worker) כברירת מחדל; נקודת תצורה אחת `API_BASE`.
- **ניקוד הפול:** או כיוון או בול (לא מצטבר), אין דרגת הפרש-שערים. **כל המשחקים לפי 90 דקות בלבד.** טבלה: בתים 1/3, שלב32 2/4, שמינית 3/6, רבע 4/8, חצי 5/10, מקום3/4 5/10, גמר 6/12.
- **בונוסים נעולים** (אלופה 10 / סגנית 5 / מלך שערים 10) → מחוץ לסקופ.
- **מודל ההמלצה:** **שתי הצעות מקבילות** לכל משחק — הצעת כיוון + הצעת בול — כל אחת עם Pexact, Pout, EV, ודגל התכנסות. ברירת מחדל מכוונת לבול אך EV מוצג תמיד בשקיפות. תוספות אופציונליות: חוגת-סיכון, אגרסיביות לפי הפער מהמוביל.
- **כלל מפתח שאומת:** ב-2026 שובר השוויון הראשון בבית הוא **ראש-בראש**, לא הפרש שערים כללי. המנוע חייב ליישם את הסולם המדויק.
- **שלושת המנועים — עומק מלא:** מצב העפלה (סולם 2026, גס+עדין-מרווח, פותר שלישיות, טבלת שיבוץ R32, מודיעין שיבוץ, זיהוי משחק-חסר-משמעות/תיקו-הדדי); היסטוריה (כושר משוקלל לפי עדכניות+עוצמת יריב, xG, ראש-בראש מתון, סגנון, גובה/מנוחה); היעדרויות (פציעות + חיזוי השעיות מכרטיסים + שקלול חשיבות + הרכבים + חיבור לשובר ההתנהגות).
- **הנחות שנקבעו (לתיקון אם צריך):** ניחוש ננעל בשריקת הפתיחה, ניתן לעריכה עד אז.

### 2026-06-21 — סשן M0 (מימוש שלד)

- **שלד הוקם בהצלחה ואומת מקצה-לקצה.** `git init` בתיקיית `GessPot`. שמות המסמכים תוקנו ל-`CLAUDE.md`/`MEMORY.md`.
- **גרסאות שנקבעו (קומבו ידוע-טוב):** Vite 6.4 · React 18.3 · TypeScript 5.7 (strict, project-references) · vite-plugin-pwa 0.21 · @tanstack/react-query 5 · zustand 5 · zod 3 · react-router-dom 7 · **vitest 3** · ESLint 9 (flat config) · Prettier 3.
- **גוצ'ה שנפתר:** vitest 2.1 נועל-peer ל-vite 5 בעוד האפליקציה על vite 6 → שתי גרסאות vite במקביל ושגיאת טיפוסים ב-`defineConfig` של `vitest/config`. **הפתרון: שדרוג ל-vitest 3** (תומך vite 6) → dedupe לגרסת vite יחידה. אם בעתיד משדרגים vite, לוודא ש-vitest תואם.
- **PWA:** manifest עברי-RTL (name=מוקד הניחושים, display=standalone, theme=#0b1020). **אייקונים אמיתיים** (`pwa-192/512.png`) נוצרים ע"י `scripts/gen-icons.mjs` — מחולל PNG מבוסס zlib מובנה, ללא תלות חדשה; מצייר את סמל ה-target/crosshair ("מוקד"). `favicon.svg` תואם.
- **מבנה שהונח:** `domain/types.ts` (§12 מלא) · `domain/scoring.ts` (§3) · `domain/engine/poisson.ts` (pmf+buildMatrix+outcomeProbs, **טהור**) + מבחן vitest עובר (7/7) · `config.ts` (`API_BASE` — נקודת ה-CORS היחידה) · `data/queryClient.ts` · router + AppShell (ניווט תחתון RTL) + 4 מסכי placeholder (Fixtures/Groups/Match/Settings) + NotFound.
- **קבלת M0 — אומתה:** `dev` מגיש מעטפת `<html lang="he" dir="rtl">`; `manifest.webmanifest` עברי תקין; `typecheck` נקי; `lint` נקי (exit 0); `test` 7/7; `build` מצליח ומפיק `sw.js`+manifest (11 precache entries). PWA installable.
- **לא בוצע commit** (ממתין לבקשת רן). העץ נקי ומוכן.

### 2026-06-21 — החלטת proxy: Supabase במקום Cloudflare

- **רן העלה: למה Cloudflare ולא Supabase?** צודק. ה-CLAUDE.md המקורי ברירת-מחדל Cloudflare Worker, אבל **הפול (המוצר המשלים) כבר רץ כולו על Supabase עם API-Football מחובר** (אותו `x-apisports-key`, תוכנית Pro). תקציב ה-1,440/7,500 בספק כבר הניח **מפתח משותף**.
- **ההחלטה:** הפרוקסי = **Supabase Edge Function** יחידה (`apifootball-proxy`, Deno) — **passthrough בלבד: מזריק מפתח, מוסיף CORS, מעביר. ללא DB/auth/אחסון** (נשארים בתוך §2; הפונקציה היא החריג היחיד המותר). reuse של המפתח שכבר ב-Secrets של פרויקט הפול.
- **גוצ'ה לזכור:** הפונקציה חייבת `verify_jwt = false` (PWA ללא auth) אחרת gateway של Supabase מחזיר 401 שקט. GET, קריאה-בלבד.
- **`CLAUDE.md` עודכן:** §5 (טבלת סטאק), §6 (מבנה — `supabase/functions/...`), §7 (תיאור+קוד הפונקציה), §16 (פקודות `supabase functions serve/deploy`).

### 2026-06-21 — סשן M1 (שכבת הנתונים, קוד)

- **החלטה:** פרויקט Supabase **חדש וייעודי** (לא הקיים של הפול) — בידוד מלא מהטורניר החי. נוצרו `supabase/config.toml` (`verify_jwt=false`) + `supabase/functions/apifootball-proxy/index.ts` (Deno passthrough), ו-`.env.example` ל-`VITE_API_BASE`.
- **api/ (גבול חיצוני):** `errors.ts` (ApiError ממובחן + הודעות עברית) · `http.ts` (`apiGet` עם envelope + ולידציית zod, זורק ApiError) · `schemas.ts` (**סכמות סובלניות** — מאמתות רק שדות נצרכים) · `endpoints.ts` (getLeagueCoverage/getStandings/getFixtures/getCurrentRound).
- **mappers/:** `stage.ts` (round→Stage, status→state, groupLabel) · `standings.ts` · `fixtures.ts` · `coverage.ts`. **כלל §3 מיושם:** תוצאת המשחק נלקחת מ-`score.fulltime` (90 דק') ולא מ-`goals` (כולל הארכה). `conduct` ב-GroupRow = 0 כרגע (נגזר מכרטיסים ב-M4/M5).
- **data/:** `hooks.ts` (useCoverage/useStandings/useFixtures/useCurrentRound) · `persister.ts` (**IndexedDB persister מעל idb-keyval — מימוש ישיר, ללא תלות נוספת**) · `main.tsx` עבר ל-`PersistQueryClientProvider` (maxAge 24h, buster v1).
- **מסכים חיים:** Groups (טבלאות 12 בתים, סימון 2 ראשונות/שלישית) · Fixtures (קיבוץ לפי יום, ציון/שעה, סימון משחקי ערך-גבוה לפי `isHighValueStage`, קישור ל-/match/:id). States.tsx (טעינה/שגיאה/ריק בעברית).
- **בדיקות:** +17 (stage 14, fixtures 3) → **24/24 עוברים**. typecheck/lint/build נקיים.
- **לזכור — שאלת אימות פתוחה:** הסכמות נכתבו מידע + סובלנות, **טרם אומתו מול תשובות חיות**. כשהפרויקט יקום: לוודא צורת `/standings` (מערך-בתוך-מערך) ו-`score.fulltime`. `/predictions` (percent/goals/comparison) — לאמת ב-M2.
- **טרם:** סכמות predictions/h2h/statistics/lineups/injuries/events (נדרשות ל-M3/M5). commit עדיין לא בוצע.

### 2026-06-21 — סשן M2 (מנוע החיזוי הטהור)

- **`poisson.ts`:** נוסף תיקון **Dixon-Coles** (`dixonColesTau` + פרמטר `rho` ל-`buildMatrix`, `DEFAULT_RHO=-0.05`). rho=0 ≡ פואסון עצמאי. ρ שלילי מגדיל מסת תיקו נמוך — מאומת בבדיקה.
- **`lambdas.ts`:** `deriveLambdas` מכייל (λh,λa) לאחוזי 1X2 ע"י **ביסקציה מקוננת** (חיצונית על μ=λh+λa לכיול pDraw, פנימית על s=λh−λa לחלוקת home/away — שתיהן מונוטוניות, יציב מאוד). משחזר אחוזים בתוך ~1pp. + `lambdasFromStrength` (fallback בסיסי כש-predictions כבוי; שכלול מלא ב-M5).
- **`suggest.ts`:** חוזה §4 מדויק — הצעת בול=התא המודאלי, הצעת כיוון=הכיוון הסביר+התא הסביר בתוכו, `EV=E·Pexact+T·(Pout−Pexact)`, דגל converged, rationale עברי. + `adviseFrom1x2` (צינור מלא 1X2→λ→מטריצה→הצעות) ל-M3.
- **בדיקות (+21 → 45 סה"כ):** poisson/DC 11, lambdas 9 (round-trip כיול), suggest 8 (כולל **מקרה הפיצול**: מודאלי=1-1 תיקו אך כיוון=ניצחון בית; ה-EV של הכיוון מעט גבוה מהבול — בדיוק עקרון §1). **קבלת M2 אומתה.**
- **לזכור:** המנוע מצפה ל-1X2 כמספרים 0..1. המרת `/predictions` הגולמי (percent "45%"→0.45, וגזירת goals) שייכת ל-mapper של M3 — שם גם לאמת את צורת `/predictions` מול הנתונים החיים.

### 2026-06-21 — Design System (`DESIGN.md`) + תשתית Supabase

- **`DESIGN.md` נוסף ע"י רן** — מקור-האמת הוויזואלי. וייב: **"קונסולת אנליסט לילה"** (נוקטורנלי, ממוקד, mobile-first ~390px). כולל בלוק `:root` מלא, מצאי רכיבים, נגישות, RTL, ומודל מפת-החום.
- **⚠️ קריטי — שני צירי-צבע שאסור לערבב (מחליף את ה-placeholder של M0):**
  - **ציר מהות** (מי מנצח): home `#2FBF87` · draw `#E8B23A` · away `#F26D7D`.
  - **ציר סוג-הצעה:** כיוון = **ציאן `#4DA8FF`** (`--steady`, גם פוקוס) · בול = **זהב `#F5C84B`** (`--strike`).
  - ב-M0 ערבבתי: tendency=אמרלד, exact=ענבר, ו-home/draw/away בכחול/אפור/ורוד. **צריך ליישר את `theme.ts`+`global.css` לטוקנים של DESIGN.md** בפאזת ה-Design System (לפני M3 UI).
- **שינויים נוספים מ-DESIGN.md:** רקעים `--ink #0A0E16`/`--surface #121A28` · פונט מספרים **IBM Plex Mono** (לא JetBrains) · `converged` = שני הכרטיסים מתאחדים לכרטיס יחיד עם תוצאה 52px · `ScorelineCoupon` 6×6 (לא 9×9 כמו המנוע — תצוגה בלבד) · `MyPickBadge` למצב "הניחוש שלי" (נעילה בשריקה).
- **ההבחנה זהב↔ענבר חייבת להיות גם באייקונוגרפיה** (בולסאיי לבול מול בר-שטוח), לא בגוון בלבד. (§9 ב-DESIGN: החלטות פתוחות — לדחוף זהב חם יותר / ניגודיות מיקרו-טקסט.)
- **HTML reference** (`מערכת_עיצוב_מוקד_הניחושים.html`) מוזכר ב-DESIGN אך **לא בריפו** — לבקש מרן אם נצטרך.
- **Supabase:** `supabase projects list` (עם ה-token) → פרויקט **GessPot** ref `<project-ref>` (Frankfurt, נוצר היום). ה-CLI מותקן (v2.84.2).

### 2026-06-21 — M1 אומת חי + מצאי נתונים + הצעת מנוע-LLM

- **הפרוקסי נפרס ואומת:** `supabase functions deploy apifootball-proxy --no-verify-jwt --project-ref <project-ref>` (ללא Docker). `/status` → Pro פעיל, 878/7500 ביום, מפתח תקין. CORS עובד מהדפדפן.
- **סכמות אומתו מול נתונים אמיתיים:** `/standings` = מערך-בתוך-מערך כצפוי; `score.fulltime` מאוכלס (כלל 90-הדקות עובד). **גילוי:** API מחזיר **13 תת-מערכי standings** — 12 בתים (A–L) + **טבלת מרוץ השלישיות מוכנה** (תווית "Group Stage", 12 שורות, rank חוצה-בתים). תוקן `mapStandings` לסנן רק בתים אמיתיים (`isRealGroup`, +test). **למנוע ההעפלה M4: טבלת השלישיות כבר מחושבת ע"י ה-API** — לקרוא אותה ישירות.
- **`/predictions` אומת:** `percent{home,draw,away}` כמחרוזות "35%"; `goals{home,away}` ספי-שערים; `advice`; `winner`; `comparison{form,att,def,poisson_distribution,h2h,goals,total}`. ה-mapper של M3 ימיר "35%"→0.35.
- **coverage:** standings/predictions/events/lineups/statistics = true; **injuries = false** (M5 חייב fallback מ-lineups+events). odds = true.
- **מצאי נתונים מלא (אומת חי):** `/fixtures/statistics` כולל **`expected_goals` (xG)** + `goals_prevented` + בעיטות/החזקה/כרטיסים/מסירות; `/teams/statistics` (כושר, ממוצעי שערים, clean_sheet, streaks, פורמציות, כרטיסים-לפי-דקה); `/odds` (14 בוקמייקרים — הסתברויות שוק); `/fixtures/events` (Goal/Card/subst/Var); `/fixtures/lineups`. **הבהרה: xG הוא נתון API; EV מחושב אצלנו מהמטריצה — לא נתון API.**
- **הצעת רן — שכבת LLM (Claude) כמנוע הכיוון/בול:** _ממתינה להחלטתו._ עמדתי המומלצת: **היברידי** — Claude כ"אנליסט" ב-data/ (I/O, לא ב-engine הטהור) קורא את כל הסטטיסטיקות המתקדמות ומחזיר פלט מובנה (1X2 מכויל + λ/שערים צפויים + התאמות + rationale), שמוזן ל-`deriveLambdas→buildMatrix→suggest` הקיים → שומר על קפדנות ה-EV והבדיקות, ומחליף בפועל את שלושת המנועים (§8–§10). דורש: מפתח Anthropic + הרחבת הפונקציה/sibling, מודל `claude-opus-4-8`, cache פר-משחק, ועדכון CLAUDE.md §2/§6/§11. חלופות: LLM-מלא (מוותר על קפדנות), או LLM כ"דעה שנייה". _לא לבנות עד אישור._

### 2026-06-21 — מנוע 0: האנליסט ההיברידי (Claude LLM) — נבנה, נפרס, אומת חי

- **רן בחר: היברידי** (Claude מזין את המתמטיקה). מומש מקצה-לקצה ואומת מול Claude אמיתי.
- **`claude-analyst` Edge Function (Deno):** מקבל `AnalystInput`, קורא ל-Anthropic (`claude-opus-4-8`, adaptive thinking, effort=medium, **structured output** עם json_schema), מנרמל ומחזיר `AnalystPrediction`. raw fetch (לא SDK) — יציב ב-Deno runtime. `ANTHROPIC_KEY` ב-secrets. `verify_jwt=false`. אופציונלי `APP_SHARED_SECRET`.
- **טהירות נשמרה:** האנליסט ב-I/O בלבד (`supabase/functions/claude-analyst` + `api/analyst.ts` + hook). `domain/engine` לא נגוע. נוסף `adviseFromLambdas(λh,λa,stage)` ב-`suggest.ts` (+2 בדיקות) — נקודת החיבור: λ מהאנליסט → מטריצה → §4.
- **חוזה:** `AnalystPrediction` (ב-`domain/types.ts`) = `oneXtwo` + `expectedGoals(λ)` + `confidence` + `keyFactors[]` + `rationale`. zod ב-`api/analyst.ts`. hook `useMatchAdvice(AnalystInput|null)` ב-`data/hooks.ts` → `{prediction, advice}`.
- **אימות חי (Spain vs Saudi Arabia):** HTTP 200 ב-14.7s. Claude **תיקן את ה-API**: בסיס 35/35/30 → 78/15/7, xG 2.3/0.6, confidence high, rationale עברי ("ה-API שמרני מדי... מתאימים כלפי מעלה"). דרך המנוע: 1X2 75/17/8, **שתי ההצעות מתכנסות על 2-0 ספרד**, EV 1.05, converged=true. **עלות ~$0.015/משחק** (1151 in + 383 out).
- **גוצ'ה שנפתר:** ב-`node -e`, `const URL=...` מצל את ה-`URL` הגלובלי → fetch נכשל ("Failed to parse URL"). לשנות שם משתנה.
- **51 בדיקות עוברות; typecheck/lint/build נקיים.**
- **טרם:** העשרת `AnalystInput` עם statistics/odds/teams/h2h/lineups/events (hooks חדשים, M3/M5); cache פר-משחק; אופציונלי הפעלת `APP_SHARED_SECRET`. commit עדיין לא בוצע.

### 2026-06-21 — M3: מסך המשחק + פאזת Design System

- **פאזת Design System:** `global.css` ו-`theme.ts` יושרו לטוקני `DESIGN.md §2` ("קונסולת אנליסט לילה"). שני צירי-צבע: מהות (home/draw/away = אמרלד/ענבר/ורד) · סוג-הצעה (steady=ציאן/strike=זהב). נטענו Heebo + IBM Plex Mono. **aliases תאימות** (`--bg→--ink` וכו') כדי לא לשבור Fixtures/Groups. `.impeccable.md` נוצר כהקשר עיצוב.
- **מנוע:** `couponGrid(λh,λa,max,rho)` ב-`poisson.ts` (טהור, +2 בדיקות) למפת-החום 6×6.
- **נתונים:** סכמת+endpoint+mapper ל-`/predictions` (ממיר "35%"→0.35) + `usePrediction`; `useMatchAdvice` ב-`data/` (אנליסט→`adviseFromLambdas`→{prediction,advice}).
- **רכיבים (`ui/components/match/`, CSS צמוד):** `SuggestionPair` (כיוון/בול + מצב converged עם מסגרת-גרדיאנט), `ProbBars`, `ScorelineCoupon` (היטמאפ אינטראקטיבי), `AnalystNote` (confidence+factors+rationale), `icons`, `format`. `Match.tsx` מרכיב הכול עם מצבי טעינה(~15ש')/שגיאה/ריק.
- **שיטת עבודה:** skill `impeccable craft` + craft-flow. **אימות ויזואלי אמיתי:** מחולל `scripts/preview-match.mjs` → HTML מקושר ל-CSS המקורי → צילום עם **Edge headless** (`--headless --screenshot`). זה הדפוס לאימות ויזואלי בריפו הזה.
- **סקירה אדוורסרית (workflow מקבילי, 4 עדשות):** 21 ממצאים. תוקנו: **P0 ניגודיות תאי-קופון** (שבב כהה מאחורי המספר), **P1** ערבוב-ציר (תג-שלב היה ציאן→chip ניטרלי), פוקוס-מקלדת גלובלי, `--text-mute`→`--text-dim` בכל טקסט-תוכן (DESIGN §5), aria לסימוני כיוון/בול בקופון, מבטא converged. דפוס reset-state-בזמן-render לקופון. P3 זניחים (44px touch ב-320px; useMemo) — טריאז' מקובל.
- **חוב טכני שנותר:** `theme.ts` כמעט-וסטיגיאלי (הרכיבים על CSS vars). `AnalystInput` עדיין מינימלי (fixture+predictions baseline) — העשרה ב-M3.5/M5.

### 2026-06-21 — M4 (חלק 1): ליבת מנוע ההעפלה + אימות אדוורסרי

- **`rankGroup` (qualify.ts):** סולם 2026 המדויק כ-comparators מסודרים. **ראש-בראש תחילה** (נק׳→הפרש→שערים בין השוות), ואז כללי (הפרש→שערים→התנהגות→פיפ"א→הגרלה). config-driven — קל להחליף סדר אם FIFA תעדכן.
- **🔴 P0 שנמצא ותוקן (הלב של §8):** המימוש הראשון חילק את כל האשכול לפי [pts,gd,gf] במעבר אחד → השתמש ב**הפרש-ראש-בראש מהטבלה המלאה** כדי לדרג שתיים שכבר נפרדה מהן השלישית (מזוהם). **התיקון:** שלבים — מפרידים בנקודות-ראש-בראש, ו**מחשבים מחדש מהתחלה** (טבלה חדשה בין הנותרים בלבד) אחרי כל שלב מפריד. בדיוק "מחשבים מחדש מראש הסולם" של CLAUDE.md §8.
- **תיקונים נוספים מהפאנל:** פיפ"א חלקי (דירוג חסר לא מדיח לתחתית — נופל להגרלה); ניכוי כפילויות בטבלת ראש-בראש; תיעוד קונבנציית-הסימן של conduct (חתום, גבוה=טוב).
- **אימות אדוורסרי (workflow מקבילי, 3 עדשות):** 10 באגים + **10 תרחישים עם סדר מחושב-ביד** לפי §8 → נוספו כ-regression (`it.each`). כולם עוברים. **76 בדיקות סה"כ.** זה ה"רוב הכלים טועים בזה" — נתפס ותוקן.
- **`qualNeeds` (שערים):** ספירת תרחישים (3^k) על המשחקים שנותרו → לכל נבחרת win/draw/loss × guaranteed/possible/eliminated, `mustWin`, `drawOk`, `minWinMargin` ("נצח ב-2+", ע"י הגדלת מרווח עד שמובטח מקום 1-2), `thirdPlaceWatch`, `gdSensitive` (גבול נחתך בשוויון-נקודות). מודל נומינלי (נצחון 1-0/תיקו 0-0); מרווחים מדויקים — שכלול עתידי.
- **לזכור:** `GroupRow.conduct` עדיין 0 (כרטיסים לא חוטים — M5). FIFA rank לא נמשך עדיין (אופציונלי ב-RankOptions). טבלת R32 seeding (495 צירופים) — נדחתה (M4.5).

### 2026-06-21 — M4 (חלק 2): שלישיות + stakes + מסך Group → M4 הושלם

- **מרוץ השלישיות:** `rankThirds` (סולם חוצה-בתים, ללא ראש-בראש: נק׳→הפרש→שערים→התנהגות→פיפ"א) + `thirdsRace` (קו-חתך 8/9). `buildGroupTables` מרכיב הכול משורות+לוח: לכל בית — דירוג 2026 + `qualNeeds`, ואוסף את השלישיות למרוץ.
- **`stakes.ts`:** `computeStakes(homeNeed, awayNeed)` מזהה must-win / mutual-draw / dead-rubber → מכפילי λ + drawBias + note עברי. `describeNeed` → משפט "מה צריך". **מחובר למסך המשחק:** Match בונה qualNeeds לבית של המארחת ומזין `AnalystInput.stakes/notes` → "חייבת ניצחון" מגיע לאנליסט ומסיט את ההצעות (קבלת M4).
- **מסך Group (חי):** `Groups.tsx` משתמש ב-`buildGroupTables` — טבלאות מדורגות (badge-דרגה צבוע 1-2/3/4), צ'יפ "מה צריך" בצבעי-מהות (עלתה/נצח-ב-N+/חייבת-ניצחון/הודחה + דגל ± להפרש-רגיש), ומרוץ השלישיות עם קו-החתך הזהוב. `groups.css` חדש בטוקני DESIGN.
- **בדיקות:** +8 (thirds 2, stakes 6) → **84 סה"כ.** typecheck/lint/build נקיים. אומת ויזואלית ב-Edge.
- **חוב/הערות:** conduct עדיין 0 (כרטיסים — M5); FIFA rank לא נמשך (אופציונלי); `qualNeeds` נומינלי (מרווחים מדויקים — שכלול); R32 seeding (495) נדחה ל-M4.5.

### 2026-06-22 — M5: היעדרויות + היסטוריה + העשרת האנליסט → M5 הושלם

- **מנועים טהורים:** `history.ts` (`weightedForm` עדכניות×עוצמת-יריב, `venueAdjust` גובה/מנוחה, `styleGoalBias`) · `absences.ts` הורחב — `analyzeSquad` (חשיבות שחקן מדקות/דירוג/קפטן/שערים + "במרחק כרטיס מהשעיה"), `conductFromCards` תוקן ל-§8 מדויק (אדום-עקיף=צהוב-שני 3−, לא 4−; net-yellows מנכה זוגות שנצרכו).
- **שכבת נתונים:** endpoints+schemas ל-`/players` (כרטיסים+חשיבות), `/teams/statistics` (כושר+ממוצעי שערים, דרך `apiGetObject` חדש לתשובת-אובייקט), `/fixtures/headtohead`, `/fixtures/statistics`. ועוד events/lineups/injuries (injuries coverage=false).
- **העשרה:** `mappers/enrichment.ts` (`buildEnrichment`/`teamEnrichment`/`h2hSummary`) + `useMatchEnrichment` (Promise.allSettled — כשל חלקי לא מאפס הכול). Match בונה `homeStats`/`awayStats`/`h2h` לאנליסט. **אומת חי:** Claude מצטט שחקני-מפתח (Bentancur/Olivera), h2h (2-2), וממוצעי שערים. הפונקציה `claude-analyst` כבר שולחת את כל ה-input ל-prompt → **לא נדרשה פריסה מחדש.**
- **UI:** פאנל "מודיעין" (`MatchContext`) — רצועות כושר (נ/ת/ה בצבעי-מהות), שחקני מפתח, התרעת "במרחק כרטיס מהשעיה" (ענבר, ללא פס-צד), ראש-בראש. אומת ויזואלית (Edge). + **תיקון UX לבקשת רן:** Fixtures ממיין חי+קרובים למעלה, גמורים מתחת ל"תוצאות" (מעומעמים).
- **אימות אדוורסרי (Workflow, 9 סוכנים, 3 עדשות):** 6 ממצאים אומתו ותוקנו — gate ספינר חסר במסך Match (P1), queryKey שמשרת תוצאה לא-מועשרת מה-cache (P1), one-from-ban עם צהוב-שני (P2), conduct double-count (P2), h2h שמשמיט AET/PEN (P2), allSettled (P2). **108 בדיקות; typecheck/lint/build נקיים.**
- **חוב/הערות:** suspension "מושעה ודאי" לא נגזר (אין coverage; רק "במרחק כרטיס" מצבירה עונתית); conduct→דירוג הבתים עוד לא מחובר (נשאר 0); xG/odds פר-משחק לא נמשכים (teamStats מספק ממוצעים).

### 2026-06-22 — M6: הגדרות, התמדה, ניחושים שמורים, חוגת-סיכון → M6 הושלם

- **store (zustand+persist):** `state/store.ts` — `riskAlpha` (0..1, נחסם) + `savedPicks` (Record לפי fixtureId) ב-localStorage `gesspot-prefs`. פעולות `setRiskAlpha`/`savePick`/`removePick`. שורד רענון.
- **חוגת-סיכון (§4):** `recommendByRisk(advice, α, stage)` במנוע הטהור — α=0 → ההצעה בעלת ה-EV הגבוה; α=1 → דחיפה לבול לפי נקודות-השלב; התכנסות → בול. +5 בדיקות.
- **מסך המשחק:** `SuggestionPair` הורחב — badge "מומלץ לך" על הכרטיס המומלץ (לפי α), כפתור "שמור ניחוש"/"✓ נשמר" לכל הצעה. Match מחווט ל-store.
- **מסך הגדרות:** חוגת-סיכון (סליידר ציאן→זהב), סטטוס חיבור (פרוקסי/אנליסט), יומן ניחושים שמורים (badge כיוון/בול + מחיקה + קישור למשחק), הערת אופליין. + באנר אופליין ב-AppShell (`useOnline`).
- **בדיקות:** 113 (כולל 5 ל-recommendByRisk). typecheck/lint/build נקיים. אומת ויזואלית (Edge).
- **אבטחה לקראת ריפו פומבי:** סקרבנו את ה-project-ref מ-MEMORY.md (3 מקומות) → אין URL קריא לפונקציות. אין מפתחות בקוד; `.env.local` ב-gitignore; אין היסטוריית git לנקות (קומיט ראשון). תזכורת ל-M7: לצמצם `ALLOWED_ORIGIN` ולהוסיף `APP_SHARED_SECRET`.

### 2026-06-22 — M7: הקשחה + פריסה לפלאפון → M7 הושלם, האפליקציה חיה

- **הקשחה:** שתי הפונקציות עברו ל-`ALLOWED_ORIGIN` כ-allowlist (מופרד בפסיקים, `corsFor(req)` מחזיר את ה-origin רק אם מורשה) = `https://redrock03.github.io,http://localhost:5173`. `claude-analyst` דורש header `x-app-secret` מול `APP_SHARED_SECRET` (אומת: 401 בלי/עם-שגוי, 200 עם נכון). הלקוח (`api/analyst.ts`) שולח `x-app-secret` מ-`VITE_APP_SECRET`. הסוד ב-`.env.local` (gitignore) וב-secrets של הפונקציה — לא בריפו. (הסוד מופיע ב-bundle הציבורי בפועל; ההגנה האמיתית מול עלות = תקרת-Anthropic + cache.)
- **GitHub Pages:** `vite.config.ts` → `base = command==='build' ? '/GessPot/' : '/'`; manifest start_url/scope=`/GessPot/`; `createHashRouter` (עמיד בתת-נתיב, ללא 404 fallback). build → דחיפת `dist/` (עם `.nojekyll`) לענף `gh-pages`; Pages מוגדר source=gh-pages/.
- **אומת חי:** `https://redrock03.github.io/GessPot/` → 200, נטען ומציג fixtures אמיתיים (screenshot) — כלומר ה-origin הפרוס קורא בהצלחה לפונקציות המוקשחות. PWA מותקן (manifest+SW, HTTPS).
- **לפריסה חוזרת:** `npm run build` → `cd dist && git init && git add -A && git commit && git push -f <repo> gh-pages`. הפונקציות: `supabase functions deploy <name> --no-verify-jwt --project-ref <ref>` (token ב-memory).

### היסטוריה רלוונטית (טרום-ריפו)

- נבנה ארטיפקט הוכחת-היתכנות (React) עם מנוע Poisson + ממקסם תוחלת — אימת שהמתמטיקה תקינה ושההמלצה האופטימלית שונה מהתוצאה הסבירה. הלוגיקה הזו תועתק ל-`domain/engine`.

---

## שאלות פתוחות / ממתינות

- אין כרגע חוסמים. (נסגרו: בסיס נוקאאוט = 90 דק'; בונוסים = נעולים.)
- לאמת מול התיעוד החי את הצורה המדויקת של תגובת `/predictions` (שדות `percent`, `goals`, `comparison`) בעת מימוש `lambdas.ts`.

---

## צ'קליסט אבני דרך

|     | אבן דרך                              | סטטוס                                    |
| --- | ------------------------------------ | ---------------------------------------- |
| M0  | שלד ותשתית PWA                       | ✅ הושלם ואומת                           |
| M1  | שכבת נתונים (API + zod + cache)      | ✅ הושלם ואומת חי                        |
| M2  | מנוע חיזוי בסיסי (Poisson + 2 הצעות) | ✅ הושלם ואומת                           |
| M3  | מסך החיזוי                           | ✅ הושלם ואומת (+Design System)          |
| M4  | מנוע ההעפלה המלא                     | ✅ הושלם ואומת                  |
| M5  | היעדרויות + היסטוריה                 | ✅ הושלם ואומת (108 בדיקות, סקירה אדוורסרית) |
| M6  | הגדרות, התמדה, ליטוש                 | ✅ הושלם ואומת (113 בדיקות)               |
| M7  | פריסה                                | ✅ חי: redrock03.github.io/GessPot/        |

---

## סיכום הסשן האחרון

**2026-06-21 (תכנון):** הושלם תכנון מלא של המוצר ושלושת מנועיו, נסגרה שיטת הניקוד והוחלט על מודל שתי-ההצעות (כיוון+בול), ואומת כלל ראש-בראש-תחילה של 2026. הופקו `CLAUDE.md` ו-`MEMORY.md`.

**2026-06-21 (M0):** הוקם והותקן שלד ה-PWA המלא (Vite 6 + React 18 + TS strict + vite-plugin-pwa + react-query + zustand + zod + react-router + vitest 3 + ESLint 9 + Prettier). נפתר קונפליקט vite/vitest. נוצרו טיפוסי ליבה, מודול ניקוד, בסיס מנוע Poisson טהור עם מבחנים, מעטפת עברית-RTL עם ניווט ו-4 מסכים, ואייקוני PWA אמיתיים. כל שערי הקבלה עברו. M0 ✅.

**2026-06-21 (M1 — קוד):** נבנתה שכבת הנתונים המלאה — פרוקסי Supabase Edge Function, שכבת `api/` (http+zod+endpoints+errors), `mappers/` (כולל כלל 90-הדקות), `data/` (hooks + IndexedDB persister), ומסכי Groups+Fixtures חיים. **חסר רק אימות מול נתונים חיים** — תלוי בהקמת פרויקט Supabase ומפתח.

**2026-06-21 (M2):** הושלם מנוע החיזוי הטהור — Dixon-Coles ב-`poisson.ts`, `deriveLambdas` (כיול ביסקציה-מקוננת לאחוזי 1X2) + fallback עוצמה ב-`lambdas.ts`, ו-`suggest.ts` (חוזה §4: בול/כיוון + EV + converged + `adviseFrom1x2`). 45/45 בדיקות; כל השערים נקיים. M2 ✅.

## הצעד הבא

**M3 — מסך המשחק (לב המוצר):**

1. סכמת zod + mapper ל-`/predictions` → `OneXTwo` (percent "45%"→0.45). **לאמת את צורת `/predictions` מול הנתונים החיים** (percent/goals/comparison) — שאלה פתוחה.
2. hook `usePrediction(fixtureId)` + חיבור ל-`adviseFrom1x2(target, stage)`.
3. רכיבי UI: `SuggestionPair` (זוג ההצעות עם Pexact/Pout/EV ודגל התכנסות), `ProbBars` (מדי 1X2), `ScorelineHeatmap` (מפת-חום מהמטריצה). מסך Match מלא.
4. **קבלה:** בחירת משחק אמיתי מציגה הצעת כיוון + בול עם הסתברויות ו-EV מנתונים חיים. _(תלוי גם באימות M1 החי.)_

**במקביל — אימות M1 חי (דורש את רן):** יצירת פרויקט Supabase ייעודי → `supabase secrets set APISPORTS_KEY=…` → `functions deploy apifootball-proxy --no-verify-jwt` → מילוי `VITE_API_BASE` ב-`.env.local` → `npm run dev`.
