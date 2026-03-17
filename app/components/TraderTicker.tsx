"use client";

import { useEffect, useState } from "react";

const BASE = 2847;

function getStoredCount(): number {
    if (typeof window === "undefined") return BASE;
    const stored = sessionStorage.getItem("sk_trader_count");
    return stored ? parseInt(stored, 10) : BASE;
}

export default function TraderTicker() {
    const [count, setCount] = useState(BASE);

    useEffect(() => {
        // Restore from session
        const initial = getStoredCount();
        setCount(initial);

        // Randomly increment every 12–40 seconds
        function schedule() {
            const delay = 12000 + Math.random() * 28000;
            return setTimeout(() => {
                setCount(c => {
                    const next = c + Math.floor(Math.random() * 3) + 1;
                    sessionStorage.setItem("sk_trader_count", String(next));
                    return next;
                });
                schedule();
            }, delay);
        }
        const t = schedule();
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="flex items-center gap-2 mt-8">
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs text-white/40">
                <span className="font-mono font-semibold text-white/65">
                    {count.toLocaleString("en")}
                </span>
                {" "}traders in early access
            </span>
        </div>
    );
}
