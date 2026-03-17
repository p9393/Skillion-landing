// app/lib/scoreEngine.ts

export type Trade = {
  ts: number;     // unix ms
  pnl: number;    // profit/loss
  risk?: number;  // opzionale
};

export type ScoreBreakdown = {
  total: number; // 0..1000
  riskControl: number; // 0..100
  stability: number;   // 0..100
  profitQuality: number; // 0..100
  drawdownDiscipline: number; // 0..100
  consistency: number; // 0..100
  stats: {
    sharpe: number;
    sortino: number;
    maxDrawdownPct: number;
    zScore: number;
    winRate: number;
    trades: number;
    avgPnl: number;
    pnlStd: number;
  };
};

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

function mean(xs: number[]) {
  if (!xs.length) return 0;
  return xs.reduce((s, v) => s + v, 0) / xs.length;
}

function std(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = mean(xs.map(x => (x - m) ** 2));
  return Math.sqrt(v);
}

function maxDrawdownPctFromPnL(pnls: number[]) {
  let equity = 0;
  let peak = 0;
  let maxDD = 0;

  for (const p of pnls) {
    equity += p;
    if (equity > peak) peak = equity;
    const denom = Math.max(1, Math.abs(peak));
    const dd = (peak - equity) / denom;
    if (dd > maxDD) maxDD = dd;
  }
  return clamp(maxDD * 100, 0, 100);
}

function sharpe(pnls: number[]) {
  const m = mean(pnls);
  const s = std(pnls);
  if (s === 0) return 0;
  return m / s;
}

function sortino(pnls: number[]) {
  const m = mean(pnls);
  const downside = pnls.filter(x => x < 0);
  const ds = std(downside);
  if (ds === 0) return downside.length ? 0 : 10;
  return m / ds;
}

function zScoreSimple(pnls: number[]) {
  const m = mean(pnls);
  const s = std(pnls);
  if (s === 0) return 0;
  return m / s;
}

function winRate(pnls: number[]) {
  if (!pnls.length) return 0;
  const w = pnls.filter(x => x > 0).length;
  return w / pnls.length;
}

function consistencyIndex(pnls: number[]) {
  const abs = pnls.map(x => Math.abs(x));
  const m = mean(abs);
  const s = std(abs);
  if (m === 0) return 0;
  const cv = s / m;
  return clamp(100 * (1 - clamp(cv / 2, 0, 1)), 0, 100);
}

function scoreFromSharpe(x: number) {
  const v = clamp((x + 0.2) / 2.2, 0, 1);
  return Math.round(v * 100);
}

function scoreFromSortino(x: number) {
  const v = clamp((x + 0.2) / 3.2, 0, 1);
  return Math.round(v * 100);
}

function scoreFromDrawdown(ddPct: number) {
  const v = clamp(1 - ddPct / 50, 0, 1);
  return Math.round(v * 100);
}

function scoreFromZ(z: number) {
  const absz = Math.abs(z);
  const center = 1.0;
  const dist = Math.abs(absz - center);
  const v = clamp(1 - dist / 2, 0, 1);
  return Math.round(v * 100);
}

function scoreFromWinRate(w: number) {
  const v = clamp((w - 0.35) / 0.40, 0, 1);
  return Math.round(v * 100);
}

export function computeSkillionScore(trades: Trade[]): ScoreBreakdown {
  const pnls = trades.map(t => t.pnl);
  const n = pnls.length;

  const sh = sharpe(pnls);
  const so = sortino(pnls);
  const dd = maxDrawdownPctFromPnL(pnls);
  const z = zScoreSimple(pnls);
  const wr = winRate(pnls);

  const riskControl = scoreFromDrawdown(dd);
  const stability = consistencyIndex(pnls);
  const profitQuality = scoreFromSortino(so);
  const drawdownDiscipline = scoreFromDrawdown(dd);
  const consistency = Math.round(0.6 * stability + 0.4 * scoreFromWinRate(wr));

  const sharpeScore = scoreFromSharpe(sh);
  const zScore = scoreFromZ(z);

  const total100 =
    0.22 * riskControl +
    0.20 * profitQuality +
    0.18 * consistency +
    0.16 * sharpeScore +
    0.14 * zScore +
    0.10 * stability;

  const total = Math.round(clamp(total100, 0, 100) * 10);

  return {
    total,
    riskControl,
    stability: Math.round(stability),
    profitQuality,
    drawdownDiscipline,
    consistency,
    stats: {
      sharpe: Number(sh.toFixed(3)),
      sortino: Number(so.toFixed(3)),
      maxDrawdownPct: Number(dd.toFixed(2)),
      zScore: Number(z.toFixed(3)),
      winRate: Number(wr.toFixed(3)),
      trades: n,
      avgPnl: Number(mean(pnls).toFixed(2)),
      pnlStd: Number(std(pnls).toFixed(2)),
    },
  };
}
