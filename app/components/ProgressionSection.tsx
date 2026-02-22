"use client";

import { useEffect, useRef, useState } from "react";

const tiers = [
    {
        rank: "01",
        name: "Explorer",
        description: "Entry into the Skillion ecosystem. Behavioral baseline established. Performance data begins accumulation.",
        requirements: ["Verified account connection", "Minimum session history", "Score baseline computed"],
        accent: "from-slate-400 to-slate-300",
        borderColor: "border-slate-400/20",
        glowColor: "rgba(148,163,184,0.06)",
    },
    {
        rank: "02",
        name: "Builder",
        description: "Demonstrated consistency over time. Stability metrics above threshold. Discipline patterns confirmed.",
        requirements: ["Consistent SDI score", "Low drawdown profile", "Behavioral stability baseline"],
        accent: "from-sky-400 to-indigo-400",
        borderColor: "border-sky-400/20",
        glowColor: "rgba(56,189,248,0.07)",
    },
    {
        rank: "03",
        name: "Strategist",
        description: "Verified risk management over multiple market conditions. 3-Month sustained discipline certified.",
        requirements: ["Advanced metric thresholds met", "Multi-session pattern confirmed", "3-Month Soulbound NFT Minted"],
        accent: "from-indigo-400 to-violet-400",
        borderColor: "border-indigo-400/25",
        glowColor: "rgba(99,102,241,0.08)",
    },
    {
        rank: "04",
        name: "Architect",
        description: "Institutional-grade behavioral profile. Recognized consistency across volatility regimes. 6-Month discipline certified.",
        requirements: ["Elite-tier statistical performance", "Long-term behavioral record", "6-Month Soulbound NFT Minted"],
        accent: "from-violet-400 to-fuchsia-400",
        borderColor: "border-violet-400/25",
        glowColor: "rgba(139,92,246,0.09)",
    },
    {
        rank: "05",
        name: "Elite",
        description: "The highest measurable standard. A complete, verified reputation profile. 12-Month track record certified.",
        requirements: ["Sustained top-tier SDI score", "Extended consistency window", "12-Month Soulbound NFT Minted"],
        accent: "from-fuchsia-400 to-pink-400",
        borderColor: "border-fuchsia-400/30",
        glowColor: "rgba(232,121,249,0.10)",
    },
];

function TierCard({ tier, index, visible }: { tier: typeof tiers[0]; index: number; visible: boolean }) {
    return (
        <div
            className={`relative flex flex-col rounded-2xl border bg-[#06080f]/80 p-7 backdrop-blur-xl transition-all duration-700 ${tier.borderColor}`}
            style={{
                transitionDelay: `${index * 110}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(28px)",
                boxShadow: visible ? `0 0 48px ${tier.glowColor}` : "none",
            }}
        >
            {/* Tier number */}
            <div className="mb-4 flex items-center justify-between">
                <div
                    className={`h-8 w-8 rounded-lg bg-gradient-to-br ${tier.accent} flex items-center justify-center text-xs font-bold text-white/90 shadow-md`}
                >
                    {tier.rank}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/20">Tier {index + 1}/5</div>
            </div>

            {/* Name */}
            <div
                className={`mb-2 bg-gradient-to-r ${tier.accent} bg-clip-text text-xl font-semibold text-transparent`}
            >
                {tier.name}
            </div>

            {/* Description */}
            <p className="mb-5 text-sm leading-relaxed text-white/50">{tier.description}</p>

            {/* Requirements */}
            <div className="mt-auto space-y-2">
                {tier.requirements.map((r) => (
                    <div key={r} className="flex items-start gap-2.5">
                        <div
                            className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br ${tier.accent}`}
                        />
                        <span className="text-xs text-white/40 leading-snug">{r}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ProgressionSection() {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.05 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section id="progression" ref={ref} className="mx-auto max-w-6xl px-6 py-14">
            {/* Header */}
            <div
                className="mb-5 text-center transition-all duration-700"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)" }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Reputation Tiers</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
                    Merit-Based{" "}
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Progression
                    </span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-white/45 leading-relaxed">
                    Reputation tiers are earned through measurable discipline — never purchased.
                    The system recognizes consistency, not capital.
                </p>
            </div>

            {/* Disclaimer */}
            <div
                className="mb-10 text-center transition-all duration-700 delay-100"
                style={{ opacity: visible ? 1 : 0 }}
            >
                <div className="inline-block rounded-xl border border-white/8 bg-white/[0.02] p-4 text-xs text-white/40 max-w-2xl mx-auto">
                    <p className="font-semibold text-white/70 mb-2">Soulbound Certification (SBT)</p>
                    <p className="italic">
                        Tiers 3, 4, and 5 issue non-transferable Soulbound NFTs on-chain. These act as immutable proofs of financial discipline.
                        They cannot be bought or sold. They are revocable in case of fraudulent behavioral deviation.
                    </p>
                </div>
            </div>

            {/* Tier cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                {tiers.map((t, i) => (
                    <TierCard key={t.name} tier={t} index={i} visible={visible} />
                ))}
            </div>
        </section>
    );
}
