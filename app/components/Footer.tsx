"use client";

import Link from "next/link";
import { useTranslation } from "../i18n/LanguageContext";

export default function Footer() {
    const { t } = useTranslation();
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
                        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 w-fit">
                            <div className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </div>
                            <span className="text-xs font-medium text-emerald-400">{t("footer.status")}</span>
                        </div>
                        <p className="mt-4 max-w-xs text-sm text-white/45 leading-relaxed">
                            {t("footer.description")}
                        </p>
                        <p className="mt-5 text-xs text-white/30 italic">
                            {t("footer.tagline")}
                        </p>
                    </div>
                </div>

                {/* Links Columns */}
                <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-4 px-6 md:px-12">
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">{t("footer.col1_title")}</h4>
                        <ul className="space-y-3 text-sm text-white/50">
                            <li><Link href="#how-it-works" className="hover:text-cyan-400 transition-colors">{t("footer.col1_item1")}</Link></li>
                            <li><Link href="#score" className="hover:text-cyan-400 transition-colors">{t("footer.col1_item2")}</Link></li>
                            <li><Link href="#aurion" className="hover:text-cyan-400 transition-colors">{t("footer.col1_item3")}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">{t("footer.col2_title")}</h4>
                        <ul className="space-y-3 text-sm text-white/50">
                            <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">{t("footer.col2_item1")}</Link></li>
                            <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">{t("footer.col2_item2")}</Link></li>
                            <li><Link href="/methodology" className="hover:text-cyan-400 transition-colors">{t("footer.col2_item3")}</Link></li>
                            <li><Link href="/security" className="hover:text-cyan-400 transition-colors">{t("footer.col2_item4")}</Link></li>
                            <li><a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">{t("footer.col2_item5")}</a></li>
                        </ul>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold text-white mb-4">{t("footer.contact_title")}</h4>
                        <ul className="space-y-2.5 text-sm text-white/55">
                            <li>
                                <a
                                    href="mailto:info@skillion.finance"
                                    className="flex items-center gap-2 hover:text-cyan-300 transition-colors group"
                                >
                                    <svg className="h-3.5 w-3.5 flex-shrink-0 group-hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <polyline points="2,4 12,13 22,4" />
                                    </svg>
                                    info@skillion.finance
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://discord.com/channels/1485968255037214890/1485968255804899422"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 hover:text-indigo-400 transition-colors group"
                                >
                                    <svg className="h-4 w-4 flex-shrink-0 group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                                    </svg>
                                    Join Discord
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://t.me/Skillion_Finance"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 hover:text-[#29A8E0] transition-colors group"
                                >
                                    <svg className="h-4 w-4 flex-shrink-0 group-hover:text-[#29A8E0] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                    </svg>
                                    Join Telegram
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                    <p className="text-[11px] leading-relaxed text-white/30">
                        <span className="font-semibold text-white/40">{t("footer.disclaimer_important_notice")}:</span>{" "}
                        {t("footer.disclaimer_text")}
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
