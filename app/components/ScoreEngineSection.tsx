"use client";

import { useEffect, useRef, useState } from "react";
import { BuildingIcon, ShieldCheckIcon } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

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
    const { t } = useTranslation();
    const [metricsVisible, setMetricsVisible] = useState(false);
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
                {/* Left â€” copy */}
                <div
                    className="transition-all duration-700"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-24px)" }}
                >
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                        {t("score_engine.section_label")}
                    </p>
                    <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
                        {t("score_engine.title_main")}
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                            {t("score_engine.title_highlight")}
                        </span>
                    </h2>
                    <div className="mx-auto mt-8 grid max-w-3xl gap-6 font-light text-white/50 md:grid-cols-2 md:text-left text-[15px] leading-relaxed">
                        <p>
                            {t("score_engine.desc_left")}
                        </p>
                        <p>
                            {t("score_engine.desc_right")}
                        </p>
                    </div>

                    <div className="mt-8 space-y-3">
                        {[
                            t("score_engine.point_1"),
                            t("score_engine.point_2"),
                            t("score_engine.point_3"),
                            t("score_engine.point_4"),
                        ].map((point, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-400" />
                                <span className="text-sm text-white/50 leading-snug">{point}</span>
                            </div>
                        ))}
                    </div>

                    {/* Institutional tagline */}
                    <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.025] px-6 py-5">
                        <p className="text-xs uppercase tracking-widest text-white/25 mb-1">{t("score_engine.core_principle_label")}</p>
                        <p className="text-sm text-white/60 leading-relaxed italic">
                            {t("score_engine.core_principle_text")}
                        </p>
                    </div>
                </div>

                {/* Right â€” metric bars */}
                <div
                    className="transition-all duration-700 delay-200"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(24px)" }}
                >
                    <div className="rounded-2xl border border-white/8 bg-[#06080f]/80 p-7 backdrop-blur-xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-white/30">{t("score_engine.sdi_framework_label")}</p>
                                <p className="mt-0.5 text-sm font-medium text-white/70">{t("score_engine.sdi_framework_title")}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/40">
                                {t("score_engine.sdi_framework_dimensions")}
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
                            {t("score_engine.disclaimer_1")}
                        </p>
                        <p className="mt-2 text-center text-[10px] text-white/30">
                            {t("score_engine.disclaimer_2_line1")}<br />
                            {t("score_engine.disclaimer_2_line2")}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

