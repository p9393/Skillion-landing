import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Brain, AlertTriangle, CheckCircle2, Star } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DimensionScore { name: string; weight: number; raw: number; normalized: number; contribution: number }
interface AurionReport { summary: string; tier_comment: string; strengths: string[]; flags: string[]; confidence: number; validationOk: boolean }

interface ScoreData {
    sdi_score: number
    tier: string
    sharpe_ratio: number
    sortino_ratio: number
    max_drawdown_pct: number
    win_rate: number
    profit_factor: number
    z_score_consistency: number
    total_trades: number
    trading_days: number
    net_profit: number
    gross_profit: number
    gross_loss: number
    mt_login: string
    platform: string
    computed_at: string
    raw_metrics: {
        breakdown: DimensionScore[]
        aurion: AurionReport
        avgProfit: number
        avgLoss: number
        dataCoverage: number
        validation: { warnings: string[] }
    }
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; next?: string; nextAt: number }> = {
    explorer: { label: 'Explorer', color: 'text-slate-400', bg: 'bg-slate-400/10', next: 'Builder', nextAt: 300 },
    builder: { label: 'Builder', color: 'text-blue-400', bg: 'bg-blue-400/10', next: 'Strategist', nextAt: 500 },
    strategist: { label: 'Strategist', color: 'text-emerald-400', bg: 'bg-emerald-400/10', next: 'Architect', nextAt: 700 },
    architect: { label: 'Architect', color: 'text-violet-400', bg: 'bg-violet-400/10', next: 'Elite', nextAt: 850 },
    elite: { label: 'Elite', color: 'text-amber-400', bg: 'bg-amber-400/10', nextAt: 1000 },
}

