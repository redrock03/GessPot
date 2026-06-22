// מנוע מצב ההעפלה (CLAUDE.md §8) — מנוע טהור, ללא I/O.
// סולם שובר-השוויון של 2026: **ראש-בראש תחילה**, עם מחשוב-מחדש בשוויון רב-נבחרתי.
// כל קריטריון מוגדר כ-comparator מסודר → קל להחליף סדר אם FIFA תעדכן (CLAUDE.md §17.11).
import type { Fixture, GroupRow, QualNeed } from '../types';

/** תוצאת משחק-בית גמורה (לבניית טבלת ראש-בראש). */
export interface H2HResult {
  home: number;
  away: number;
  gh: number;
  ga: number;
}

export interface RankOptions {
  /** דירוג פיפ"א לכל נבחרת (מספר נמוך = טוב יותר). אופציונלי — בלעדיו הקריטריון נופל להגרלה. */
  fifaRank?: Record<number, number>;
}

/** סך נקודות/הפרש/שערים של נבחרת בתת-טבלת ראש-בראש מסוימת. */
interface H2HLine {
  pts: number;
  gd: number;
  gf: number;
}

/** חילוץ משחקי הבית הגמורים מבין נבחרות הבית מתוך לוח כללי. */
export function h2hResultsFromFixtures(
  fixtures: Array<{
    status: string;
    home: { id: number };
    away: { id: number };
    goalsHome?: number;
    goalsAway?: number;
  }>,
  teamIds: Set<number>,
): H2HResult[] {
  const out: H2HResult[] = [];
  for (const f of fixtures) {
    if (
      f.status === 'finished' &&
      typeof f.goalsHome === 'number' &&
      typeof f.goalsAway === 'number' &&
      teamIds.has(f.home.id) &&
      teamIds.has(f.away.id)
    ) {
      out.push({ home: f.home.id, away: f.away.id, gh: f.goalsHome, ga: f.goalsAway });
    }
  }
  return out;
}

/** בונה תת-טבלת ראש-בראש בין קבוצת נבחרות בלבד. כל זוג משחק פעם אחת — מנכים כפילויות. */
function h2hTable(teamIds: number[], results: H2HResult[]): Map<number, H2HLine> {
  const ids = new Set(teamIds);
  const tbl = new Map<number, H2HLine>();
  for (const id of teamIds) tbl.set(id, { pts: 0, gd: 0, gf: 0 });
  const seen = new Set<string>();
  for (const r of results) {
    if (!ids.has(r.home) || !ids.has(r.away)) continue;
    const pairKey = r.home < r.away ? `${r.home}-${r.away}` : `${r.away}-${r.home}`;
    if (seen.has(pairKey)) continue; // משחק בית בודד לכל זוג (פורמט המונדיאל)
    seen.add(pairKey);
    const H = tbl.get(r.home)!;
    const A = tbl.get(r.away)!;
    H.gf += r.gh;
    A.gf += r.ga;
    H.gd += r.gh - r.ga;
    A.gd += r.ga - r.gh;
    if (r.gh > r.ga) H.pts += 3;
    else if (r.gh < r.ga) A.pts += 3;
    else {
      H.pts += 1;
      A.pts += 1;
    }
  }
  return tbl;
}

/** מפתח השוואה: מחזיר מספר ש**גבוה=טוב יותר** (כל הקריטריונים ממוינים יורד). */
type Key = (t: GroupRow) => number;

/**
 * מחלק קבוצת נבחרות לבלוקים מסודרים: ממיין יורד לפי keys בזה אחר זה,
 * ומקבץ רצף נבחרות ש**שוות בכל ה-keys** לבלוק אחד. בלוק בגודל >1 = עדיין תיקו.
 */
function partition(teams: GroupRow[], keys: Key[]): GroupRow[][] {
  const sorted = [...teams].sort((a, b) => {
    for (const k of keys) {
      const d = k(b) - k(a);
      if (d !== 0) return d;
    }
    return 0;
  });
  const blocks: GroupRow[][] = [];
  for (const t of sorted) {
    const prev = blocks[blocks.length - 1];
    if (prev && keys.every((k) => k(prev[0]) === k(t))) prev.push(t);
    else blocks.push([t]);
  }
  return blocks;
}

// קריטריונים כלליים (5–8): הפרש כללי → שערים כללי → התנהגות → דירוג פיפ"א.
// דירוג פיפ"א מוחל רק אם **כל** הנבחרות התקועות מדורגות (אחרת — נופלים להגרלה; תיקון P2/P3).
function overallKeys(cluster: GroupRow[], opts: RankOptions): Key[] {
  const keys: Key[] = [
    (t) => t.goalsFor - t.goalsAgainst, // הפרש שערים כללי
    (t) => t.goalsFor, // שערים כללי
    (t) => t.conduct, // ציון התנהגות = ניקוד פייר-פליי **חתום** (גבוה/קרוב ל-0 = פחות כרטיסים = טוב)
  ];
  if (cluster.every((t) => opts.fifaRank?.[t.team.id] !== undefined)) {
    keys.push((t) => -opts.fifaRank![t.team.id]!); // דירוג נמוך=טוב → שלילי
  }
  return keys;
}

