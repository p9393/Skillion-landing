import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Mail, Lock, Bell, Shield } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-16">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide mb-1">Account Settings</h2>
                <p className="text-white/40 text-sm">Manage your identity, security and notification preferences.</p>
            </div>

            {/* Identity Section */}
            <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                    <Mail className="w-4 h-4 text-[#00F0FF]" />
                    <p className="text-sm font-medium text-white/80">Identity</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-white/30 mb-2 font-medium">Email</label>
                        <div className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white/60 text-sm font-mono">
                            {user.email}
                        </div>
                        <p className="mt-1.5 text-xs text-white/25">To change your email, contact us at info@skillion.finance</p>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-white/30 mb-2 font-medium">User ID</label>
                        <div className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white/30 text-xs font-mono truncate">
                            {user.id}
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                    <Lock className="w-4 h-4 text-[#00F0FF]" />
                    <p className="text-sm font-medium text-white/80">Security</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/70">Password</p>
                            <p className="text-xs text-white/30 mt-0.5">Last changed: unknown</p>
                        </div>
                        <a
                            href="/auth/forgot-password"
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 transition-colors"
                        >
                            Change Password
                        </a>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div>
                            <p className="text-sm text-white/70">Two-Factor Auth</p>
                            <p className="text-xs text-white/30 mt-0.5">Additional layer of security</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                            Coming Soon
                        </span>
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                    <Bell className="w-4 h-4 text-[#00F0FF]" />
                    <p className="text-sm font-medium text-white/80">Notifications</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {[
                        { label: 'Score updates', desc: 'When your SDI Score is recalculated', enabled: true },
                        { label: 'Tier changes', desc: 'When you advance to the next tier', enabled: true },
                        { label: 'Protocol announcements', desc: 'News from the Skillion team', enabled: false },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/70">{item.label}</p>
                                <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
                            </div>
                            <div className={`w-10 h-5 rounded-full border relative transition-colors ${item.enabled ? 'bg-[#00F0FF]/20 border-[#00F0FF]/30' : 'bg-white/5 border-white/10'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${item.enabled ? 'left-5 bg-[#00F0FF]' : 'left-0.5 bg-white/30'}`} />
                            </div>
                        </div>
                    ))}
                    <p className="text-xs text-white/20 pt-2 border-t border-white/5">Notification preferences — coming in next release</p>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-red-500/10">
                    <Shield className="w-4 h-4 text-red-400" />
                    <p className="text-sm font-medium text-red-400/80">Danger Zone</p>
                </div>
                <div className="px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-white/70">Delete Account</p>
                        <p className="text-xs text-white/30 mt-0.5">Permanently remove your identity and all data</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400/60 text-xs font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        Request Deletion
                    </button>
                </div>
            </div>
        </div>
    )
}
