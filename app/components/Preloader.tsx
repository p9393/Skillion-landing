"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
    const [visible, setVisible] = useState(false);
    const [fading, setFading] = useState(false);
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Only show once per session
        if (sessionStorage.getItem("sk_loaded")) return;
        sessionStorage.setItem("sk_loaded", "1");
        setVisible(true);

        // Count up to 100
        const start = performance.now();
        const dur = 1600;
        function tick(now: number) {
            const t = Math.min(1, (now - start) / dur);
            setCount(Math.round(t * 100));
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                // Fade out
                setTimeout(() => {
                    setFading(true);
                    setTimeout(() => setVisible(false), 600);
                }, 100);
            }
        }
        requestAnimationFrame(tick);
    }, []);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#05060a]"
            style={{
                opacity: fading ? 0 : 1,
                transition: "opacity 0.6s ease",
                pointerEvents: fading ? "none" : "all",
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-fuchsia-500" />
                <div>
                    <div className="text-base font-semibold tracking-[0.18em] text-white">SKILLION</div>
                    <div className="text-[10px] text-white/40 tracking-widest">FINANCE</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-48 h-[1px] bg-white/10 overflow-hidden rounded-full mb-4">
                <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500"
                    style={{ width: `${count}%`, transition: "width 0.05s linear" }}
                />
            </div>

            {/* Counter */}
            <div className="font-mono text-xs text-white/30 tracking-widest">
                {String(count).padStart(3, "0")}%
            </div>

            {/* Tagline */}
            <div className="mt-8 text-[11px] text-white/20 tracking-[0.3em] uppercase">
                Calculating metrics…
            </div>
        </div>
    );
}
