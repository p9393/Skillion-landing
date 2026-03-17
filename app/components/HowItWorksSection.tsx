"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "../i18n/LanguageContext";

export default function HowItWorksSection() {
    const { t } = useTranslation();
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    const STEPS = [
        {
            number: "01",
            title: t("how_it_works.step1_title"),
            subtitle: t("how_it_works.step1_subtitle"),
            description: t("how_it_works.step1_desc"),
            detail: t("how_it_works.step1_detail"),
            items: [
                "CeFi (Binance, Bybit via API)",
                "DeFi (Wallet EVM signatures)",
                "TradFi (MT4/5 via Connectors) - Coming Soon",
            ],
            accent: "from-sky-500 to-indigo-500", // Original accent
            bg: "bg-sky-500/[0.04]", // Original bg
            border: "border-sky-500/15", // Original border
            glow: "rgba(14,165,233,0.08)", // Original glow
            color: "text-indigo-400 font-medium", // New color
            bgClass: "from-indigo-900/40", // New bg
            borderClass: "group-hover:border-indigo-500/30", // New border
        },
        {
            number: "02",
            title: t("how_it_works.step2_title"),
            subtitle: t("how_it_works.step2_subtitle"),
            description: t("how_it_works.step2_desc"),
            detail: t("how_it_works.step2_detail"),
            items: [
                "Sharpe & Sortino evaluation",
                "Z-Score distribution coherence",
                "Drawdown magnitude analysis",
            ],
            accent: "from-indigo-500 to-violet-500",
            bg: "bg-indigo-500/[0.04]",
            border: "border-indigo-500/15",
            glow: "rgba(99,102,241,0.09)",
            color: "text-sky-400 font-medium",
            bgClass: "from-sky-900/40",
            borderClass: "group-hover:border-sky-500/30",
        },
        {
            number: "03",
            title: t("how_it_works.step3_title"),
            subtitle: t("how_it_works.step3_subtitle"),
            description: t("how_it_works.step3_desc"),
            detail: t("how_it_works.step3_detail"),
            items: [
                "Behavioral interpretation",
                "Coherence analysis",
                "Adaptive risk feedback",
            ],
            accent: "from-violet-500 to-purple-500",
            bg: "bg-violet-500/[0.04]",
            border: "border-violet-500/15",
            glow: "rgba(168,85,247,0.09)",
            color: "text-cyan-400 font-medium",
            bgClass: "from-cyan-900/40",
            borderClass: "group-hover:border-cyan-500/30",
        },
        {
            number: "04",
            title: t("how_it_works.step4_title"),
            subtitle: t("how_it_works.step4_subtitle"),
            description: t("how_it_works.step4_desc"),
            detail: t("how_it_works.step4_detail"),
            items: [
                "Soulbound NFT issuance",
                "3, 6, and 12-month epochs",
                "Immutable on-chain record",
            ],
            accent: "from-purple-500 to-fuchsia-500",
            bg: "bg-purple-500/[0.04]",
            border: "border-purple-500/15",
            glow: "rgba(217,70,239,0.09)",
            color: "text-fuchsia-400 font-medium",
            bgClass: "from-fuchsia-900/40",
            borderClass: "group-hover:border-fuchsia-500/30",
        },
        {
            number: "05",
            title: t("how_it_works.step5_title"),
            subtitle: t("how_it_works.step5_subtitle"),
            description: t("how_it_works.step5_desc"),
            detail: t("how_it_works.step5_detail"),
            items: [
                "Meritocratic Capital Program",
                "Utility Token (SKL) integration",
                "Decentralized governance",
            ],
            accent: "from-fuchsia-500 to-rose-500",
            bg: "bg-fuchsia-500/[0.04]",
            border: "border-fuchsia-500/15",
            glow: "rgba(244,63,94,0.09)",
            color: "text-purple-400 font-medium",
            bgClass: "from-purple-900/40",
            borderClass: "group-hover:border-purple-500/30",
        },
    ];

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
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-400">
                    {t("how_it_works.section_label")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-5xl lg:text-5xl tracking-tight">
                    {t("how_it_works.title_main")}{" "}
                    <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                        {t("how_it_works.title_highlight")}
                    </span>
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-base text-white/50 leading-relaxed font-light">
                    {t("how_it_works.desc")}
                </p>
            </div>

            {/* Step cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {STEPS.map((s, i) => (
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

            {/* Security Model */}
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl transition-all duration-700 delay-500" style={{ opacity: visible ? 1 : 0 }}>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">{t("how_it_works.security_title")}</h3>
                <ul className="grid gap-3 sm:grid-cols-2 text-sm text-white/60">
                    <li className="flex items-center gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/50" /> {t("how_it_works.security_1")}
                    </li>
                    <li className="flex items-center gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/50" /> {t("how_it_works.security_2")}
                    </li>
                    <li className="flex items-center gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/50" /> {t("how_it_works.security_3")}
                    </li>
                    <li className="flex items-center gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/50" /> {t("how_it_works.security_4")}
                    </li>
                    <li className="flex items-center gap-2.5 sm:col-span-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/50" /> {t("how_it_works.security_5")}
                    </li>
                </ul>
            </div>
        </section>
    );
}
