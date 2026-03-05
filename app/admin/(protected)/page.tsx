import { createClient } from "@/utils/supabase/server";
import { updateWaitlistStatus, toggleUserActivation, getNetworkStats } from "../actions";
import { Users, Star, Clock, Database, TrendingUp, Shield } from "lucide-react";

const TIER_COLOR: Record<string, string> = {
    explorer: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    builder: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    strategist: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    architect: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    elite: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

export default async function AdminDashboard() {
    const supabase = await createClient();

    // Parallel data fetching
    const [
        { data: waitlist },
        { data: profiles },
        networkStats,
    ] = await Promise.all([
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles")
            .select(`
                id, email, is_activated, role, created_at,
                sdi_scores(sdi_score, tier, total_trades, computed_at)
            `)
            .order("created_at", { ascending: false }),
        getNetworkStats(),
    ]);

    // Attach latest score to each profile
    const profilesWithScore = (profiles || []).map(p => {
        const scores = (p as Record<string, unknown>).sdi_scores as Array<{ sdi_score: number; tier: string; total_trades: number; computed_at: string }> | null;
        const latestScore = Array.isArray(scores) && scores.length > 0 ? scores[0] : null;
        return { ...p, latestScore };
    });

    const pendingWaitlist = waitlist?.filter(w => w.status === 'pending') || []
    const invitedWaitlist = waitlist?.filter(w => w.status === 'invited') || []
    const now = new Date().getTime()

    return (
        <div className="space-y-8 pb-20">

            {/* ── KPI Bar ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    { label: 'Total Users', value: networkStats?.totalUsers ?? '—', icon: Users, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
                    { label: 'Active Members', value: networkStats?.activeUsers ?? '—', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
                    { label: 'Avg SDI Score', value: networkStats?.avgNetworkScore ?? '—', icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
                    { label: 'Pending Review', value: networkStats?.pendingWaitlist ?? '—', icon: Clock, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
                    { label: 'Trades Analyzed', value: networkStats?.totalTrades?.toLocaleString() ?? '—', icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20' },
                ].map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className={`rounded-xl border p-4 flex flex-col gap-2 ${kpi.bg}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40 uppercase tracking-wider font-medium">{kpi.label}</span>
                                <Icon className={`w-4 h-4 ${kpi.color}`} />
                            </div>
                            <p className={`text-2xl font-light ${kpi.color}`}>{kpi.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* ── Tier Distribution ───────────────────────────────────────── */}
            {networkStats?.tierDistribution && Object.keys(networkStats.tierDistribution).length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-[#0a0c12]/80 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        <p className="text-sm font-medium text-white/70">Network Tier Distribution</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {['explorer', 'builder', 'strategist', 'architect', 'elite'].map(tier => {
                            const count = networkStats.tierDistribution![tier] || 0;
                            const total = networkStats.totalAnalyzed || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                                <div key={tier} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${TIER_COLOR[tier]}`}>
                                    <span className="capitalize">{tier}</span>
                                    <span className="opacity-70">{count} ({pct}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Waitlist ────────────────────────────────────────────────── */}
            <section className="rounded-2xl border border-white/10 bg-[#0a0c12]/80 p-6 backdrop-blur-md shadow-2xl">
                <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold">1</span>
                        Waitlist & Onboarding
                    </h2>
                    <div className="flex gap-2">
                        <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-medium">{pendingWaitlist.length} pending</span>
                        <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium">{invitedWaitlist.length} invited</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/[0.04] text-xs uppercase text-white/35 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Joined</th>
                                <th className="px-4 py-3 font-medium">Days Waiting</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {waitlist?.map((w) => {
                                const daysWaiting = Math.floor((now - new Date(w.created_at).getTime()) / 86400000);
                                return (
                                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 font-medium text-white/85">{w.email}</td>
                                        <td className="px-4 py-3 text-xs text-white/40">{new Date(w.created_at).toLocaleDateString('en-GB')}</td>
                                        <td className="px-4 py-3 text-xs">
                                            <span className={`font-medium ${daysWaiting > 7 ? 'text-rose-400' : daysWaiting > 3 ? 'text-amber-400' : 'text-white/50'}`}>
                                                {daysWaiting}d
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${w.status === 'invited' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                                                w.status === 'rejected' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                                                    'bg-amber-400/10 text-amber-400 border-amber-400/20'
                                                }`}>{w.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <form className="inline-flex gap-1.5">
                                                <button
                                                    formAction={updateWaitlistStatus.bind(null, w.id, "invited")}
                                                    className="rounded-md bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors border border-indigo-500/20"
                                                >Approve</button>
                                                <button
                                                    formAction={updateWaitlistStatus.bind(null, w.id, "rejected")}
                                                    className="rounded-md bg-white/5 px-3 py-1.5 text-xs font-medium text-white/35 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/20 transition-all border border-transparent"
                                                >Reject</button>
                                            </form>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!waitlist || waitlist.length === 0) && (
                                <tr><td colSpan={5} className="px-4 py-10 text-center text-white/25 italic">No waitlist entries yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── Profiles & CRM ──────────────────────────────────────────── */}
            <section className="rounded-2xl border border-white/10 bg-[#0a0c12]/80 p-6 backdrop-blur-md shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 text-xs font-bold">2</span>
                        Profiles & CRM
                    </h2>
                    <span className="text-xs font-mono text-white/40 bg-white/5 px-3 py-1 rounded-md border border-white/8">{profiles?.length || 0} registered</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/[0.04] text-xs uppercase text-white/35 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">SDI Score</th>
                                <th className="px-4 py-3 font-medium">Trades</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {profilesWithScore.map((p) => (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 font-medium text-white/85 max-w-[200px] truncate">{p.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs uppercase tracking-wider font-bold ${p.role === 'admin' ? 'text-fuchsia-400' : 'text-white/30'}`}>
                                            {p.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.latestScore ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white/80">{p.latestScore.sdi_score}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize font-medium ${TIER_COLOR[p.latestScore.tier] || 'text-white/30 bg-white/5 border-white/10'}`}>
                                                    {p.latestScore.tier}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-white/20 italic">No data</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-white/40">
                                        {p.latestScore?.total_trades ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${p.is_activated ? 'text-emerald-400' : 'text-white/30'}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${p.is_activated ? 'bg-emerald-400' : 'bg-white/20'}`} />
                                            {p.is_activated ? 'Active' : 'Locked'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <form>
                                            <button
                                                formAction={toggleUserActivation.bind(null, p.id, p.is_activated)}
                                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors border ${p.is_activated
                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                    }`}
                                            >
                                                {p.is_activated ? 'Revoke' : 'Grant'}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                            {(!profiles || profiles.length === 0) && (
                                <tr><td colSpan={6} className="px-4 py-10 text-center text-white/25 italic">No registered profiles yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── Phase 2 Placeholders ─────────────────────────────────────── */}
            <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.02] p-7 flex flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl border border-indigo-500/15 mb-4">📜</div>
                    <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-2">Certification Engine</h2>
                    <p className="text-xs text-indigo-200/40 leading-relaxed max-w-xs">SBT Minting module. Pending Web3 EVM wallet integration.</p>
                    <div className="mt-4 rounded-full border border-indigo-400/15 bg-indigo-400/8 px-4 py-1 text-[10px] uppercase tracking-widest text-indigo-300/60">Phase 2</div>
                </section>

                <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/[0.02] p-7 flex flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-xl border border-fuchsia-500/15 mb-4">⛓️</div>
                    <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-2">Governance & Tokenomics</h2>
                    <p className="text-xs text-fuchsia-200/40 leading-relaxed max-w-xs">SKL token treasury management. Smart contracts not deployed on mainnet.</p>
                    <div className="mt-4 rounded-full border border-fuchsia-400/15 bg-fuchsia-400/8 px-4 py-1 text-[10px] uppercase tracking-widest text-fuchsia-300/60">Phase 2</div>
                </section>
            </div>
        </div>
    );
}
