'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
        })
        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center text-white px-4 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7000FF]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full bg-[#0D1322]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/5 relative z-10 shadow-2xl">
                {success ? (
                    <div className="text-center space-y-5">
                        <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                                <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-light text-white tracking-wide mb-2">Check your inbox</h2>
                            <p className="text-sm text-white/45 leading-relaxed">
                                We sent a password reset link to <span className="text-white/70 font-medium">{email}</span>.
                                Follow the link to set a new password.
                            </p>
                        </div>
                        <Link
                            href="/auth/login"
                            className="inline-block px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 transition-colors"
                        >
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-light tracking-wide">
                                <span className="text-white">Reset</span>{' '}
                                <span className="text-white/40">Password</span>
                            </h2>
                            <p className="text-xs text-white/25 mt-1">Enter your email to receive a reset link</p>
                        </div>

                        <form onSubmit={handleReset} className="space-y-5">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-medium">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                                    placeholder="you@email.com"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-sm p-3 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#00F0FF]/10 to-[#7000FF]/10 hover:from-[#00F0FF]/25 hover:to-[#7000FF]/25 border border-[#00F0FF]/20 transition-all text-white font-medium py-3 px-4 rounded-lg disabled:opacity-60"
                            >
                                {loading ? 'Sending…' : 'Send Reset Link'}
                            </button>

                            <div className="text-center">
                                <Link
                                    href="/auth/login"
                                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                                >
                                    ← Back to Login
                                </Link>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
