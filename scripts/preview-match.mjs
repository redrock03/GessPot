// מחולל תצוגה-מקדימה למסך המשחק — מחשב את פלט המנוע האמיתי ופולט HTML
// המקושר ל-CSS המקורי, לצילום מסך עם Edge headless (אימות ויזואלי, craft step 4).
import { writeFileSync } from 'node:fs';

const RHO = -0.05;
const MAX = 8;
const pmf = (k, l) => {
  if (l === 0) return k === 0 ? 1 : 0;
  let lp = -l + k * Math.log(l);
  for (let i = 2; i <= k; i++) lp -= Math.log(i);
  return Math.exp(lp);
};
const tau = (i, j, l, m) =>
  i === 0 && j === 0
    ? 1 - l * m * RHO
    : i === 0 && j === 1
      ? 1 + l * RHO
      : i === 1 && j === 0
        ? 1 + m * RHO
        : i === 1 && j === 1
          ? 1 - RHO
          : 1;
function build(l, m) {
  const M = [];
  let s = 0;
  for (let i = 0; i <= MAX; i++) {
    M[i] = [];
    for (let j = 0; j <= MAX; j++) {
      const p = pmf(i, l) * pmf(j, m) * tau(i, j, l, m);
      M[i][j] = p;
      s += p;
    }
  }
  for (let i = 0; i <= MAX; i++) for (let j = 0; j <= MAX; j++) M[i][j] /= s;
  return M;
}
const oc = (i, j) => (i > j ? 'home' : i === j ? 'draw' : 'away');
function suggest(M, T, E) {
  let pH = 0,
    pD = 0,
    pA = 0;
  for (let i = 0; i <= MAX; i++)
    for (let j = 0; j <= MAX; j++) {
      if (i > j) pH += M[i][j];
      else if (i === j) pD += M[i][j];
      else pA += M[i][j];
    }
  const pOut = { home: pH, draw: pD, away: pA };
  const best = pH >= pD && pH >= pA ? 'home' : pD >= pA ? 'draw' : 'away';
  let eI = 0,
    eJ = 0,
    eP = -1,
    tI = 0,
    tJ = 0,
    tP = -1;
  for (let i = 0; i <= MAX; i++)
    for (let j = 0; j <= MAX; j++) {
      const p = M[i][j];
      if (p > eP) {
        eP = p;
        eI = i;
        eJ = j;
      }
      if (oc(i, j) === best && p > tP) {
        tP = p;
        tI = i;
        tJ = j;
      }
    }
  const ev = (i, j) => E * M[i][j] + T * (pOut[oc(i, j)] - M[i][j]);
  return {
    outcomeProb: pOut,
    tendencyPick: {
      score: { home: tI, away: tJ },
      pOutcome: pOut[best],
      pExact: tP,
      ev: ev(tI, tJ),
    },
    exactPick: {
      score: { home: eI, away: eJ },
      pOutcome: pOut[oc(eI, eJ)],
      pExact: eP,
      ev: ev(eI, eJ),
    },
    converged: eI === tI && eJ === tJ,
  };
}
function coupon(l, m, max = 5) {
  const M = build(l, m);
  const cells = [];
  let pMax = 0;
  for (let i = 0; i <= max; i++)
    for (let j = 0; j <= max; j++) {
      const p = M[i][j];
      if (p > pMax) pMax = p;
      cells.push({ home: i, away: j, p });
    }
  return { cells, pMax, max };
}

const pct = (p) => `${Math.round(p * 100)}%`;
const ev2 = (x) => x.toFixed(2);
const sideName = (s, h, a) => (s.home > s.away ? h : s.home < s.away ? a : 'תיקו');

