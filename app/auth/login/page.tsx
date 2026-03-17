'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Tab = 'login' | 'signup'

export default function LoginPage() {
    const [tab, setTab] = useState<Tab>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const resetState = () => {
        setError(null)
        setSuccess(null)
    }

    const handleTabChange = (t: Tab) => {
        setTab(t)
        resetState()
    }

    const validatePassword = (pw: string): string | null => {
        if (pw.length < 8) return 'Password must be at least 8 characters.'
        return null
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        resetState()
        setLoading(true)
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
        resetState()
        const pwError = validatePassword(password)
        if (pwError) { setError(pwError); return }
        setLoading(true)
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
            setSuccess('Account created — check your email to verify your address and get access.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center text-white px-4 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7000FF]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full bg-[#0D1322]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/5 relative z-10 shadow-2xl">
                {/* Logo + Title */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-light tracking-wide">
                        <span className="text-white">Skillion</span>{' '}
                        <span className="text-white/40">Access</span>
                    </h2>
                    <p className="text-xs text-white/25 mt-1">Enter the protocol · Merit over capital</p>
                </div>

                {/* Tab switcher */}
                <div className="flex rounded-lg border border-white/8 bg-white/[0.03] p-1 mb-6">
                    <button
                        type="button"
                        onClick={() => handleTabChange('login')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                            tab === 'login'
                                ? 'bg-white/10 text-white'
                                : 'text-white/35 hover:text-white/60'
                        }`}
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('signup')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                            tab === 'signup'
                                ? 'bg-white/10 text-white'
                                : 'text-white/35 hover:text-white/60'
                        }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* LOGIN FORM */}
                {tab === 'login' && (
                    <form className="space-y-5" onSubmit={handleSignIn}>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-medium">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); resetState() }}
                                className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                                placeholder="you@email.com"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs uppercase tracking-widest text-white/40 font-medium">
                                    Password
                                </label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs text-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); resetState() }}
                                className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm p-3 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="text-sm p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#00F0FF]/10 to-[#7000FF]/10 hover:from-[#00F0FF]/25 hover:to-[#7000FF]/25 border border-[#00F0FF]/20 transition-all text-white font-medium py-3 px-4 rounded-lg disabled:opacity-60"
                        >
                            {loading ? 'Loading…' : 'Log In'}
                        </button>
                    </form>
                )}

                {/* SIGN UP FORM */}
                {tab === 'signup' && (
                    <form className="space-y-5" onSubmit={handleSignUp}>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-medium">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); resetState() }}
                                className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                                placeholder="you@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-medium">
                                Password
                                <span className="ml-2 text-white/20 normal-case tracking-normal font-normal">(min. 8 characters)</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); resetState() }}
                                className="w-full bg-[#1A2235]/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                                placeholder="••••••••"
                                minLength={8}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm p-3 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="text-sm p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white font-medium py-3 px-4 rounded-lg disabled:opacity-60"
                        >
                            {loading ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center text-xs text-white/20">
                    By accessing, you agree to the{' '}
                    <Link href="/terms" className="text-white/35 hover:text-white/60 transition-colors">Terms</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-white/35 hover:text-white/60 transition-colors">Privacy Policy</Link>
                </p>
            </div>
        </div>
    )
}
