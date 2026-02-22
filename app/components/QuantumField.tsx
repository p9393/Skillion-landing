"use client";

import { useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════════════════
   THE SKILL LATTICE — 3D EDITION
   
   Full 3D particle constellation with perspective projection.
   - Each node lives in true 3D space (x, y, z)
   - The world slowly auto-rotates on Y + gentle X oscillation
   - Mouse X/Y tilts the constellation in real time (parallax)
   - Depth fog: far nodes fade + shrink, near nodes glow + grow
   - Connections drawn in 3D; depth-based opacity
   - Traveling light pulses follow 3D projected paths
   - Cascade events radiate through 3D proximity
══════════════════════════════════════════════════════════════════ */

type Tier = "bronze" | "silver" | "gold" | "elite";

interface Node3D {
    // world-space position
    wx: number; wy: number; wz: number;
    // world-space velocity
    vx: number; vy: number; vz: number;
    radius: number;
    tier: Tier;
    energyPhase: number;
    score: number;
    cascading: number;
    cascadeDecay: number;
    // projected screen position (computed each frame)
    sx: number; sy: number;
    scale: number;   // perspective scale factor
    depth: number;   // 0=far, 1=close
}

interface Pulse {
    fromIdx: number; toIdx: number;
    progress: number;
    speed: number;
    color: string;
    alpha: number;
}

const TIER_RGB: Record<Tier, string> = {
    bronze: "200,110,50",
    silver: "150,190,220",
    gold: "30,220,245",
    elite: "210,110,255",
};
const TIER_BASE_RADIUS: Record<Tier, number> = {
    bronze: 2, silver: 2.5, gold: 3.2, elite: 4.5,
};
const TIER_GLOW: Record<Tier, number> = {
    bronze: 3, silver: 4, gold: 5.5, elite: 8,
};

function tierFromScore(s: number): Tier {
    if (s >= 850) return "elite";
    if (s >= 700) return "gold";
    if (s >= 500) return "silver";
    return "bronze";
}
function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ── Parameters ────────────────────────────────────────────────────
const FOV = 500;   // perspective focal length
const Z_RANGE = 350;   // depth extent ±
const MAX_DIST3D = 220;   // max 3D dist for edge

export default function QuantumField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D;

        let W = 0, H = 0;
        let animId = 0;
        let nodes: Node3D[] = [];
        let pulses: Pulse[] = [];

        // Camera rotation state
        let rotY = 0;          // auto-rotation angle (Y axis)
        let rotX = 0;          // gentle oscillation (X axis)
        let tiltY = 0;          // mouse-driven Y tilt
        let tiltX = 0;          // mouse-driven X tilt
        const mouse = { nx: 0, ny: 0 }; // normalized -1..1

        let lastCascade = 0;
        let lastPulse = 0;

        // ── Init ──────────────────────────────────────────────────────
        function init() {
            const dpr = window.devicePixelRatio || 1;
            W = window.innerWidth;
            H = window.innerHeight;
            canvas!.width = W * dpr;
            canvas!.height = H * dpr;
            canvas!.style.width = W + "px";
            canvas!.style.height = H + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const count = W < 700 ? 55 : 120;
            nodes = Array.from({ length: count }, () => {
                const score =
                    Math.random() < 0.08 ? rand(850, 1000) :
                        Math.random() < 0.18 ? rand(700, 850) :
                            Math.random() < 0.42 ? rand(500, 700) : rand(100, 500);
                const t = tierFromScore(score);
                return {
                    wx: rand(-W * 1.2, W * 1.2),
                    wy: rand(-H * 1.2, H * 1.2),
                    wz: rand(-Z_RANGE * 1.5, Z_RANGE * 1.5),
                    vx: rand(-0.18, 0.18),
                    vy: rand(-0.18, 0.18),
                    vz: rand(-0.06, 0.06),
                    radius: TIER_BASE_RADIUS[t] + rand(0, 1.5),
                    tier: t, energyPhase: Math.random() * Math.PI * 2,
                    score, cascading: 0, cascadeDecay: rand(0.005, 0.012),
                    sx: 0, sy: 0, scale: 1, depth: 0.5,
                };
            });
        }

        // ── 3D → Screen projection ────────────────────────────────────
        function project(wx: number, wy: number, wz: number): { sx: number; sy: number; sc: number; depth: number } {
            // Apply camera rotations (Y then X)
            const cosY = Math.cos(rotY + tiltY), sinY = Math.sin(rotY + tiltY);
            const cosX = Math.cos(rotX + tiltX), sinX = Math.sin(rotX + tiltX);

            // Rotate around Y
            const rx = wx * cosY - wz * sinY;
            const rz1 = wx * sinY + wz * cosY;
            // Rotate around X
            const ry = wy * cosX - rz1 * sinX;
            const rz = wy * sinX + rz1 * cosX;

            // Perspective projection
            const denom = FOV / (rz + Z_RANGE + FOV * 0.9);
            const sx = W / 2 + rx * denom;
            const sy = H / 2 + ry * denom;
            const depth = Math.max(0, Math.min(1, (rz + Z_RANGE) / (Z_RANGE * 2)));

            return { sx, sy, sc: denom, depth };
        }

        // ── Draw edge between two projected nodes ─────────────────────
        function drawEdge(
            ax: number, ay: number, bx: number, by: number,
            alpha: number, cA: string, cB: string
        ) {
            const g = ctx.createLinearGradient(ax, ay, bx, by);
            g.addColorStop(0, `rgba(${cA},${(alpha * 0.55).toFixed(2)})`);
            g.addColorStop(0.5, `rgba(255,255,255,${(alpha * 0.10).toFixed(2)})`);
            g.addColorStop(1, `rgba(${cB},${(alpha * 0.55).toFixed(2)})`);
            ctx.beginPath();
            ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
            ctx.strokeStyle = g;
            ctx.lineWidth = alpha > 0.4 ? 0.9 : 0.5;
            ctx.stroke();
        }

        // ── Draw node ─────────────────────────────────────────────────
        function drawNode(n: Node3D, t: number) {
            if (n.sx < -100 || n.sx > W + 100 || n.sy < -100 || n.sy > H + 100) return;

            const energy = 0.5 + 0.5 * Math.sin(t * 0.0011 + n.energyPhase);
            const totalE = Math.min(1, energy + n.cascading * 0.9) * n.depth;
            const r = n.radius * n.scale * (1 + n.cascading * 0.5);
            const glowR = r * TIER_GLOW[n.tier] * n.depth;
            const rgb = TIER_RGB[n.tier];

            if (glowR < 0.5) return;

            // Glow halo
            const glow = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, glowR);
            glow.addColorStop(0, `rgba(${rgb},${(totalE * 0.9).toFixed(2)})`);
            glow.addColorStop(0.4, `rgba(${rgb},${(totalE * 0.2).toFixed(2)})`);
            glow.addColorStop(1, `rgba(${rgb},0)`);
            ctx.beginPath(); ctx.arc(n.sx, n.sy, glowR, 0, Math.PI * 2);
            ctx.fillStyle = glow; ctx.fill();

            // Core dot
            ctx.beginPath(); ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb},${Math.min(1, totalE * 1.2).toFixed(2)})`;
            ctx.fill();

            // Specular highlight
            ctx.beginPath(); ctx.arc(n.sx, n.sy, r * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${(n.depth * 0.85).toFixed(2)})`;
            ctx.fill();
        }

        // ── Draw traveling pulse ──────────────────────────────────────
        function drawPulse(p: Pulse) {
            const a = nodes[p.fromIdx], b = nodes[p.toIdx];
            if (!a || !b) return;
            const x = lerp(a.sx, b.sx, p.progress);
            const y = lerp(a.sy, b.sy, p.progress);
            const depth = lerp(a.depth, b.depth, p.progress);
            const size = 12 * depth;

            const g = ctx.createRadialGradient(x, y, 0, x, y, size);
            g.addColorStop(0, `rgba(${p.color},${(p.alpha * 0.95).toFixed(2)})`);
            g.addColorStop(0.4, `rgba(${p.color},${(p.alpha * 0.4).toFixed(2)})`);
            g.addColorStop(1, `rgba(${p.color},0)`);
            ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = g; ctx.fill();

            ctx.beginPath(); ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${(p.alpha * depth).toFixed(2)})`;
            ctx.fill();
        }

        // ── Cascade event ─────────────────────────────────────────────
        function triggerCascade(now: number) {
            if (now - lastCascade < rand(3500, 7000)) return;
            lastCascade = now;
            const elite = nodes.filter(n => n.tier === "elite" || n.tier === "gold");
            if (!elite.length) return;
            const epi = elite[Math.floor(Math.random() * elite.length)];
            epi.cascading = 1.0;

            nodes.forEach((n, ni) => {
                const epicIdx = nodes.indexOf(epi);
                if (ni === epicIdx) return;
                const dx = n.wx - epi.wx, dy = n.wy - epi.wy, dz = n.wz - epi.wz;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < MAX_DIST3D * 2.2) {
                    setTimeout(() => {
                        n.cascading = Math.max(n.cascading, 1 - dist / (MAX_DIST3D * 2.2));
                        pulses.push({
                            fromIdx: epicIdx, toIdx: ni,
                            progress: 0, speed: rand(0.01, 0.025),
                            color: TIER_RGB[epi.tier], alpha: 0.95,
                        });
                    }, dist * 1.8);
                }
            });
        }

        // ── Ambient pulses ────────────────────────────────────────────
        function maybeEmitPulse(now: number) {
            if (now - lastPulse < 700 || Math.random() > 0.4) return;
            lastPulse = now;
            const ai = Math.floor(Math.random() * nodes.length);
            const a = nodes[ai];
            const candidates: number[] = [];
            nodes.forEach((n, ni) => {
                if (ni === ai) return;
                const dx = n.wx - a.wx, dy = n.wy - a.wy, dz = n.wz - a.wz;
                if (dx * dx + dy * dy + dz * dz < MAX_DIST3D * MAX_DIST3D * 0.65) candidates.push(ni);
            });
            if (!candidates.length) return;
            const bi = candidates[Math.floor(Math.random() * candidates.length)];
            const b = nodes[bi];
            pulses.push({
                fromIdx: ai, toIdx: bi, progress: 0,
                speed: rand(0.007, 0.020),
                color: TIER_RGB[a.score > b.score ? a.tier : b.tier],
                alpha: 0.75,
            });
        }

        // ── Main render loop ──────────────────────────────────────────
        function loop(t: number) {
            animId = requestAnimationFrame(loop);

            // Clear background to transparent so CSS gradient shows through
            ctx.clearRect(0, 0, W, H);

            // Advance camera rotation
            rotY += 0.0008;
            rotX = Math.sin(t * 0.00025) * 0.15;

            // Smooth mouse tilt (lerp toward target)
            tiltY = lerp(tiltY, mouse.nx * 0.35, 0.04);
            tiltX = lerp(tiltX, mouse.ny * 0.20, 0.04);

            triggerCascade(t);
            maybeEmitPulse(t);

            // Update node world positions + project to screen
            for (const n of nodes) {
                n.wx += n.vx; n.wy += n.vy; n.wz += n.vz;

                // Soft boundary: push back toward center
                const bW = W * 1.3, bH = H * 1.3;
                if (Math.abs(n.wx) > bW) n.vx -= Math.sign(n.wx) * 0.015;
                if (Math.abs(n.wy) > bH) n.vy -= Math.sign(n.wy) * 0.015;
                if (Math.abs(n.wz) > Z_RANGE * 1.5) n.vz -= Math.sign(n.wz) * 0.008;

                // Drag
                n.vx *= 0.999; n.vy *= 0.999; n.vz *= 0.999;

                // Project
                const { sx, sy, sc, depth } = project(n.wx, n.wy, n.wz);
                n.sx = sx; n.sy = sy; n.scale = sc; n.depth = depth;

                // Cascade decay
                if (n.cascading > 0) n.cascading = Math.max(0, n.cascading - n.cascadeDecay);
            }

            // Sort by depth (paint far-to-near for correct overlap)
            const sorted = [...nodes].sort((a, b) => a.depth - b.depth);

            // Draw edges (using sorted projected positions)
            ctx.save();
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = a.wx - b.wx, dy = a.wy - b.wy, dz = a.wz - b.wz;
                    const d3 = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (d3 > MAX_DIST3D) continue;
                    const proximity = 1 - d3 / MAX_DIST3D;
                    const depthFade = (a.depth + b.depth) * 0.5;
                    const alpha = proximity * 0.5 * depthFade;
                    if (alpha < 0.02) continue;
                    drawEdge(a.sx, a.sy, b.sx, b.sy, alpha, TIER_RGB[a.tier], TIER_RGB[b.tier]);
                }
            }
            ctx.restore();

            // Draw nodes back-to-front
            for (const n of sorted) drawNode(n, t);

            // Draw pulses
            pulses = pulses.filter(p => {
                p.progress += p.speed;
                p.alpha *= 0.993;
                if (p.progress >= 1 || p.alpha < 0.03) return false;
                drawPulse(p);
                return true;
            });
        }

        // ── Bootstrap ─────────────────────────────────────────────────
        init();
        animId = requestAnimationFrame(loop);

        const onMove = (e: MouseEvent) => {
            mouse.nx = (e.clientX / W - 0.5) * 2;  // -1..1
            mouse.ny = (e.clientY / H - 0.5) * 2;
        };
        const onLeave = () => { mouse.nx = 0; mouse.ny = 0; };
        const onResize = () => init();
        const onVisibility = () => {
            if (document.hidden) {
                cancelAnimationFrame(animId);
            } else {
                animId = requestAnimationFrame(loop);
            }
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseleave", onLeave);
        window.addEventListener("resize", onResize);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseleave", onLeave);
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0, left: 0,
                width: "100vw",
                height: "100vh",
                display: "block",
                zIndex: 0,
                pointerEvents: "none",
            }}
            aria-hidden="true"
        />
    );
}
