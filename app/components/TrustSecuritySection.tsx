"use client";

import { useEffect, useRef, useState } from "react";

const pillars = [
    {
        icon: "🔒",
        title: "Data Privacy",
        body: "Skillion does not store or sell user data. All behavioral data is processed exclusively for scoring purposes and protected under strict privacy standards.",
        accent: "border-indigo-400/20 bg-indigo-400/[0.03]",
    },
    {
        icon: "🔑",
        title: "Read-Only Integrations",
        body: "All account connections are read-only. Skillion never requests trading permissions, withdrawal access, or transaction authority of any kind.",
        accent: "border-sky-400/20 bg-sky-400/[0.03]",
    },
    {
        icon: "🛡",
        title: "Non-Custodial",
        body: "Skillion holds no custody of funds, assets, or private keys at any point. The platform operates strictly as a data analysis and reputation layer.",
        accent: "border-cyan-400/20 bg-cyan-400/[0.03]",
    },
    {
        icon: "📐",
        title: "Transparent Methodology",
        body: "The scoring framework is based on accepted financial mathematics. Methodology principles are openly documented. No black-box scoring.",
        accent: "border-violet-400/20 bg-violet-400/[0.03]",
    },
    {
        icon: "⚖",
        title: "No Financial Advice",
        body: "Skillion is a reputation measurement system, not a financial advisor. No content on this platform constitutes investment or trading advice.",
        accent: "border-fuchsia-400/20 bg-fuchsia-400/[0.03]",
    },
];

export default function TrustSecuritySection() {
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
        <section id="security" ref={ref} className="mx-auto max-w-6xl px-6 py-14">
            {/* Header */}
            <div
                className="mb-8 text-center transition-all duration-700"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)" }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Foundations</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                    Security, Privacy &{" "}
                    <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                        Methodology
                    </span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-white/45 leading-relaxed">
                    Skillion is built on principles of transparency, user protection, and methodological integrity.
                </p>
            </div>

            {/* Pillars */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {pillars.slice(0, 3).map((p, i) => (
                    <PillarCard key={p.title} pillar={p} index={i} visible={visible} />
                ))}
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
                {pillars.slice(3).map((p, i) => (
                    <PillarCard key={p.title} pillar={p} index={i + 3} visible={visible} />
                ))}
            </div>

            {/* Disclaimer bar */}
            <div
                className="mt-10 overflow-hidden rounded-2xl border border-white/6 bg-white/[0.015] px-8 py-5 text-center transition-all duration-700 delay-700"
                style={{ opacity: visible ? 1 : 0 }}
            >
                <p className="text-xs leading-relaxed text-white/30">
                    Skillion is a reputation infrastructure platform. It is not a financial institution, broker, investment advisor, or regulated entity.
                    Nothing on this platform should be interpreted as investment advice or a solicitation to trade.
                    Performance data is informational only.
                </p>
            </div>
        </section>
    );
}

function PillarCard({ pillar, index, visible }: { pillar: typeof pillars[0]; index: number; visible: boolean }) {
    return (
        <div
            className={`rounded-2xl border p-7 transition-all duration-700 ${pillar.accent}`}
            style={{
                transitionDelay: `${index * 90}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(20px)",
            }}
        >
            <div className="mb-4 text-2xl">{pillar.icon}</div>
            <div className="mb-2 text-sm font-semibold text-white/85">{pillar.title}</div>
            <p className="text-sm leading-relaxed text-white/45">{pillar.body}</p>
        </div>
    );
}
