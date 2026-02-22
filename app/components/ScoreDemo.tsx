"use client";

import { useEffect, useRef, useState } from "react";

/* ── Score algorithm ────────────────────────────────────────────── */
function calcScore(params: {
    winRate: number;    // 0-100
    sharpe: number;     // 0-3
    maxDD: number;      // 0-50 (lower = better)
    rrRatio: number;    // 0.5-3
    consistency: number; // 0-100
}): number {
    const wr = (params.winRate / 100) * 220;
    const sh = Math.min(1, params.sharpe / 3) * 260;
    const dd = (1 - params.maxDD / 50) * 200;
    const rr = Math.min(1, (params.rrRatio - 0.5) / 2.5) * 160;
    const cons = (params.consistency / 100) * 160;
    return Math.round(Math.min(1000, Math.max(0, wr + sh + dd + rr + cons)));
}

function getTier(s: number): { label: string; color: string; rgb: string } {
    if (s >= 850) return { label: "Elite", color: "text-fuchsia-300", rgb: "200,110,255" };
    if (s >= 700) return { label: "Gold", color: "text-cyan-300", rgb: "34,211,238" };
    if (s >= 500) return { label: "Silver", color: "text-sky-300", rgb: "14,165,233" };
    return { label: "Bronze", color: "text-amber-300", rgb: "200,110,50" };
}

/* ── Animated score value ───────────────────────────────────────── */
function useAnimatedNumber(target: number) {
    const [display, setDisplay] = useState(target);
    const prev = useRef(target);
    useEffect(() => {
        const start = prev.current;
        const diff = target - start;
        if (diff === 0) return;
        const dur = 400;
        const t0 = performance.now();
        function tick(now: number) {
            const p = Math.min(1, (now - t0) / dur);
            const e = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(start + diff * e));
            if (p < 1) requestAnimationFrame(tick);
            else prev.current = target;
        }
        requestAnimationFrame(tick);
    }, [target]);
    return display;
}

