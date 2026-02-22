"use client";

import { useEffect, useRef, useState } from "react";

const years = [
    {
        year: "Year 1",
        title: "Reputation Infrastructure",
        accentFrom: "from-sky-400",
        accentTo: "to-indigo-400",
        borderColor: "border-sky-400/20",
        glowColor: "rgba(56,189,248,0.07)",
        milestones: [
            {
                n: "01",
                title: "Score Engine v1",
                description: "Core SDI framework operational. Risk-adjusted scoring methodology implemented and tested.",
                status: "In Progress",
                statusColor: "text-sky-400 border-sky-400/30 bg-sky-400/10",
            },
            {
                n: "02",
                title: "User Dashboard",
                description: "Personal reputation dashboard with historical performance tracking and progression overview.",
                status: "In Progress",
                statusColor: "text-sky-400 border-sky-400/30 bg-sky-400/10",
            },
            {
                n: "03",
                title: "Verified Data Integrations",
                description: "Read-only connections to major CeFi platforms, DeFi wallets, and traditional broker data sources.",
                status: "Planned",
                statusColor: "text-white/40 border-white/15 bg-white/5",
            },
            {
                n: "04",
                title: "Certification Framework",
                description: "Reputation certification standards defined. Tier criteria documented and finalized.",
                status: "Planned",
                statusColor: "text-white/40 border-white/15 bg-white/5",
            },
            {
                n: "05",
                title: "Closed Beta Launch",
                description: "Founding cohort onboarding. Initial behavioral data collection. Framework validation.",
                status: "Planned",
                statusColor: "text-white/40 border-white/15 bg-white/5",
            },
        ],
    },
    {
        year: "Year 2",
        title: "Recognition & Expansion",
        accentFrom: "from-indigo-400",
        accentTo: "to-violet-400",
        borderColor: "border-indigo-400/20",
        glowColor: "rgba(99,102,241,0.08)",
        milestones: [
            {
                n: "01",
                title: "Exchange Integrations",
                description: "Verified integrations with major trading platforms. Expanded data source coverage.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
            {
                n: "02",
                title: "Advanced Analytics Layer",
                description: "Deeper behavioral analysis. Cross-platform consistency measurement. Expanded SDI dimensions.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
            {
                n: "03",
                title: "Institutional API",
                description: "API access for institutional partners to query verified reputation data. Rate-limited and permission-scoped.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
            {
                n: "04",
                title: "Reputation Validation Partnerships",
                description: "Formal agreements with platforms, institutions, and networks recognizing Skillion reputation scores.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
            {
                n: "05",
                title: "Pilot Ecosystem Programs",
                description: "Initial framework for reputation-based access programs. Pilot runs with partner platforms.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
        ],
    },
    {
        year: "Year 3",
        title: "Ecosystem Evolution",
        accentFrom: "from-violet-400",
        accentTo: "to-fuchsia-400",
        borderColor: "border-violet-400/20",
        glowColor: "rgba(139,92,246,0.09)",
        milestones: [
            {
                n: "01",
                title: "Utility Token (SKL) Generation",
                description: "Launch of the native SKL token. Designed strictly as an ecosystem utility and governance primitive, not a speculative asset.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
            {
                n: "02",
                title: "Meritocratic Capital Program",
                description: "Introduction of verified capital pools. Elite-tier traders with sustained historical discipline gain access to ecosystem capital.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
            {
                n: "03",
                title: "Ecosystem Governance",
                description: "Transition toward decentralized parameter control. SKL holders participate in shaping scoring weights and system upgrades.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
            {
                n: "04",
                title: "International Expansion",
                description: "Multi-jurisdiction regulatory review. Localization for emerging markets and international partners.",
                status: "Roadmap",
                statusColor: "text-white/30 border-white/10 bg-white/[0.03]",
            },
        ],
    },
];

export default function RoadmapSection() {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.04 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section id="roadmap" ref={ref} className="mx-auto max-w-6xl px-6 py-14">
            {/* Header */}
            <div
                className="mb-8 text-center transition-all duration-700"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)" }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Infrastructure Timeline</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
                    3-Year{" "}
                    <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Development Roadmap
                    </span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-white/45 leading-relaxed">
                    A structured plan for building reputation infrastructure over a three-year horizon.
                    Milestones are directional and subject to revision as the ecosystem evolves.
                </p>
            </div>

            {/* Year columns */}
            <div className="grid gap-6 lg:grid-cols-3">
                {years.map((y, yi) => (
                    <div
                        key={y.year}
                        className={`rounded-2xl border p-7 backdrop-blur-xl transition-all duration-700 ${y.borderColor}`}
                        style={{
                            transitionDelay: `${yi * 150}ms`,
                            opacity: visible ? 1 : 0,
                            transform: visible ? "none" : "translateY(28px)",
                            boxShadow: visible ? `0 0 56px ${y.glowColor}` : "none",
                        }}
                    >
                        {/* Year header */}
                        <div className="mb-6">
                            <div
                                className={`mb-1 text-xs uppercase tracking-widest bg-gradient-to-r ${y.accentFrom} ${y.accentTo} bg-clip-text text-transparent`}
                            >
                                {y.year}
                            </div>
                            <div className="text-lg font-semibold text-white/85">{y.title}</div>
                        </div>

                        {/* Milestone cards */}
                        <div className="space-y-4">
                            {y.milestones.map((m) => (
                                <div
                                    key={m.n}
                                    className="rounded-xl border border-white/6 bg-white/[0.025] p-4"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div
                                            className={`text-xs font-semibold bg-gradient-to-r ${y.accentFrom} ${y.accentTo} bg-clip-text text-transparent`}
                                        >
                                            {m.n} — {m.title}
                                        </div>
                                        <span
                                            className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${m.statusColor}`}
                                        >
                                            {m.status}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-white/40">{m.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Disclaimer */}
            <p
                className="mt-10 text-center text-xs text-white/25 italic transition-all duration-700 delay-500"
                style={{ opacity: visible ? 1 : 0 }}
            >
                Roadmap milestones are indicative and subject to change. No financial returns, capital access,
                or profit are implied by any timeline item. Infrastructure development timelines are estimates only.
            </p>
        </section>
    );
}
