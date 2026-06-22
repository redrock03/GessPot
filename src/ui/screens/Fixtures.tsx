import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Fixture } from '../../domain/types';
import { isHighValueStage } from '../../domain/scoring';
import { useCurrentRound, useFixtures } from '../../data/hooks';
import { ErrorState, LoadingState } from '../components/States';
import { Placeholder } from '../components/Placeholder';

const dayFmt = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const timeFmt = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' });

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

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

const ms = (iso: string) => new Date(iso).getTime();

/** משחקים חיים בראש, אחר כך הקרובים (הבא ביותר ראשון). */
function sortUpcoming(a: Fixture, b: Fixture): number {
  const live = Number(b.status === 'live') - Number(a.status === 'live');
  return live !== 0 ? live : ms(a.kickoff) - ms(b.kickoff);
}
/** תוצאות — האחרון שהסתיים ראשון. */
const sortFinished = (a: Fixture, b: Fixture) => ms(b.kickoff) - ms(a.kickoff);

function DayGroups({ days }: { days: Array<[string, Fixture[]]> }) {
  return (
    <>
      {days.map(([label, items]) => (
        <section key={label}>
          <h3 className="fixtures__group-title">{label}</h3>
          {items.map((f) => (
            <FixtureRow key={f.id} f={f} />
          ))}
        </section>
      ))}
    </>
  );
}

function FixtureRow({ f }: { f: Fixture }) {
  const hasScore = f.goalsHome !== undefined && f.goalsAway !== undefined;
  return (
    <Link
      to={`/match/${f.id}`}
      className={`fixture-row${isHighValueStage(f.stage) ? ' is-value' : ''}`}
    >
      <div className="fixture-team">
        {f.home.logo && <img src={f.home.logo} alt="" />}
        <span>{f.home.name}</span>
      </div>
      <div className="fixture-mid">
        {hasScore ? (
          <span className="fixture-score num">
            {f.goalsHome}–{f.goalsAway}
          </span>
        ) : (
          <span className="fixture-time num">{timeFmt.format(new Date(f.kickoff))}</span>
        )}
        {f.status === 'live' && <span className="fixture-live">חי</span>}
      </div>
      <div className="fixture-team fixture-team--away">
        {f.away.logo && <img src={f.away.logo} alt="" />}
        <span>{f.away.name}</span>
      </div>
    </Link>
  );
}

export function Fixtures() {
  const { data, isLoading, isError, error, refetch } = useFixtures();
  const { data: currentRound } = useCurrentRound();
  const { upcoming, finished } = useMemo(() => {
    const all = data ?? [];
    return {
      upcoming: groupByDay(all.filter((f) => f.status !== 'finished').sort(sortUpcoming)),
      finished: groupByDay(all.filter((f) => f.status === 'finished').sort(sortFinished)),
    };
  }, [data]);

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

      {upcoming.length > 0 && (
        <div className="fixtures">
          <DayGroups days={upcoming} />
        </div>
      )}

      {finished.length > 0 && (
        <>
          <div className="fixtures__divider">
            <span>תוצאות</span>
          </div>
          <div className="fixtures fixtures--past">
            <DayGroups days={finished} />
          </div>
        </>
      )}
    </>
  );
}
