'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCheck, ChevronRight, ArrowRight, BarChart3, MousePointer2, Brain, AlertTriangle, CheckCircle2, HardDrive, Loader2 } from 'lucide-react';

const STEPS = [
    { icon: MousePointer2, step: '1', title: 'Esporta da MT4 / MT5', desc: 'Account History → tasto destro → "All History" → "Salva come Report" (HTML)' },
    { icon: Upload, step: '2', title: 'Carica qui', desc: 'Trascina o clicca il pulsante per selezionare il file HTML' },
    { icon: BarChart3, step: '3', title: 'SDI Score certificato', desc: 'Aurion analizza tutti i parametri e certifica il tuo punteggio' },
];

type Stage = 'idle' | 'dragging' | 'parsing' | 'aurion' | 'success' | 'error' | 'insufficient';

interface UploadResult {
    sdi: number;
    tier: string;
    trades: number;
    tradingDays: number;
    aurion: { summary: string; tier_comment: string; strengths: string[]; flags: string[]; confidence: number };
    warnings: string[];
    metrics: { sharpe: number; sortino: number; maxDrawdown: number; winRate: number; profitFactor: number; netProfit: number };
}

interface InsufficientResult {
    message: string;
    actualTrades: number;
    actualDays: number;
    minTradesRequired: number;
    minDaysRequired: number;
}

