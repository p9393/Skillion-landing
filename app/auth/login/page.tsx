'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
        const [tab, setTab] = useState('login')
        const [email, setEmail] = useState('')
        const [password, setPassword] = useState('')
        const [error, setError] = useState(null)
        const [success, setSuccess] = useState(null)
        const [loading, setLoading] = useState(false)
        const router = useRouter()
        const supabase = createClient()

    const handleAuth = async (e) => {
                e.preventDefault(); setError(null); setSuccess(null); setLoading(true)
                const { error } = tab === 'login' 
                    ? await supabase.auth.signInWithPassword({ email, password })
                                : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } })

                if (error) setError(error.message)
                else if (tab === 'login') { router.push('/dashboard'); router.refresh() }
                else setSuccess('Check your email to verify your account.')
                setLoading(false)
    }

    return (
                <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center text-white px-4">
                            <div className="max-w-md w-full bg-[#0D1322] p-8 rounded-2xl border border-white/5 shadow-2xl">
                                            <div className="text-center mb-6">
                                                                <h2 className="text-3xl font-light tracking-wide">Skillion Access</h2>h2>
                                div>div>
                                            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 mb-6">
                                                                <button onClick={() => setTab('login')} className={`flex-1 py-2 rounded-md ${tab === 'login' ? 'bg-white/10' : ''}`}>Log In</button>button>
                                                                <button onClick={() => setTab('signup')} className={`flex-1 py-2 rounded-md ${tab === 'signup' ? 'bg-white/10' : ''}`}>Sign Up</button>button>
                                            </div>div>
                                            <form className="space-y-5" onSubmit={handleAuth}>
                                                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3" placeholder="Email" required />
                                                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3" placeholder="Password" minLength={8} required />
                                                {error && <div className="text-red-400 text-sm">{error}</div>div>}
                                                {success && <div className="text-emerald-400 text-sm">{success}</div>div>}
                                                                <button type="submit" disabled={loading} className="w-full bg-white/10 py-3 rounded-lg">{loading ? 'Loading...' : (tab === 'login' ? 'Log In' : 'Sign Up')}</button>button>
                                    form>
                                            </form>div >
                                    div>div >
                            </div>div >
                        )
                    }
                    />
                            </div>div>
                </div>div>
            )
}
</div>
