import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { explainScoreDelta } from '@/lib/scoring/explainability'
import { TrendingUp, TrendingDown, Minus, Award, Calendar } from 'lucide-react'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    explorer: { color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Explorer' },
    builder: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Builder' },
    strategist: { color: 'text-violet-400', bg: 'bg-violet-400/10', label: 'Strategist' },
    architect: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Architect' },
    elite: { color: 'text-[#00F0FF]', bg: 'bg-[#00F0FF]/10', label: 'Elite' },
}

export default async function TimelinePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const admin = getAdmin()

    const { data: snapshots } = await admin
        .from('score_snapshots')
        .select('id, sdi_total, risk_discipline, consistency, efficiency, professionalism, tier, data_quality_score, period_start, period_end, computed_at')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(30)

    const list = snapshots ?? []

    // Attach delta to each snapshot (compared to previous)
    const withDeltas = list.map((snap, i) => {
        if (i === list.length - 1) return { ...snap, delta: null }
        const prev = list[i + 1]
        return {
            ...snap,
            delta: explainScoreDelta(
                { ...prev, factors: undefined },
                { ...snap, factors: undefined }
            ),
        }
    })

    return (
        <div className="space-y-6 pb-16">
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide">Score Timeline</h2>
                <p className="text-white/40 text-sm mt-1">History of SDI score changes with explanations</p>
            </div>

            {list.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-[#7000FF]/10 border border-[#7000FF]/20 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-[#7000FF]/60" />
                    </div>
                    <h3 className="text-xl font-light text-white mb-2">No score history yet</h3>
                    <p className="text-white/40 text-sm">Connect an exchange account and upload or sync data to build your score history.</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-6 top-8 bottom-8 w-px bg-white/10" />

                    <div className="space-y-4">
                        {withDeltas.map((snap, i) => {
                            const tier = TIER_CONFIG[snap.tier] ?? TIER_CONFIG.explorer
                            const delta = snap.delta
                            const totalDelta = delta?.totalDelta ?? 0
                            const DeltaIcon = totalDelta > 0 ? TrendingUp : totalDelta < 0 ? TrendingDown : Minus
                            const deltaColor = totalDelta > 3 ? 'text-emerald-400' : totalDelta < -3 ? 'text-rose-400' : 'text-white/30'

                            return (
                                <div key={snap.id} className="relative flex gap-4">
                                    {/* Timeline dot */}
                                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${i === 0 ? 'bg-[#00F0FF]/15 border-[#00F0FF]/30' : 'bg-white/5 border-white/10'}`}>
                                        <Award className={`w-5 h-5 ${i === 0 ? 'text-[#00F0FF]' : 'text-white/40'}`} />
                                    </div>

                                    {/* Card */}
                                    <div className="flex-1 rounded-2xl border border-white/8 bg-[#0d1220]/60 p-4 mb-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl font-bold text-white">{snap.sdi_total}</span>
                                                    {delta && (
                                                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${deltaColor}`}>
                                                            <DeltaIcon className="w-3.5 h-3.5" />
                                                            {totalDelta > 0 ? '+' : ''}{totalDelta}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${tier.bg} ${tier.color} font-medium`}>
                                                    {tier.label}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-white/30">
                                                    {new Date(snap.computed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-white/20 mt-0.5">
                                                    {snap.period_start} → {snap.period_end}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Sub-scores */}
                                        <div className="grid grid-cols-4 gap-2 mt-3">
                                            {[
                                                { label: 'Risk', value: snap.risk_discipline },
                                                { label: 'Consist.', value: snap.consistency },
                                                { label: 'Edge', value: snap.efficiency },
                                                { label: 'Prof.', value: snap.professionalism },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="text-center bg-white/[0.03] rounded-lg py-2 px-1">
                                                    <p className="text-[10px] text-white/30 mb-0.5">{label}</p>
                                                    <p className="text-sm font-semibold text-white">{value}</p>
                                                    <p className="text-[9px] text-white/25">/250</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Delta explanations */}
                                        {delta?.explanations && delta.explanations.length > 0 && totalDelta !== 0 && (
                                            <div className="mt-3 space-y-1">
                                                {delta.explanations.slice(0, 2).map((exp, j) => (
                                                    <p key={j} className="text-xs text-white/40 leading-relaxed">
                                                        {exp}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {/* Tier change badge */}
                                        {delta?.tierChange.changed && (
                                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                                                ✦ Tier change: {delta.tierChange.from} → {delta.tierChange.to}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <p className="text-[11px] text-white/20 text-center pt-4">
                Score history for informational purposes only. Past performance does not guarantee future results.
            </p>
        </div>
    )
}