function dataRows(s, emph) {
  return `<dl class="sg-data">
    <div class="sg-row${emph === 'tendency' ? ' is-emph' : ''}"><dt>סיכוי-כיוון</dt><dd class="num">${pct(s.pOutcome)}</dd></div>
    <div class="sg-row${emph === 'exact' ? ' is-emph' : ''}"><dt>סיכוי-בול</dt><dd class="num">${pct(s.pExact)}</dd></div>
    <div class="sg-row sg-row--ev"><dt>תוחלת</dt><dd class="num">${ev2(s.ev)}</dd></div>
  </dl>`;
}
const tIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" stroke-width="2"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/></svg>`;
const eIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.9" fill="currentColor"/></svg>`;
const cIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 7h4l5 5 5-5h4M3 17h4l5-5 5 5h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function card(kind, s, side) {
  const t = kind === 'tendency';
  return `<article class="sg-card sg-card--${t ? 'steady' : 'strike'}">
    <header class="sg-card__head"><span class="sg-card__icon">${t ? tIcon : eIcon}</span>
    <div class="sg-card__title"><span class="sg-card__kind">${t ? 'כיוון' : 'בול'}</span><span class="sg-card__tag">${t ? 'הדרך הבטוחה' : 'מלוא הניקוד'}</span></div></header>
    <div class="sg-card__score"><span class="sg-card__num num">${s.score.home}–${s.score.away}</span><span class="sg-card__side">${side}</span></div>
    ${dataRows(s, kind)}
  </article>`;
}
function pairHTML(a, h, w) {
  if (a.converged) {
    const s = sideName(a.exactPick.score, h, w);
    return `<section class="sg-converged"><div class="sg-converged__ribbon">${cIcon} התכנסות · ביטחון גבוה</div>
      <div class="sg-converged__body"><div class="sg-converged__score"><span class="sg-converged__num num">${a.exactPick.score.home}–${a.exactPick.score.away}</span><span class="sg-converged__side">${s}</span></div>${dataRows(a.exactPick, 'tendency')}</div>
      <p class="sg-converged__note">הכיוון והבול מצביעים על אותה תוצאה.</p></section>`;
  }
  return `<section class="sg-pair">${card('tendency', a.tendencyPick, sideName(a.tendencyPick.score, h, w))}${card('exact', a.exactPick, sideName(a.exactPick.score, h, w))}</section>`;
}
function probHTML(p, h, w) {
  const segs = [
    ['home', h, p.home],
    ['draw', 'תיקו', p.draw],
    ['away', w, p.away],
  ];
  return `<div class="prob"><div class="prob-bar">${segs
    .map(
      ([k, , v]) =>
        `<span class="prob-seg prob-seg--${k}" style="flex-grow:${Math.max(v, 0.001)}">${v >= 0.1 ? `<i class="num">${pct(v)}</i>` : ''}</span>`,
    )
    .join('')}</div><div class="prob-legend">${segs
    .map(
      ([k, l, v]) =>
        `<span class="prob-leg prob-leg--${k}"><span class="prob-leg__dot"></span>${l} <i class="num">${pct(v)}</i></span>`,
    )
    .join('')}</div></div>`;
}
function couponHTML(g, t, e) {
  const same = (s, c) => s.home === c.home && s.away === c.away;
  return `<figure class="coupon"><figcaption class="coupon__cap">מפת התוצאות<span class="coupon__axes"><span class="coupon__axis coupon__axis--home">בית ↓</span><span class="coupon__axis coupon__axis--away">חוץ →</span></span></figcaption>
  <div class="coupon__grid">${g.cells
    .map((c) => {
      const out = oc(c.home, c.away);
      const a = 0.07 + 0.86 * (g.pMax > 0 ? c.p / g.pMax : 0);
      const isT = same(t, c),
        isE = same(e, c),
        isSel = isE;
      return `<button class="coupon__cell${isSel ? ' is-sel' : ''}${isT ? ' is-tendency' : ''}" style="background:color-mix(in srgb, var(--${out}) ${(a * 100).toFixed(1)}%, transparent)"><span class="coupon__score num">${c.home}–${c.away}</span>${isE ? '<span class="coupon__mark"></span>' : ''}</button>`;
    })
    .join('')}</div>
  <div class="coupon__readout"><span class="coupon__readout-score num">${e.home}–${e.away}</span><span class="coupon__readout-p num">${pct(g.cells.find((c) => same(e, c)).p)}</span><span class="coupon__readout-hint">סיכוי לבול זה</span></div>
  <div class="coupon__legend"><span class="coupon__leg coupon__leg--steady">${cIcon} כיוון</span><span class="coupon__leg coupon__leg--strike">בול</span></div></figure>`;
}
function analystHTML(p) {
  const lvl = { low: 1, medium: 2, high: 3 }[p.confidence];
  const lbl = { low: 'ביטחון נמוך', medium: 'ביטחון בינוני', high: 'ביטחון גבוה' }[p.confidence];
  return `<section class="analyst"><header class="analyst__head"><span class="analyst__by"><span class="analyst__by-dot"></span>ניתוח Claude</span>
  <span class="analyst__conf"><span class="analyst__meter">${[1, 2, 3].map((i) => `<span class="analyst__seg${i <= lvl ? ' is-on' : ''}"></span>`).join('')}</span>${lbl}</span></header>
  <ul class="analyst__factors">${p.keyFactors.map((f) => `<li>${f}</li>`).join('')}</ul>
  <p class="analyst__rationale">${p.rationale}</p></section>`;
}
function screen(home, away, stage, l, m, prediction, T, E) {
  const a = suggest(build(l, m), T, E);
  const g = coupon(l, m);
  return `<div class="match">
    <header class="match__head">
      <div class="match__team"><div class="match__crest" style="background:#1c2440;border-radius:50%"></div><span class="match__team-name">${home}</span></div>
      <div class="match__vs"><span class="match__stage">${stage}</span><span class="match__vs-x">—</span><span class="match__kick num">22:00</span><span class="match__date">יום שני, 23 ביוני</span></div>
      <div class="match__team match__team--away"><div class="match__crest" style="background:#1c2440;border-radius:50%"></div><span class="match__team-name">${away}</span></div>
    </header>
    <section class="panel panel--hero">${pairHTML(a, home, away)}</section>
    <section class="panel"><h2 class="panel__title">סיכויי התוצאה</h2>${probHTML(a.outcomeProb, home, away)}</section>
    <section class="panel">${couponHTML(g, a.tendencyPick.score, a.exactPick.score)}</section>
    <section class="panel">${analystHTML(prediction)}</section>
  </div>`;
}

