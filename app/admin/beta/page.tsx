import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { InviteButton } from './InviteButton'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

async function checkAdmin(userId: string): Promise<boolean> {
    const admin = getAdmin()
    const { data } = await admin
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .single()
    return !!data
}

export default async function AdminBetaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')
    if (!await checkAdmin(user.id)) redirect('/')

    const admin = getAdmin()

    const { data: waitlist } = await admin
        .from('waitlist')
        .select('id, email, status, created_at, invited_at')
        .order('created_at', { ascending: false })
        .limit(200)

    const pending = waitlist?.filter(w => w.status !== 'invited') ?? []
    const invited = waitlist?.filter(w => w.status === 'invited') ?? []

    return (
        <div className="min-h-screen bg-[#050A14] text-white p-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <p className="text-xs uppercase tracking-widest text-[#00F0FF] font-semibold mb-1">Admin Panel</p>
                    <h1 className="text-2xl font-semibold text-white">Closed Beta — Waitlist</h1>
                    <p className="text-white/40 text-sm mt-1">{pending.length} pending · {invited.length} invited</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Signups', value: waitlist?.length ?? 0, color: 'text-white' },
                        { label: 'Pending', value: pending.length, color: 'text-sky-400' },
                        { label: 'Invited', value: invited.length, color: 'text-emerald-400' },
                    ].map(s => (
                        <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
                            <p className="text-xs text-white/30 mb-1">{s.label}</p>
                            <p className={`text-3xl font-light ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Pending table */}
                <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/60 mb-6 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                        <p className="text-sm font-medium text-white">Pending Invites</p>
                    </div>
                    {pending.length === 0 ? (
                        <p className="text-center text-white/30 text-sm py-10">No pending signups</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-widest text-white/25">
                                    <th className="text-left px-6 py-3">Email</th>
                                    <th className="text-left px-6 py-3">Signed Up</th>
                                    <th className="text-right px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map(entry => (
                                    <tr key={entry.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-3.5 text-sm text-white/70 font-mono">{entry.email}</td>
                                        <td className="px-6 py-3.5 text-xs text-white/30">
                                            {new Date(entry.created_at).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <InviteButton email={entry.email} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Invited table */}
                {invited.length > 0 && (
                    <div className="rounded-2xl border border-emerald-500/10 bg-[#0a0f1a]/60 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5">
                            <p className="text-sm font-medium text-emerald-400">Invited ({invited.length})</p>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-widest text-white/25">
                                    <th className="text-left px-6 py-3">Email</th>
                                    <th className="text-left px-6 py-3">Signed Up</th>
                                    <th className="text-left px-6 py-3">Invited</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invited.map(entry => (
                                    <tr key={entry.id} className="border-t border-white/[0.04]">
                                        <td className="px-6 py-3.5 text-sm text-white/50 font-mono">{entry.email}</td>
                                        <td className="px-6 py-3.5 text-xs text-white/30">
                                            {new Date(entry.created_at).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-6 py-3.5 text-xs text-emerald-400">
                                            {entry.invited_at ? new Date(entry.invited_at).toLocaleDateString('en-GB') : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
