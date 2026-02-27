"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";

const tiers = [
    {
        rank: "01",
        nameKey: "roadmap.tier_1_name",
        scoreKey: "roadmap.tier_1_score",
        labelKey: "roadmap.tier_1_label",
        descKey: "roadmap.tier_1_description",
        reqs: ["roadmap.tier_1_requirement_1", "roadmap.tier_1_requirement_2", "roadmap.tier_1_requirement_3"],
        unlockKey: "roadmap.tier_1_unlock",
        scoreMin: 0,
        scoreMax: 299,
        progress: 20,
        accent: "from-slate-400 to-slate-300",
        accentSolid: "#94a3b8",
        borderColor: "border-slate-400/20",
        bgGlow: "rgba(148,163,184,0.05)",
        badgeBg: "bg-slate-400/10 border-slate-400/20 text-slate-300",
        dotColor: "bg-slate-400",
        certified: false,
    },
    {
        rank: "02",
        nameKey: "roadmap.tier_2_name",
        scoreKey: "roadmap.tier_2_score",
        labelKey: "roadmap.tier_2_label",
        descKey: "roadmap.tier_2_description",
        reqs: ["roadmap.tier_2_requirement_1", "roadmap.tier_2_requirement_2", "roadmap.tier_2_requirement_3"],
        unlockKey: "roadmap.tier_2_unlock",
        scoreMin: 300,
        scoreMax: 499,
        progress: 40,
        accent: "from-sky-400 to-cyan-400",
        accentSolid: "#38bdf8",
        borderColor: "border-sky-400/20",
        bgGlow: "rgba(56,189,248,0.06)",
        badgeBg: "bg-sky-400/10 border-sky-400/20 text-sky-300",
        dotColor: "bg-sky-400",
        certified: true,
    },
    {
        rank: "03",
        nameKey: "roadmap.tier_3_name",
        scoreKey: "roadmap.tier_3_score",
        labelKey: "roadmap.tier_3_label",
        descKey: "roadmap.tier_3_description",
        reqs: ["roadmap.tier_3_requirement_1", "roadmap.tier_3_requirement_2", "roadmap.tier_3_requirement_3"],
        unlockKey: "roadmap.tier_3_unlock",
        scoreMin: 500,
        scoreMax: 699,
        progress: 60,
        accent: "from-indigo-400 to-violet-400",
        accentSolid: "#818cf8",
        borderColor: "border-indigo-400/25",
        bgGlow: "rgba(99,102,241,0.07)",
        badgeBg: "bg-indigo-400/10 border-indigo-400/25 text-indigo-300",
        dotColor: "bg-indigo-400",
        certified: true,
    },
    {
        rank: "04",
        nameKey: "roadmap.tier_4_name",
        scoreKey: "roadmap.tier_4_score",
        labelKey: "roadmap.tier_4_label",
        descKey: "roadmap.tier_4_description",
        reqs: ["roadmap.tier_4_requirement_1", "roadmap.tier_4_requirement_2", "roadmap.tier_4_requirement_3"],
        unlockKey: "roadmap.tier_4_unlock",
        scoreMin: 700,
        scoreMax: 849,
        progress: 80,
        accent: "from-violet-400 to-fuchsia-400",
        accentSolid: "#a78bfa",
        borderColor: "border-violet-400/25",
        bgGlow: "rgba(139,92,246,0.08)",
        badgeBg: "bg-violet-400/10 border-violet-400/25 text-violet-300",
        dotColor: "bg-violet-400",
        certified: true,
    },
    {
        rank: "05",
        nameKey: "roadmap.tier_5_name",
        scoreKey: "roadmap.tier_5_score",
        labelKey: "roadmap.tier_5_label",
        descKey: "roadmap.tier_5_description",
        reqs: ["roadmap.tier_5_requirement_1", "roadmap.tier_5_requirement_2", "roadmap.tier_5_requirement_3"],
        unlockKey: "roadmap.tier_5_unlock",
        scoreMin: 850,
        scoreMax: 1000,
        progress: 100,
        accent: "from-fuchsia-400 via-pink-400 to-rose-400",
        accentSolid: "#e879f9",
        borderColor: "border-fuchsia-400/30",
        bgGlow: "rgba(232,121,249,0.09)",
        badgeBg: "bg-fuchsia-400/10 border-fuchsia-400/30 text-fuchsia-300",
        dotColor: "bg-fuchsia-400",
        certified: true,
    },
];

