import { pct } from './format';
import './prob-bars.css';

interface ProbBarsProps {
  prob: { home: number; draw: number; away: number };
  homeName: string;
  awayName: string;
}

export function ProbBars({ prob, homeName, awayName }: ProbBarsProps) {
  const segs = [
    { key: 'home', label: homeName, p: prob.home },
    { key: 'draw', label: 'תיקו', p: prob.draw },
    { key: 'away', label: awayName, p: prob.away },
  ] as const;

  return (
    <div className="prob">
      <div
        className="prob-bar"
        role="img"
        aria-label={`הסתברות 1X2: בית ${pct(prob.home)}, תיקו ${pct(prob.draw)}, חוץ ${pct(prob.away)}`}
      >
        {segs.map((s) => (
          <span
            key={s.key}
            className={`prob-seg prob-seg--${s.key}`}
            style={{ flexGrow: Math.max(s.p, 0.001) }}
          >
            {s.p >= 0.16 && <i className="num">{pct(s.p)}</i>}
          </span>
        ))}
      </div>
      <div className="prob-legend">
        {segs.map((s) => (
          <span key={s.key} className={`prob-leg prob-leg--${s.key}`}>
            <span className="prob-leg__dot" aria-hidden="true" />
            {s.label}
            <i className="num">{pct(s.p)}</i>
          </span>
        ))}
      </div>
    </div>
  );
}
