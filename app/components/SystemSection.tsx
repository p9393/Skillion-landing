"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
    {
        index: "01",
        label: "Skill",
        title: "Verified Performance",
        description:
            "Connect your trading account. Skillion imports your real history — PnL, drawdown, win rate, R/R — and verifies it. No opinions. Only data.",
        accent: "from-indigo-400 to-blue-500",
        accentSolid: "99,102,241",
        border: "rgba(99,102,241,0.35)",
        glow: "rgba(99,102,241,0.18)",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
    {
        index: "02",
        label: "Score",
        title: "Reputation Engine",
        description:
            "The Skillion Score (0–1000) quantifies your edge across five dimensions: Risk Control, Stability, Profit Quality, Drawdown Discipline, and Consistency.",
        accent: "from-sky-400 to-cyan-400",
        accentSolid: "14,165,233",
        border: "rgba(14,165,233,0.35)",
        glow: "rgba(14,165,233,0.18)",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    {
        index: "03",
        label: "Capital",
        title: "Merit-Gated Access",
        description:
            "Your score unlocks progression: advanced tools, certified profile, public ranking, and — in future phases — capital allocation and DeFi modules.",
        accent: "from-fuchsia-400 to-pink-500",
        accentSolid: "236,72,153",
        border: "rgba(236,72,153,0.35)",
        glow: "rgba(236,72,153,0.18)",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
            </svg>
        ),
    },
];

/* ── 3D tilt card ──────────────────────────────────────────────── */
function StepCard({
    step, visible, delay,
}: {
    step: typeof steps[0];
    visible: boolean;
    delay: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: cy * -14, y: cx * 14 }); // degrees
    };

    const onMouseEnter = () => setHovered(true);
    const onMouseLeave = () => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={onMouseMove}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                perspective: "900px",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            }}
        >
            <div
                style={{
                    transform: hovered
                        ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.025)`
                        : "rotateX(0deg) rotateY(0deg) scale(1)",
                    transition: hovered
                        ? "transform 0.12s ease-out"
                        : "transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)",
                    transformStyle: "preserve-3d",
                }}
                className="relative rounded-3xl p-[1px] cursor-default"
            >
                {/* Animated border gradient */}
                <div
                    className="absolute inset-0 rounded-3xl transition-opacity duration-500"
                    style={{
                        background: hovered
                            ? `linear-gradient(135deg, ${step.border}, rgba(255,255,255,0.12), ${step.border})`
                            : `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))`,
                        padding: "1px",
                    }}
                />

                {/* Card body */}
                <div
                    className="relative rounded-3xl p-8 overflow-hidden"
                    style={{
                        background: hovered
                            ? `radial-gradient(circle at 50% 0%, rgba(${step.accentSolid},0.08) 0%, rgba(7,9,15,0.97) 60%)`
                            : "rgba(7,9,15,0.85)",
                        border: `1px solid ${hovered ? step.border : "rgba(255,255,255,0.08)"}`,
                        boxShadow: hovered
                            ? `0 0 0 1px ${step.border}, 0 20px 60px -10px ${step.glow}, 0 0 40px -15px rgba(${step.accentSolid},0.3)`
                            : "0 0 0 1px rgba(255,255,255,0.06)",
                        transition: "background 0.4s, border-color 0.3s, box-shadow 0.4s",
                    }}
                >
                    {/* Shimmer sweep on hover */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                        style={{
                            background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.04) 50%, transparent 65%)",
                            backgroundSize: "200% 100%",
                            backgroundPosition: hovered ? "0% 0%" : "200% 0%",
                            transition: "background-position 0.6s ease",
                            opacity: hovered ? 1 : 0,
                            borderRadius: "inherit",
                        }}
                    />

                    {/* Icon + index */}
                    <div className="flex items-start justify-between">
                        <div
                            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} text-white`}
                            style={{
                                transform: hovered ? "scale(1.08) translateZ(20px)" : "scale(1) translateZ(0)",
                                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                boxShadow: hovered ? `0 8px 24px -4px rgba(${step.accentSolid},0.5)` : "none",
                            }}
                        >
                            {step.icon}
                        </div>
                        <span
                            className="font-mono text-xs"
                            style={{ color: hovered ? `rgba(${step.accentSolid},0.7)` : "rgba(255,255,255,0.25)", transition: "color 0.3s" }}
                        >
                            {step.index}
                        </span>
                    </div>

                    {/* Label pill */}
                    <div
                        className={`mt-5 inline-block rounded-full bg-gradient-to-r ${step.accent} px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white`}
                        style={{
                            transform: hovered ? "translateZ(10px)" : "translateZ(0)",
                            transition: "transform 0.3s ease",
                        }}
                    >
                        {step.label}
                    </div>

                    {/* Title */}
                    <h3
                        className="mt-3 text-xl font-semibold"
                        style={{
                            color: hovered ? "#fff" : "rgba(255,255,255,0.88)",
                            transition: "color 0.3s",
                        }}
                    >
                        {step.title}
                    </h3>

                    {/* Description */}
                    <p
                        className="mt-3 text-sm leading-relaxed"
                        style={{
                            color: hovered ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.55)",
                            transition: "color 0.3s",
                        }}
                    >
                        {step.description}
                    </p>

                    {/* Bottom accent line */}
                    <div
                        className={`absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r ${step.accent}`}
                        style={{
                            opacity: hovered ? 0.7 : 0.2,
                            transition: "opacity 0.4s",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

/* ── Section ───────────────────────────────────────────────────── */
export default function SystemSection() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold: 0.12 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section id="system" ref={ref} className="relative mx-auto max-w-6xl px-6 py-24">

            {/* Section header */}
            <div
                className="mb-16 max-w-2xl"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.7s ease, transform 0.7s ease",
                }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">The System</p>
                <h2 className="mt-3 text-3xl font-semibold leading-snug text-white md:text-4xl">
                    Three layers.{" "}
                    <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                        One closed loop.
                    </span>
                </h2>
                <p className="mt-4 text-base text-white/55 leading-relaxed">
                    Skillion is not a trading platform. It is a reputation infrastructure — the first system where verified financial skill becomes a measurable, portable asset.
                </p>
            </div>

            {/* Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {steps.map((step, i) => (
                    <StepCard
                        key={step.label}
                        step={step}
                        visible={visible}
                        delay={i * 130}
                    />
                ))}
            </div>

            {/* Bottom divider */}
            <div
                className="mt-14 flex items-center gap-4"
                style={{
                    opacity: visible ? 1 : 0,
                    transition: "opacity 1s ease 400ms",
                }}
            >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <p className="text-xs tracking-[0.22em] text-white/30 uppercase">
                    Meritocratic &bull; Verified &bull; Scalable
                </p>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
        </section>
    );
}
