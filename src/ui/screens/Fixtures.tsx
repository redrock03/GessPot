import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Fixture, Stage } from '../../domain/types';
import { isHighValueStage } from '../../domain/scoring';
import { useCurrentRound, useFixtures, useStandings } from '../../data/hooks';
import { useAppStore } from '../../state/store';
import { ErrorState, LoadingState } from '../components/States';
import { Placeholder } from '../components/Placeholder';
import './fixtures.css';

const dayFmt = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' });

const STAGE_HE: Record<Stage, string> = {
  group: 'שלב הבתים',
  r32: 'שלב 32',
  r16: 'שמינית',
  qf: 'רבע',
  sf: 'חצי',
  third: 'מקום 3',
  final: 'הגמר',
};

const ms = (iso: string) => new Date(iso).getTime();
const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

function groupByDay(fixtures: Fixture[]): Array<[string, Fixture[]]> {
  const map = new Map<string, { label: string; items: Fixture[] }>();
  for (const f of fixtures) {
    const key = dayKey(f.kickoff);
    const entry = map.get(key) ?? { label: dayFmt.format(new Date(f.kickoff)), items: [] };
    entry.items.push(f);
    map.set(key, entry);
  }
  return [...map.values()].map((e) => [e.label, e.items]);
}

const sortUpcoming = (a: Fixture, b: Fixture) => ms(a.kickoff) - ms(b.kickoff);
const sortFinished = (a: Fixture, b: Fixture) => ms(b.kickoff) - ms(a.kickoff);

function BandCard({ f, ctx, saved }: { f: Fixture; ctx: string; saved: boolean }) {
  const live = f.status === 'live';
  const hasScore = f.goalsHome !== undefined && f.goalsAway !== undefined;
  return (
    <Link to={`/match/${f.id}`} className={`fxb-card${live ? ' is-live' : ''}`}>
      <div className="fxb-card__top">
        <span className="fxb-card__ctx">{ctx}</span>
        {live ? (
          <span className="fxb-card__live">
            <i className="fxb-card__dot" aria-hidden="true" />
            חי
          </span>
        ) : (
          <span className="fxb-card__time num">{timeFmt.format(new Date(f.kickoff))}</span>
        )}
      </div>
      <div className="fxb-card__rows">
        <div className="fxb-card__row">
          <span className="fxb-card__team">
            {f.home.logo && <img src={f.home.logo} alt="" />}
            <span>{f.home.name}</span>
          </span>
          {hasScore && <span className="fxb-card__g num">{f.goalsHome}</span>}
        </div>
        <div className="fxb-card__row">
          <span className="fxb-card__team">
            {f.away.logo && <img src={f.away.logo} alt="" />}
            <span>{f.away.name}</span>
          </span>
          {hasScore && <span className="fxb-card__g num">{f.goalsAway}</span>}
        </div>
      </div>
      {saved && <span className="fxb-card__saved">✓ נשמר</span>}
    </Link>
  );
}

function Row({
  f,
  ctx,
  saved,
  result,
}: {
  f: Fixture;
  ctx: string;
  saved: boolean;
  result?: boolean;
}) {
  const live = f.status === 'live';
  const hasScore = f.goalsHome !== undefined && f.goalsAway !== undefined;
  const homeWin = hasScore && f.goalsHome! > f.goalsAway!;
  const awayWin = hasScore && f.goalsAway! > f.goalsHome!;
  const value = isHighValueStage(f.stage);
  return (
    <Link
      to={`/match/${f.id}`}
      className={`fxr${result ? ' fxr--result' : ''}${value ? ' is-value' : ''}`}
    >
      <div className="fxr__meta">
        <span className="fxr__ctx">{ctx}</span>
        {value && (
          <span className="fxr__star" aria-hidden="true">
            ★
          </span>
        )}
        {saved && (
          <span className="fxr__done" title="ניחוש שמור">
            ✓
          </span>
        )}
      </div>
      <div className="fxr__match">
        <span className={`fxr__team${result && homeWin ? ' is-win' : ''}`}>
          {f.home.logo && <img src={f.home.logo} alt="" />}
          <span>{f.home.name}</span>
        </span>
        <span className="fxr__mid">
          {hasScore ? (
            <span className="fxr__score num">
              {f.goalsHome}–{f.goalsAway}
            </span>
          ) : (
            <span className="fxr__time num">{timeFmt.format(new Date(f.kickoff))}</span>
          )}
          {live && <span className="fxr__live">חי</span>}
        </span>
        <span className={`fxr__team fxr__team--away${result && awayWin ? ' is-win' : ''}`}>
          {f.away.logo && <img src={f.away.logo} alt="" />}
          <span>{f.away.name}</span>
        </span>
      </div>
    </Link>
  );
}

