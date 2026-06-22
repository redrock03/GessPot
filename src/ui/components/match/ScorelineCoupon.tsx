import { useState } from 'react';
import type { CouponGridResult } from '../../../domain/engine/poisson';
import { ExactIcon, TendencyIcon } from './icons';
import { outcomeOf, pct } from './format';
import './scoreline-coupon.css';

interface CouponProps {
  grid: CouponGridResult;
  tendency: { home: number; away: number };
  exact: { home: number; away: number };
  homeName: string;
  awayName: string;
}

const same = (a: { home: number; away: number }, h: number, w: number) =>
  a.home === h && a.away === w;

export function ScorelineCoupon({ grid, tendency, exact, homeName, awayName }: CouponProps) {
  const [sel, setSel] = useState<{ home: number; away: number }>(exact);
  // איפוס הבחירה לתא הבול כשמתחלף משחק (אותו instance ל-/match ול-/match/:id) —
  // דפוס "התאמת state בזמן render" המומלץ ב-React, בלי useEffect.
  const [prevExact, setPrevExact] = useState(exact);
  if (exact.home !== prevExact.home || exact.away !== prevExact.away) {
    setPrevExact(exact);
    setSel(exact);
  }
  const selCell = grid.cells.find((c) => same(sel, c.home, c.away));

  return (
    <figure className="coupon">
      <figcaption className="coupon__cap">
        מפת התוצאות
        <span className="coupon__axes">
          <span className="coupon__axis coupon__axis--home">בית ↓</span>
          <span className="coupon__axis coupon__axis--away">חוץ →</span>
        </span>
      </figcaption>

      <div className="coupon__grid" role="grid" aria-label="מפת חום של תוצאות אפשריות">
        {grid.cells.map((c) => {
          const out = outcomeOf(c.home, c.away);
          const alpha = 0.07 + 0.86 * (grid.pMax > 0 ? c.p / grid.pMax : 0);
          const isT = same(tendency, c.home, c.away);
          const isE = same(exact, c.home, c.away);
          const isSel = same(sel, c.home, c.away);
          return (
            <button
              key={`${c.home}-${c.away}`}
              type="button"
              className={`coupon__cell${isSel ? ' is-sel' : ''}${isT ? ' is-tendency' : ''}`}
              style={{
                background: `color-mix(in srgb, var(--${out}) ${(alpha * 100).toFixed(1)}%, transparent)`,
              }}
              aria-label={`${homeName} ${c.home}, ${awayName} ${c.away}, הסתברות ${pct(c.p)}${
                isT ? ', הצעת כיוון' : ''
              }${isE ? ', הצעת בול' : ''}`}
              aria-pressed={isSel}
              onClick={() => setSel({ home: c.home, away: c.away })}
            >
              <span className="coupon__score num">
                {c.home}–{c.away}
              </span>
              {isE && <span className="coupon__mark" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="coupon__readout" aria-live="polite">
        {selCell ? (
          <>
            <span className="coupon__readout-score num">
              {selCell.home}–{selCell.away}
            </span>
            <span className="coupon__readout-p num">{pct(selCell.p)}</span>
            <span className="coupon__readout-hint">סיכוי לבול זה</span>
          </>
        ) : null}
      </div>

      <div className="coupon__legend">
        <span className="coupon__leg coupon__leg--steady">
          <TendencyIcon size={13} /> כיוון
        </span>
        <span className="coupon__leg coupon__leg--strike">
          <ExactIcon size={13} /> בול
        </span>
      </div>
    </figure>
  );
}
