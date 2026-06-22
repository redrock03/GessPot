import { Link } from 'react-router-dom';
import { ANALYST_BASE, API_BASE } from '../../config';
import type { Stage } from '../../domain/types';
import { riskFromPoolGap } from '../../domain/engine/suggest';
import { useCoverage } from '../../data/hooks';
import { useAppStore } from '../../state/store';
import './settings.css';

const COVERAGE_HE: Array<{ key: 'predictions' | 'odds' | 'lineups' | 'events' | 'statistics' | 'injuries'; label: string }> = [
  { key: 'predictions', label: 'תחזיות API' },
  { key: 'odds', label: 'ליינים (סוכנויות)' },
  { key: 'lineups', label: 'הרכבים' },
  { key: 'events', label: 'אירועים (כרטיסים)' },
  { key: 'statistics', label: 'סטטיסטיקות משחק (xG)' },
  { key: 'injuries', label: 'פציעות' },
];

const STAGE_HE: Record<Stage, string> = {
  group: 'שלב הבתים',
  r32: 'שלב 32',
  r16: 'שמינית',
  qf: 'רבע',
  sf: 'חצי',
  third: 'מקום 3',
  final: 'הגמר',
};

function riskLabel(a: number): string {
  if (a <= 0.2) return 'שמרני — כיוון בטוח';
  if (a <= 0.42) return 'נוטה לבטוח';
  if (a < 0.58) return 'מאוזן';
  if (a < 0.8) return 'נוטה לבול';
  return 'אגרסיבי — רדיפת בול';
}

