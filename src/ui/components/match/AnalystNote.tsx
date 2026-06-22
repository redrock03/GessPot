import type { AnalystPrediction } from '../../../domain/types';
import './analyst-note.css';

const CONF_LABEL: Record<AnalystPrediction['confidence'], string> = {
  low: 'ביטחון נמוך',
  medium: 'ביטחון בינוני',
  high: 'ביטחון גבוה',
};
const CONF_LEVEL: Record<AnalystPrediction['confidence'], number> = { low: 1, medium: 2, high: 3 };

export function AnalystNote({ prediction }: { prediction: AnalystPrediction }) {
  const level = CONF_LEVEL[prediction.confidence];
  return (
    <section className="analyst" aria-label="ניתוח האנליסט">
      <header className="analyst__head">
        <span className="analyst__by">
          <span className="analyst__by-dot" aria-hidden="true" />
          ניתוח Claude
        </span>
        <span className="analyst__conf">
          <span
            className="analyst__meter"
            role="img"
            aria-label={CONF_LABEL[prediction.confidence]}
          >
            {[1, 2, 3].map((i) => (
              <span key={i} className={`analyst__seg${i <= level ? ' is-on' : ''}`} />
            ))}
          </span>
          {CONF_LABEL[prediction.confidence]}
        </span>
      </header>

      {prediction.keyFactors.length > 0 && (
        <ul className="analyst__factors">
          {prediction.keyFactors.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}

      {prediction.rationale && <p className="analyst__rationale">{prediction.rationale}</p>}
    </section>
  );
}