/**
 * שובר שוויון בתוך אשכול נבחרות שוות-נקודות (CLAUDE.md §8):
 * מחילים את קריטריוני ראש-בראש **בשלבים** (נקודות → הפרש → שערים), וברגע ששלב מפריד —
 * **מחשבים מחדש מראש הסולם** לכל תת-בלוק שנותר שווה (טבלת ראש-בראש חדשה בין חבריו בלבד).
 * זה ההבדל הקריטי שרוב הכלים מפספסים: אסור להשתמש בהפרש-ראש-בראש מהטבלה המלאה
 * כדי לדרג נבחרות שכבר הופרדו מהן נבחרת. רק כשאין כל הפרדה בראש-בראש — נופלים לקריטריונים הכלליים.
 */
function breakTie(cluster: GroupRow[], results: H2HResult[], opts: RankOptions): GroupRow[] {
  if (cluster.length <= 1) return cluster;

  const ids = cluster.map((t) => t.team.id);
  const tbl = h2hTable(ids, results);
  const stages: Key[] = [
    (t) => tbl.get(t.team.id)?.pts ?? 0, // 2) נקודות ראש-בראש
    (t) => tbl.get(t.team.id)?.gd ?? 0, // 3) הפרש ראש-בראש
    (t) => tbl.get(t.team.id)?.gf ?? 0, // 4) שערי ראש-בראש
  ];

  for (const key of stages) {
    const blocks = partition(cluster, [key]);
    if (blocks.length > 1) {
      // שלב זה הפריד → מחשבים מחדש מהתחלה לכל תת-בלוק שנותר שווה.
      return blocks.flatMap((b) => (b.length > 1 ? breakTie(b, results, opts) : b));
    }
  }

  // האשכול שווה לחלוטין בכל קריטריוני ראש-בראש → קריטריונים כלליים (ואז הגרלה = סדר יציב).
  return partition(cluster, overallKeys(cluster, opts)).flat();
}

/**
 * מדרג בית מלא לפי הסולם המדויק של 2026. מחזיר את הנבחרות מסודרות (הטוב ביותר ראשון).
 * `teams` = שורות הבית; `h2h` = תוצאות משחקי-הבית הגמורות; `opts.fifaRank` אופציונלי.
 */
export function rankGroup(teams: GroupRow[], h2h: H2HResult[], opts: RankOptions = {}): GroupRow[] {
  const byPoints = [...teams].sort((a, b) => b.points - a.points);
  const out: GroupRow[] = [];
  let i = 0;
  while (i < byPoints.length) {
    let j = i;
    while (j < byPoints.length && byPoints[j].points === byPoints[i].points) j++;
    const cluster = byPoints.slice(i, j);
    out.push(...(cluster.length > 1 ? breakTie(cluster, h2h, opts) : cluster));
    i = j;
  }
  return out;
}

// ============================================================
// שערי ההעפלה — מה כל נבחרת צריכה (CLAUDE.md §8 / QualNeed §12).
// מודל: ספירת תרחישים (W/D/L) של המשחקים שנותרו, עם ציון נומינלי (נצחון 1-0, תיקו 0-0)
// לדירוג כל תרחיש. דגל gdSensitive מסמן מקרים שבהם הגבול נחתך בשוויון-נקודות (תלוי מרווח).
// minWinMargin (מצב עדין) מחושב ע"י הגדלת מרווח הניצחון עד שמובטח מקום 1-2 בכל תרחיש אחר.
// ============================================================

/** משחק בית שנותר לשחק. */
export interface RemainingMatch {
  home: number;
  away: number;
}

type MatchOutcome = 'H' | 'D' | 'A';
const OUTCOMES: readonly MatchOutcome[] = ['H', 'D', 'A'];

/** כל צירופי ה-W/D/L ל-k משחקים (3^k). */
function* enumerate(k: number): Generator<MatchOutcome[]> {
  const total = 3 ** k;
  for (let n = 0; n < total; n++) {
    const combo: MatchOutcome[] = [];
    let x = n;
    for (let i = 0; i < k; i++) {
      combo.push(OUTCOMES[x % 3]);
      x = Math.floor(x / 3);
    }
    yield combo;
  }
}

