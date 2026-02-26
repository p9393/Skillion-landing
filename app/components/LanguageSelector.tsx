"use client";

import { useTranslation } from "../i18n/LanguageContext";
import { useState, useRef, useEffect } from "react";

const languages = [
    { code: "en", label: "English" },
    { code: "it", label: "Italiano" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
] as const;

type LangCode = typeof languages[number]["code"];

export default function LanguageSelector() {
    const { lang, setLang } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative z-50">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70 hover:bg-white/10 hover:text-white transition-all"
                aria-label="Select Language"
            >
                {lang}
                <svg
                    className={`h-3 w-3 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#090b14]/95 backdrop-blur-xl shadow-xl">
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {languages.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => {
                                    setLang(l.code as LangCode);
                                    setOpen(false);
                                }}
                                className={`flex items-center justify-between rounded-md px-3 py-2 text-xs transition-colors ${lang === l.code
                                        ? "bg-white/10 text-white font-semibold"
                                        : "text-white/60 hover:bg-white/5 hover:text-white/90"
                                    }`}
                            >
                                <span>{l.label}</span>
                                {lang === l.code && <span className="text-[10px] text-cyan-400">●</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