function Status({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return (
    <span className={`set-status${on ? ' is-on' : ''}`}>
      <span className="set-status__dot" aria-hidden="true" />
      {on ? onText : offText}
    </span>
  );
}

export function Settings() {
  const riskAlpha = useAppStore((s) => s.riskAlpha);
  const setRiskAlpha = useAppStore((s) => s.setRiskAlpha);
  const poolAdjust = useAppStore((s) => s.poolAdjust);
  const poolBehind = useAppStore((s) => s.poolBehind);
  const poolPoints = useAppStore((s) => s.poolPoints);
  const setPoolAdjust = useAppStore((s) => s.setPoolAdjust);
  const setPoolBehind = useAppStore((s) => s.setPoolBehind);
  const setPoolPoints = useAppStore((s) => s.setPoolPoints);
  const savedPicks = useAppStore((s) => s.savedPicks);
  const removePick = useAppStore((s) => s.removePick);
  const clearPicks = useAppStore((s) => s.clearPicks);
  const coverage = useCoverage();
  const picks = Object.values(savedPicks).sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  const poolGap = poolBehind ? poolPoints : -poolPoints;
  const effAlpha = poolAdjust ? riskFromPoolGap(poolGap) : riskAlpha;

  const onClearPicks = () => {
    if (window.confirm('למחוק את כל הניחושים השמורים?')) clearPicks();
  };

  return (
    <>
      <div className="screen-head">
        <h2>הגדרות</h2>
      </div>

      <h3 className="set-cat">אסטרטגיה</h3>
      <section className="panel set">
        <h3 className="set__title">חוגת הסיכון</h3>
        <p className="set__hint">
          מטה את ההמלצה בין הכיוון הבטוח (EV מרבי) לרדיפת הבול (תקרה מרבית). שתי ההצעות תמיד מוצגות
          במלואן.
        </p>

        {!poolAdjust && (
          <>
            <div className="set__dial">
              <span className="set__dial-end">בטוח</span>
              <input
                type="range"
                className="set__range"
                min={0}
                max={1}
                step={0.05}
                value={riskAlpha}
                onChange={(e) => setRiskAlpha(Number(e.target.value))}
                aria-label="חוגת סיכון"
              />
              <span className="set__dial-end set__dial-end--strike">בול</span>
            </div>
            <div className="set__dial-val">
              {riskLabel(riskAlpha)} · <span className="num">{Math.round(riskAlpha * 100)}%</span>
            </div>
          </>
        )}

        <label className="set__toggle">
          <input
            type="checkbox"
            checked={poolAdjust}
            onChange={(e) => setPoolAdjust(e.target.checked)}
          />
          <span>התאם אוטומטית לפי מצב הפול</span>
        </label>

        {poolAdjust && (
          <div className="set__pool">
            <div className="set__seg" role="group" aria-label="מיקום בפול">
              <button
                type="button"
                className={poolBehind ? 'is-on' : undefined}
                onClick={() => setPoolBehind(true)}
              >
                אני מאחור
              </button>
              <button
                type="button"
                className={!poolBehind ? 'is-on' : undefined}
                onClick={() => setPoolBehind(false)}
              >
                אני מוביל
              </button>
            </div>
            <label className="set__points">
              <span>{poolBehind ? 'פער מהמוביל (נק׳)' : 'יתרון על המקום ה-2 (נק׳)'}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={poolPoints}
                onChange={(e) => setPoolPoints(Number(e.target.value))}
              />
            </label>
            <div className="set__dial-val">
              אגרסיביות מומלצת: {riskLabel(effAlpha)} ·{' '}
              <span className="num">{Math.round(effAlpha * 100)}%</span>
            </div>
            <p className="set__hint">
              {poolBehind
                ? 'מאחורי המוביל → דוחפים לבול לשונות גבוהה (צריך תקרה כדי לסגור פער).'
                : 'מובילים → משחק בטוח לשמירה על היתרון (EV מרבי).'}
            </p>
          </div>
        )}
      </section>

      <h3 className="set-cat">הניחושים שלי</h3>
      <section className="panel set">
        <div className="set__titlerow">
          <h3 className="set__title">
            ניחושים שמורים <span className="set__count num">{picks.length}</span>
          </h3>
          {picks.length > 0 && (
            <button type="button" className="set__clear" onClick={onClearPicks}>
              נקה הכל
            </button>
          )}
        </div>
        {picks.length === 0 ? (
          <p className="set__empty">
            עדיין לא שמרת ניחושים. במסך משחק לחץ <strong>"שמור ניחוש"</strong> על ההצעה שבחרת — היא
            תופיע כאן ותשרוד רענון.
          </p>
        ) : (
          <ul className="set__picks">
            {picks.map((p) => (
              <li key={p.fixtureId} className="pick">
                <Link to={`/match/${p.fixtureId}`} className="pick__main">
                  <span className="pick__teams">
                    {p.homeName} — {p.awayName}
                  </span>
                  <span className="pick__meta">{STAGE_HE[p.stage]}</span>
                </Link>
                <span className={`pick__kind pick__kind--${p.kind === 'exact' ? 'strike' : 'steady'}`}>
                  {p.kind === 'exact' ? 'בול' : 'כיוון'}
                </span>
                <span className="pick__score num">
                  {p.score.home}–{p.score.away}
                </span>
                <button
                  type="button"
                  className="pick__del"
                  aria-label={`מחק את הניחוש ל${p.homeName} מול ${p.awayName}`}
                  onClick={() => removePick(p.fixtureId)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h3 className="set-cat">נתונים וחיבור</h3>
      <section className="panel set">
        <h3 className="set__title">מצב הנתונים</h3>
        <ul className="set__conn">
          <li>
            <span>פרוקסי API</span>
            <Status on={Boolean(API_BASE)} onText="מחובר" offText="ישיר" />
          </li>
          <li>
            <span>אנליסט Claude</span>
            <Status on={Boolean(ANALYST_BASE)} onText="פעיל" offText="כבוי" />
          </li>
        </ul>

        {coverage.data && (
          <>
            <h4 className="set__subhead">כיסוי נתוני המונדיאל</h4>
            <ul className="set__conn">
              {COVERAGE_HE.map(({ key, label }) => (
                <li key={key}>
                  <span>{label}</span>
                  <Status on={coverage.data![key]} onText="זמין" offText="לא זמין" />
                </li>
              ))}
            </ul>
            <p className="set__hint">
              נתונים ש"לא זמינים" כרגע (כמו פציעות) מתחברים אוטומטית ברגע שה-API יתחיל לספק אותם — אין
              צורך בפעולה.
            </p>
          </>
        )}

        <p className="set__hint">המפתחות חיים בשרת הפונקציות בלבד — לעולם לא בדפדפן.</p>
      </section>

      <h3 className="set-cat">פרטיות והתמדה</h3>
      <section className="panel set">
        <h3 className="set__title">התמדה ואופליין</h3>
        <p className="set__hint">
          כל הנתונים נשמרים בדפדפן ושורדים רענון. האפליקציה מותקנת למסך הבית ועובדת אופליין עם המטמון
          האחרון — ללא שרת וללא חשבון.
        </p>
      </section>
    </>
  );
}
