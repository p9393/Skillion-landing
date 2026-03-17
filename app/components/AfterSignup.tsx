"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
    {
        n: "01",
        title: "Request access",
        body: "Drop your email. Spots are allocated by discipline, not by date.",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" />
            </svg>
        ),
        color: "34,211,238",
        grad: "from-cyan-400 to-sky-500",
    },
    {
        n: "02",
        title: "Connect your data",
        body: "Link your exchange or upload a verified track record. Aurion imports and analyzes.",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
        ),
        color: "99,102,241",
        grad: "from-indigo-400 to-violet-500",
    },
    {
        n: "03",
        title: "Your Score begins",
        body: "The engine calculates. Aurion explains. Your reputation starts building from day one.",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
        color: "200,120,255",
        grad: "from-fuchsia-400 to-pink-500",
    },
];

export default function AfterSignup() {
    const ref = useRef<HTMLDivElement>(null);
    const [vis, setVis] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVis(true); },
            { threshold: 0.1 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <div ref={ref} className="mt-14">
            <p
                className="mb-8 text-xs uppercase tracking-[0.25em] text-white/35"
                style={{ opacity: vis ? 1 : 0, transition: "opacity 0.6s ease" }}
            >
                What happens next
            </p>
            <div className="grid gap-4 md:grid-cols-3">
                {steps.map((s, i) => (
                    <div
                        key={s.n}
                        className="relative flex gap-4 rounded-2xl border border-white/6 bg-white/[0.02] p-5"
                        style={{
                            opacity: vis ? 1 : 0,
                            transform: vis ? "translateY(0)" : "translateY(16px)",
                            transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
                        }}
                    >
                        {/* Connector line between steps (desktop) */}
                        {i < steps.length - 1 && (
                            <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 md:block">
                                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 2" /></svg>
                            </div>
                        )}

                        {/* Icon */}
                        <div
                            className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-white`}
                            style={{ boxShadow: `0 4px 16px -4px rgba(${s.color},0.4)` }}
                        >
                            {s.icon}
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-white/30 mb-1">{s.n}</div>
                            <div className="text-sm font-semibold text-white/85 mb-1">{s.title}</div>
                            <div className="text-xs leading-relaxed text-white/45">{s.body}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
