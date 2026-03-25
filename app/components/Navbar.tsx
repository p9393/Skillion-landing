'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import LanguageSelector from './LanguageSelector'
import { useTranslation } from '../i18n/LanguageContext'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { t } = useTranslation()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const links = [
    { href: '#system', label: t('navbar.system') },
    { href: '#aurion', label: t('navbar.aurion') },
    { href: '#progression', label: t('navbar.progression') },
    { href: '#roadmap', label: t('navbar.roadmap') },
    { href: '#security', label: t('navbar.security') },
  ]

  const ctaHref = isLoggedIn ? '/dashboard' : '/auth/login'
  const ctaLabel = isLoggedIn ? 'Dashboard' : t('navbar.launch_app')

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

      {/* Desktop CTA and Language Selector */}
      <div className="hidden md:flex items-center gap-4">
        <a
          href="https://discord.com/channels/1485968255037214890/1485968255804899422"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-[#5865F2] transition-colors"
          aria-label="Join Discord"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
          </svg>
        </a>
        <LanguageSelector />
        <a
          href={ctaHref}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all font-sans ring-1 ${isLoggedIn
              ? 'bg-gradient-to-r from-[#00F0FF]/15 to-[#7000FF]/15 ring-[#00F0FF]/25 hover:from-[#00F0FF]/25 hover:to-[#7000FF]/25'
              : 'bg-white/10 ring-white/10 hover:bg-white/20'
            }`}
        >
          {isLoggedIn && (
            <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#00F0FF] align-middle" />
          )}
          {ctaLabel}
        </a>
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        onClick={() => setMenuOpen(o => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        <span
          className="block h-[1.5px] w-5 bg-white/70 transition-all duration-200"
          style={{ transform: menuOpen ? 'translateY(5px) rotate(45deg)' : undefined }}
        />
        <span
          className="block h-[1.5px] w-5 bg-white/70 transition-all duration-200"
          style={{ opacity: menuOpen ? 0 : 1 }}
        />
        <span
          className="block h-[1.5px] w-5 bg-white/70 transition-all duration-200"
          style={{ transform: menuOpen ? 'translateY(-5px) rotate(-45deg)' : undefined }}
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
            href="https://discord.com/channels/1485968255037214890/1485968255804899422"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-[#5865F2]/10 hover:text-[#5865F2] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
            Discord Community
          </a>
          <a
            href={ctaHref}
            onClick={() => setMenuOpen(false)}
            className="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white text-center hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
          </a>
        </div>
      )}
    </header>
  )
}