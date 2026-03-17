"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
    {
        value: "0",
        unit: "",
        suffix: "pay-to-win",
        description: "Reputation is earned, not bought. No premium badges, no vanity metrics.",
        accent: "from-cyan-400 to-sky-500",
        accentRGB: "34,211,238",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
        ),
    },
    {
        value: "5",
        unit: "",
        suffix: "verified metrics",
        description: "Risk Control, Stability, Profit Quality, Consistency, Drawdown Discipline.",
        accent: "from-indigo-400 to-violet-500",
        accentRGB: "99,102,241",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
    {
        value: "1000",
        unit: "",
        suffix: "score ceiling",
        description: "A precisely bounded score. Comparable, portable, and impossible to inflate.",
        accent: "from-fuchsia-400 to-pink-500",
        accentRGB: "236,72,153",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    },
    {
        value: "3",
        unit: "",
        suffix: "phase rollout",
        description: "Freemium → Certification → Capital Layer. Sustainable growth, no shortcuts.",
        accent: "from-emerald-400 to-teal-500",
        accentRGB: "52,211,153",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
            </svg>
        ),
    },
];

const pillars = [
    {
        label: "Merit-first",
        body: "Your score is built entirely from verified trading history. No social following, no capital size — only what you actually do in the market.",
        accent: "text-cyan-300",
    },
    {
        label: "Portability",
        body: "Your Skillion Score is yours. Export it, display it, use it as proof of track record with partners, allocators, or future employers.",
        accent: "text-indigo-300",
    },
    {
        label: "Progression",
        body: "The system is designed to reward consistency above all. A Bronze trader with stable discipline will outrank a volatile Gold in the long run.",
        accent: "text-fuchsia-300",
    },
];

export default function WhySkillion() {
    const ref = useRef<HTMLDivElement>(null);
    const [vis, setVis] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVis(true); },
            { threshold: 0.10 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section ref={ref} className="mx-auto max-w-6xl px-6 py-24">

            {/* Section header */}
            <div
                className="mb-16 text-center"
                style={{
                    opacity: vis ? 1 : 0,
                    transform: vis ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.7s ease, transform 0.7s ease",
                }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">Why Skillion</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                    Built on a simple{" "}
                    <span className="bg-gradient-to-r from-cyan-300 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                        conviction.
                    </span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-white/50 leading-relaxed">
                    Financial skill is real. It is measurable. And it should have economic consequence — not just personal satisfaction.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-14">
                {stats.map((s, i) => (
                    <div
                        key={s.suffix}
                        style={{
                            opacity: vis ? 1 : 0,
                            transform: vis ? "translateY(0)" : "translateY(24px)",
                            transition: `opacity 0.7s ease ${i * 100}ms, transform 0.7s ease ${i * 100}ms`,
                        }}
                    >
                        <StatCard {...s} />
                    </div>
                ))}
            </div>

            {/* Pillar cards — horizontal */}
            <div className="grid gap-5 md:grid-cols-3">
                {pillars.map((p, i) => (
                    <div
                        key={p.label}
                        className="rounded-2xl border border-white/6 bg-white/[0.025] p-7 hover:border-white/12 hover:bg-white/[0.04] transition-all duration-300"
                        style={{
                            opacity: vis ? 1 : 0,
                            transform: vis ? "translateY(0)" : "translateY(20px)",
                            transition: `opacity 0.7s ease ${300 + i * 100}ms, transform 0.7s ease ${300 + i * 100}ms`,
                        }}
                    >
                        <div className={`text-sm font-semibold uppercase tracking-wider ${p.accent} mb-3`}>
                            {p.label}
                        </div>
                        <p className="text-sm leading-relaxed text-white/55">{p.body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function StatCard({
    value, suffix, description, accent, accentRGB, icon,
}: typeof stats[0]) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative rounded-2xl border p-6 cursor-default overflow-hidden transition-all duration-300"
            style={{
                borderColor: hovered ? `rgba(${accentRGB},0.35)` : "rgba(255,255,255,0.07)",
                background: hovered
                    ? `radial-gradient(circle at 50% 0%, rgba(${accentRGB},0.08), rgba(6,8,16,0.98) 70%)`
                    : "rgba(6,8,16,0.6)",
                boxShadow: hovered
                    ? `0 0 40px -10px rgba(${accentRGB},0.25), 0 0 0 1px rgba(${accentRGB},0.2)`
                    : "none",
            }}
        >
            {/* Icon */}
            <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white/90`}
                style={{
                    transform: hovered ? "scale(1.1)" : "scale(1)",
                    transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                    boxShadow: hovered ? `0 6px 20px -4px rgba(${accentRGB},0.5)` : "none",
                }}
            >
                {icon}
            </div>

            {/* Value */}
            <div className="mb-1 flex items-baseline gap-1.5">
                <span
                    className={`text-3xl font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}
                >
                    {value}
                </span>
                <span className="text-sm font-medium text-white/50">{suffix}</span>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed text-white/45">{description}</p>

            {/* Bottom accent */}
            <div
                className={`absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r ${accent}`}
                style={{ opacity: hovered ? 0.6 : 0.15, transition: "opacity 0.3s" }}
            />
        </div>
    );
}
