'use client'

import { useState, useEffect, useTransition } from 'react'
import { Link2, Trash2, RefreshCw, CheckCircle, AlertCircle, Clock, Plus, X, Shield, Eye, EyeOff } from 'lucide-react'

interface Account {
    id: string
    exchange: 'bybit' | 'binance'
    label: string
    status: 'pending' | 'active' | 'error' | 'revoked'
    last_sync_at: string | null
    error_msg: string | null
    created_at: string
}

const EXCHANGE_LOGOS: Record<string, string> = {
    bybit: '🟡',
    binance: '🟠',
}

const STATUS_CONFIG = {
    active: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', label: 'Active' },
    pending: { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', label: 'Pending' },
    error: { color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20', label: 'Error' },
    revoked: { color: 'text-white/30', bg: 'bg-white/5 border-white/10', label: 'Revoked' },
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // Form state
    const [exchange, setExchange] = useState<'bybit' | 'binance'>('bybit')
    const [label, setLabel] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [apiSecret, setApiSecret] = useState('')
    const [showSecret, setShowSecret] = useState(false)
    const [formError, setFormError] = useState('')
    const [formSuccess, setFormSuccess] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const loadAccounts = async () => {
        try {
            const res = await fetch('/api/accounts')
            const data = await res.json() as { accounts: Account[] }
            setAccounts(data.accounts ?? [])
        } catch {
            console.error('Failed to load accounts')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadAccounts() }, [])

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setFormError('')
        setFormSuccess('')

        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exchange, label, apiKey, apiSecret }),
            })
            const data = await res.json() as { error?: string; accountId?: string; message?: string }

            if (!res.ok) {
                setFormError(data.error ?? 'Connection failed')
                return
            }

            setFormSuccess(data.message ?? 'Account connected!')
            setShowForm(false)
            setApiKey(''); setApiSecret(''); setLabel('')

            // Auto-trigger first sync
            if (data.accountId) {
                await fetch('/api/ingestion/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId: data.accountId }),
                })
            }

            await loadAccounts()
        } finally {
            setSubmitting(false)
        }
    }

    const handleSync = async (accountId: string) => {
        setSyncing(accountId)
        try {
            await fetch('/api/ingestion/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId }),
            })
            // Poll for completion (simplified — show loading for 3s)
            setTimeout(() => { setSyncing(null); loadAccounts() }, 3000)
        } catch { setSyncing(null) }
    }

    const handleDisconnect = async (accountId: string) => {
        if (!confirm('Disconnect this account? Your trade history will be preserved.')) return
        startTransition(async () => {
            await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' })
            await loadAccounts()
        })
    }

    return (
        <div className="space-y-6 pb-16">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-light text-white tracking-wide">Connected Accounts</h2>
                    <p className="text-white/40 text-sm mt-1">Read-only API keys — Skillion never touches your funds</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setFormError(''); setFormSuccess('') }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium hover:bg-[#00F0FF]/20 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Connect Exchange
                </button>
            </div>

            {/* Security disclaimer */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                <Shield className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-indigo-200/60 leading-relaxed">
                    API keys are encrypted with AES-256-GCM and stored only on our servers.
                    Always use <strong className="text-indigo-200/80">read-only</strong> API keys with <strong className="text-indigo-200/80">no withdrawal permissions</strong>.
                    Skillion never executes trades or moves funds.
                </p>
            </div>

            {/* Connect Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1220] p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Connect Exchange</h3>
                            <button onClick={() => setShowForm(false)} className="p-1 text-white/40 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleConnect} className="space-y-4">
                            {/* Exchange selector */}
                            <div>
                                <label className="text-xs font-medium text-white/60 mb-2 block">Exchange</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['bybit', 'binance'] as const).map(ex => (
                                        <button
                                            key={ex}
                                            type="button"
                                            onClick={() => setExchange(ex)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${exchange === ex
                                                    ? 'border-[#00F0FF]/40 bg-[#00F0FF]/10 text-white'
                                                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                                                }`}
                                        >
                                            <span>{EXCHANGE_LOGOS[ex]}</span>
                                            <span className="capitalize">{ex}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Label */}
                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Account label</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder="e.g. Main Perps"
                                    required
                                    maxLength={50}
                                    className="w-full rounded-xl border border-white/10 bg-[#070B14] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#00F0FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/40 transition-colors"
                                />
                            </div>

                            {/* API Key */}
                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">API Key (read-only)</label>
                                <input
                                    type="text"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="Paste your read-only API key"
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-[#070B14] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#00F0FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/40 transition-colors font-mono"
                                />
                            </div>

                            {/* API Secret */}
                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">API Secret</label>
                                <div className="relative">
                                    <input
                                        type={showSecret ? 'text' : 'password'}
                                        value={apiSecret}
                                        onChange={e => setApiSecret(e.target.value)}
                                        placeholder="Paste your API secret"
                                        required
                                        className="w-full rounded-xl border border-white/10 bg-[#070B14] px-3 py-2.5 pr-10 text-sm text-white placeholder-white/20 focus:border-[#00F0FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/40 transition-colors font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                                    >
                                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {formError && (
                                <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-sm text-rose-400">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {formError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !apiKey || !apiSecret || !label}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] font-semibold text-sm hover:bg-[#00F0FF]/25 transition-colors disabled:opacity-40"
                            >
                                {submitting ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying credentials...</>
                                ) : (
                                    <><Link2 className="w-4 h-4" /> Connect Account</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Accounts List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-white/30 animate-spin" />
                </div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mx-auto mb-4">
                        <Link2 className="w-8 h-8 text-[#00F0FF]/60" />
                    </div>
                    <h3 className="text-xl font-light text-white mb-2">No exchanges connected</h3>
                    <p className="text-white/40 text-sm mb-6">Connect your Bybit or Binance account to start building your reputation score.</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium hover:bg-[#00F0FF]/20 transition-colors"
                    >
                        Connect your first exchange
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map(acc => {
                        const cfg = STATUS_CONFIG[acc.status]
                        return (
                            <div key={acc.id} className="rounded-2xl border border-white/8 bg-[#0d1220]/60 p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                                            {EXCHANGE_LOGOS[acc.exchange]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{acc.label}</p>
                                            <p className="text-xs text-white/40 capitalize">{acc.exchange}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.bg} ${cfg.color}`}>
                                            {acc.status === 'active' && <CheckCircle className="w-3 h-3" />}
                                            {acc.status === 'error' && <AlertCircle className="w-3 h-3" />}
                                            {acc.status === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
                                            {cfg.label}
                                        </span>

                                        {acc.status === 'active' && (
                                            <button
                                                onClick={() => handleSync(acc.id)}
                                                disabled={syncing === acc.id}
                                                title="Sync now"
                                                className="p-2 rounded-lg text-white/30 hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${syncing === acc.id ? 'animate-spin' : ''}`} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDisconnect(acc.id)}
                                            title="Disconnect"
                                            className="p-2 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {acc.last_sync_at && (
                                    <p className="mt-3 text-xs text-white/25">
                                        Last synced: {new Date(acc.last_sync_at).toLocaleString('en-GB')}
                                    </p>
                                )}
                                {acc.error_msg && (
                                    <p className="mt-2 text-xs text-rose-400/80 bg-rose-500/5 rounded-lg px-3 py-1.5">
                                        ⚠ {acc.error_msg}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Disclaimer */}
            <p className="text-[11px] text-white/20 text-center leading-relaxed pt-4">
                Skillion does not provide financial advice or manage funds.
                All analysis is for informational purposes only. Past performance does not guarantee future results.
            </p>
        </div>
    )
}