function DaySection({
  days,
  ctxOf,
  savedIds,
  result,
}: {
  days: Array<[string, Fixture[]]>;
  ctxOf: (f: Fixture) => string;
  savedIds: Set<number>;
  result?: boolean;
}) {
  return (
    <>
      {days.map(([label, items]) => (
        <div className="fx-day" key={label}>
          <div className="fx-day__label">{label}</div>
          <ul className="fx-day__list">
            {items.map((f) => (
              <li key={f.id}>
                <Row f={f} ctx={ctxOf(f)} saved={savedIds.has(f.id)} result={result} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function Fixtures() {
  const { data, isLoading, isError, error, refetch } = useFixtures();
  const { data: currentRound } = useCurrentRound();
  const standings = useStandings();
  const savedPicks = useAppStore((s) => s.savedPicks);

  const nowDate = new Date();
  const todayK = `${nowDate.getFullYear()}-${nowDate.getMonth()}-${nowDate.getDate()}`;

  const groupOf = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of standings.data ?? []) m.set(r.team.id, r.group);
    return (id: number) => m.get(id);
  }, [standings.data]);

  const savedIds = useMemo(() => new Set(Object.keys(savedPicks).map(Number)), [savedPicks]);

  const ctxOf = (f: Fixture): string => {
    if (f.stage === 'group') {
      const g = groupOf(f.home.id);
      return g ? `בית ${g}` : 'שלב הבתים';
    }
    return STAGE_HE[f.stage];
  };

  const { band, bandIsNext, schedule, finished } = useMemo(() => {
    const all = data ?? [];
    const todayBand = all
      .filter((f) => f.status === 'live' || (f.status === 'scheduled' && dayKey(f.kickoff) === todayK))
      .sort(
        (a, b) => Number(b.status === 'live') - Number(a.status === 'live') || ms(a.kickoff) - ms(b.kickoff),
      );
    const rest = all
      .filter((f) => f.status === 'scheduled' && dayKey(f.kickoff) !== todayK)
      .sort(sortUpcoming);
    const fin = all.filter((f) => f.status === 'finished').sort(sortFinished);
    return {
      band: todayBand.length ? todayBand : rest.slice(0, 1),
      bandIsNext: todayBand.length === 0,
      schedule: groupByDay(todayBand.length ? rest : rest.slice(1)),
      finished: groupByDay(fin),
    };
  }, [data, todayK]);

  if (isLoading) return <LoadingState label="טוען משחקים…" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data || data.length === 0) {
    return (
      <Placeholder milestone="M1" title="משחקים">
        אין עדיין משחקים בלוח. הם יופיעו כשה-API יתחיל להחזיר את לוח המונדיאל.
      </Placeholder>
    );
  }

  return (
    <>
      <div className="screen-head">
        <h2>משחקים</h2>
        {currentRound && <span className="screen-head__meta">{currentRound}</span>}
      </div>

      {band.length > 0 && (
        <section className="fxb">
          <h3 className="fxb__title">{bandIsNext ? 'המשחק הבא' : 'היום'}</h3>
          <div className="fxb__strip">
            {band.map((f) => (
              <BandCard key={f.id} f={f} ctx={ctxOf(f)} saved={savedIds.has(f.id)} />
            ))}
          </div>
        </section>
      )}

      {schedule.length > 0 && (
        <section className="fx-sec">
          <h3 className="fx-sec__title">לוח המשחקים</h3>
          <DaySection days={schedule} ctxOf={ctxOf} savedIds={savedIds} />
        </section>
      )}

      {finished.length > 0 && (
        <section className="fx-sec">
          <div className="fixtures__divider">
            <span>תוצאות</span>
          </div>
          <DaySection days={finished} ctxOf={ctxOf} savedIds={savedIds} result />
        </section>
      )}
    </>
  );
}
