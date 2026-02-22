"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        // Skip on touch/pointer-coarse devices (smartphones, tablets)
        if (window.matchMedia("(pointer: coarse)").matches) return;

        // Hide native cursor
        document.documentElement.style.cursor = "none";

        let mx = -100, my = -100;
        let rx = -100, ry = -100;
        let animId = 0;
        let isHovering = false;

        const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };

        // Use event delegation instead of individual listeners (avoids duplicate/leak)
        const INTERACTIVE = "a, button, [role=button], input, label, [data-hover]";
        const onOver = (e: MouseEvent) => {
            if ((e.target as Element).closest(INTERACTIVE)) isHovering = true;
        };
        const onOut = (e: MouseEvent) => {
            if ((e.target as Element).closest(INTERACTIVE)) isHovering = false;
        };

        function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

        function tick() {
            animId = requestAnimationFrame(tick);
            // Inner dot: snaps fast
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
            }
            // Outer ring: smooth follow
            rx = lerp(rx, mx, 0.12);
            ry = lerp(ry, my, 0.12);
            if (ringRef.current) {
                const s = isHovering ? 2.2 : 1;
                ringRef.current.style.transform = `translate(${rx - 18}px, ${ry - 18}px) scale(${s})`;
                ringRef.current.style.opacity = isHovering ? "0.5" : "0.75";
            }
        }

        window.addEventListener("mousemove", onMove);
        document.addEventListener("mouseover", onOver);
        document.addEventListener("mouseout", onOut);
        tick();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseover", onOver);
            document.removeEventListener("mouseout", onOut);
            document.documentElement.style.cursor = "";
        };
    }, []);

    return (
        <>
            {/* Inner dot */}
            <div
                ref={dotRef}
                className="pointer-events-none fixed top-0 left-0 z-[9999] h-2 w-2 rounded-full bg-cyan-400"
                style={{ willChange: "transform", mixBlendMode: "difference" }}
            />
            {/* Outer ring */}
            <div
                ref={ringRef}
                className="pointer-events-none fixed top-0 left-0 z-[9998] h-9 w-9 rounded-full border border-cyan-400/60"
                style={{
                    willChange: "transform, opacity",
                    transition: "opacity 0.3s, scale 0.25s",
                    mixBlendMode: "difference",
                }}
            />
        </>
    );
}
