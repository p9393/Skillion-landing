import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const TIER_CONFIG: Record<string, { color: string; label: string; next: string; nextMin: number }> = {
    explorer: { color: '#94a3b8', label: 'Explorer', next: 'Builder', nextMin: 300 },
    builder: { color: '#38bdf8', label: 'Builder', next: 'Strategist', nextMin: 500 },
    strategist: { color: '#818cf8', label: 'Strategist', next: 'Architect', nextMin: 700 },
    architect: { color: '#a78bfa', label: 'Architect', next: 'Elite', nextMin: 850 },
    elite: { color: '#e879f9', label: 'Elite', next: 'Elite', nextMin: 1000 },
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = Math.round(Math.min((value / max) * 100, 100));
    return (
        <div className="h-1.5 w-full rounded-full bg-white/5">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 p-5">
            <p className="text-xs uppercase tracking-widest text-white/30 mb-2">{label}</p>
            <p className="text-2xl font-light mb-1" style={{ color }}>{value}</p>
            <p className="text-xs text-white/30">{sub}</p>
        </div>
    );
}

export default async function ScorePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    // Fetch SDI score
    const { data: score } = await supabase
        .from('sdi_scores')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // Fetch recent trades
    const { data: trades } = await supabase
        .from('mt4_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('close_time', { ascending: false })
        .limit(20);

    const sdi = score?.sdi_score ?? 0;
    const tier = score?.tier ?? 'explorer';
    const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.explorer;
    const nextPts = Math.max(0, cfg.nextMin - sdi);

    return (
        <div className="space-y-8 max-w-5xl">

            {/* No data state */}
            {!score && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
                    <p className="text-amber-400 font-medium mb-2">No score data yet</p>
                    <p className="text-white/40 text-sm mb-6">
                        Connect your MetaTrader account to start building your Skillion Discipline Index.
                    </p>
                    <Link href="/dashboard/connect/mt4-ea" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium hover:bg-[#00F0FF]/20 transition-colors">
                        Connect MetaTrader →
                    </Link>
                </div>
            )}

            {/* Score Hero */}
            {score && (
                <>
                    <div className="rounded-2xl border border-white/8 bg-[#06080f]/85 p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/30 mb-3">Skillion Discipline Index</p>
                                <div className="flex items-end gap-3">
                                    <p className="text-7xl font-light tabular-nums" style={{ color: cfg.color }}>
                                        {Math.round(sdi)}
                                    </p>
                                    <span className="text-2xl text-white/20 font-light mb-2">/1000</span>
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest"
                                        style={{ borderColor: cfg.color + '40', backgroundColor: cfg.color + '15', color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                    <span className="text-xs text-white/30">
                                        {tier === 'elite'
                                            ? 'Maximum tier achieved'
                                            : `${nextPts} pts to ${cfg.next}`}
                                    </span>
                                </div>
                                {tier !== 'elite' && (
                                    <div className="mt-4 w-64">
                                        <ProgressBar value={sdi % 200 || sdi} max={200} color={cfg.color} />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 text-sm text-white/40">
                                <p><span className="text-white/20">Platform:</span> {score.platform}</p>
                                <p><span className="text-white/20">Login:</span> {score.mt_login}</p>
                                <p><span className="text-white/20">Broker:</span> {score.broker || '—'}</p>
                                <p><span className="text-white/20">Last sync:</span> {score.computed_at ? new Date(score.computed_at).toLocaleString() : '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <MetricCard label="Total Trades" value={String(score.total_trades)} sub="closed positions" color="#00F0FF" />
                        <MetricCard label="Win Rate" value={`${((score.win_rate || 0) * 100).toFixed(1)}%`} sub="profitable trades" color="#a3e635" />
                        <MetricCard label="Profit Factor" value={Number(score.profit_factor || 0).toFixed(2)} sub="gross P / gross L" color="#818cf8" />
                        <MetricCard label="Net Profit" value={`${score.net_profit >= 0 ? '+' : ''}${Number(score.net_profit || 0).toFixed(2)}`} sub="all closed trades" color={score.net_profit >= 0 ? '#4ade80' : '#f87171'} />
                    </div>

                    {/* Dimension breakdown */}
                    {score.raw_metrics && Array.isArray(score.raw_metrics) && score.raw_metrics.length > 0 && (
                        <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 p-6">
                            <p className="text-sm font-medium text-white/60 uppercase tracking-widest mb-5">Score Breakdown</p>
                            <div className="space-y-4">
                                {(score.raw_metrics as Array<{ name: string; raw: number; normalized: number; weight: number; contribution: number }>).map((dim) => (
                                    <div key={dim.name}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-white/50">{dim.name}</span>
                                            <span className="text-white/30">{dim.contribution} pts · {Math.round(dim.weight * 100)}% weight</span>
                                        </div>
                                        <ProgressBar value={dim.normalized} max={1} color={cfg.color} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Risk metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <MetricCard label="Sharpe Ratio" value={Number(score.sharpe_ratio || 0).toFixed(2)} sub="risk-adjusted return" color="#00F0FF" />
                        <MetricCard label="Sortino Ratio" value={Number(score.sortino_ratio || 0).toFixed(2)} sub="downside-adj return" color="#818cf8" />
                        <MetricCard label="Max Drawdown" value={`${Number(score.max_drawdown_pct || 0).toFixed(1)}%`} sub="peak to trough" color={score.max_drawdown_pct > 25 ? '#f87171' : '#4ade80'} />
                    </div>

                    {/* Recent trades */}
                    {trades && trades.length > 0 && (
                        <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 overflow-hidden">
                            <p className="text-sm font-medium text-white/60 uppercase tracking-widest p-5 pb-3">Recent Trade History</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="px-5 py-2 text-left text-white/30 font-medium">Ticket</th>
                                            <th className="px-5 py-2 text-left text-white/30 font-medium">Symbol</th>
                                            <th className="px-5 py-2 text-left text-white/30 font-medium">Type</th>
                                            <th className="px-5 py-2 text-left text-white/30 font-medium">Lots</th>
                                            <th className="px-5 py-2 text-right text-white/30 font-medium">Profit</th>
                                            <th className="px-5 py-2 text-right text-white/30 font-medium">Close</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trades.map((t) => {
                                            const p = Number(t.profit) + Number(t.commission || 0) + Number(t.swap || 0);
                                            return (
                                                <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                                    <td className="px-5 py-2 text-white/30 font-mono">{t.ticket}</td>
                                                    <td className="px-5 py-2 text-white/60 font-medium">{t.symbol}</td>
                                                    <td className="px-5 py-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${t.trade_type === 'buy' ? 'bg-sky-500/10 text-sky-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                            {t.trade_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-2 text-white/40">{Number(t.lots).toFixed(2)}</td>
                                                    <td className={`px-5 py-2 text-right font-medium ${p >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {p >= 0 ? '+' : ''}{p.toFixed(2)}
                                                    </td>
                                                    <td className="px-5 py-2 text-right text-white/30">
                                                        {t.close_time ? new Date(t.close_time).toLocaleDateString() : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Disclaimer */}
                    <p className="text-xs text-white/20 text-center leading-relaxed">
                        The Skillion Discipline Index (SDI) is an algorithmic metric for informational purposes only.
                        It does not constitute financial advice or guarantee future performance.
                    </p>
                </>
            )}
        </div>
    );
}
