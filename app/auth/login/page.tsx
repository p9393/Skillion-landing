'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(error.message)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
        setLoading(false)
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
        } else {
            setError('Check your email to verify your account.') // using error state to show success message simply
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center text-white px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7000FF]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full bg-[#0D1322]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/5 relative z-10 shadow-2xl">
                <h2 className="text-3xl font-light mb-8 text-center tracking-wide">
                    <span className="text-white">Skillion</span>{' '}
                    <span className="text-white/40">Access</span>
                </h2>

                <form className="space-y-5">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-medium">Identity</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                            placeholder="you@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-medium">Passphrase</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className={`text-sm p-3 rounded-lg border ${error.includes('Check') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={handleSignIn}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-[#00F0FF]/10 to-[#7000FF]/10 hover:from-[#00F0FF]/25 hover:to-[#7000FF]/25 border border-[#00F0FF]/20 transition-all text-white font-medium py-3 px-4 rounded-lg"
                        >
                            Log In
                        </button>
                        <button
                            onClick={handleSignUp}
                            disabled={loading}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white font-medium py-3 px-4 rounded-lg"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
