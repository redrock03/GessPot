import { useEffect, useState } from 'react';
import './splash.css';

/** אנימציית כניסה ממותגת — Redrock Studio. נפתחת בעלייה, מחזיקה רגע, ומתמוססת אל המוצר.
 *  ניתנת לדילוג בהקשה; מיידית כש-prefers-reduced-motion. */
export function Splash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>('in');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }
    const toOut = setTimeout(() => setPhase('out'), 1350);
    const toDone = setTimeout(() => setPhase('done'), 1950);
    return () => {
      clearTimeout(toOut);
      clearTimeout(toDone);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`splash${phase === 'out' ? ' is-out' : ''}`}
      onClick={() => setPhase('done')}
      role="presentation"
    >
      <div className="splash__inner">
        <span className="splash__mark" aria-hidden="true">
          <span className="splash__bar" />
          <span className="splash__bar" />
          <span className="splash__bar" />
        </span>
        <span className="splash__word">REDROCK</span>
        <span className="splash__sub">STUDIO</span>
      </div>
    </div>
  );
}
