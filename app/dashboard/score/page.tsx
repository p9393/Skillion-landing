import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    ShieldCheck, TrendingUp, Zap, Star, AlertCircle,
    RefreshCw, ChevronRight, Info, Award
} from 'lucide-react'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// ── Tier config ──────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string; description: string }> = {
    explorer: { label: 'Explorer', color: 'text-slate-300', bg: 'bg-slate-500/10', ring: 'ring-slate-500/30', description: 'Beginning the journey. Focus on building disciplined habits.' },
    builder: { label: 'Builder', color: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-500/30', description: 'Developing consistency. Risk control is key at this stage.' },
    strategist: { label: 'Strategist', color: 'text-violet-400', bg: 'bg-violet-500/10', ring: 'ring-violet-500/30', description: 'Solid foundation. You show repeatable edge and discipline.' },
    architect: { label: 'Architect', color: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', description: 'Advanced operator. Strong risk-adjusted performance.' },
    elite: { label: 'Elite', color: 'text-[#00F0FF]', bg: 'bg-[#00F0FF]/10', ring: 'ring-[#00F0FF]/30', description: 'Institutional-grade execution. Top 5% of all traders.' },
}

const SUB_SCORE_CONFIG = [
    { key: 'risk_discipline', label: 'Risk Discipline', icon: ShieldCheck, color: 'text-rose-400', bar: 'bg-rose-400', desc: 'Drawdown control, CVaR, leverage management' },
    { key: 'consistency', label: 'Consistency', icon: TrendingUp, color: 'text-blue-400', bar: 'bg-blue-400', desc: 'Sharpe, Sortino, return stability, positive days' },
    { key: 'efficiency', label: 'Edge / Efficiency', icon: Zap, color: 'text-emerald-400', bar: 'bg-emerald-400', desc: 'Win rate, profit factor, win/loss ratio, fee drag' },
    { key: 'professionalism', label: 'Professionalism', icon: Star, color: 'text-amber-400', bar: 'bg-amber-400', desc: 'Diversification, holding time, trade frequency' },
]

function ScoreRing({ score }: { score: number }) {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const pct = Math.min(score / 1000, 1)
    const dashOffset = circumference * (1 - pct)

    return (
        <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
                cx="60" cy="60" r={radius} fill="none"
                stroke="url(#scoreGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7000FF" />
                    <stop offset="100%" stopColor="#00F0FF" />
                </linearGradient>
            </defs>
        </svg>
    )
}

export default async function ScorePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const admin = getAdmin()

    // Latest snapshot
    const { data: snapshot } = await admin
        .from('score_snapshots')
        .select('id, sdi_total, risk_discipline, consistency, efficiency, professionalism, tier, data_quality_score, computed_at, period_start, period_end, account_id')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single()

    // Factors for this snapshot
    const { data: factors } = snapshot
        ? await admin
            .from('score_factors')
            .select('sub_score, factor_name, raw_value, normalized_0_1, contribution, direction, explanation')
            .eq('snapshot_id', snapshot.id)
            .order('contribution', { ascending: false })
        : { data: [] }

    // Previous snapshot for delta
    const { data: prevSnapshot } = await admin
        .from('score_snapshots')
        .select('sdi_total, tier')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .range(1, 1)
        .single()

    const tier = TIER_CONFIG[snapshot?.tier ?? 'explorer']
    const totalDelta = snapshot && prevSnapshot ? snapshot.sdi_total - prevSnapshot.sdi_total : null
    const hasData = !!snapshot

    return (
        <div className="space-y-6 pb-16">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-light text-white tracking-wide">Reputation Score</h2>
                    <p className="text-white/40 text-sm mt-1">
                        {hasData
                            ? `Period: ${snapshot.period_start} → ${snapshot.period_end}`
                            : 'No data yet — connect an exchange to compute your score'}
                    </p>
                </div>
                {hasData && (
                    <form action="/api/aurion/reanalyze" method="POST">
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/40 border border-white/10 hover:border-white/20 hover:text-white/70 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Recompute
                        </button>
                    </form>
                )}
            </div>

            {!hasData ? (
                /* Empty state */
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-[#7000FF]/10 border border-[#7000FF]/20 flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-[#7000FF]/60" />
                    </div>
                    <h3 className="text-xl font-light text-white mb-2">No score computed yet</h3>
                    <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
                        Connect your exchange, sync your trades, then your SDI score will appear here.
                    </p>
                    <Link href="/dashboard/accounts" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium hover:bg-[#00F0FF]/20 transition-colors">
                        Connect Exchange <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <>
                    {/* SDI Gauge + Tier */}
                    <div className="rounded-2xl border border-white/8 bg-[#0d1220]/60 p-6">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* Ring */}
                            <div className="relative w-40 h-40 flex-shrink-0">
                                <ScoreRing score={snapshot.sdi_total} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-white">{snapshot.sdi_total}</span>
                                    <span className="text-xs text-white/40 mt-0.5">/1000</span>
                                    {totalDelta !== null && (
                                        <span className={`text-xs font-medium mt-1 ${totalDelta > 0 ? 'text-emerald-400' : totalDelta < 0 ? 'text-rose-400' : 'text-white/30'}`}>
                                            {totalDelta > 0 ? `+${totalDelta}` : totalDelta < 0 ? `${totalDelta}` : '—'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Tier info */}
                            <div className="flex-1 text-center md:text-left">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${tier.bg} ring-1 ${tier.ring} mb-3`}>
                                    <Award className={`w-4 h-4 ${tier.color}`} />
                                    <span className={`text-sm font-semibold ${tier.color}`}>{tier.label}</span>
                                </div>
                                <p className="text-white/50 text-sm leading-relaxed max-w-sm">{tier.description}</p>
                                <div className="flex items-center gap-4 mt-4 text-xs text-white/30">
                                    <span>Data quality: <span className="text-white/60">{Math.round((snapshot.data_quality_score ?? 0) * 100)}%</span></span>
                                    <span>Updated: <span className="text-white/60">{new Date(snapshot.computed_at).toLocaleDateString('en-GB')}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sub-score breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SUB_SCORE_CONFIG.map(cfg => {
                            const value = (snapshot as Record<string, unknown>)[cfg.key] as number ?? 0
                            const pct = Math.min((value / 250) * 100, 100)
                            const subFactors = (factors ?? []).filter(f => f.sub_score === cfg.key)
                            const IconComp = cfg.icon

                            return (
                                <div key={cfg.key} className="rounded-2xl border border-white/8 bg-[#0d1220]/60 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center`}>
                                            <IconComp className={`w-4 h-4 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white">{cfg.label}</p>
                                            <p className="text-[10px] text-white/30 truncate">{cfg.desc}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-xl font-bold text-white">{value}</span>
                                            <span className="text-xs text-white/30">/250</span>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-1.5 rounded-full bg-white/5 mb-3">
                                        <div
                                            className={`h-full rounded-full ${cfg.bar} transition-all`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>

                                    {/* Top factors */}
                                    {subFactors.slice(0, 3).map(f => (
                                        <div key={f.factor_name} className="flex items-start gap-2 py-1.5 border-t border-white/5">
                                            <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.direction === 'positive' ? 'bg-emerald-400' :
                                                    f.direction === 'negative' ? 'bg-rose-400' : 'bg-white/20'
                                                }`} />
                                            <p className="text-[11px] text-white/45 leading-snug">{f.explanation}</p>
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>

                    {/* Score path: tier progression */}
                    <div className="rounded-2xl border border-white/8 bg-[#0d1220]/60 p-4">
                        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4 text-white/30" />
                            Tier Progression
                        </h3>
                        <div className="flex items-center gap-1">
                            {(['explorer', 'builder', 'strategist', 'architect', 'elite'] as const).map((t, i) => {
                                const tc = TIER_CONFIG[t]
                                const thresholds = [0, 300, 500, 700, 850]
                                const isActive = snapshot.tier === t
                                const isPast = snapshot.sdi_total >= thresholds[i]
                                return (
                                    <div key={t} className="flex-1 text-center">
                                        <div className={`h-1 rounded-full mb-2 ${isPast ? (isActive ? `bg-gradient-to-r from-[#7000FF] to-[#00F0FF]` : 'bg-white/30') : 'bg-white/8'}`} />
                                        <p className={`text-[10px] font-medium ${isActive ? tc.color : isPast ? 'text-white/40' : 'text-white/15'}`}>
                                            {tc.label}
                                        </p>
                                        <p className="text-[9px] text-white/20">{thresholds[i]}+</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/dashboard/timeline"
                            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
                        >
                            <TrendingUp className="w-4 h-4" /> Score Timeline
                        </Link>
                        <Link
                            href="/dashboard/insights"
                            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#7000FF]/20 bg-[#7000FF]/5 text-sm text-[#7000FF] hover:bg-[#7000FF]/15 transition-colors"
                        >
                            <AlertCircle className="w-4 h-4" /> Ask Aurion
                        </Link>
                    </div>
                </>
            )}

            <p className="text-[11px] text-white/20 text-center pt-2">
                SDI score is for informational purposes only. Not financial advice.
            </p>
        </div>
    )
}
