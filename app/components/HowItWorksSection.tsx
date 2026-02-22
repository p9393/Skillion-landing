"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
    {
        number: "01",
        title: "Layer 1: Data Connection",
        subtitle: "Verified data only. Zero custody.",
        description:
            "Skillion connects to external platforms in read-only mode to extract verified historical and live performance data.",
        detail: "No manual reputation. Only verified data.",
        items: [
            "CeFi (Binance, Bybit via API)",
            "DeFi (Wallet EVM signatures)",
            "TradFi (Brokers, MT4/MT5 statements)",
            "Non-custodial by design",
        ],
        accent: "from-sky-500 to-indigo-500",
        bg: "bg-sky-500/[0.04]",
        border: "border-sky-500/15",
        glow: "rgba(14,165,233,0.08)",
    },
    {
        number: "02",
        title: "Layer 2: Score Engine",
        subtitle: "The Mathematical Core.",
        description:
            "Raw data is processed to generate the Skillion Score (0-1000) and stability metrics. The system rewards long-term discipline over short-term PnL.",
        detail: "Rendimento senza disciplina = rumore.",
        items: [
            "Sharpe & Sortino evaluation",
            "Z-Score distribution coherence",
            "Max Drawdown & Duration",
            "Leverage behavior analysis",
        ],
        accent: "from-indigo-500 to-violet-500",
        bg: "bg-indigo-500/[0.04]",
        border: "border-indigo-500/15",
        glow: "rgba(99,102,241,0.09)",
    },
    {
        number: "03",
        title: "Layer 3: Aurion",
        subtitle: "The Intelligence Layer.",
        description:
            "Aurion interprets behavioral patterns, highlighting deviations and progressions. It acts as the mathematical conscience of the system.",
        detail: "Non fa trading. Non dà segnali.",
        items: [
            "Behavioral interpretation",
            "Coherence analysis",
            "Deviation alerts",
            "Progression monitoring",
        ],
        accent: "from-violet-500 to-purple-500",
        bg: "bg-violet-500/[0.04]",
        border: "border-violet-500/15",
        glow: "rgba(168,85,247,0.09)",
    },
    {
        number: "04",
        title: "Layer 4: Certification",
        subtitle: "Soulbound Reputation.",
        description:
            "Sustained discipline is minted into digital certifications. These acts as immutable proof of financial stability.",
        detail: "Non vendibile. Revocabile in caso di frode.",
        items: [
            "Soulbound NFT issuance",
            "3, 6, and 12-month epochs",
            "On-chain notarized hashes",
            "Verifiable via unique QR",
        ],
        accent: "from-purple-500 to-fuchsia-500",
        bg: "bg-purple-500/[0.04]",
        border: "border-purple-500/15",
        glow: "rgba(217,70,239,0.09)",
    },
    {
        number: "05",
        title: "Layer 5: Ecosystem",
        subtitle: "Where reputation becomes capital.",
        description:
            "Once the standard is established, the ecosystem expands to grant real financial utility to those with verified high discipline scores.",
        detail: "Prima reputazione stabile, poi capitale.",
        items: [
            "Meritocratic Capital Program",
            "Utility Token (SKL) integration",
            "Ecosystem Governance",
            "Partner API access",
        ],
        accent: "from-fuchsia-500 to-rose-500",
        bg: "bg-fuchsia-500/[0.04]",
        border: "border-fuchsia-500/15",
        glow: "rgba(244,63,94,0.09)",
    },
];

export default function HowItWorksSection() {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.06 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section id="system" ref={ref} className="mx-auto max-w-6xl px-6 py-14">
            {/* Header */}
            <div
                className="mb-8 text-center transition-all duration-700"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)" }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">How It Works</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
                    From Data to{" "}
                    <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Verified Reputation
                    </span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-white/45 leading-relaxed">
                    Three structured layers transform raw trading data into a measurable, portable financial reputation.
                </p>
            </div>

            {/* Step cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {steps.map((s, i) => (
                    <div
                        key={s.title}
                        className={`relative flex flex-col rounded-2xl border p-8 backdrop-blur-xl transition-all duration-700 ${s.bg} ${s.border}`}
                        style={{
                            transitionDelay: `${i * 120}ms`,
                            opacity: visible ? 1 : 0,
                            transform: visible ? "none" : "translateY(28px)",
                            boxShadow: visible ? `0 0 48px ${s.glow}` : "none",
                        }}
                    >
                        {/* Step number */}
                        <div
                            className={`mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} text-sm font-bold text-white shadow-md`}
                        >
                            {s.number}
                        </div>

                        {/* Title */}
                        <h3
                            className={`mb-1 bg-gradient-to-r ${s.accent} bg-clip-text text-xl font-semibold text-transparent`}
                        >
                            {s.title}
                        </h3>
                        <p className="mb-4 text-xs uppercase tracking-widest text-white/30">{s.subtitle}</p>

                        {/* Description */}
                        <p className="mb-5 text-sm leading-relaxed text-white/55">{s.description}</p>

                        {/* Items */}
                        <ul className="mb-5 space-y-2.5">
                            {s.items.map((item) => (
                                <li key={item} className="flex items-start gap-2.5">
                                    <div
                                        className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br ${s.accent}`}
                                    />
                                    <span className="text-xs text-white/45 leading-snug">{item}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Detail footer */}
                        <div className="mt-auto rounded-xl border border-white/6 bg-white/[0.025] px-4 py-3">
                            <p className="text-xs text-white/35 italic">{s.detail}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
