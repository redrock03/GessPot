// פאנל מודיעין למסך המשחק (§9–§10): כושר, שחקני מפתח, התרעות "במרחק כרטיס מהשעיה", וראש-בראש.
// ציר-צבע התוצאה בלבד (נ/ת/ה = home/draw/away); לעולם לא מערבבים עם ציר ההצעה (ציאן/זהב).
import type { MatchEnrichment, TeamEnrichment } from '../../../mappers/enrichment';
import './match-context.css';

const FORM_HE: Record<string, { he: string; tone: string }> = {
  W: { he: 'נ', tone: 'home' },
  D: { he: 'ת', tone: 'draw' },
  L: { he: 'ה', tone: 'away' },
};

function FormStrip({ form }: { form?: string }) {
  const chars = (form ?? '').toUpperCase().replace(/[^WDL]/g, '').slice(-5);
  if (!chars) return <span className="ctxf__empty">—</span>;
  return (
    <span className="ctxf" dir="ltr" aria-label={`כושר אחרון: ${chars}`}>
      {[...chars].map((c, i) => {
        const m = FORM_HE[c];
        return (
          <span key={i} className={`ctxf__b ctxf__b--${m.tone}`} aria-hidden="true">
            {m.he}
          </span>
        );
      })}
    </span>
  );
}

function TeamColumn({ team, name, away }: { team: TeamEnrichment; name: string; away?: boolean }) {
  return (
    <div className={`ctx-team${away ? ' ctx-team--away' : ''}`}>
      <span className="ctx-team__name">{name}</span>
      <FormStrip form={team.form} />
      {team.keyPlayers.length > 0 && (
        <span className="ctx-team__players">{team.keyPlayers.slice(0, 3).join(' · ')}</span>
      )}
    </div>
  );
}

export function MatchContext({
  enrichment,
  homeName,
  awayName,
}: {
  enrichment: MatchEnrichment;
  homeName: string;
  awayName: string;
}) {
  const { home, away, h2h, market } = enrichment;
  const risks = [
    ...home.oneFromBan.map((n) => ({ name: n, team: homeName })),
    ...away.oneFromBan.map((n) => ({ name: n, team: awayName })),
  ];
  const pct = (p: number) => `${Math.round(p * 100)}%`;
  const hasForm = Boolean(home.form || away.form);
  const empty =
    !hasForm && !market && h2h.length === 0 && risks.length === 0 && home.keyPlayers.length === 0;

  return (
    <section className="ctx" aria-label="מודיעין">
      <h2 className="panel__title">מודיעין</h2>

      {empty ? (
        <p className="ctx__empty">אין עדיין מספיק נתונים היסטוריים למשחק הזה.</p>
      ) : (
        <>
          <div className="ctx__forms">
            <TeamColumn team={home} name={homeName} />
            <span className="ctx__axis">כושר</span>
            <TeamColumn team={away} name={awayName} away />
          </div>

          {risks.length > 0 && (
            <div className="ctx-warn" role="note">
              <BookingIcon />
              <div className="ctx-warn__body">
                <strong className="ctx-warn__title">במרחק כרטיס מהשעיה</strong>
                <span className="ctx-warn__names">
                  {risks.map((r) => `${r.name} (${r.team})`).join(' · ')}
                </span>
              </div>
            </div>
          )}

          {market && (
            <div className="ctx-market">
              <h3 className="ctx__sub">שוק ההימורים · קונצנזוס סוכנויות</h3>
              <div className="ctx-market__row">
                <span className="ctx-market__cell">
                  <b className="num">{pct(market.home)}</b>
                  <span>{homeName}</span>
                </span>
                <span className="ctx-market__cell">
                  <b className="num">{pct(market.draw)}</b>
                  <span>תיקו</span>
                </span>
                <span className="ctx-market__cell">
                  <b className="num">{pct(market.away)}</b>
                  <span>{awayName}</span>
                </span>
              </div>
            </div>
          )}

          {h2h.length > 0 && (
            <div className="ctx-h2h">
              <h3 className="ctx__sub">מפגשים אחרונים</h3>
              <ul className="ctx-h2h__list">
                {h2h.map((line, i) => (
                  <li key={i} dir="ltr">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function BookingIcon() {
  return (
    <svg className="ctx-warn__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="4.5" y="2.5" width="7" height="11" rx="1.4" />
    </svg>
  );
}
