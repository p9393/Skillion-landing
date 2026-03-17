"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement;
            const max = el.scrollHeight - el.clientHeight;
            const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
            if (barRef.current) {
                barRef.current.style.width = `${pct}%`;
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className="pointer-events-none fixed top-0 left-0 right-0 z-[9997] h-[2px] bg-transparent">
            <div
                ref={barRef}
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500"
                style={{
                    width: "0%",
                    transition: "width 0.08s linear",
                    boxShadow: "0 0 8px rgba(34,211,238,0.6)",
                }}
            />
        </div>
    );
}