const base = 'file:///C:/Users/shira/GessPot/src/ui';
const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}/global.css">
<link rel="stylesheet" href="${base}/components/match/suggestion-pair.css">
<link rel="stylesheet" href="${base}/components/match/prob-bars.css">
<link rel="stylesheet" href="${base}/components/match/scoreline-coupon.css">
<link rel="stylesheet" href="${base}/components/match/analyst-note.css">
<link rel="stylesheet" href="${base}/screens/match.css">
<style>body{margin:0;background:var(--ink)} .wrap{max-width:412px;margin:0 auto;padding:16px} .sep{height:1px;background:var(--line);margin:24px 0}</style></head>
<body><div class="wrap">
${screen('ספרד', 'ערב הסעודית', 'שלב הבתים', 2.3, 0.6, { confidence: 'high', keyFactors: ['פער איכות עצום לטובת ספרד כמעצמת על', 'ספרד בראש הבית וניצחון מבטיח עלייה', 'ערב הסעודית זקוקה לניצחון אך נחותה משמעותית'], rationale: 'ספרד מהמעצמות הגדולות עם פער איכות גדול מול ערב הסעודית. צפויה שליטה ספרדית עם xG גבוה והגנה סגורה. ה-API נראה שמרני מדי בהערכת התיקו, ואנו מתאימים כלפי מעלה את סיכויי ספרד.' }, 1, 3)}
<div class="sep"></div>
${screen('גרמניה', 'אקוודור', 'שלב הבתים', 1.6, 1.25, { confidence: 'medium', keyFactors: ['גרמניה מועדפת אך אקוודור הגנתית וקשה', 'קצב שערים נמוך צפוי — סיכוי תיקו לא מבוטל', 'הרכב גרמניה מסובב לקראת ההמשך'], rationale: 'משחק מאוזן יותר ממה שנדמה: אקוודור משחקת נמוך ומסוגלת לתפוס נקודה. הכיוון מצביע על ניצחון גרמניה, אך התא המודאלי דווקא תיקו — ולכן ההצעות מתפצלות.' }, 1, 3)}
</div></body></html>`;

writeFileSync('C:/tmp/match-preview.html', html, 'utf8');
console.log('wrote C:/tmp/match-preview.html');
