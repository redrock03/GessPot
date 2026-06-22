import { useEffect, useState } from 'react';
import './splash.css';

const SPLASH_KEY = 'rr-splash';
const seen = (): boolean => {
  try {
    return sessionStorage.getItem(SPLASH_KEY) === '1';
  } catch {
    return false;
  }
};

/** אנימציית כניסה ממותגת — Redrock Studio. פעם אחת לכל סשן (נטען חדש), לא בכל רענון.
 *  עלייה → החזקה קצרה → התמוססות אל המוצר. ניתנת לדילוג בהקשה; מוסתרת ב-prefers-reduced-motion. */
export function Splash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>(() => (seen() ? 'done' : 'in'));

  useEffect(() => {
    if (seen()) return; // כבר הוצג בסשן הזה
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* אחסון חסום — עדיין מציגים פעם אחת */
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
