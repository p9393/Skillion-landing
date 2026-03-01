'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCheck, ChevronRight, ArrowRight, BarChart3, MousePointer2, HardDrive, Sparkles } from 'lucide-react';

const STEPS = [
    {
        icon: MousePointer2,
        step: '1',
        title: 'Export from MT4 / MT5',
        desc: 'In MetaTrader: Account History tab → right-click → "Save as Report" → HTML',
        detail: 'Funziona con qualsiasi broker e qualsiasi conto (MT4 e MT5)',
    },
    {
        icon: Upload,
        step: '2',
        title: 'Upload here',
        desc: 'Drag & drop or click to select your HTML report file',
        detail: 'Nessun limite minimo di trade. Il file non viene mai condiviso.',
    },
    {
        icon: BarChart3,
        step: '3',
        title: 'Get your SDI Score',
        desc: 'Your Skillion Discipline Index is calculated instantly',
        detail: '7 dimensioni analizzate: Sharpe, Sortino, Max Drawdown, Win Rate e altro',
    },
];

type State = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export default function ConnectPage() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [state, setState] = useState<State>('idle');
    const [result, setResult] = useState<{ sdi: number; tier: string; trades: number } | null>(null);
    const [errMsg, setErrMsg] = useState('');
    const [progress, setProgress] = useState(0);

    const upload = useCallback(async (file: File) => {
        if (!file) return;
        // Accept HTML and HTM only
        if (!file.name.match(/\.(html?|htm)$/i)) {
            setErrMsg('Please upload an HTML file exported from MetaTrader (Account History → Save as Report).');
            setState('error');
            return;
        }

        setState('uploading');
        setProgress(10);

        const form = new FormData();
        form.append('file', file);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(p => Math.min(p + 15, 85));
            }, 300);

            const res = await fetch('/api/upload/statement', { method: 'POST', body: form });
            clearInterval(progressInterval);
            setProgress(100);

            const data = await res.json();

            if (!res.ok || !data.success) {
                setErrMsg(data.message || data.error || 'Upload failed. Please try again.');
                setState('error');
                return;
            }

            setResult({ sdi: Math.round(data.sdi), tier: data.tier, trades: data.trades });
            setState('success');

            // Auto-redirect to score page after 2.5s
            setTimeout(() => router.push('/dashboard/score'), 2500);

        } catch {
            setErrMsg('Network error. Please check your connection and try again.');
            setState('error');
        }
    }, [router]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setState('idle');
        const file = e.dataTransfer.files[0];
        if (file) upload(file);
    }, [upload]);

    const reset = () => { setState('idle'); setErrMsg(''); setProgress(0); setResult(null); };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto space-y-10 pb-16">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide mb-1">Connect your trading account</h2>
                <p className="text-white/40 text-sm">Export your history from MetaTrader in 10 seconds, upload it here.</p>
            </div>

            {/* 3-step visual guide */}
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-0">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.step} className="flex sm:flex-col flex-1 items-start sm:items-center relative">
                            <div className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-3 p-4 sm:p-5 sm:text-center flex-1 rounded-2xl border border-white/5 bg-[#0d1220]/60 sm:mx-1 hover:border-[#00F0FF]/10 transition-colors">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-[#00F0FF]" />
                                </div>
                                <div className="flex-1 sm:flex-none">
                                    <p className="text-xs uppercase tracking-widest text-[#00F0FF]/60 font-semibold mb-0.5">Step {s.step}</p>
                                    <p className="text-sm font-medium text-white/80 mb-1">{s.title}</p>
                                    <p className="text-xs text-white/35 leading-relaxed hidden sm:block">{s.desc}</p>
                                </div>
                            </div>
                            {i < STEPS.length - 1 && (
                                <ChevronRight className="hidden sm:block absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 z-10" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Upload Zone */}
            {(state === 'idle' || state === 'dragging') && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setState('dragging'); }}
                    onDragLeave={() => setState('idle')}
                    onDrop={onDrop}
                    className={`
                        relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 p-12 text-center
                        ${state === 'dragging'
                            ? 'border-[#00F0FF]/60 bg-[#00F0FF]/5 scale-[1.01]'
                            : 'border-white/10 bg-[#0d1220]/40 hover:border-[#00F0FF]/30 hover:bg-[#00F0FF]/5'}
                    `}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".html,.htm"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
                    />
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                            <HardDrive className="w-8 h-8 text-[#00F0FF]" />
                        </div>
                        <div>
                            <p className="text-lg font-light text-white mb-1">
                                {state === 'dragging' ? 'Drop your file here' : 'Drop your MT4/MT5 report here'}
                            </p>
                            <p className="text-sm text-white/40">or click to browse — accepts HTML files only</p>
                        </div>
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium">
                            <Upload className="w-4 h-4" /> Select File
                        </div>
                    </div>
                </div>
            )}

            {/* Uploading state */}
            {state === 'uploading' && (
                <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 p-10 text-center space-y-5">
                    <div className="w-14 h-14 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mx-auto animate-pulse">
                        <Sparkles className="w-7 h-7 text-[#00F0FF]" />
                    </div>
                    <div>
                        <p className="text-white font-medium mb-1">Analyzing your trades…</p>
                        <p className="text-white/40 text-sm">Parsing history and calculating your SDI Score</p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Success state */}
            {state === 'success' && result && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center space-y-5">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                        <FileCheck className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-emerald-400 font-medium mb-1">✓ {result.trades} trades imported</p>
                        <p className="text-4xl font-light text-white mt-3">{result.sdi} <span className="text-white/30 text-xl">/1000</span></p>
                        <p className="text-white/50 text-sm mt-1 capitalize">Tier: <strong className="text-white/70">{result.tier}</strong></p>
                    </div>
                    <p className="text-white/30 text-xs animate-pulse">Redirecting to your full score…</p>
                    <button onClick={() => router.push('/dashboard/score')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                        View Full Score <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error state */}
            {state === 'error' && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
                    <p className="text-red-400 font-medium">Upload failed</p>
                    <p className="text-white/40 text-sm">{errMsg}</p>
                    <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors">
                        Try Again
                    </button>
                </div>
            )}

            {/* MT4 Export guide */}
            {state === 'idle' && (
                <div className="rounded-2xl border border-white/5 bg-[#070B14]/60 p-5">
                    <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-3">How to export from MetaTrader</p>
                    <ol className="space-y-2">
                        {[
                            'Open MetaTrader 4 or 5',
                            'Click the "Account History" tab at the bottom',
                            'Right-click anywhere → "All History"',
                            'Right-click again → "Save as Report"',
                            'Save as HTML → upload the file above',
                        ].map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white/40">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/30 mt-0.5">{i + 1}</span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