/** מחיל תרחיש על שורות הבית (שיבוט) — מחזיר שורות מעודכנות + תוצאות ראש-בראש להוסיף. */
function project(
  teams: GroupRow[],
  remaining: RemainingMatch[],
  outcomes: MatchOutcome[],
  margin?: { idx: number; goals: number },
): { rows: GroupRow[]; addH2H: H2HResult[] } {
  const rows = teams.map((t) => ({ ...t }));
  const byId = new Map(rows.map((r) => [r.team.id, r]));
  const addH2H: H2HResult[] = [];
  remaining.forEach((m, i) => {
    const o = outcomes[i];
    const H = byId.get(m.home);
    const A = byId.get(m.away);
    if (!H || !A) return;
    let gh = 0;
    let ga = 0;
    if (o === 'H') {
      gh = margin && margin.idx === i ? margin.goals : 1;
      ga = 0;
      H.points += 3;
    } else if (o === 'A') {
      gh = 0;
      ga = margin && margin.idx === i ? margin.goals : 1;
      A.points += 3;
    } else {
      H.points += 1;
      A.points += 1;
    }
    H.goalsFor += gh;
    H.goalsAgainst += ga;
    A.goalsFor += ga;
    A.goalsAgainst += gh;
    addH2H.push({ home: m.home, away: m.away, gh, ga });
  });
  return { rows, addH2H };
}

type Standing = QualNeed['win'];
function classify(top2: boolean[]): Standing {
  if (top2.length === 0) return 'eliminated';
  if (top2.every(Boolean)) return 'guaranteed';
  if (top2.some(Boolean)) return 'possible';
  return 'eliminated';
}

/** התוצאה מנקודת-מבט הנבחרת במשחק נתון: ניצחון/תיקו/הפסד. */
function resultFor(teamId: number, m: RemainingMatch, o: MatchOutcome): 'win' | 'draw' | 'loss' {
  if (o === 'D') return 'draw';
  const homeWon = o === 'H';
  const isHome = m.home === teamId;
  return homeWon === isHome ? 'win' : 'loss';
}

/**
 * מחשב QualNeed לכל נבחרת בבית, בהינתן השורות הנוכחיות, המשחקים שנותרו, ותוצאות ראש-בראש שכבר נצברו.
 */
export function qualNeeds(
  teams: GroupRow[],
  remaining: RemainingMatch[],
  finishedH2H: H2HResult[],
  opts: RankOptions = {},
): QualNeed[] {
  const k = remaining.length;
  // טבלת כל התרחישים: מיקום סופי לכל נבחרת + האם גבול 2/3 נחתך בשוויון-נקודות.
  const table = [...enumerate(k)].map((outcomes) => {
    const { rows, addH2H } = project(teams, remaining, outcomes);
    const ranked = rankGroup(rows, [...finishedH2H, ...addH2H], opts);
    const pos = new Map(ranked.map((r, idx) => [r.team.id, idx + 1]));
    const boundaryTie = ranked.length >= 3 && ranked[1].points === ranked[2].points;
    return { outcomes, pos, boundaryTie };
  });

  return teams.map((t): QualNeed => {
    const id = t.team.id;
    const nextIdx = remaining.findIndex((m) => m.home === id || m.away === id);

    const buckets: Record<'win' | 'draw' | 'loss', boolean[]> = { win: [], draw: [], loss: [] };
    const positions: number[] = [];
    let gdSensitive = false;
    for (const s of table) {
      const p = s.pos.get(id) ?? 99;
      positions.push(p);
      if (s.boundaryTie && (p === 2 || p === 3)) gdSensitive = true;
      if (nextIdx >= 0) {
        const r = resultFor(id, remaining[nextIdx], s.outcomes[nextIdx]);
        buckets[r].push(p <= 2);
      }
    }

    const win =
      nextIdx >= 0
        ? classify(buckets.win)
        : positions.every((p) => p <= 2)
          ? 'guaranteed'
          : positions.some((p) => p <= 2)
            ? 'possible'
            : 'eliminated';
    const draw = nextIdx >= 0 ? classify(buckets.draw) : win;
    const loss = nextIdx >= 0 ? classify(buckets.loss) : win;

    const need: QualNeed = {
      team: t.team,
      win,
      draw,
      loss,
      mustWin: draw === 'eliminated' && loss === 'eliminated' && win !== 'eliminated',
      drawOk: draw !== 'eliminated',
      thirdPlaceWatch: positions.some((p) => p === 3),
      gdSensitive,
    };

    // מצב עדין: אם ניצחון לא תמיד מספיק (possible) — מהו המרווח שמבטיח מקום 1-2?
    if (nextIdx >= 0 && win === 'possible') {
      const margin = minWinMargin(teams, remaining, finishedH2H, opts, id, nextIdx);
      if (margin !== undefined) need.minWinMargin = margin;
    }
    return need;
  });
}

