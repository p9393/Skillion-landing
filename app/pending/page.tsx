'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Clock } from 'lucide-react'

export default function PendingPage() {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center text-white px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7000FF]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full bg-[#0D1322]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/5 relative z-10 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-[#1A2235] rounded-2xl flex items-center justify-center mx-auto border border-white/5 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
                    <Clock className="w-8 h-8 text-[#00F0FF]" />
                </div>

                <div>
                    <h2 className="text-2xl font-light mb-2 tracking-wide">
                        Account Pending
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                        Your identity has been registered, but full access to the Skillion platform requires manual activation by the protocol.
                    </p>
                </div>

                <div className="bg-[#1A2235]/50 border border-[#00F0FF]/10 rounded-xl p-4">
                    <p className="text-xs text-[#00F0FF]/80 uppercase tracking-widest font-medium mb-1">Status</p>
                    <p className="text-sm text-white/80">Awaiting Merit Review</p>
                </div>

                <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/80 font-medium py-3 px-4 rounded-lg"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
