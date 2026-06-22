import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Fixture } from '../../domain/types';
import { isHighValueStage } from '../../domain/scoring';
import { useFixtures } from '../../data/hooks';
import { useAppStore } from '../../state/store';
import { ErrorState, LoadingState } from '../components/States';
import './predict.css';

const dayFmt = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat('he-IL', { weekday: 'long' });

const ms = (iso: string) => new Date(iso).getTime();
const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** מתי המשחק — יחסי וקריא ("בעוד 3 שע׳" / "מחר" / יום בשבוע). */
function relWhen(iso: string, now: number): string {
  const mins = Math.round((ms(iso) - now) / 60000);
  if (mins <= 0) return 'עכשיו';
  if (mins < 60) return `בעוד ${mins} דק׳`;
  if (mins < 600) return `בעוד ${Math.round(mins / 60)} שע׳`;
  const today = new Date(now).toDateString();
  const that = new Date(ms(iso)).toDateString();
  if (today === that) return 'היום';
  if (new Date(now + 86_400_000).toDateString() === that) return 'מחר';
  return weekdayFmt.format(new Date(iso));
}

function groupByDay(fixtures: Fixture[]): Array<[string, Fixture[]]> {
  const map = new Map<string, { label: string; items: Fixture[] }>();
  for (const f of fixtures) {
    const k = dayKey(f.kickoff);
    const e = map.get(k) ?? { label: dayFmt.format(new Date(f.kickoff)), items: [] };
    e.items.push(f);
    map.set(k, e);
  }
  return [...map.values()].map((e) => [e.label, e.items]);
}

export function Predict() {
  const { data, isLoading, isError, error, refetch } = useFixtures();
  const savedPicks = useAppStore((s) => s.savedPicks);
  const now = Date.now();

  const upcoming = useMemo(
    () =>
      (data ?? [])
        .filter((f) => f.status !== 'finished')
        .sort((a, b) => ms(a.kickoff) - ms(b.kickoff)),
    [data],
  );
  const saved = useMemo(
    () => Object.values(savedPicks).sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [savedPicks],
  );
  const savedIds = useMemo(() => new Set(saved.map((s) => s.fixtureId)), [saved]);

  if (isLoading) return <LoadingState label="טוען משחקים…" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const next = upcoming[0];
  const days = groupByDay(upcoming.slice(1, 13));

  return (
    <>
      <div className="screen-head">
        <h2>חיזוי</h2>
        {saved.length > 0 && <span className="screen-head__meta">{saved.length} ניחושים שמורים</span>}
      </div>

      {next && (
        <Link to={`/match/${next.id}`} className="pr-hero">
          <div className="pr-hero__head">
            <span className="pr-hero__kicker">המשחק הבא</span>
            <span className="pr-hero__when">{relWhen(next.kickoff, now)}</span>
          </div>
          <div className="pr-hero__teams">
            <span className="pr-hero__team">
              {next.home.logo && <img src={next.home.logo} alt="" />}
              <span>{next.home.name}</span>
            </span>
            <span className="pr-hero__vs" aria-hidden="true">
              נגד
            </span>
            <span className="pr-hero__team">
              {next.away.logo && <img src={next.away.logo} alt="" />}
              <span>{next.away.name}</span>
            </span>
          </div>
          <div className="pr-hero__foot">
            <span className="pr-hero__time num">{timeFmt.format(new Date(next.kickoff))}</span>
            {isHighValueStage(next.stage) && <span className="pr-hero__tag pr-hero__tag--val">★ ערך גבוה</span>}
            {savedIds.has(next.id) && <span className="pr-hero__tag pr-hero__tag--saved">✓ נשמר</span>}
            <span className="pr-hero__cta">נתח ←</span>
          </div>
        </Link>
      )}

      {saved.length > 0 && (
        <section className="pr-sec">
          <h3 className="pr-sec__title">הניחושים שלך</h3>
          <div className="pr-tickets">
            {saved.slice(0, 8).map((p) => (
              <Link key={p.fixtureId} to={`/match/${p.fixtureId}`} className="pr-ticket">
                <span className="pr-ticket__score num">
                  {p.score.home}–{p.score.away}
                </span>
                <span className="pr-ticket__teams">
                  {p.homeName} — {p.awayName}
                </span>
                <span
                  className={`pr-ticket__kind pr-ticket__kind--${p.kind === 'exact' ? 'strike' : 'steady'}`}
                >
                  {p.kind === 'exact' ? 'בול' : 'כיוון'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="pr-sec">
        <h3 className="pr-sec__title">לוח הקרובים</h3>
        {days.length === 0 ? (
          <p className="pr-empty">אין משחקים נוספים בלוח כרגע.</p>
        ) : (
          days.map(([label, items]) => (
            <div className="pr-day" key={label}>
              <div className="pr-day__label">{label}</div>
              <ul className="pr-day__list">
                {items.map((f) => (
                  <li key={f.id}>
                    <Link to={`/match/${f.id}`} className="pr-match">
                      <span className="pr-match__time num">
                        {timeFmt.format(new Date(f.kickoff))}
                      </span>
                      <span className="pr-match__teams">
                        {isHighValueStage(f.stage) && (
                          <span className="pr-match__star" aria-hidden="true">
                            ★
                          </span>
                        )}
                        {f.home.name} <span className="pr-match__dash">—</span> {f.away.name}
                      </span>
                      {savedIds.has(f.id) && (
                        <span className="pr-match__done" title="ניחוש שמור">
                          ✓
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
