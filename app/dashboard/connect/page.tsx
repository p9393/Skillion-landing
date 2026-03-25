'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload, FileCheck, ChevronRight, ArrowRight, BarChart3,
    MousePointer2, Brain, AlertTriangle, CheckCircle2,
    HardDrive, Loader2, Wallet, Key, Link as LinkIcon,
    Zap, Globe, Shield, Trash2, Plus, Check, X
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type Tab = 'mt4' | 'exchange' | 'wallet';

const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'mt4', label: 'MT4 / MT5', icon: Upload },
    { id: 'exchange', label: 'Exchange API', icon: Key, badge: 'CeFi' },
    { id: 'wallet', label: 'DeFi Wallet', icon: Wallet, badge: 'On-chain' },
];

const EXCHANGES = [
    { id: 'bybit', label: 'Bybit', color: '#F7A600' },
    { id: 'binance', label: 'Binance', color: '#F0B90B' },
] as const;

const CHAINS = [
    { id: 'ethereum', label: 'Ethereum', symbol: 'ETH' },
    { id: 'arbitrum', label: 'Arbitrum', symbol: 'ARB' },
    { id: 'base', label: 'Base', symbol: 'BASE' },
    { id: 'polygon', label: 'Polygon', symbol: 'MATIC' },
    { id: 'optimism', label: 'Optimism', symbol: 'OP' },
] as const;

type MT4Stage = 'idle' | 'dragging' | 'parsing' | 'aurion' | 'success' | 'error' | 'insufficient';

interface UploadResult {
    sdi: number; tier: string; trades: number; tradingDays: number;
    aurion: { summary: string; tier_comment: string; strengths: string[]; flags: string[]; confidence: number };
    warnings: string[];
    metrics: { sharpe: number; sortino: number; maxDrawdown: number; winRate: number; profitFactor: number; netProfit: number };
}

interface InsufficientResult {
    message: string; actualTrades: number; actualDays: number; minTradesRequired: number; minDaysRequired: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// MT4 Upload Tab
// ──────────────────────────────────────────────────────────────────────────────

function MT4Tab() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [stage, setStage] = useState<MT4Stage>('idle');
    const [result, setResult] = useState<UploadResult | null>(null);
    const [insuff, setInsuff] = useState<InsufficientResult | null>(null);
    const [errMsg, setErrMsg] = useState('');
    const isLoading = stage === 'parsing' || stage === 'aurion';

    const upload = useCallback(async (file: File) => {
        if (!file.name.match(/\.(html?|htm)$/i)) {
            setErrMsg('Carica un file HTML esportato da MetaTrader (Account History → Salva come Report).');
            setStage('error'); return;
        }
        setStage('parsing');
        const form = new FormData();
        form.append('file', file);
        const aurionTimer = setTimeout(() => setStage('aurion'), 1500);
        try {
            const res = await fetch('/api/upload/statement', { method: 'POST', body: form });
            clearTimeout(aurionTimer);
            const data = await res.json();
            if (res.status === 422 && data.validation_status === 'insufficient_data') {
                setInsuff(data); setStage('insufficient'); return;
            }
            if (!res.ok || !data.success) {
                setErrMsg(data.message || data.error || 'Upload fallito. Riprova.'); setStage('error'); return;
            }
            setResult(data as UploadResult); setStage('success');
        } catch {
            clearTimeout(aurionTimer);
            setErrMsg('Errore di rete. Verifica la connessione e riprova.'); setStage('error');
        }
    }, []);

    const reset = () => { setStage('idle'); setErrMsg(''); setResult(null); setInsuff(null); };

    const STEPS = [
        { icon: MousePointer2, step: '1', title: 'Esporta da MT4 / MT5', desc: 'Account History → tasto destro → "All History" → "Salva come Report" (HTML)' },
        { icon: Upload, step: '2', title: 'Carica qui', desc: 'Trascina o clicca il pulsante per selezionare il file HTML' },
        { icon: BarChart3, step: '3', title: 'SDI Score certificato', desc: 'Aurion analizza tutti i parametri e certifica il tuo punteggio' },
    ];

