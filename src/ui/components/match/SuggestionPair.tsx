import type { MatchAdvice, Suggestion } from '../../../domain/types';
import { ExactIcon, ConvergeIcon, TendencyIcon } from './icons';
import { ev2, outcomeSideName, pct } from './format';
import './suggestion-pair.css';

type Kind = 'tendency' | 'exact';

interface PairProps {
  advice: MatchAdvice;
  homeName: string;
  awayName: string;
  /** ההצעה שחוגת-הסיכון ממליצה עליה (§4). */
  recommended?: Kind;
  /** הסוג השמור כרגע למשחק (אם יש). */
  savedKind?: Kind | null;
  onSave?: (kind: Kind) => void;
  onRemove?: () => void;
}

function DataRows({ s, emphasis }: { s: Suggestion; emphasis: Kind }) {
  return (
    <dl className="sg-data">
      <div className={`sg-row${emphasis === 'tendency' ? ' is-emph' : ''}`}>
        <dt>סיכוי-כיוון</dt>
        <dd className="num">{pct(s.pOutcome)}</dd>
      </div>
      <div className={`sg-row${emphasis === 'exact' ? ' is-emph' : ''}`}>
        <dt>סיכוי-בול</dt>
        <dd className="num">{pct(s.pExact)}</dd>
      </div>
      <div className="sg-row sg-row--ev">
        <dt>תוחלת</dt>
        <dd className="num">{ev2(s.ev)}</dd>
      </div>
    </dl>
  );
}

function SaveFoot({
  kind,
  recommended,
  saved,
  onSave,
  onRemove,
}: {
  kind: Kind;
  recommended: boolean;
  saved: boolean;
  onSave?: (kind: Kind) => void;
  onRemove?: () => void;
}) {
  if (!onSave && !recommended) return null;
  return (
    <footer className="sg-foot">
      {recommended && <span className="sg-foot__rec">מומלץ לך</span>}
      {onSave && (
        <button
          type="button"
          className={`sg-save${saved ? ' is-saved' : ''}`}
          aria-pressed={saved}
          onClick={() => (saved ? onRemove?.() : onSave(kind))}
        >
          {saved ? '✓ נשמר' : 'שמור ניחוש'}
        </button>
      )}
    </footer>
  );
}

function Card({
  kind,
  s,
  side,
  recommended,
  saved,
  onSave,
  onRemove,
}: {
  kind: Kind;
  s: Suggestion;
  side: string;
  recommended: boolean;
  saved: boolean;
  onSave?: (kind: Kind) => void;
  onRemove?: () => void;
}) {
  const isTendency = kind === 'tendency';
  return (
    <article
      className={`sg-card sg-card--${isTendency ? 'steady' : 'strike'}${recommended ? ' is-rec' : ''}`}
    >
      <header className="sg-card__head">
        <span className="sg-card__icon">{isTendency ? <TendencyIcon /> : <ExactIcon />}</span>
        <div className="sg-card__title">
          <span className="sg-card__kind">{isTendency ? 'כיוון' : 'בול'}</span>
          <span className="sg-card__tag">{isTendency ? 'הדרך הבטוחה' : 'מלוא הניקוד'}</span>
        </div>
      </header>
      <div className="sg-card__score">
        <span className="sg-card__num num">
          {s.score.home}–{s.score.away}
        </span>
        <span className="sg-card__side">{side}</span>
      </div>
      <DataRows s={s} emphasis={kind} />
      <SaveFoot
        kind={kind}
        recommended={recommended}
        saved={saved}
        onSave={onSave}
        onRemove={onRemove}
      />
    </article>
  );
}

export function SuggestionPair({
  advice,
  homeName,
  awayName,
  recommended,
  savedKind,
  onSave,
  onRemove,
}: PairProps) {
  const { tendencyPick: t, exactPick: e, converged } = advice;

  if (converged) {
    const side = outcomeSideName(e.score.home, e.score.away, homeName, awayName);
    const saved = savedKind != null;
    return (
      <section className="sg-converged" aria-label="הצעה מתכנסת — ביטחון גבוה">
        <div className="sg-converged__ribbon">
          <ConvergeIcon size={15} />
          התכנסות · ביטחון גבוה
        </div>
        <div className="sg-converged__body">
          <div className="sg-converged__score">
            <span className="sg-converged__num num">
              {e.score.home}–{e.score.away}
            </span>
            <span className="sg-converged__side">{side}</span>
          </div>
          <DataRows s={e} emphasis="tendency" />
        </div>
        <p className="sg-converged__note">הכיוון והבול מצביעים על אותה תוצאה.</p>
        <SaveFoot
          kind="exact"
          recommended={false}
          saved={saved}
          onSave={onSave}
          onRemove={onRemove}
        />
      </section>
    );
  }

  return (
    <section className="sg-pair" aria-label="זוג ההצעות — כיוון ובול">
      <Card
        kind="tendency"
        s={t}
        side={outcomeSideName(t.score.home, t.score.away, homeName, awayName)}
        recommended={recommended === 'tendency'}
        saved={savedKind === 'tendency'}
        onSave={onSave}
        onRemove={onRemove}
      />
      <Card
        kind="exact"
        s={e}
        side={outcomeSideName(e.score.home, e.score.away, homeName, awayName)}
        recommended={recommended === 'exact'}
        saved={savedKind === 'exact'}
        onSave={onSave}
        onRemove={onRemove}
      />
    </section>
  );
}