/* ── Slider component ───────────────────────────────────────────── */
function Slider({
    label, value, min, max, step, format, onChange, color,
}: {
    label: string; value: number; min: number; max: number; step: number;
    format: (v: number) => string; onChange: (v: number) => void; color: string;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div>
            <div className="flex justify-between mb-2">
                <span className="text-xs text-white/55">{label}</span>
                <span className="text-xs font-mono font-semibold text-white/85">{format(value)}</span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-white/8">
                <div
                    className={`absolute left-0 h-full rounded-full bg-gradient-to-r ${color}`}
                    style={{ width: `${pct}%` }}
                />
                <input
                    type="range"
                    min={min} max={max} step={step} value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    style={{ margin: 0 }}
                />
                {/* Thumb */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-white/70 bg-[#080a12] shadow-lg pointer-events-none"
                    style={{ left: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ── Main ScoreDemo ─────────────────────────────────────────────── */
export default function ScoreDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const [vis, setVis] = useState(false);

    const [params, setParams] = useState({
        winRate: 62,
        sharpe: 1.5,
        maxDD: 12,
        rrRatio: 1.8,
        consistency: 70,
    });

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVis(true); },
            { threshold: 0.1 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    const rawScore = calcScore(params);
    const score = useAnimatedNumber(rawScore);
    const tier = getTier(score);

    const set = (key: keyof typeof params) => (v: number) =>
        setParams(p => ({ ...p, [key]: v }));

    return (
        <section ref={ref} className="mx-auto max-w-6xl px-6 py-24">
            {/* Header */}
            <div
                className="mb-14 max-w-2xl"
                style={{
                    opacity: vis ? 1 : 0,
                    transform: vis ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.7s ease, transform 0.7s ease",
                }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">Interactive Demo</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                    Calculate your{" "}
                    <span className="bg-gradient-to-r from-cyan-300 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                        potential score.
                    </span>
                </h2>
                <p className="mt-4 text-base text-white/50 leading-relaxed">
                    Adjust your trading metrics and see how Skillion would evaluate your performance — in real time.
                </p>
            </div>

            <div
                className="grid gap-8 md:grid-cols-2"
                style={{
                    opacity: vis ? 1 : 0,
                    transform: vis ? "translateY(0)" : "translateY(24px)",
                    transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
                }}
            >
                {/* Left — sliders */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-7 space-y-6 backdrop-blur">
                    <div className="text-xs uppercase tracking-widest text-white/30 mb-2">Your metrics</div>

                    <Slider label="Win Rate" value={params.winRate} min={10} max={90} step={1} format={v => `${v}%`} onChange={set("winRate")} color="from-indigo-400 to-blue-500" />
                    <Slider label="Sharpe Ratio" value={params.sharpe} min={0} max={3} step={0.1} format={v => v.toFixed(1)} onChange={set("sharpe")} color="from-sky-400 to-cyan-400" />
                    <Slider label="Max Drawdown" value={params.maxDD} min={1} max={50} step={0.5} format={v => `${v}%`} onChange={set("maxDD")} color="from-fuchsia-400 to-pink-500" />
                    <Slider label="Risk/Reward Ratio" value={params.rrRatio} min={0.5} max={3} step={0.1} format={v => `${v.toFixed(1)}x`} onChange={set("rrRatio")} color="from-violet-400 to-purple-500" />
                    <Slider label="Monthly Consistency" value={params.consistency} min={0} max={100} step={1} format={v => `${v}%`} onChange={set("consistency")} color="from-cyan-400 to-teal-400" />

                    <p className="text-[11px] text-white/25 pt-2 border-t border-white/6">
                        Scoring model uses 5-dimension weighted algorithm. Final score factors risk-adjusted returns.
                    </p>
                </div>

                {/* Right — score display */}
                <div className="flex flex-col gap-5">
                    {/* Main score card */}
                    <div
                        className="flex-1 rounded-2xl border p-8 flex flex-col justify-between backdrop-blur transition-all duration-500"
                        style={{
                            borderColor: `rgba(${tier.rgb},0.30)`,
                            background: `radial-gradient(circle at 50% 0%, rgba(${tier.rgb},0.07), rgba(5,6,10,0.95) 70%)`,
                            boxShadow: `0 0 50px -15px rgba(${tier.rgb},0.25)`,
                        }}
                    >
                        <div className="text-xs uppercase tracking-[0.22em] text-white/35">Skillion Score</div>

                        <div className="my-6 text-center">
                            <div
                                className="text-8xl font-bold tracking-tighter tabular-nums"
                                style={{ color: `rgb(${tier.rgb})`, textShadow: `0 0 40px rgba(${tier.rgb},0.4)` }}
                            >
                                {score}
                            </div>
                            <div className="mt-1 text-sm text-white/25">/1000</div>
                        </div>

                        {/* Tier badge */}
                        <div className="flex items-center justify-between">
                            <div
                                className={`text-lg font-bold ${tier.color} uppercase tracking-widest`}
                            >
                                {tier.label}
                            </div>
                            {/* Score ring indicator */}
                            <div className="relative h-14 w-14">
                                <svg viewBox="0 0 56 56" className="rotate-[-90deg]">
                                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                    <circle
                                        cx="28" cy="28" r="22" fill="none"
                                        stroke={`rgb(${tier.rgb})`} strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(score / 1000) * 138.23} 138.23`}
                                        style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.4s ease" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-mono text-white/50">{Math.round(score / 10)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tier progression */}
                    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Tier ladder</div>
                        <div className="flex gap-2">
                            {[
                                { label: "Bronze", min: 0, max: 499, col: "from-amber-400 to-orange-500" },
                                { label: "Silver", min: 500, max: 699, col: "from-sky-400 to-blue-500" },
                                { label: "Gold", min: 700, max: 849, col: "from-cyan-400 to-teal-400" },
                                { label: "Elite", min: 850, max: 1000, col: "from-fuchsia-400 to-pink-500" },
                            ].map(t => (
                                <div key={t.label} className="flex-1 text-center">
                                    <div
                                        className={`h-1 rounded-full mb-1.5 bg-gradient-to-r ${t.col}`}
                                        style={{ opacity: score >= t.min ? 1 : 0.18 }}
                                    />
                                    <div className={`text-[9px] uppercase tracking-wide ${score >= t.min ? "text-white/60" : "text-white/20"}`}>
                                        {t.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
