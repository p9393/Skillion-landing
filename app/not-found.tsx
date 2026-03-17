'use client'

import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center text-white px-4 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7000FF]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full text-center relative z-10 space-y-8">
                {/* Logo */}
                <div className="flex justify-center">
                    <svg width="48" height="48" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="nf1" x1="45" y1="88" x2="75" y2="28" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#d946ef" />
                                <stop offset="45%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#00e5ff" />
                            </linearGradient>
                            <linearGradient id="nfB" x1="17" y1="112" x2="103" y2="8" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#d946ef" stopOpacity="0.85" />
                                <stop offset="50%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.9" />
                            </linearGradient>
                            <radialGradient id="nfG" cx="50%" cy="50%" r="55%">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                            </radialGradient>
                            <filter id="nfGlow">
                                <feGaussianBlur stdDeviation="3.5" result="b" />
                                <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                        <circle cx="60" cy="60" r="56" fill="url(#nfG)" />
                        <path d="M60 9 L103.3 33 L103.3 87 L60 111 L16.7 87 L16.7 33 Z" fill="#07090f" />
                        <path d="M38 78 L60 55 L82 78" stroke="url(#nf1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#nfGlow)" opacity="0.45" />
                        <path d="M38 64 L60 41 L82 64" stroke="url(#nf1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#nfGlow)" opacity="0.72" />
                        <path d="M38 50 L60 27 L82 50" stroke="url(#nf1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#nfGlow)" />
                        <path d="M60 9 L103.3 33 L103.3 87 L60 111 L16.7 87 L16.7 33 Z" fill="none" stroke="url(#nfB)" strokeWidth="1.6" />
                    </svg>
                </div>

                {/* 404 */}
                <div>
                    <p className="text-[6rem] font-thin leading-none bg-gradient-to-r from-indigo-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                        404
                    </p>
                    <h1 className="mt-2 text-2xl font-light text-white tracking-wide">
                        Page not found
                    </h1>
                    <p className="mt-3 text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
                        This signal doesn&apos;t exist in the protocol. The route you&apos;re looking for may have moved or was never created.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white/70 hover:bg-white/[0.08] transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>

                <p className="text-xs text-white/20">
                    SKILLION FINANCE · Merit over capital. Skill over hype.
                </p>
            </div>
        </div>
    )
}
