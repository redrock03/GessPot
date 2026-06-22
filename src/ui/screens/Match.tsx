import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import type { AnalystInput } from '../../api/analyst';
import type { Stage } from '../../domain/types';
import { couponGrid, DEFAULT_RHO } from '../../domain/engine/poisson';
import { h2hResultsFromFixtures, qualNeeds } from '../../domain/engine/qualify';
import { recommendByRisk, riskFromPoolGap } from '../../domain/engine/suggest';
import { computeStakes, describeNeed } from '../../domain/engine/stakes';
import { useAppStore } from '../../state/store';
import {
  useFixtures,
  useMatchAdvice,
  useMatchEnrichment,
  usePrediction,
  useStandings,
} from '../../data/hooks';
import { SuggestionPair } from '../components/match/SuggestionPair';
import { ProbBars } from '../components/match/ProbBars';
import { ScorelineCoupon } from '../components/match/ScorelineCoupon';
import { AnalystNote } from '../components/match/AnalystNote';
import { MatchContext } from '../components/match/MatchContext';
import { ErrorState } from '../components/States';
import { Placeholder } from '../components/Placeholder';
import './match.css';

const STAGE_HE: Record<Stage, string> = {
  group: 'שלב הבתים',
  r32: 'שלב 32',
  r16: 'שמינית הגמר',
  qf: 'רבע הגמר',
  sf: 'חצי הגמר',
  third: 'מקום 3',
  final: 'הגמר',
};

const dateFmt = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const timeFmt = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' });

