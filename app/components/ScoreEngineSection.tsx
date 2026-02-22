"use client";

import { useEffect, useRef, useState } from "react";

const metrics = [
    { label: "Sharpe Ratio", description: "Risk-adjusted return relative to volatility", value: 78 },
    { label: "Sortino Ratio", description: "Downside deviation-weighted return measure", value: 72 },
    { label: "Z-Score Consistency", description: "Statistical deviation from expected behaviour", value: 85 },
    { label: "Maximum Drawdown", description: "Peak-to-trough decline measurement", value: 68 },
    { label: "Downside Deviation", description: "Volatility in negative return periods", value: 81 },
    { label: "Risk-Adjusted Return", description: "Net return weighted by risk exposure level", value: 74 },
    { label: "Behavioral Stability", description: "Consistency patterns across market conditions", value: 89 },
];

export default function ScoreEngineSection() {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.07 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section id="score-engine" ref={ref} className="mx-auto max-w-6xl px-6 py-14">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
                {/* Left — copy */}
                <div
                    className="transition-all duration-700"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-24px)" }}
                >
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">Score Engine</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                        A Reputation Engine Built on{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                            Financial Mathematics
                        </span>
                    </h2>

                    <p className="mt-5 text-base leading-relaxed text-white/50">
                        Skillion&apos;s core engine evaluates performance through risk-weighted and
                        consistency-based models validated against accepted financial methodology.
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-white/50">
                        The system measures long-term behavioral consistency and statistical stability
                        — not short-term performance or speculative outcomes.
                    </p>

                    <div className="mt-8 space-y-3">
                        {[
                            "Stability across sessions and volatility regimes",
                            "Statistical deviation from expected patterns",
                            "Downside volatility and risk exposure behavior",
                            "Drawdown duration and recovery characteristics",
                        ].map((point) => (
                            <div key={point} className="flex items-start gap-3">
                                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-400" />
                                <span className="text-sm text-white/50 leading-snug">{point}</span>
                            </div>
                        ))}
                    </div>

                    {/* Institutional tagline */}
                    <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.025] px-6 py-5">
                        <p className="text-xs uppercase tracking-widest text-white/25 mb-1">Core Principle</p>
                        <p className="text-sm text-white/60 leading-relaxed italic">
                            "The focus is long-term consistency over short-term gains. Discipline is the only variable that matters."
                        </p>
                    </div>
                </div>

                {/* Right — metric bars */}
                <div
                    className="transition-all duration-700 delay-200"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(24px)" }}
                >
                    <div className="rounded-2xl border border-white/8 bg-[#06080f]/80 p-7 backdrop-blur-xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-white/30">SDI Framework</p>
                                <p className="mt-0.5 text-sm font-medium text-white/70">Skillion Discipline Index</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/40">
                                7 Dimensions
                            </div>
                        </div>

                        <div className="space-y-5">
                            {metrics.map((m, i) => (
                                <div key={m.label}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-medium text-white/75">{m.label}</span>
                                            <p className="text-[10px] text-white/30 mt-0.5">{m.description}</p>
                                        </div>
                                        <span className="text-xs text-white/40">{m.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500 transition-all duration-1000"
                                            style={{
                                                width: visible ? `${m.value}%` : "0%",
                                                transitionDelay: `${300 + i * 100}ms`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="mt-6 text-center text-[10px] text-white/20">
                            Relative display only — not indicative of any specific user's score.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