export default function ConnectPage() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [stage, setStage] = useState<Stage>('idle');
    const [result, setResult] = useState<UploadResult | null>(null);
    const [insuff, setInsuff] = useState<InsufficientResult | null>(null);
    const [errMsg, setErrMsg] = useState('');

    const stageLabel: Record<Stage, string> = {
        idle: '',
        dragging: '',
        parsing: 'Analisi dello statement in corso…',
        aurion: 'Aurion sta analizzando il profilo comportamentale…',
        success: '',
        error: '',
        insufficient: '',
    };

    const upload = useCallback(async (file: File) => {
        if (!file.name.match(/\.(html?|htm)$/i)) {
            setErrMsg('Carica un file HTML esportato da MetaTrader (Account History → Salva come Report).');
            setStage('error');
            return;
        }

        setStage('parsing');
        const form = new FormData();
        form.append('file', file);

        // Simulate Aurion phase after 1.5s
        const aurionTimer = setTimeout(() => setStage('aurion'), 1500);

        try {
            const res = await fetch('/api/upload/statement', { method: 'POST', body: form });
            clearTimeout(aurionTimer);
            const data = await res.json();

            if (res.status === 422 && data.validation_status === 'insufficient_data') {
                setInsuff({
                    message: data.message,
                    actualTrades: data.actualTrades,
                    actualDays: data.actualDays,
                    minTradesRequired: data.minTradesRequired,
                    minDaysRequired: data.minDaysRequired,
                });
                setStage('insufficient');
                return;
            }

            if (!res.ok || !data.success) {
                setErrMsg(data.message || data.error || 'Upload fallito. Riprova.');
                setStage('error');
                return;
            }

            setResult(data as UploadResult);
            setStage('success');

        } catch {
            clearTimeout(aurionTimer);
            setErrMsg('Errore di rete. Verifica la connessione e riprova.');
            setStage('error');
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setStage('idle');
        const file = e.dataTransfer.files[0];
        if (file) upload(file);
    }, [upload]);

    const reset = () => { setStage('idle'); setErrMsg(''); setResult(null); setInsuff(null); };
    const isLoading = stage === 'parsing' || stage === 'aurion';

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-16">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide mb-1">Connetti il tuo conto trading</h2>
                <p className="text-white/40 text-sm">Esporta lo storico da MetaTrader, caricalo qui. Aurion certifica il tuo SDI Score.</p>
            </div>

            {/* 3-step guide */}
            <div className="grid grid-cols-3 gap-2">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.step} className="relative flex flex-col items-center text-center p-4 rounded-xl border border-white/5 bg-[#0d1220]/60">
                            <div className="w-9 h-9 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mb-2">
                                <Icon className="w-4 h-4 text-[#00F0FF]" />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-[#00F0FF]/50 font-semibold mb-0.5">Step {s.step}</p>
                            <p className="text-xs font-medium text-white/70 mb-1">{s.title}</p>
                            <p className="text-[10px] text-white/25 leading-relaxed hidden sm:block">{s.desc}</p>
                            {i < STEPS.length - 1 && (
                                <ChevronRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 z-10 hidden sm:block" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Drop Zone */}
            {(stage === 'idle' || stage === 'dragging') && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setStage('dragging'); }}
                    onDragLeave={() => setStage('idle')}
                    onDrop={onDrop}
                    className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 p-14 text-center
                        ${stage === 'dragging'
                            ? 'border-[#00F0FF]/70 bg-[#00F0FF]/8 scale-[1.01]'
                            : 'border-white/10 bg-[#0d1220]/30 hover:border-[#00F0FF]/30 hover:bg-[#00F0FF]/5'}`}
                >
                    <input ref={inputRef} type="file" accept=".html,.htm" className="hidden" aria-label="Upload MT4 statement"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
                            <HardDrive className="w-8 h-8 text-[#00F0FF]" />
                        </div>
                        <div>
                            <p className="text-lg font-light text-white mb-1">
                                {stage === 'dragging' ? 'Rilascia il file qui' : 'Trascina il report MT4/MT5 qui'}
                            </p>
                            <p className="text-sm text-white/30">oppure clicca per scegliere — solo file HTML</p>
                        </div>
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium">
                            <Upload className="w-4 h-4" /> Seleziona file
                        </span>
                    </div>
                </div>
            )}

            {/* Loading / Aurion state */}
            {isLoading && (
                <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 p-10 text-center space-y-5">
                    <div className="w-14 h-14 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mx-auto">
                        {stage === 'aurion'
                            ? <Brain className="w-7 h-7 text-[#00F0FF] animate-pulse" />
                            : <Loader2 className="w-7 h-7 text-[#00F0FF] animate-spin" />
                        }
                    </div>
                    <div>
                        <p className="text-white font-medium mb-1">{stageLabel[stage]}</p>
                        <p className="text-white/30 text-sm">
                            {stage === 'aurion'
                                ? 'Calcolo Sharpe, Sortino, Max Drawdown, Z-Score, Profit Factor…'
                                : 'Parsing trade history e calcolo metriche…'}
                        </p>
                    </div>
                    {stage === 'aurion' && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-bounce [animation-delay:0ms]" />
                            <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-bounce [animation-delay:150ms]" />
                            <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-bounce [animation-delay:300ms]" />
                        </div>
                    )}
                </div>
            )}

            {/* Insufficient data */}
            {stage === 'insufficient' && insuff && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 space-y-5">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <p className="text-amber-400 font-medium">Dati insufficienti per il calcolo SDI</p>
                    </div>
                    <p className="text-white/50 text-sm">{insuff.message}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/30 text-xs mb-1">Trade trovati</p>
                            <p className="text-white font-medium">{insuff.actualTrades} <span className="text-white/30 font-normal">/ {insuff.minTradesRequired} richiesti</span></p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/30 text-xs mb-1">Giorni coperti</p>
                            <p className="text-white font-medium">{insuff.actualDays} <span className="text-white/30 font-normal">/ {insuff.minDaysRequired} richiesti</span></p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-[#0d1220]/60 p-4">
                        <p className="text-xs text-white/40 leading-relaxed">
                            In MT4: tab <strong className="text-white/60">Storico Operazioni</strong> → tasto destro → <strong className="text-white/60">All History</strong> (per caricare tutto lo storico), poi → <strong className="text-white/60">Salva come Report</strong>
                        </p>
                    </div>
                    <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors">
                        Riprova con lo storico completo
                    </button>
                </div>
            )}

            {/* Success */}
            {stage === 'success' && result && (
                <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1220]/60 p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                            <FileCheck className="w-7 h-7 text-emerald-400" />
                        </div>
                        <p className="text-emerald-400 font-medium">{result.trades} trade importati · {result.tradingDays} giorni di trading</p>
                        <p className="text-6xl font-thin text-white">{result.sdi} <span className="text-white/30 text-xl">/1000</span></p>
                        <p className="text-white/40 text-sm capitalize">Tier: <strong className="text-white/60">{result.tier}</strong></p>
                    </div>

                    {/* Quick metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {[
                            { l: 'Win Rate', v: `${result.metrics?.winRate ?? 0}%` },
                            { l: 'Profit Factor', v: result.metrics?.profitFactor?.toFixed(2) ?? '-' },
                            { l: 'Max DD', v: `${result.metrics?.maxDrawdown?.toFixed(1) ?? '-'}%` },
                        ].map(m => (
                            <div key={m.l} className="bg-white/5 rounded-lg p-2">
                                <p className="text-white/30 mb-0.5">{m.l}</p>
                                <p className="text-white/80 font-medium">{m.v}</p>
                            </div>
                        ))}
                    </div>

                    {/* Aurion mini-preview */}
                    {result.aurion?.summary && (
                        <div className="rounded-xl border border-[#00F0FF]/10 bg-[#00F0FF]/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-3.5 h-3.5 text-[#00F0FF]" />
                                <span className="text-xs text-[#00F0FF] font-medium">Aurion · Confidence {result.aurion.confidence}%</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{result.aurion.summary}</p>
                        </div>
                    )}

                    {result.warnings?.length > 0 && (
                        <div className="space-y-1">
                            {result.warnings.map((w, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-300/60">{w}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-center text-white/20 text-xs animate-pulse">Reindirizzamento al punteggio completo…</p>
                    <button onClick={() => router.push('/dashboard/score')} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                        Vedi SDI Score completo <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error */}
            {stage === 'error' && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
                    <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                    <p className="text-red-400 font-medium">Upload fallito</p>
                    <p className="text-white/40 text-sm max-w-sm mx-auto">{errMsg}</p>
                    <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors">
                        Riprova
                    </button>
                </div>
            )}

            {/* MT4 guide (always visible when idle) */}
            {(stage === 'idle' || stage === 'dragging') && (
                <div className="rounded-xl border border-white/5 bg-[#070B14]/60 p-5">
                    <p className="text-xs uppercase tracking-widest text-white/20 font-semibold mb-3">Come esportare da MetaTrader</p>
                    <ol className="space-y-2.5">
                        {[
                            'Apri MetaTrader 4 o 5',
                            'Clicca il tab "Storico Operazioni" (in basso)',
                            'Tasto destro → "All History" (carica tutto lo storico)',
                            'Tasto destro di nuovo → "Salva come Report"',
                            'Salva come HTML → carica il file qui sopra',
                        ].map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white/35">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/25 mt-0.5">{i + 1}</span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
