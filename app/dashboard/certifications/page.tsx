import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Award, Calendar, TrendingUp, ShieldCheck, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getTierInfo, getNextTier, pointsToNextTier, TIER_THRESHOLDS, type SdiTier } from '@/app/lib/tier-certification'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export default async function CertificationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const admin = getAdmin()

    // Current certification
    const { data: currentCert } = await admin
        .from('user_certifications')
        .select('tier, sdi_at_certification, certified_at, snapshot_id')
        .eq('user_id', user.id)
        .order('certified_at', { ascending: false })
        .limit(1)
        .single()

    // Certification history
    const { data: history } = await admin
        .from('user_certifications')
        .select('tier, sdi_at_certification, certified_at')
        .eq('user_id', user.id)
        .order('certified_at', { ascending: false })
        .limit(10)

    // Latest snapshot for current score
    const { data: snapshot } = await admin
        .from('score_snapshots')
        .select('sdi_total, tier, computed_at')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single()

    const hasCert = !!currentCert
    const currentTier = currentCert?.tier as SdiTier ?? 'explorer'
    const tierInfo = getTierInfo(currentTier)
    const nextTier = getNextTier(currentTier)
    const pointsNeeded = snapshot ? pointsToNextTier(snapshot.sdi_total, currentTier) : null

    const TIER_COLORS: Record<SdiTier, string> = {
        explorer: 'text-slate-300 border-slate-500/30 bg-slate-500/10',
        builder: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
        strategist: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
        architect: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        elite: 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10',
    }

    return (
        <div className="space-y-6 pb-16">
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide">Certification Record</h2>
                <p className="text-white/40 text-sm mt-1">Your verified reputation certification history.</p>
            </div>

            {!hasCert ? (
                /* No certification yet */
                <div className="text-center py-20 rounded-2xl border border-white/5 bg-[#0d1220]/40">
                    <div className="w-16 h-16 rounded-2xl bg-[#7000FF]/10 border border-[#7000FF]/20 flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-[#7000FF]/60" />
                    </div>
                    <h3 className="text-xl font-light text-white mb-2">No certification yet</h3>
                    <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">Upload your trading history to compute your SDI Score and receive your first certification.</p>
                    <Link href="/dashboard/connect" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium hover:bg-[#00F0FF]/20 transition-colors">
                        Connect Trading Data <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <>
                    {/* Current certification card */}
                    <div className="rounded-2xl border border-white/8 bg-[#0d1220]/60 p-6">
                        <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-4">Current Certification</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${TIER_COLORS[currentTier]}`}>
                                <Award className="w-4 h-4" />
                                <span className="font-semibold text-sm">{tierInfo.label}</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-white/60 text-sm leading-relaxed">{tierInfo.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                                    <span>SDI at certification: <span className="text-white/60">{currentCert.sdi_at_certification}</span></span>
                                    <span>Certified: <span className="text-white/60">{new Date(currentCert.certified_at).toLocaleDateString('en-GB')}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tier progression */}
                    <div className="rounded-2xl border border-white/8 bg-[#0d1220]/60 p-6">
                        <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-5">Tier Progression</p>
                        <div className="space-y-3">
                            {[...TIER_THRESHOLDS].reverse().map(t => {
                                const isActive = t.tier === currentTier
                                const isPast = (snapshot?.sdi_total ?? 0) >= t.minScore
                                return (
                                    <div key={t.tier} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isActive ? `${TIER_COLORS[t.tier]} border-opacity-50` : isPast ? 'border-white/8 bg-white/[0.02]' : 'border-white/5 bg-transparent'}`}>
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? 'bg-current' : isPast ? 'bg-white/30' : 'bg-white/10'}`} />
                                        <div className="flex-1">
                                            <span className={`text-sm font-medium ${isActive ? '' : isPast ? 'text-white/50' : 'text-white/20'}`}>{t.label}</span>
                                            <span className="text-xs text-white/25 ml-2">{t.minScore}+ pts</span>
                                        </div>
                                        {isActive && <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Current</span>}
                                        {isPast && !isActive && <ShieldCheck className="w-3.5 h-3.5 text-white/20" />}
                                    </div>
                                )
                            })}
                        </div>
                        {nextTier && pointsNeeded !== null && (
                            <div className="mt-4 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-white/30" />
                                    <p className="text-xs text-white/40">
                                        <span className="text-white/60 font-semibold">{pointsNeeded} points</span> to reach {nextTier.label}
                                    </p>
                                </div>
                            </div>
                        )}
                        {!nextTier && (
                            <div className="mt-4 p-3 rounded-xl border border-[#00F0FF]/15 bg-[#00F0FF]/5 text-center">
                                <p className="text-xs text-[#00F0FF]">🏆 You've reached the highest tier — Elite</p>
                            </div>
                        )}
                    </div>

                    {/* History */}
                    {history && history.length > 1 && (
                        <div className="rounded-2xl border border-white/8 bg-[#0d1220]/60 p-6">
                            <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-4">Certification History</p>
                            <div className="space-y-2">
                                {history.map((h, i) => (
                                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-3.5 h-3.5 text-white/20" />
                                            <span className="text-xs text-white/40">{new Date(h.certified_at).toLocaleDateString('en-GB')}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-white/30">SDI {h.sdi_at_certification}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${TIER_COLORS[h.tier as SdiTier]}`}>{h.tier}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Update certification CTA */}
                    <Link href="/dashboard/connect" className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                        <div>
                            <p className="text-sm font-medium text-white/70">Update your certification</p>
                            <p className="text-xs text-white/30 mt-0.5">Upload a new statement to recompute your SDI Score</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                    </Link>
                </>
            )}
        </div>
    )
}