function MetricCard({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean | null }) {
    const Icon = good === true ? TrendingUp : good === false ? TrendingDown : Minus
    const color = good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : 'text-white/40'
    return (
        <div className="bg-[#0d1220]/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs uppercase tracking-widest text-white/30 font-semibold">{label}</p>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <p className="text-xl font-light text-white">{value}</p>
            {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
        </div>
    )
}

function DimensionBar({ d }: { d: DimensionScore }) {
    const pct = Math.round(d.normalized * 100)
    const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm text-white/70">{d.name}</p>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">{Math.round(d.weight * 100)}% weight</span>
                    <span className="text-sm font-medium text-white">{d.contribution} pt</span>
                </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ScorePage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: score } = await supabase
        .from('sdi_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single() as { data: ScoreData | null }

    // ── No score yet ──────────────────────────────────────────────────────────
    if (!score) {
        return (
            <div className="max-w-lg mx-auto text-center py-20 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mx-auto">
                    <Star className="w-8 h-8 text-[#00F0FF]" />
                </div>
                <h2 className="text-2xl font-light text-white">No SDI Score yet</h2>
                <p className="text-white/40 text-sm leading-relaxed">Upload your MT4/MT5 statement to get your full Skillion Discipline Index score, verified by Aurion.</p>
                <a href="/dashboard/connect" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium hover:bg-[#00F0FF]/20 transition-colors">
                    Connect Trading Account →
                </a>
            </div>
        )
    }

    const tier = TIER_CONFIG[score.tier] ?? TIER_CONFIG.explorer
    const aurion = score.raw_metrics?.aurion as AurionReport | undefined
    const breakdown = score.raw_metrics?.breakdown as DimensionScore[] | undefined
    const warnings = score.raw_metrics?.validation?.warnings ?? []

    // Progress to next tier
    const tierMin = { explorer: 0, builder: 300, strategist: 500, architect: 700, elite: 850 }[score.tier] ?? 0
    const tierMax = tier.nextAt
    const progress = tierMax > tierMin ? Math.round(((score.sdi_score - tierMin) / (tierMax - tierMin)) * 100) : 100

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-16">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide mb-1">Skillion Discipline Index</h2>
                <p className="text-white/40 text-xs">
                    {score.platform} · Login: {score.mt_login || 'N/A'} ·
                    Last analysis: {new Date(score.computed_at).toLocaleDateString('it-IT')}
                </p>
            </div>

            {/* Score Hero */}
            <div className={`rounded-2xl border border-white/5 p-8 text-center ${tier.bg} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 pointer-events-none" />
                <div className="relative z-10">
                    <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${tier.color}`}>SDI Score · {tier.label}</p>
                    <p className="text-7xl font-thin text-white mb-1">{score.sdi_score}</p>
                    <p className="text-white/30 text-sm">/1000</p>

                    {/* Tier progress */}
                    {score.tier !== 'elite' && (
                        <div className="mt-5 max-w-xs mx-auto">
                            <div className="flex justify-between text-xs text-white/30 mb-1.5">
                                <span>{tier.label}</span>
                                <span>{tier.next}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5">
                                <div className={`h-full rounded-full ${tier.color.replace('text-', 'bg-')}`} style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-white/20 mt-1 text-right">{tierMax - score.sdi_score} pt to next tier</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Validation warnings */}
            {warnings.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Data Notices</p>
                    </div>
                    {warnings.map((w, i) => <p key={i} className="text-xs text-amber-300/70">{w}</p>)}
                </div>
            )}

            {/* Aurion Analysis */}
            {aurion && (
                <div className="rounded-2xl border border-[#00F0FF]/10 bg-[#0d1220]/60 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-[#00F0FF]" />
                            <p className="text-sm font-medium text-[#00F0FF]">Aurion Analysis</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {aurion.validationOk
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            }
                            <span className="text-xs text-white/30">Confidence: {aurion.confidence}%</span>
                        </div>
                    </div>

                    <p className="text-sm text-white/60 leading-relaxed">{aurion.summary}</p>
                    {aurion.tier_comment && (
                        <p className="text-xs text-[#00F0FF]/50 italic">{aurion.tier_comment}</p>
                    )}

                    {aurion.strengths?.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs uppercase tracking-widest text-emerald-400/60 font-semibold">Strengths</p>
                            {aurion.strengths.map((s, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-white/50">{s}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {aurion.flags?.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs uppercase tracking-widest text-amber-400/60 font-semibold">Areas to improve</p>
                            {aurion.flags.map((f, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-white/50">{f}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-white/5 pt-3 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]/50" />
                        <p className="text-xs text-white/25">Score validated by Aurion — Skillion Intelligence Layer</p>
                    </div>
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard label="Net Profit" value={`${score.net_profit >= 0 ? '+' : ''}${score.net_profit.toFixed(0)}`} good={score.net_profit > 0} />
                <MetricCard label="Win Rate" value={`${(score.win_rate * 100).toFixed(1)}%`} good={score.win_rate >= 0.5} />
                <MetricCard label="Profit Factor" value={score.profit_factor.toFixed(2)} good={score.profit_factor >= 1.5} />
                <MetricCard label="Max Drawdown" value={`${score.max_drawdown_pct.toFixed(1)}%`} good={score.max_drawdown_pct <= 15} />
                <MetricCard label="Sharpe Ratio" value={score.sharpe_ratio.toFixed(2)} sub="annualized" good={score.sharpe_ratio >= 1} />
                <MetricCard label="Sortino Ratio" value={score.sortino_ratio.toFixed(2)} sub="downside-adj." good={score.sortino_ratio >= 1} />
                <MetricCard label="Total Trades" value={score.total_trades.toString()} sub={`${score.trading_days} trading days`} good={null} />
                <MetricCard label="Z-Score (CV)" value={score.z_score_consistency.toFixed(2)} sub="consistency" good={score.z_score_consistency <= 1.5} />
                <MetricCard label="Gross Profit" value={`+${score.gross_profit.toFixed(0)}`} good={true} />
            </div>

            {/* SDI Breakdown */}
            {breakdown && breakdown.length > 0 && (
                <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 p-6 space-y-4">
                    <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-2">Score Breakdown</p>
                    {breakdown.map(d => <DimensionBar key={d.name} d={d} />)}
                    <div className="border-t border-white/5 pt-3 flex justify-between text-xs text-white/30">
                        <span>Total</span>
                        <span className="font-medium text-white">{breakdown.reduce((a, b) => a + b.contribution, 0)} / 1000</span>
                    </div>
                </div>
            )}

            {/* Re-upload CTA */}
            <div className="rounded-xl border border-white/5 bg-[#0d1220]/40 p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-white/60">Want to update your score?</p>
                    <p className="text-xs text-white/30">Upload a new statement from MetaTrader</p>
                </div>
                <a href="/dashboard/connect" className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-medium hover:bg-[#00F0FF]/20 transition-colors whitespace-nowrap">
                    Update →
                </a>
            </div>
        </div>
    )
}
