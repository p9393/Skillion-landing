import { createClient } from '@/utils/supabase/server'
import { Star, Link as LinkIcon, ArrowRight, Upload, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardOverview() {
    let user = null
    let count = 0
    let score: { sdi_score: number; tier: string } | null = null

    try {
        const supabase = await createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
            redirect('/auth/login')
        }

        user = authUser

        const { count: sourceCount } = await supabase
            .from('data_sources')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        count = sourceCount ?? 0

        const { data: scoreData } = await supabase
            .from('sdi_scores')
            .select('sdi_score, tier')
            .eq('user_id', user.id)
            .order('computed_at', { ascending: false })
            .limit(1)
            .single()

        score = scoreData ?? null
    } catch (err) {
        console.error('[dashboard] Unexpected error:', err)
        // Don't crash — render with empty state
    }

    const hasScore = !!score
    const hasSource = count > 0

    return (
        <div className="space-y-8">

            {/* Welcome header */}
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide">
                    Welcome back
                    <span className="text-white/30">{user?.email ? `, ${user.email.split('@')[0]}` : ''}</span>
                </h2>
                <p className="text-white/35 text-sm mt-1">
                    {hasScore
                        ? 'Your SDI Score is ready. Keep tracking your performance.'
                        : 'Follow the steps below to get your Skillion Discipline Index score.'}
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Score card */}
                <div className="bg-[#1A2235]/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-transparent pointer-events-none" />
                    <Star className="w-8 h-8 text-[#00F0FF]/50 mb-4" />
                    <p className="text-sm text-white/50 uppercase tracking-widest font-medium mb-1">Skillion Score</p>
                    {hasScore ? (
                        <>
                            <p className="text-5xl font-thin text-white">{score!.sdi_score}</p>
                            <p className="text-xs text-white/30 mt-1 capitalize">{score!.tier} tier</p>
                        </>
                    ) : (
                        <p className="text-xl font-light text-white/30">No data yet</p>
                    )}
                </div>

                {/* Sources card */}
                <div className="bg-[#1A2235]/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-bl from-[#7000FF]/5 to-transparent pointer-events-none" />
                    <LinkIcon className="w-8 h-8 text-[#7000FF]/50 mb-4" />
                    <p className="text-sm text-white/50 uppercase tracking-widest font-medium mb-1">Connected Sources</p>
                    <p className="text-5xl font-thin text-white mb-3">{count}</p>
                    {!hasSource && (
                        <Link href="/dashboard/connect" className="text-sm text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors flex items-center gap-1">
                            Connect your first source <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Onboarding Steps — only shown if no score yet */}
            {!hasScore && (
                <div className="rounded-2xl border border-white/5 bg-[#0a0f1a]/60 p-6">
                    <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-5">
                        Get started — 3 steps to your SDI Score
                    </p>
                    <div className="space-y-4">
                        {[
                            {
                                step: '01',
                                icon: Upload,
                                title: 'Export your MT4 / MT5 history',
                                desc: 'Open MetaTrader → Account History tab → right-click → "All History" → "Save as Report" (HTML)',
                                done: false,
                                href: '/dashboard/connect',
                                cta: 'Go to Connect →',
                            },
                            {
                                step: '02',
                                icon: BarChart3,
                                title: 'Upload the HTML report',
                                desc: 'Drag & drop or click to upload. Aurion will parse your trades and compute all metrics.',
                                done: hasSource,
                                href: '/dashboard/connect',
                                cta: 'Upload now →',
                            },
                            {
                                step: '03',
                                icon: Star,
                                title: 'View your SDI Score',
                                desc: 'Your verified Skillion Discipline Index will be ready instantly after upload.',
                                done: hasScore,
                                href: '/dashboard/score',
                                cta: 'View Score →',
                            },
                        ].map((item) => {
                            const Icon = item.icon
                            return (
                                <div
                                    key={item.step}
                                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${item.done
                                            ? 'border-emerald-500/20 bg-emerald-500/5'
                                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${item.done
                                            ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                                            : 'bg-[#00F0FF]/10 border-[#00F0FF]/20 text-[#00F0FF]'
                                        }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[10px] font-bold text-white/20 tracking-wider">STEP {item.step}</span>
                                            {item.done && <span className="text-[10px] text-emerald-400 font-semibold">✓ DONE</span>}
                                        </div>
                                        <p className="text-sm font-medium text-white/80">{item.title}</p>
                                        <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{item.desc}</p>
                                    </div>
                                    {!item.done && (
                                        <Link
                                            href={item.href}
                                            className="flex-shrink-0 text-xs text-[#00F0FF]/70 hover:text-[#00F0FF] transition-colors whitespace-nowrap pt-1"
                                        >
                                            {item.cta}
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Quick navigation — shown after score exists */}
            {hasScore && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        href="/dashboard/score"
                        className="flex items-center gap-4 p-5 rounded-xl border border-white/5 bg-[#0a0f1a]/60 hover:bg-white/[0.04] transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                            <Star className="w-5 h-5 text-[#00F0FF]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/80">View Full Score</p>
                            <p className="text-xs text-white/35">Breakdown, Aurion analysis, tier progress</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </Link>
                    <Link
                        href="/dashboard/connect"
                        className="flex items-center gap-4 p-5 rounded-xl border border-white/5 bg-[#0a0f1a]/60 hover:bg-white/[0.04] transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#7000FF]/10 border border-[#7000FF]/20 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-[#7000FF]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/80">Update Score</p>
                            <p className="text-xs text-white/35">Upload a new MT4/MT5 statement</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </Link>
                </div>
            )}
        </div>
    )
}