export function Match() {
  const { fixtureId } = useParams();
  const id = fixtureId ? Number(fixtureId) : undefined;

  const fixturesQ = useFixtures();
  const fixture = useMemo(
    () => (id ? fixturesQ.data?.find((f) => f.id === id) : undefined),
    [fixturesQ.data, id],
  );

  const predQ = usePrediction(id);
  const standingsQ = useStandings();
  const enrichQ = useMatchEnrichment(fixture?.home.id, fixture?.away.id);

  // הגדרות + ניחושים שמורים (M6).
  const riskAlpha = useAppStore((s) => s.riskAlpha);
  const poolAdjust = useAppStore((s) => s.poolAdjust);
  const poolBehind = useAppStore((s) => s.poolBehind);
  const poolPoints = useAppStore((s) => s.poolPoints);
  const savedPick = useAppStore((s) => (id !== undefined ? s.savedPicks[id] : undefined));
  const savePick = useAppStore((s) => s.savePick);
  const removePick = useAppStore((s) => s.removePick);
  const queryClient = useQueryClient();

  // אגרסיביות אפקטיבית: לפי מצב הפול אם הופעל, אחרת החוגה הידנית.
  const effAlpha = poolAdjust ? riskFromPoolGap(poolBehind ? poolPoints : -poolPoints) : riskAlpha;

  // מצב ההעפלה (מוטיבציה) — רק בשלב הבתים. נגזר מהבית של המארחת.
  const stakesInfo = useMemo(() => {
    if (!fixture || fixture.stage !== 'group' || !standingsQ.data || !fixturesQ.data) return null;
    const homeRow = standingsQ.data.find((r) => r.team.id === fixture.home.id);
    if (!homeRow) return null;
    const groupTeams = standingsQ.data.filter((r) => r.group === homeRow.group);
    const ids = new Set(groupTeams.map((t) => t.team.id));
    const finishedH2H = h2hResultsFromFixtures(fixturesQ.data, ids);
    const remaining = fixturesQ.data
      .filter((f) => f.status !== 'finished' && ids.has(f.home.id) && ids.has(f.away.id))
      .map((f) => ({ home: f.home.id, away: f.away.id }));
    const needs = qualNeeds(groupTeams, remaining, finishedH2H);
    const homeNeed = needs.find((n) => n.team.id === fixture.home.id);
    const awayNeed = needs.find((n) => n.team.id === fixture.away.id);
    return { homeNeed, awayNeed, stakes: computeStakes(homeNeed, awayNeed) };
  }, [fixture, standingsQ.data, fixturesQ.data]);

  // בונים את קלט האנליסט כשהמשחק ידוע, ה-baseline נסגר, מצב-ההעפלה מוכן (בתים) וההעשרה נסגרה.
  const input: AnalystInput | null = useMemo(() => {
    if (!fixture || predQ.isLoading) return null;
    if (fixture.stage === 'group' && standingsQ.isLoading) return null;
    if (enrichQ.isLoading) return null; // ממתינים להעשרה (כושר/h2h/סגל) — נכנסת לקריאה הראשונה
    const stakesText =
      stakesInfo?.homeNeed || stakesInfo?.awayNeed
        ? { home: describeNeed(stakesInfo?.homeNeed), away: describeNeed(stakesInfo?.awayNeed) }
        : undefined;
    const enrich = enrichQ.data;
    const statsOf = (t: 'home' | 'away') =>
      enrich
        ? {
            form: enrich[t].form,
            goalsForAvg: enrich[t].goalsForAvg,
            goalsAgainstAvg: enrich[t].goalsAgainstAvg,
            keyPlayers: enrich[t].keyPlayers,
            cardRiskPlayers: enrich[t].oneFromBan, // במרחק כרטיס מהשעיה
          }
        : undefined;
    return {
      fixture: {
        home: fixture.home.name,
        away: fixture.away.name,
        stage: fixture.stage,
        kickoff: fixture.kickoff,
      },
      apiPrediction: predQ.data ?? undefined,
      homeStats: statsOf('home'),
      awayStats: statsOf('away'),
      h2h: enrich?.h2h,
      stakes: stakesText,
      notes: stakesInfo?.stakes.note || undefined,
    };
  }, [
    fixture,
    predQ.isLoading,
    predQ.data,
    standingsQ.isLoading,
    enrichQ.isLoading,
    enrichQ.data,
    stakesInfo,
  ]);

  const adviceQ = useMatchAdvice(input);

  // חישוב מחדש: מרענן נתוני מקור (predictions/העשרה) ומריץ את האנליסט מחדש.
  const regenerate = () => {
    if (id !== undefined && fixture) {
      void queryClient.invalidateQueries({ queryKey: ['prediction', id] });
      void queryClient.invalidateQueries({
        queryKey: ['enrichment', fixture.home.id, fixture.away.id],
      });
    }
    void adviceQ.refetch();
  };

  // ---- מצבי כניסה ----
  if (!id) {
    return (
      <Placeholder milestone="בחר משחק" title="מסך החיזוי">
        בחר משחק מרשימת <Link to="/">המשחקים</Link> כדי לראות את זוג ההצעות, מפת התוצאות וניתוח
        האנליסט.
      </Placeholder>
    );
  }
  if (fixturesQ.isError) {
    return <ErrorState error={fixturesQ.error} onRetry={() => void fixturesQ.refetch()} />;
  }
  if (fixturesQ.isLoading) {
    return <AnalyzingState label="טוען את המשחק…" />;
  }
  if (!fixture) {
    return (
      <Placeholder milestone="404" title="המשחק לא נמצא">
        לא מצאנו את המשחק הזה בלוח. <Link to="/">חזרה למשחקים</Link>.
      </Placeholder>
    );
  }

  const kickoff = new Date(fixture.kickoff);
  // עד שיש תחזית או שגיאה — מציגים "מנתח". כולל את חלון ההעשרה שבו adviceQ עוד מנוטרל.
  const advicePending = !adviceQ.data && !adviceQ.isError;

  return (
    <div className="match">
      <header className="match__head">
        <Team name={fixture.home.name} logo={fixture.home.logo} />
        <div className="match__vs">
          <span className="match__stage">{STAGE_HE[fixture.stage]}</span>
          <span className="match__vs-x" aria-hidden="true">
            —
          </span>
          <span className="match__kick num">{timeFmt.format(kickoff)}</span>
          <span className="match__date">{dateFmt.format(kickoff)}</span>
        </div>
        <Team name={fixture.away.name} logo={fixture.away.logo} away />
      </header>

      {advicePending && <AnalyzingState label="Claude מנתח את המשחק…" />}
      {adviceQ.isError && (
        <ErrorState error={adviceQ.error} onRetry={() => void adviceQ.refetch()} />
      )}

      {adviceQ.data && (
        <>
          <section className="panel panel--hero">
            <SuggestionPair
              advice={adviceQ.data.advice}
              homeName={fixture.home.name}
              awayName={fixture.away.name}
              recommended={recommendByRisk(adviceQ.data.advice, effAlpha, fixture.stage)}
              savedKind={savedPick?.kind ?? null}
              onSave={(kind) => {
                const pick =
                  kind === 'exact'
                    ? adviceQ.data.advice.exactPick
                    : adviceQ.data.advice.tendencyPick;
                savePick({
                  fixtureId: fixture.id,
                  kind,
                  score: pick.score,
                  homeName: fixture.home.name,
                  awayName: fixture.away.name,
                  stage: fixture.stage,
                  kickoff: fixture.kickoff,
                  savedAt: new Date().toISOString(),
                });
              }}
              onRemove={() => removePick(fixture.id)}
            />
          </section>

          {stakesInfo && (stakesInfo.homeNeed || stakesInfo.awayNeed) && (
            <section className="panel match-stakes">
              <h2 className="panel__title">מה צריך כל צד</h2>
              <ul className="ms-list">
                <li>
                  <span className="ms-team">{fixture.home.name}</span>
                  <span className="ms-need">{describeNeed(stakesInfo.homeNeed)}</span>
                </li>
                <li>
                  <span className="ms-team">{fixture.away.name}</span>
                  <span className="ms-need">{describeNeed(stakesInfo.awayNeed)}</span>
                </li>
              </ul>
              <p className="ms-foot">ההצעות וההסתברויות כאן כבר שוקללו לפי המוטיבציה של כל צד.</p>
            </section>
          )}

          <section className="panel">
            <h2 className="panel__title">סיכויי התוצאה</h2>
            <ProbBars
              prob={adviceQ.data.advice.outcomeProb}
              homeName={fixture.home.name}
              awayName={fixture.away.name}
            />
          </section>

          <section className="panel">
            <ScorelineCoupon
              grid={couponGrid(
                adviceQ.data.prediction.expectedGoals.home,
                adviceQ.data.prediction.expectedGoals.away,
                5,
                DEFAULT_RHO,
              )}
              tendency={adviceQ.data.advice.tendencyPick.score}
              exact={adviceQ.data.advice.exactPick.score}
              homeName={fixture.home.name}
              awayName={fixture.away.name}
            />
          </section>

          <section className="panel">
            <AnalystNote prediction={adviceQ.data.prediction} />
            <button
              type="button"
              className="match__regen"
              onClick={regenerate}
              disabled={adviceQ.isFetching}
            >
              {adviceQ.isFetching ? 'מחשב מחדש…' : '↻ חשב מחדש'}
            </button>
          </section>
        </>
      )}

      {enrichQ.data && (
        <section className="panel">
          <MatchContext
            enrichment={enrichQ.data}
            homeName={fixture.home.name}
            awayName={fixture.away.name}
          />
        </section>
      )}
    </div>
  );
}

function Team({ name, logo, away }: { name: string; logo?: string; away?: boolean }) {
  return (
    <div className={`match__team${away ? ' match__team--away' : ''}`}>
      {logo && <img className="match__crest" src={logo} alt="" />}
      <span className="match__team-name">{name}</span>
    </div>
  );
}

function AnalyzingState({ label }: { label: string }) {
  return (
    <div className="match__analyzing" role="status" aria-live="polite">
      <span className="match__scope" aria-hidden="true">
        <span className="match__scope-ring" />
        <span className="match__scope-dot" />
      </span>
      {label}
    </div>
  );
}
