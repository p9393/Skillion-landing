"use client";

import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "#system", label: "The System" },
    { href: "#aurion", label: "Aurion" },
    { href: "#progression", label: "Progression" },
    { href: "#roadmap", label: "Roadmap" },
    { href: "#security", label: "Security" },
  ];

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      {/* Logo */}
      <a href="/" className="flex items-center gap-2.5 group">
        <svg
          width="36" height="36"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="nl1" x1="45" y1="88" x2="75" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d946ef" />
              <stop offset="45%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#00e5ff" />
            </linearGradient>
            <linearGradient id="nhB3" x1="17" y1="112" x2="103" y2="8" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d946ef" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="nh3G" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#d946ef" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </radialGradient>
            <filter id="nlg">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="nh3Glow">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Ambient glow */}
          <circle cx="60" cy="60" r="56" fill="url(#nh3G)" />
          {/* Hex body */}
          <path d="M60 9 L103.3 33 L103.3 87 L60 111 L16.7 87 L16.7 33 Z" fill="#07090f" />
          {/* 3 ascending chevrons */}
          <path d="M38 78 L60 55 L82 78" stroke="url(#nl1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#nlg)" opacity="0.45" />
          <path d="M38 64 L60 41 L82 64" stroke="url(#nl1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#nlg)" opacity="0.72" />
          <path d="M38 50 L60 27 L82 50" stroke="url(#nl1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#nlg)" />
          {/* Hex border */}
          <path d="M60 9 L103.3 33 L103.3 87 L60 111 L16.7 87 L16.7 33 Z" fill="none" stroke="url(#nhB3)" strokeWidth="1.6" filter="url(#nh3Glow)" />
          {/* Corner dots */}
          <circle cx="60" cy="9" r="2.2" fill="#00e5ff" opacity="0.9" />
          <circle cx="103.3" cy="33" r="2.2" fill="#818cf8" opacity="0.85" />
          <circle cx="103.3" cy="87" r="2.2" fill="#818cf8" opacity="0.65" />
          <circle cx="60" cy="111" r="2.2" fill="#d946ef" opacity="0.9" />
          <circle cx="16.7" cy="87" r="2.2" fill="#d946ef" opacity="0.65" />
          <circle cx="16.7" cy="33" r="2.2" fill="#00e5ff" opacity="0.75" />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold tracking-[0.12em] text-white">SKILLION</span>
          <span className="text-[8px] tracking-[0.28em] text-white/40 mt-0.5">FINANCE</span>
        </div>
      </a>

      {/* Desktop Nav links */}
      <nav className="hidden gap-7 md:flex" aria-label="Main navigation">
        {links.map(l => (
          <a key={l.href} href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
            {l.label}
          </a>
        ))}
      </nav>

      {/* Desktop CTA */}
      <a
        href="#waitlist"
        className="hidden md:inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
      >
        Request Invite →
      </a>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        onClick={() => setMenuOpen(o => !o)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span
          className="block h-[1.5px] w-5 bg-white/70 transition-all duration-200"
          style={{ transform: menuOpen ? "translateY(5px) rotate(45deg)" : undefined }}
        />
        <span
          className="block h-[1.5px] w-5 bg-white/70 transition-all duration-200"
          style={{ opacity: menuOpen ? 0 : 1 }}
        />
        <span
          className="block h-[1.5px] w-5 bg-white/70 transition-all duration-200"
          style={{ transform: menuOpen ? "translateY(-5px) rotate(-45deg)" : undefined }}
        />
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-40 border-t border-white/8 bg-[#07090f]/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-1 md:hidden">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-white/6 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#waitlist"
            onClick={() => setMenuOpen(false)}
            className="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white text-center hover:opacity-90 transition-opacity"
          >
            Request Invite →
          </a>
        </div>
      )}
    </header>
  );
}