import { createClient } from "@/utils/supabase/server";
import { updateWaitlistStatus, toggleUserActivation } from "../actions";

export default async function AdminDashboard() {
    const supabase = await createClient();

    const { data: waitlist } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });

    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, is_activated, role, created_at")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-10 pb-20">
            {/* ── 1. WAITLIST ────────────────────────────────────────── */}
            <section className="rounded-2xl border border-white/10 bg-[#0a0c12]/80 p-6 backdrop-blur-md shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-3 tracking-wide">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-sm">1</span>
                        Waitlist & Onboarding
                    </h2>
                    <span className="text-xs font-mono text-white/40 bg-white/5 px-3 py-1 rounded-md">{waitlist?.length || 0} Entries</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/5 text-xs uppercase text-white/40">
                            <tr>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Date Joined</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {waitlist?.map((w) => (
                                <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 font-medium text-white/90">{w.email}</td>
                                    <td className="px-4 py-3 text-xs">{new Date(w.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${w.status === "invited" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" :
                                            w.status === "rejected" ? "bg-rose-400/10 text-rose-400 border border-rose-400/20" :
                                                "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                                            }`}>
                                            {w.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <form className="inline-flex gap-2">
                                            <button
                                                formAction={updateWaitlistStatus.bind(null, w.id, "invited")}
                                                className="rounded-md bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors border border-indigo-500/20"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                formAction={updateWaitlistStatus.bind(null, w.id, "rejected")}
                                                className="rounded-md bg-white/5 px-3 py-1.5 text-xs font-medium text-white/40 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/20 transition-all border border-transparent"
                                            >
                                                Reject
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                            {(!waitlist || waitlist.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-white/30 italic">No waitlist entries yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── 2. PROFILES ────────────────────────────────────────── */}
            <section className="rounded-2xl border border-white/10 bg-[#0a0c12]/80 p-6 backdrop-blur-md shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-3 tracking-wide">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 text-sm">2</span>
                        Profiles & CRM
                    </h2>
                    <span className="text-xs font-mono text-white/40 bg-white/5 px-3 py-1 rounded-md">{profiles?.length || 0} Users</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/5 text-xs uppercase text-white/40">
                            <tr>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Access Status</th>
                                <th className="px-4 py-3 font-medium text-right">Toggle Activation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {profiles?.map((p) => (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 font-medium text-white/90">{p.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs uppercase tracking-wider ${p.role === 'admin' ? 'text-fuchsia-400 font-bold' : 'text-white/40'}`}>
                                            {p.role}
                                        </span>
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
                                                {p.is_activated ? 'Revoke Access' : 'Grant Access'}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                            {(!profiles || profiles.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-white/30 italic">No registered profiles yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── 3. PHASE 2 PLACEHOLDERS ────────────────────────────── */}
            <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] p-8 backdrop-blur-md flex flex-col items-center justify-center text-center opacity-70">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl border border-indigo-500/20 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.15)]">📜</div>
                    <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-2">Certification Engine</h2>
                    <p className="text-xs text-indigo-200/50 leading-relaxed max-w-xs">
                        SBT Minting module and achievement QR code generation currently locked. Pending Web3 EVM wallet integration.
                    </p>
                    <div className="mt-5 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-1.5 text-[10px] uppercase tracking-widest text-indigo-300">Phase 2 Module</div>
                </section>

                <section className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/[0.02] p-8 backdrop-blur-md flex flex-col items-center justify-center text-center opacity-70">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-2xl border border-fuchsia-500/20 mb-4 shadow-[0_0_30px_rgba(217,70,239,0.15)]">⛓️</div>
                    <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-2">Governance & Tokenomics</h2>
                    <p className="text-xs text-fuchsia-200/50 leading-relaxed max-w-xs">
                        SKL token treasury management and DAO parameter controls currently locked. Smart contracts not deployed on mainnet.
                    </p>
                    <div className="mt-5 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-1.5 text-[10px] uppercase tracking-widest text-fuchsia-300">Phase 2 Module</div>
                </section>
            </div>

        </div>
    );
}
