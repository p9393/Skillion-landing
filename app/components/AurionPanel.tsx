import { computeSkillionScore, Trade } from "../lib/scoreEngine";

export default function AurionPanel() {

  // Mock trades (simulazione iniziale)
  const trades: Trade[] = [
    { ts: 1, pnl: 50 },
    { ts: 2, pnl: -30 },
    { ts: 3, pnl: 80 },
    { ts: 4, pnl: -20 },
    { ts: 5, pnl: 40 },
    { ts: 6, pnl: -10 },
    { ts: 7, pnl: 100 },
    { ts: 8, pnl: -50 },
    { ts: 9, pnl: 60 },
    { ts: 10, pnl: 30 },
  ];

  const score = computeSkillionScore(trades);

  return (
    <section id="aurion" className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">

        <h3 className="text-2xl font-semibold mb-4">
          Aurion Quant Console
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">

          <Metric label="Reputation Score" value={String(score.total)} />

          <Metric label="Sharpe Ratio" value={score.stats.sharpe.toFixed(2)} />

          <Metric label="Sortino Ratio" value={score.stats.sortino.toFixed(2)} />

          <Metric label="Z-Score" value={score.stats.zScore.toFixed(2)} />

          <Metric label="Max Drawdown" value={`${score.stats.maxDrawdownPct.toFixed(2)}%`} />

          <Metric label="Win Rate" value={`${score.stats.winRate.toFixed(1)}%`} />

          <Metric label="Trades" value={String(score.stats.trades)} />

          <Metric label="Avg PnL" value={score.stats.avgPnl.toFixed(2)} />

        </div>

      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
