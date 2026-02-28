'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Download, Terminal, Wifi, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
    {
        n: '01',
        title: 'Get Your Sync Token',
        desc: 'Copy your personal token below. It uniquely identifies your Skillion account.',
    },
    {
        n: '02',
        title: 'Download the EA File',
        desc: 'Download the Expert Advisor for your MetaTrader version (MT4 or MT5).',
    },
    {
        n: '03',
        title: 'Install in MetaTrader',
        desc: 'Copy the .mq4/.mq5 file to your MetaTrader Experts folder and restart the platform.',
    },
    {
        n: '04',
        title: 'Attach & Configure',
        desc: 'Drag the EA onto any chart. In the Inputs tab, paste your Sync Token. Enable WebRequests for skillion.finance in MT4/MT5 settings.',
    },
    {
        n: '05',
        title: 'First Sync',
        desc: 'The EA syncs your full trade history immediately and every 60 minutes. Your SDI Score will appear in your dashboard.',
    },
];

export default function MT4EAPage() {
    const [token, setToken] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [regen, setRegen] = useState(false);
    const [error, setError] = useState('');
    const lastSync: string | null = null;

    const fetchToken = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/mt4/token');
            const data = await res.json();
            if (data.token) setToken(data.token);
            else setError(data.error || 'Failed to load token.');
        } catch {
            setError('Network error. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchToken(); }, [fetchToken]);

    const copy = async () => {
        if (!token) return;
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const regenerate = async () => {
        if (!confirm('Regenerate your sync token? Your existing EA installations will need to be updated with the new token.')) return;
        setRegen(true);
        try {
            const res = await fetch('/api/mt4/token', { method: 'POST' });
            const data = await res.json();
            if (data.token) setToken(data.token);
        } finally {
            setRegen(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-10">

            {/* Header */}
            <div>
                <Link href="/dashboard/connect" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-6 transition-colors">
                    ← Back to Connect
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20">
                        <Terminal className="w-4 h-4 text-[#00F0FF]" />
                    </div>
                    <h2 className="text-2xl font-light text-white tracking-wide">MetaTrader Expert Advisor</h2>
                    <span className="text-[10px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-semibold">Free</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed max-w-xl">
                    Install the Skillion EA once in MetaTrader. It automatically syncs your complete trade history
                    and updates your SDI Score every hour — for free, forever.
                </p>
            </div>

            {/* Step-by-step */}
            <div className="space-y-4">
                {STEPS.map((step, i) => (
                    <div key={step.n} className="flex gap-4 rounded-2xl border border-white/5 bg-[#0d1220]/60 p-5">
                        <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center text-xs font-bold text-[#00F0FF]">
                                {step.n}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/90 mb-1">{step.title}</p>
                            <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>

                            {/* Step 1 — Token */}
                            {i === 0 && (
                                <div className="mt-4">
                                    {loading ? (
                                        <div className="h-11 rounded-xl bg-white/5 animate-pulse w-full" />
                                    ) : error ? (
                                        <div className="flex items-center gap-2 text-red-400 text-sm">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 rounded-xl bg-[#070B14] border border-white/10 px-4 py-2.5 font-mono text-xs text-[#00F0FF] overflow-hidden text-ellipsis whitespace-nowrap">
                                                {token}
                                            </div>
                                            <button
                                                onClick={copy}
                                                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-medium hover:bg-[#00F0FF]/20 transition-colors whitespace-nowrap"
                                            >
                                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                            <button
                                                onClick={regenerate}
                                                disabled={regen}
                                                className="p-2.5 rounded-xl border border-white/10 text-white/30 hover:text-white/60 transition-colors"
                                                title="Regenerate token"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${regen ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2 — Downloads */}
                            {i === 1 && (
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <a
                                        href="/ea/SkillionReporter.mq4"
                                        download
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> SkillionReporter.mq4 (MT4)
                                    </a>
                                    <a
                                        href="/ea/SkillionReporter.mq5"
                                        download
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> SkillionReporter.mq5 (MT5)
                                    </a>
                                </div>
                            )}

                            {/* Step 3 — install path */}
                            {i === 2 && (
                                <div className="mt-3 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-mono text-white/40 bg-white/5 rounded-lg px-3 py-1.5">
                                        <span className="text-[#00F0FF]/70">MT4:</span>
                                        <span>C:\Program Files\MetaTrader 4\MQL4\Experts\</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-white/40 bg-white/5 rounded-lg px-3 py-1.5">
                                        <span className="text-[#00F0FF]/70">MT5:</span>
                                        <span>C:\Program Files\MetaTrader 5\MQL5\Experts\</span>
                                    </div>
                                </div>
                            )}

                            {/* Step 4 — enable webrequests */}
                            {i === 3 && (
                                <div className="mt-3 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2 text-xs text-amber-400/80 leading-relaxed">
                                    <strong>Important:</strong> In MT4/MT5 go to <strong>Tools → Options → Expert Advisors</strong> → check <strong>&quot;Allow WebRequests for listed URL&quot;</strong> → add <code>https://skillion.finance</code>
                                </div>
                            )}

                            {/* Step 5 — go to score */}
                            {i === 4 && (
                                <Link
                                    href="/dashboard/score"
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#00F0FF] hover:underline"
                                >
                                    View Reputation Score <ChevronRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Live status indicator */}
            <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-white/20" />
                    <div>
                        <p className="text-sm text-white/60 font-medium">Connection Status</p>
                        <p className="text-xs text-white/30">{lastSync ? `Last sync: ${lastSync}` : 'Waiting for first sync from MT4/MT5...'}</p>
                    </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
        </div>
    );
}
