"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "../i18n/LanguageContext";

export default function ParadigmShiftSection() {
    const { t } = useTranslation();
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    const contrasts = [
        {
            left: { label: t("paradigm.row1_left_label"), value: t("paradigm.row1_left_value") },
            right: { label: t("paradigm.row1_right_label"), value: t("paradigm.row1_right_value") },
            accent: "from-indigo-500 to-sky-500",
        },
        {
            left: { label: t("paradigm.row2_left_label"), value: t("paradigm.row2_left_value") },
            right: { label: t("paradigm.row2_right_label"), value: t("paradigm.row2_right_value") },
            accent: "from-sky-500 to-cyan-400",
        },
        {
            left: { label: t("paradigm.row3_left_label"), value: t("paradigm.row3_left_value") },
            right: { label: t("paradigm.row3_right_label"), value: t("paradigm.row3_right_value") },
            accent: "from-cyan-400 to-fuchsia-500",
        },
    ];

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setVisible(true);
            return;
        }
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.08 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section id="paradigm" ref={ref} className="mx-auto max-w-6xl px-6 py-14">
            {/* Header */}
            <div
                className="mb-8 text-center transition-all duration-700"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)" }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">{t("paradigm.section_label")}</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
                    {t("paradigm.title_main")}{" "}
                    <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                        {t("paradigm.title_highlight")}
                    </span>
                </h2>
            </div>

            {/* Contrast rows */}
            <div className="space-y-5">
                {contrasts.map((c, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/8 transition-all duration-700"
                        style={{
                            transitionDelay: `${i * 120}ms`,
                            opacity: visible ? 1 : 0,
                            transform: visible ? "none" : "translateY(24px)",
                        }}
                    >
                        {/* Left — old paradigm */}
                        <div className="flex flex-col justify-center gap-1.5 bg-white/[0.02] px-8 py-7">
                            <div className="text-xs uppercase tracking-widest text-white/30">{c.left.label}</div>
                            <div className="text-2xl font-light text-white/50 md:text-3xl">{c.left.value}</div>
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div
                                className={`absolute -left-px inset-y-0 w-px bg-gradient-to-b ${c.accent} opacity-60`}
                            />
                        </div>

                        {/* Right — Skillion */}
                        <div
                            className="relative -ml-px flex flex-col justify-center gap-1.5 bg-white/[0.035] px-8 py-7"
                        >
                            <div
                                className={`absolute inset-0 bg-gradient-to-r ${c.accent} opacity-[0.04]`}
                            />
                            <div
                                className={`absolute left-0 inset-y-0 w-0.5 bg-gradient-to-b ${c.accent}`}
                            />
                            <div className="text-xs uppercase tracking-widest text-white/40">
                                {c.right.label}
                            </div>
                            <div
                                className={`bg-gradient-to-r ${c.accent} bg-clip-text text-2xl font-semibold text-transparent md:text-3xl`}
                            >
                                {c.right.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Body copy */}
            <div
                className="mx-auto mt-14 max-w-2xl space-y-5 text-center transition-all duration-700 delay-500"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)" }}
            >
                <p className="text-base leading-relaxed text-white/50">
                    {t("paradigm.desc1")}
                </p>
                <p className="text-base leading-relaxed text-white/50">
                    {t("paradigm.desc2")}
                </p>
                <div className="pt-2 inline-block rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-white/45 italic">
                    {t("paradigm.tagline")}
                </div>
            </div>
        </section>
    );
}
