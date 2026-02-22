"use client";

import { useEffect, useRef, useState } from "react";

const platforms = [
    {
        id: "cefi",
        icon: "⬡",
        title: "CeFi Exchanges",
        subtitle: "API Read-Only",
        description:
            "Connect major centralised exchanges via secure, read-only API keys. We request only market data and trade history — never withdrawal permissions.",
        examples: ["Binance", "Bybit", "OKX", "Kraken", "Coinbase", "+ more"],
        trustNote: "Read-only API · Zero withdrawal access",
        accent: "from-cyan-500 to-sky-500",
        accentRGB: "34,211,238",
        border: "border-cyan-400/15",
    },
    {
        id: "defi",
        icon: "◈",
        title: "DeFi Wallets",
        subtitle: "Non-Custodial · WalletConnect",
        description:
            "Verify on-chain activity through a simple wallet signature. No seed phrase, no private key, no custody transfer — just cryptographic proof of wallet ownership.",
        examples: ["MetaMask", "WalletConnect", "Phantom", "Ledger", "Trezor", "+ more"],
        trustNote: "Signature only · Non-custodial",
        accent: "from-indigo-500 to-violet-500",
        accentRGB: "129,140,248",
        border: "border-indigo-400/15",
    },
    {
        id: "broker",
        icon: "▣",
        title: "Traditional Brokers",
        subtitle: "Multi-asset · Regulated Markets",
        description:
            "Skillion is not crypto-only. Connect equity, futures, and forex accounts from traditional brokers for full cross-asset performance evaluation.",
        examples: ["MetaTrader 4/5", "Interactive Brokers", "cTrader", "Tradestation", "IBKR", "+ more"],
        trustNote: "Read-only data sync · Regulated",
        accent: "from-violet-500 to-fuchsia-500",
        accentRGB: "167,139,250",
        border: "border-violet-400/15",
    },
    {
        id: "upload",
        icon: "⊞",
        title: "Statement Upload",
        subtitle: "Universal · CSV · PDF",
        description:
            "No supported integration? Upload your broker statement directly. Our parser normalises trades across formats into the standard Skillion data model.",
        examples: ["CSV export", "PDF statement", "Excel sheet", "MT4 report", "Any format", ""],
        trustNote: "Encrypted upload · Processed server-side",
        accent: "from-fuchsia-500 to-pink-500",
        accentRGB: "217,70,239",
        border: "border-fuchsia-400/15",
    },
];

function PlatformCard({
    p,
    index,
    visible,
}: {
    p: (typeof platforms)[0];
    index: number;
    visible: boolean;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={`relative flex flex-col rounded-3xl border bg-[#06080f]/80 p-7 backdrop-blur-xl transition-all duration-500 ${p.border}`}
            style={{
                transitionDelay: `${index * 100}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                boxShadow: hovered ? `0 0 40px -12px rgba(${p.accentRGB},0.20)` : "none",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Icon + badge */}
            <div className="flex items-start justify-between mb-5">
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${p.accent} text-xl text-white shadow-lg`}
                >
                    {p.icon}
                </div>
                <span
                    className="rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
                    style={{
                        borderColor: `rgba(${p.accentRGB},0.25)`,
                        color: `rgba(${p.accentRGB},0.8)`,
                        background: `rgba(${p.accentRGB},0.06)`,
                    }}
                >
                    {p.subtitle.split("·")[0].trim()}
                </span>
            </div>

            <h3 className="text-xl font-semibold text-white">{p.title}</h3>
            <p className="mt-1 text-xs text-white/35 uppercase tracking-wider">{p.subtitle}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/50">{p.description}</p>

            {/* Example tags */}
            <div className="mt-5 flex flex-wrap gap-1.5">
                {p.examples.filter(Boolean).map((ex) => (
                    <span
                        key={ex}
                        className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/50"
                    >
                        {ex}
                    </span>
                ))}
            </div>

            {/* Trust note */}
            <div className="mt-auto pt-5">
                <hr className="border-white/6 mb-4" />
                <p className="text-[11px] text-white/35">🔒 {p.trustNote}</p>
            </div>
        </div>
    );
}

export default function ConnectAccountsSection() {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) { setVisible(true); return; }
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.06 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <section
            id="connect"
            ref={ref}
            className="mx-auto max-w-6xl px-6 py-24"
        >
            {/* Header */}
            <div
                className="mb-16 text-center transition-all duration-700"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)" }}
            >
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Integrations</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
                    No trader{" "}
                    <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                        excluded.
                    </span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-white/45 leading-relaxed">
                    Crypto, DeFi, equities, futures, forex — Skillion evaluates performance across all asset classes
                    and platforms with a unified scoring model.
                </p>
            </div>

            {/* Cards grid */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {platforms.map((p, i) => (
                    <PlatformCard key={p.id} p={p} index={i} visible={visible} />
                ))}
            </div>

            {/* Bottom tagline */}
            <div
                className="mt-12 rounded-2xl border border-white/6 bg-white/[0.02] px-8 py-5 text-center transition-all duration-700 delay-500"
                style={{ opacity: visible ? 1 : 0 }}
            >
                <p className="text-sm text-white/50">
                    All connections are{" "}
                    <span className="text-white/75 font-medium">read-only</span>.
                    {" "}Skillion never holds, moves, or controls your funds.
                    {" "}<span className="text-white/75 font-medium">Ever.</span>
                </p>
            </div>
        </section>
    );
}