/** המרווח המינימלי שבו ניצחון מבטיח מקום 1-2 ללא תלות בשאר התוצאות (1..6), או undefined. */
function minWinMargin(
  teams: GroupRow[],
  remaining: RemainingMatch[],
  finishedH2H: H2HResult[],
  opts: RankOptions,
  id: number,
  nextIdx: number,
): number | undefined {
  const m = remaining[nextIdx];
  const isHome = m.home === id;
  const otherIdx = remaining.map((_, i) => i).filter((i) => i !== nextIdx);
  for (let margin = 1; margin <= 6; margin++) {
    let guaranteed = true;
    for (const oc of enumerate(otherIdx.length)) {
      const outcomes: MatchOutcome[] = remaining.map(() => 'D');
      outcomes[nextIdx] = isHome ? 'H' : 'A';
      otherIdx.forEach((idx, j) => (outcomes[idx] = oc[j]));
      const { rows, addH2H } = project(teams, remaining, outcomes, { idx: nextIdx, goals: margin });
      const ranked = rankGroup(rows, [...finishedH2H, ...addH2H], opts);
      const pos = ranked.findIndex((r) => r.team.id === id) + 1;
      if (pos > 2) {
        guaranteed = false;
        break;
      }
    }
    if (guaranteed) return margin;
  }
  return undefined;
}

// ============================================================
// מרוץ השלישיות (CLAUDE.md §8) — 8 השלישיות המיטביות עוברות. סולם חוצה-בתים, **ללא ראש-בראש**:
// נקודות → הפרש כללי → שערים כללי → התנהגות → דירוג פיפ"א → הגרלה.
// ============================================================

/** מדרג את 12 השלישיות לפי סולם השלישיות (ללא ראש-בראש — הן לא נפגשו). */
export function rankThirds(thirds: GroupRow[], opts: RankOptions = {}): GroupRow[] {
  const byPoints = [...thirds].sort((a, b) => b.points - a.points);
  const out: GroupRow[] = [];
  let i = 0;
  while (i < byPoints.length) {
    let j = i;
    while (j < byPoints.length && byPoints[j].points === byPoints[i].points) j++;
    const cluster = byPoints.slice(i, j);
    out.push(
      ...(cluster.length > 1 ? partition(cluster, overallKeys(cluster, opts)).flat() : cluster),
    );
    i = j;
  }
  return out;
}

export interface ThirdsRace {
  ranked: GroupRow[];
  qualified: GroupRow[]; // 8 הראשונות
  out: GroupRow[]; // 9 ומטה
  cutIndex: number; // קו-החתך (8)
}

/** מדרג ומחשב את קו-החתך 8/9 של מרוץ השלישיות. */
export function thirdsRace(
  thirds: GroupRow[],
  opts: RankOptions = {},
  qualifyCount = 8,
): ThirdsRace {
  const ranked = rankThirds(thirds, opts);
  return {
    ranked,
    qualified: ranked.slice(0, qualifyCount),
    out: ranked.slice(qualifyCount),
    cutIndex: qualifyCount,
  };
}

// ============================================================
// הרכבה: שורות + לוח → טבלאות בתים מדורגות + שערים + מרוץ שלישיות (CLAUDE.md §13 מסך Group).
// ============================================================

export interface GroupTable {
  letter: string;
  ranked: GroupRow[];
  needs: QualNeed[];
}

export interface GroupsView {
  groups: GroupTable[];
  thirds: ThirdsRace;
}

/** בונה את כל תצוגת הבתים מתוך שורות ה-standings והלוח (טהור). */
export function buildGroupTables(
  rows: GroupRow[],
  fixtures: Fixture[],
  opts: RankOptions = {},
): GroupsView {
  const byGroup = new Map<string, GroupRow[]>();
  for (const r of rows) {
    const arr = byGroup.get(r.group) ?? [];
    arr.push(r);
    byGroup.set(r.group, arr);
  }

  const groups: GroupTable[] = [];
  const thirdsTeams: GroupRow[] = [];
  for (const [letter, teams] of [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const ids = new Set(teams.map((t) => t.team.id));
    const finishedH2H = h2hResultsFromFixtures(fixtures, ids);
    const remaining = fixtures
      .filter((f) => f.status !== 'finished' && ids.has(f.home.id) && ids.has(f.away.id))
      .map((f) => ({ home: f.home.id, away: f.away.id }));
    const ranked = rankGroup(teams, finishedH2H, opts);
    const needs = qualNeeds(teams, remaining, finishedH2H, opts);
    groups.push({ letter, ranked, needs });
    if (ranked[2]) thirdsTeams.push(ranked[2]);
  }

  return { groups, thirds: thirdsRace(thirdsTeams, opts) };
}