    return (
        <div className="space-y-6">
            {/* Step guide */}
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
                            {i < STEPS.length - 1 && <ChevronRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 z-10 hidden sm:block" />}
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
                    onDrop={(e) => { e.preventDefault(); setStage('idle'); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
                    className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 p-14 text-center
                        ${stage === 'dragging' ? 'border-[#00F0FF]/70 bg-[#00F0FF]/8 scale-[1.01]' : 'border-white/10 bg-[#0d1220]/30 hover:border-[#00F0FF]/30 hover:bg-[#00F0FF]/5'}`}
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

            {/* Loading */}
            {isLoading && (
                <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 p-10 text-center space-y-5">
                    <div className="w-14 h-14 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mx-auto">
                        {stage === 'aurion' ? <Brain className="w-7 h-7 text-[#00F0FF] animate-pulse" /> : <Loader2 className="w-7 h-7 text-[#00F0FF] animate-spin" />}
                    </div>
                    <div>
                        <p className="text-white font-medium mb-1">{stage === 'aurion' ? 'Aurion analizza il profilo comportamentale…' : 'Analisi statement in corso…'}</p>
                        <p className="text-white/30 text-sm">{stage === 'aurion' ? 'Calcolo Sharpe, Sortino, Max Drawdown, Z-Score…' : 'Parsing trade history e calcolo metriche…'}</p>
                    </div>
                    {stage === 'aurion' && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-[#00F0FF] animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                    )}
                </div>
            )}

            {/* Insufficient */}
            {stage === 'insufficient' && insuff && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 space-y-5">
                    <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-amber-400" /><p className="text-amber-400 font-medium">Dati insufficienti per il calcolo SDI</p></div>
                    <p className="text-white/50 text-sm">{insuff.message}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/5 rounded-lg p-3"><p className="text-white/30 text-xs mb-1">Trade trovati</p><p className="text-white font-medium">{insuff.actualTrades} <span className="text-white/30">/ {insuff.minTradesRequired} richiesti</span></p></div>
                        <div className="bg-white/5 rounded-lg p-3"><p className="text-white/30 text-xs mb-1">Giorni coperti</p><p className="text-white font-medium">{insuff.actualDays} <span className="text-white/30">/ {insuff.minDaysRequired} richiesti</span></p></div>
                    </div>
                    <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors">Riprova con lo storico completo</button>
                </div>
            )}

            {/* Success */}
            {stage === 'success' && result && (
                <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1220]/60 p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto"><FileCheck className="w-7 h-7 text-emerald-400" /></div>
                        <p className="text-emerald-400 font-medium">{result.trades} trade importati · {result.tradingDays} giorni</p>
                        <p className="text-6xl font-thin text-white">{result.sdi} <span className="text-white/30 text-xl">/1000</span></p>
                        <p className="text-white/40 text-sm capitalize">Tier: <strong className="text-white/60">{result.tier}</strong></p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {[{ l: 'Win Rate', v: `${result.metrics?.winRate ?? 0}%` }, { l: 'Profit Factor', v: result.metrics?.profitFactor?.toFixed(2) ?? '-' }, { l: 'Max DD', v: `${result.metrics?.maxDrawdown?.toFixed(1) ?? '-'}%` }].map(m => (
                            <div key={m.l} className="bg-white/5 rounded-lg p-2"><p className="text-white/30 mb-0.5">{m.l}</p><p className="text-white/80 font-medium">{m.v}</p></div>
                        ))}
                    </div>
                    {result.aurion?.summary && (
                        <div className="rounded-xl border border-[#00F0FF]/10 bg-[#00F0FF]/5 p-4">
                            <div className="flex items-center gap-2 mb-2"><Brain className="w-3.5 h-3.5 text-[#00F0FF]" /><span className="text-xs text-[#00F0FF] font-medium">Aurion · Confidence {result.aurion.confidence}%</span><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" /></div>
                            <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{result.aurion.summary}</p>
                        </div>
                    )}
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
                    <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors">Riprova</button>
                </div>
            )}

            {/* Guide */}
            {(stage === 'idle' || stage === 'dragging') && (
                <div className="rounded-xl border border-white/5 bg-[#070B14]/60 p-5">
                    <p className="text-xs uppercase tracking-widest text-white/20 font-semibold mb-3">Come esportare da MetaTrader</p>
                    <ol className="space-y-2.5">
                        {['Apri MetaTrader 4 o 5', 'Clicca il tab "Storico Operazioni" (in basso)', 'Tasto destro → "All History" (carica tutto lo storico)', 'Tasto destro di nuovo → "Salva come Report"', 'Salva come HTML → carica il file qui sopra'].map((s, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white/35">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/25 mt-0.5">{i + 1}</span>
                                {s}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Exchange API Tab (CeFi)
// ──────────────────────────────────────────────────────────────────────────────

function ExchangeTab() {
    const [exchange, setExchange] = useState<'bybit' | 'binance'>('bybit');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [label, setLabel] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const submit = async () => {
        if (!apiKey || !apiSecret) { setMsg('API Key e Secret sono obbligatori.'); setStatus('error'); return; }
        setStatus('loading');
        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exchange, apiKey, apiSecret, label: label || `${exchange} Account` }),
            });
            const data = await res.json();
            if (!res.ok) { setMsg(data.error || 'Errore durante la connessione.'); setStatus('error'); return; }
            setMsg(data.message || 'Exchange collegato correttamente!'); setStatus('success');
            setApiKey(''); setApiSecret(''); setLabel('');
        } catch {
            setMsg('Errore di rete. Riprova.'); setStatus('error');
        }
    };

    return (
        <div className="space-y-6 max-w-lg">
            <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4">
                <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-amber-400" /><p className="text-sm font-medium text-amber-300">Solo permessi di lettura</p></div>
                <p className="text-xs text-white/40 leading-relaxed">Usa API key con soli permessi <strong className="text-white/60">read-only</strong> sull'account. Non viene mai richiesto il ritiro di fondi. Le chiavi sono cifrate a riposo.</p>
            </div>

            {/* Exchange selector */}
            <div>
                <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-3">Exchange</p>
                <div className="flex gap-2">
                    {EXCHANGES.map(ex => (
                        <button key={ex.id} onClick={() => setExchange(ex.id)}
                            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${exchange === ex.id ? 'border-[#00F0FF]/40 bg-[#00F0FF]/10 text-white' : 'border-white/10 bg-white/[0.03] text-white/40 hover:text-white/60'}`}>
                            {ex.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Nome account (opzionale)</label>
                    <input value={label} onChange={e => setLabel(e.target.value)} placeholder={`${exchange} Main`}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00F0FF]/40 transition-colors" />
                </div>
                <div>
                    <label className="text-xs text-white/40 mb-1.5 block">API Key</label>
                    <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="••••••••••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00F0FF]/40 transition-colors font-mono" />
                </div>
                <div>
                    <label className="text-xs text-white/40 mb-1.5 block">API Secret</label>
                    <input value={apiSecret} onChange={e => setApiSecret(e.target.value)} type="password" placeholder="••••••••••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00F0FF]/40 transition-colors font-mono" />
                </div>
            </div>

            {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${status === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {status === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {msg}
                </div>
            )}

            <button onClick={submit} disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] font-medium text-sm hover:bg-[#00F0FF]/20 transition-colors disabled:opacity-50">
                {status === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifica credenziali…</> : <><LinkIcon className="w-4 h-4" /> Collega {exchange}</>}
            </button>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// DeFi Wallet Tab
// ──────────────────────────────────────────────────────────────────────────────

function WalletTab() {
    const [address, setAddress] = useState('');
    const [chain, setChain] = useState<'ethereum' | 'arbitrum' | 'base' | 'polygon' | 'optimism'>('ethereum');
    const [label, setLabel] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const isValidAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a);

    const submit = async () => {
        if (!isValidAddress(address)) { setMsg('Indirizzo EVM non valido. Deve iniziare con 0x e contenere 40 caratteri hex.'); setStatus('error'); return; }
        setStatus('loading');
        try {
            const res = await fetch('/api/accounts/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, chain, label: label || undefined }),
            });
            const data = await res.json();
            if (!res.ok) { setMsg(data.error || 'Errore durante la registrazione.'); setStatus('error'); return; }
            setMsg(data.message || 'Wallet registrato!'); setStatus('success');
            setAddress(''); setLabel('');
        } catch {
            setMsg('Errore di rete. Riprova.'); setStatus('error');
        }
    };

    return (
        <div className="space-y-6 max-w-lg">
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                <div className="flex items-center gap-2 mb-1"><Globe className="w-4 h-4 text-emerald-400" /><p className="text-sm font-medium text-emerald-300">Read-only — nessuna chiave privata</p></div>
                <p className="text-xs text-white/40 leading-relaxed">Inserisci solo l'indirizzo pubblico del wallet. Skillion non richiede mai chiavi private o seed phrase. Accesso in sola lettura alla blockchain pubblica.</p>
            </div>

            {/* Chain selector */}
            <div>
                <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-3">Blockchain</p>
                <div className="grid grid-cols-5 gap-2">
                    {CHAINS.map(c => (
                        <button key={c.id} onClick={() => setChain(c.id as typeof chain)}
                            className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${chain === c.id ? 'border-[#7000FF]/40 bg-[#7000FF]/15 text-white' : 'border-white/10 bg-white/[0.03] text-white/40 hover:text-white/60'}`}>
                            {c.symbol}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Indirizzo wallet</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="0x..."
                        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-mono
                            ${address && !isValidAddress(address) ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/10 focus:border-[#7000FF]/40'}`} />
                    {address && !isValidAddress(address) && <p className="text-[11px] text-red-400 mt-1">Formato non valido — deve essere un indirizzo EVM (0x...)</p>}
                </div>
                <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Nome (opzionale)</label>
                    <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Il mio wallet ETH"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#7000FF]/40 transition-colors" />
                </div>
            </div>

            {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${status === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {status === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {msg}
                </div>
            )}

            <button onClick={submit} disabled={status === 'loading' || !isValidAddress(address)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#7000FF]/10 border border-[#7000FF]/20 text-[#7000FF] hover:text-white font-medium text-sm hover:bg-[#7000FF]/20 transition-colors disabled:opacity-40">
                {status === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrazione…</> : <><Plus className="w-4 h-4" /> Registra wallet</>}
            </button>

            <div className="rounded-xl border border-white/5 bg-[#070B14]/60 p-4">
                <p className="text-xs uppercase tracking-widest text-white/20 font-semibold mb-2">Supporto chain</p>
                <div className="space-y-1">
                    {CHAINS.map(c => <div key={c.id} className="flex items-center gap-2 text-xs text-white/35"><Zap className="w-3 h-3 text-[#7000FF]/50" />{c.label} ({c.symbol})</div>)}
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Connect Page
// ──────────────────────────────────────────────────────────────────────────────

export default function ConnectPage() {
    const [activeTab, setActiveTab] = useState<Tab>('mt4');

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide mb-1">Connetti le tue fonti dati</h2>
                <p className="text-white/40 text-sm">Collega il tuo conto trading per ottenere il tuo SDI Score certificato.</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-2xl border border-white/8 bg-[#080c14]">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/8 text-white' : 'text-white/35 hover:text-white/60'}`}>
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tab.badge && (
                                <span className={`hidden md:inline text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${isActive ? 'border-[#00F0FF]/30 text-[#00F0FF] bg-[#00F0FF]/10' : 'border-white/10 text-white/25'}`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            {activeTab === 'mt4' && <MT4Tab />}
            {activeTab === 'exchange' && <ExchangeTab />}
            {activeTab === 'wallet' && <WalletTab />}
        </div>
    );
}