function TierCard({ tier, index, visible }: { tier: typeof tiers[0]; index: number; visible: boolean }) {
    const { t } = useTranslation();
    const isElite = index === 4;

    return (
        <div
            className={`relative flex flex-col rounded-2xl border bg-[#06080f]/90 backdrop-blur-xl transition-all duration-700 overflow-hidden ${tier.borderColor} ${isElite ? "ring-1 ring-fuchsia-400/15" : ""}`}
            style={{
                transitionDelay: `${index * 100}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(32px)",
                boxShadow: visible ? `0 0 56px ${tier.bgGlow}, 0 1px 0 rgba(255,255,255,0.04) inset` : "none",
            }}
        >
            {/* Elite glow top line */}
            {isElite && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent" />
            )}

            {/* Top section */}
            <div className="p-6 pb-4">
                {/* Rank badge + certified pill */}
                <div className="mb-5 flex items-center justify-between">
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${tier.accent} flex items-center justify-center text-[11px] font-bold text-white shadow-lg`}>
                        {tier.rank}
                    </div>
                    {tier.certified ? (
                        <span className={`text-[10px] font-semibold uppercase tracking-widest border rounded-full px-2.5 py-1 ${tier.badgeBg}`}>
                            SBT
                        </span>
                    ) : (
                        <span className="text-[10px] uppercase tracking-widest text-white/20 border border-white/10 rounded-full px-2.5 py-1">
                            {t(tier.labelKey)}
                        </span>
                    )}
                </div>

                {/* Tier name */}
                <div className={`mb-1 bg-gradient-to-r ${tier.accent} bg-clip-text text-2xl font-bold text-transparent`}>
                    {t(tier.nameKey)}
                </div>

                {/* SDI score range */}
                <div className="mb-4 text-[11px] font-mono font-medium text-white/35 tracking-wider">
                    {t(tier.scoreKey)}
                </div>

                {/* SDI progress bar */}
                <div className="mb-5">
                    <div className="h-1 w-full rounded-full bg-white/[0.06]">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${tier.accent} transition-all duration-1000`}
                            style={{
                                width: visible ? `${tier.progress}%` : "0%",
                                transitionDelay: `${index * 100 + 400}ms`,
                            }}
                        />
                    </div>
                </div>

                {/* Description */}
                <p className="text-[13px] leading-relaxed text-white/50">
                    {t(tier.descKey)}
                </p>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-white/[0.05]" />

            {/* Requirements */}
            <div className="px-6 py-4 flex-1">
                <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">
                    Requirements
                </p>
                <div className="space-y-2.5">
                    {tier.reqs.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <div className={`mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${tier.dotColor} opacity-70`} />
                            <span className="text-[12px] text-white/40 leading-snug">{t(r)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-white/[0.05]" />

            {/* Unlock benefits */}
            <div className={`px-6 py-4 rounded-b-2xl bg-gradient-to-br ${index === 4 ? "from-fuchsia-400/[0.05] to-transparent" : "from-white/[0.015] to-transparent"}`}>
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">
                    Unlocks
                </p>
                <p className={`text-[12px] font-medium bg-gradient-to-r ${tier.accent} bg-clip-text text-transparent leading-snug`}>
                    {t(tier.unlockKey)}
                </p>
            </div>
        </div>
    );
}

export default function ProgressionSection() {
    const { t } = useTranslation();
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
        <section id="progression" ref={ref} className="mx-auto max-w-6xl px-6 py-20">
            {/* Header */}
            <div
                className="mb-4 text-center transition-all duration-700"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)" }}
            >
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400/80">
                    {t("roadmap.section_label")}
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
                    {t("roadmap.title_main")}
                    <br />
                    <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                        {t("roadmap.title_highlight")}
                    </span>
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/45">
                    {t("roadmap.desc")}
                </p>
            </div>

            {/* SBT disclaimer */}
            <div
                className="mb-12 text-center transition-all duration-700 delay-150"
                style={{ opacity: visible ? 1 : 0 }}
            >
                <div className="inline-block rounded-xl border border-white/8 bg-white/[0.025] px-6 py-4 text-left max-w-2xl mx-auto">
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
                        {t("roadmap.sbt_title")}
                    </p>
                    <p className="text-xs leading-relaxed text-white/35 italic">
                        {t("roadmap.sbt_desc")}
                    </p>
                </div>
            </div>

            {/* Tier cards — 5 columns on lg, 2 on sm */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {tiers.map((tier, i) => (
                    <TierCard key={tier.rank} tier={tier} index={i} visible={visible} />
                ))}
            </div>

            {/* Bottom disclaimer */}
            <p
                className="mt-10 text-center text-xs text-white/25 transition-all duration-700 delay-500"
                style={{ opacity: visible ? 1 : 0 }}
            >
                {t("roadmap.disclaimer")}
            </p>
        </section>
    );
}
