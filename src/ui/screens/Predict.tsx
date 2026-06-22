import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { isHighValueStage } from '../../domain/scoring';
import { useFixtures } from '../../data/hooks';
import { useAppStore } from '../../state/store';
import { ErrorState, LoadingState } from '../components/States';
import './predict.css';

const whenFmt = new Intl.DateTimeFormat('he-IL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const ms = (iso: string) => new Date(iso).getTime();

export function Predict() {
  const { data, isLoading, isError, error, refetch } = useFixtures();
  const savedPicks = useAppStore((s) => s.savedPicks);

  const upcoming = useMemo(
    () =>
      (data ?? [])
        .filter((f) => f.status !== 'finished')
        .sort((a, b) => ms(a.kickoff) - ms(b.kickoff))
        .slice(0, 12),
    [data],
  );
  const saved = useMemo(
    () => Object.values(savedPicks).sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [savedPicks],
  );
  const savedIds = useMemo(() => new Set(saved.map((s) => s.fixtureId)), [saved]);

  if (isLoading) return <LoadingState label="טוען משחקים…" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <>
      <div className="screen-head">
        <h2>חיזוי</h2>
        <span className="screen-head__meta">{saved.length} ניחושים שמורים</span>
      </div>

      {saved.length > 0 && (
        <section className="pr-block">
          <h3 className="pr-block__title">הניחושים שלך</h3>
          <ul className="pr-list">
            {saved.map((p) => (
              <li key={p.fixtureId}>
                <Link to={`/match/${p.fixtureId}`} className="pr-row">
                  <span className="pr-row__teams">
                    {p.homeName} — {p.awayName}
                  </span>
                  <span className={`pr-kind pr-kind--${p.kind === 'exact' ? 'strike' : 'steady'}`}>
                    {p.kind === 'exact' ? 'בול' : 'כיוון'}
                  </span>
                  <span className="pr-row__score num">
                    {p.score.home}–{p.score.away}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="pr-block">
        <h3 className="pr-block__title">הבאים בתור</h3>
        {upcoming.length === 0 ? (
          <p className="pr-empty">אין משחקים קרובים בלוח כרגע.</p>
        ) : (
          <ul className="pr-list">
            {upcoming.map((f) => (
              <li key={f.id}>
                <Link
                  to={`/match/${f.id}`}
                  className={`pr-row${isHighValueStage(f.stage) ? ' is-value' : ''}`}
                >
                  <span className="pr-row__teams">
                    {isHighValueStage(f.stage) && (
                      <span className="pr-star" title="משחק ערך-גבוה" aria-hidden="true">
                        ★
                      </span>
                    )}
                    {f.home.name} — {f.away.name}
                  </span>
                  {savedIds.has(f.id) && (
                    <span className="pr-done" title="ניחוש שמור">
                      ✓
                    </span>
                  )}
                  <span className="pr-row__when num">{whenFmt.format(new Date(f.kickoff))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="pr-hint">הקש על משחק כדי לראות את זוג ההצעות, מפת התוצאות וניתוח Claude.</p>
      </section>
    </>
  );
}
