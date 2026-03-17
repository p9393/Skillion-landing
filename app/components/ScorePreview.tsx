"use client";

import { useEffect, useRef, useState } from "react";

/* ── Score bar with animated fill ─────────────────────────────── */
function AnimatedBar({
    label, pct, color, delay,
}: { label: string; pct: number; color: string; delay: number }) {
    const [fill, setFill] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const timer = setTimeout(() => {
            // Ramp up over 900ms
            const start = performance.now();
            const dur = 900;
            function tick(now: number) {
                const t = Math.min(1, (now - start) / dur);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - t, 3);
                setFill(Math.round(eased * pct));
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(timer);
    }, [pct, delay]);

    return (
        <div>
            <div className="flex justify-between mb-1.5">
                <span className="text-[11px] text-white/55">{label}</span>
                <span className="text-[11px] font-mono text-white/70">{fill}%</span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-white/8 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-none`}
                    style={{ width: `${fill}%` }}
                />
            </div>
        </div>
    );
}

/* ── Counting number ───────────────────────────────────────────── */
function CountUp({ target, delay }: { target: number; delay: number }) {
    const [value, setValue] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const timer = setTimeout(() => {
            const start = performance.now();
            const dur = 1400;
            function tick(now: number) {
                const t = Math.min(1, (now - start) / dur);
                const eased = 1 - Math.pow(1 - t, 4);
                setValue(Math.round(eased * target));
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(timer);
    }, [target, delay]);

    return <>{value}</>;
}

/* ── Main Score Preview component ──────────────────────────────── */
export default function ScorePreview() {
    const ref = useRef<HTMLDivElement>(null);
    const [vis, setVis] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [clock, setClock] = useState("");
    const [refresh, setRefresh] = useState(30);

    useEffect(() => {
        // Delay past preloader (1800ms load + 600ms fade = 2400ms total)
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
            setVis(true);
            return;
        }
        const t = setTimeout(() => setVis(true), 2200);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        // Live UTC clock — only ticks when visible
        let tick: ReturnType<typeof setInterval> | null = null;

        function fmt() {
            const d = new Date();
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
        }
        setClock(fmt());

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (!tick) {
                        tick = setInterval(() => {
                            setClock(fmt());
                            setRefresh(r => r <= 1 ? 30 : r - 1);
                        }, 1000);
                    }
                } else {
                    if (tick) { clearInterval(tick); tick = null; }
                }
            },
            { threshold: 0 }
        );
        if (ref.current) obs.observe(ref.current);

        return () => {
            obs.disconnect();
            if (tick) clearInterval(tick);
        };
    }, []);

    return (
        <div
            ref={ref}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                opacity: vis ? 1 : 0,
                transform: vis ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
                transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
            }}
        >
            <div
                className="relative rounded-3xl border bg-[#080a12]/90 backdrop-blur-xl overflow-hidden"
                style={{
                    borderColor: hovered ? "rgba(34,211,238,0.30)" : "rgba(255,255,255,0.08)",
                    boxShadow: hovered
                        ? "0 0 0 1px rgba(34,211,238,0.2), 0 30px 80px -20px rgba(34,211,238,0.15), 0 0 60px -20px rgba(99,102,241,0.2)"
                        : "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -20px rgba(0,0,0,0.5)",
                    transition: "border-color 0.4s, box-shadow 0.4s",
                }}
            >
                {/* Top glow strip */}
                <div
                    className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(99,102,241,0.5), transparent)",
                        opacity: hovered ? 1 : 0.3,
                        transition: "opacity 0.4s",
                    }}
                />

                {/* Inner glow */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 60%)",
                        opacity: hovered ? 1 : 0.5,
                        transition: "opacity 0.4s",
                    }}
                />

                <div className="relative p-6">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-1">
                                Skillion Score
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-4xl font-bold tracking-tight text-white">
                                    {vis ? <CountUp target={741} delay={300} /> : 0}
                                </span>
                                <span className="text-lg text-white/30 font-light">/1000</span>
                            </div>
                        </div>
                        <div
                            className="rounded-xl px-3 py-1.5 text-[11px] font-semibold tracking-wide"
                            style={{
                                background: "rgba(34,211,238,0.12)",
                                border: "1px solid rgba(34,211,238,0.25)",
                                color: "rgb(103,232,249)",
                            }}
                        >
                            Initiate
                        </div>
                    </div>

                    {/* Bars */}
                    {vis && (
                        <div className="space-y-3">
                            <AnimatedBar label="Risk Control" pct={82} color="from-indigo-400 to-blue-500" delay={300} />
                            <AnimatedBar label="Stability" pct={74} color="from-sky-400 to-cyan-400" delay={400} />
                            <AnimatedBar label="Profit Quality" pct={69} color="from-cyan-400 to-teal-400" delay={500} />
                            <AnimatedBar label="Consistency" pct={78} color="from-violet-400 to-purple-500" delay={600} />
                            <AnimatedBar label="Drawdown Discipline" pct={61} color="from-fuchsia-400 to-pink-500" delay={700} />
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                        {[
                            { label: "Sharpe", value: "1.42", color: "text-cyan-300" },
                            { label: "Win Rate", value: "61%", color: "text-sky-300" },
                            { label: "Max DD", value: "8.2%", color: "text-fuchsia-300" },
                        ].map(({ label, value, color }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-white/6 bg-white/[0.025] px-3 py-2.5 text-center"
                                style={{
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                                }}
                            >
                                <div className={`text-base font-bold ${color}`}>{value}</div>
                                <div className="mt-0.5 text-[10px] text-white/40">{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Gate status */}
                    <div
                        className="mt-4 flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3"
                        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                    >
                        <div className="text-[11px] text-white/40">Next unlock</div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-cyan-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Gold Rank — 4 stable sessions left
                        </div>
                    </div>

                    {/* Live clock footer */}
                    <div className="mt-4 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-white/25 uppercase tracking-widest">Simulated · Live</span>
                        <div className="flex items-center gap-3">
                            <span className="text-white/35">{clock}</span>
                            <span className="text-white/20">Upd. in {refresh}s</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
