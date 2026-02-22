export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-white/10 bg-[#05060a]">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="grid gap-10 md:grid-cols-4">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-3">
                            <svg width="34" height="34" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="fl1" x1="45" y1="88" x2="75" y2="28" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#d946ef" /><stop offset="45%" stopColor="#818cf8" /><stop offset="100%" stopColor="#00e5ff" />
                                    </linearGradient>
                                    <linearGradient id="fhB3" x1="17" y1="112" x2="103" y2="8" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#d946ef" stopOpacity="0.85" /><stop offset="50%" stopColor="#818cf8" /><stop offset="100%" stopColor="#00e5ff" stopOpacity="0.9" />
                                    </linearGradient>
                                    <radialGradient id="fh3G" cx="50%" cy="50%" r="55%">
                                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" /><stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                                    </radialGradient>
                                    <filter id="flg"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                </defs>
                                <circle cx="60" cy="60" r="56" fill="url(#fh3G)" />
                                <path d="M60 9 L103.3 33 L103.3 87 L60 111 L16.7 87 L16.7 33 Z" fill="#07090f" />
                                <path d="M38 78 L60 55 L82 78" stroke="url(#fl1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#flg)" opacity="0.45" />
                                <path d="M38 64 L60 41 L82 64" stroke="url(#fl1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#flg)" opacity="0.72" />
                                <path d="M38 50 L60 27 L82 50" stroke="url(#fl1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#flg)" />
                                <path d="M60 9 L103.3 33 L103.3 87 L60 111 L16.7 87 L16.7 33 Z" fill="none" stroke="url(#fhB3)" strokeWidth="1.6" />
                            </svg>
                            <div>
                                <div className="text-sm font-semibold tracking-wide">SKILLION</div>
                                <div className="text-xs text-white/50">Finance</div>
                            </div>
                        </div>
                        <p className="mt-4 max-w-xs text-sm text-white/45 leading-relaxed">
                            A Reputation-Based Financial Infrastructure. Where verified skill becomes a measurable, portable financial asset.
                        </p>
                        <p className="mt-5 text-xs text-white/30 italic">
                            "Where Skill Becomes Capital."
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Product</div>
                        <ul className="space-y-2.5 text-sm text-white/55">
                            <li><a href="#system" className="hover:text-white/80 transition-colors">The System</a></li>
                            <li><a href="#aurion" className="hover:text-white/80 transition-colors">Aurion</a></li>
                            <li><a href="#roadmap" className="hover:text-white/80 transition-colors">Roadmap</a></li>
                            <li><a href="#waitlist" className="hover:text-white/80 transition-colors">Early Access</a></li>
                        </ul>
                    </div>

                    <div>
                        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Legal</div>
                        <ul className="space-y-2.5 text-sm text-white/55">
                            <li><a href="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-white/80 transition-colors">Terms of Use</a></li>
                            <li><a href="/disclaimer" className="hover:text-white/80 transition-colors">Disclaimer</a></li>
                            <li><a href="/cookies" className="hover:text-white/80 transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Contact</div>
                        <ul className="space-y-2.5 text-sm text-white/55">
                            <li>
                                <a
                                    href="mailto:contact@skillion.finance"
                                    className="flex items-center gap-2 hover:text-cyan-300 transition-colors group"
                                >
                                    <svg className="h-3.5 w-3.5 flex-shrink-0 group-hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <polyline points="2,4 12,13 22,4" />
                                    </svg>
                                    contact@skillion.finance
                                </a>
                            </li>
                            <li className="text-xs text-white/30 leading-relaxed">
                                For partnerships, press,<br />and general inquiries.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                    <p className="text-[11px] leading-relaxed text-white/30">
                        <span className="font-semibold text-white/40">Important Notice:</span>{" "}
                        Skillion Finance is a reputation analytics and gamification platform. It does not provide financial advice, manage client funds, or operate as a regulated financial institution. The Skillion Score is an algorithmic performance metric and does not constitute a guarantee of future results. All data shown on this platform is for informational purposes only. Users are responsible for their own trading decisions. Skillion Finance is not affiliated with any exchange, broker, or financial regulator.
                    </p>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-white/30">
                        © {year} Skillion Finance — All rights reserved.
                    </p>
                    <p className="text-xs text-white/25">
                        Built with discipline. Not hype.
                    </p>
                </div>
            </div>
        </footer>
    );
}
