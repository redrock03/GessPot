import { useMemo } from 'react';
import type { GroupRow, QualNeed } from '../../domain/types';
import { buildGroupTables } from '../../domain/engine/qualify';
import { useFixtures, useStandings } from '../../data/hooks';
import { ErrorState, LoadingState } from '../components/States';
import { Placeholder } from '../components/Placeholder';
import './groups.css';

type Tone = 'home' | 'draw' | 'away' | 'mute';

function needStatus(n: QualNeed): { label: string; tone: Tone } {
  if (n.win === 'guaranteed' && n.draw === 'guaranteed' && n.loss === 'guaranteed')
    return { label: 'עלתה', tone: 'home' };
  if (n.win === 'eliminated') return { label: 'הודחה', tone: 'away' };
  if (n.mustWin)
    return {
      label: n.minWinMargin && n.minWinMargin > 1 ? `נצח ב-${n.minWinMargin}+` : 'חייבת ניצחון',
      tone: 'draw',
    };
  if (n.draw === 'guaranteed') return { label: 'תיקו מספיק', tone: 'home' };
  if (n.thirdPlaceWatch) return { label: 'נאבקת', tone: 'draw' };
  return { label: 'במאבק', tone: 'mute' };
}

function NeedChip({ need }: { need?: QualNeed }) {
  if (!need) return null;
  const { label, tone } = needStatus(need);
  return (
    <span className={`need-chip need-chip--${tone}`}>
      {label}
      {need.gdSensitive && (
        <span className="need-chip__gd" title="תלוי הפרש שערים">
          ±
        </span>
      )}
    </span>
  );
}

export function Groups() {
  const standingsQ = useStandings();
  const fixturesQ = useFixtures();
  const view = useMemo(
    () =>
      standingsQ.data && fixturesQ.data ? buildGroupTables(standingsQ.data, fixturesQ.data) : null,
    [standingsQ.data, fixturesQ.data],
  );

  if (standingsQ.isLoading || fixturesQ.isLoading) return <LoadingState label="טוען טבלאות…" />;
  if (standingsQ.isError) {
    return <ErrorState error={standingsQ.error} onRetry={() => void standingsQ.refetch()} />;
  }
  if (!view || view.groups.length === 0) {
    return (
      <Placeholder milestone="M4" title="בתים ומרוץ השלישיות">
        אין עדיין טבלאות. הן יופיעו עם תחילת המונדיאל, כולל מה כל נבחרת צריכה ומרוץ השלישיות.
      </Placeholder>
    );
  }

  return (
    <>
      <div className="screen-head">
        <h2>בתים</h2>
        <span className="screen-head__meta">{view.groups.length} בתים</span>
      </div>

      <div className="groups">
        {view.groups.map((g) => {
          const needById = new Map(g.needs.map((n) => [n.team.id, n]));
          return (
            <div className="group-card" key={g.letter}>
              <div className="group-card__title">בית {g.letter}</div>
              <ul className="gtable">
                {g.ranked.map((r, i) => (
                  <li className="grow" key={r.team.id}>
                    <span className={`grow__rank grow__rank--${rankTone(i)}`}>{i + 1}</span>
                    <span className="grow__team">
                      {r.team.logo && <img src={r.team.logo} alt="" />}
                      <span className="grow__name">{r.team.name}</span>
                      <NeedChip need={needById.get(r.team.id)} />
                    </span>
                    <span className="grow__stat num" title="משוחקים">
                      {r.played}
                    </span>
                    <span className="grow__stat num" title="הפרש שערים">
                      {fmtGd(r)}
                    </span>
                    <span className="grow__pts num">{r.points}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <ThirdsRace race={view.thirds} />
    </>
  );
}

function ThirdsRace({ race }: { race: ReturnType<typeof buildGroupTables>['thirds'] }) {
  if (race.ranked.length === 0) return null;
  return (
    <section className="thirds">
      <div className="screen-head">
        <h2>מרוץ השלישיות</h2>
        <span className="screen-head__meta">8 עוברות</span>
      </div>
      <ol className="thirds__list">
        {race.ranked.map((r, i) => (
          <li key={r.team.id}>
            {i === race.cutIndex && (
              <div className="thirds__cut" role="separator">
                קו החתך · {race.cutIndex} עוברות
              </div>
            )}
            <div className={`trow${i < race.cutIndex ? ' is-in' : ' is-out'}`}>
              <span className="trow__rank num">{i + 1}</span>
              <span className="trow__group">בית {r.group}</span>
              <span className="trow__team">
                {r.team.logo && <img src={r.team.logo} alt="" />}
                {r.team.name}
              </span>
              <span className="trow__stat num" title="הפרש שערים">
                {fmtGd(r)}
              </span>
              <span className="trow__pts num">{r.points}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const rankTone = (i: number): Tone => (i <= 1 ? 'home' : i === 2 ? 'draw' : 'mute');
function fmtGd(r: GroupRow): string {
  const gd = r.goalsFor - r.goalsAgainst;
  return gd > 0 ? `+${gd}` : `${gd}`;
}
