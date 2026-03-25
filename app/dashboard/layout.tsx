'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { LayoutDashboard, Link as LinkIcon, Star, Settings, LogOut, ChevronRight, Menu, X, BarChart2, Wallet, Activity, Lightbulb, Award } from 'lucide-react'

const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Connected Accounts', href: '/dashboard/accounts', icon: Wallet },
    { label: 'Connect Data', href: '/dashboard/connect', icon: LinkIcon },
    { label: 'Trade History', href: '/dashboard/trades', icon: BarChart2 },
    { label: 'Reputation Score', href: '/dashboard/score', icon: Star },
    { label: 'Certifications', href: '/dashboard/certifications', icon: Award },
    { label: 'Score Timeline', href: '/dashboard/timeline', icon: Activity },
    { label: 'Insights', href: '/dashboard/insights', icon: Lightbulb },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]


// NavContent extracted as a top-level component to avoid "component defined during render" lint error
function NavContent({
    pathname,
    onNavClick,
    onSignOut,
}: {
    pathname: string
    onNavClick: () => void
    onSignOut: () => void
}) {
    return (
        <>
            <nav className="p-4 space-y-2 mt-4 flex-1">
                {navItems.map((item) => {
                    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavClick}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active
                                ? 'bg-gradient-to-r from-[#00F0FF]/10 to-transparent border border-[#00F0FF]/20 text-white'
                                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${active ? 'text-[#00F0FF]' : 'text-current'}`} strokeWidth={active ? 2 : 1.5} />
                                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                            </div>
                            {active && <ChevronRight className="w-4 h-4 text-[#00F0FF]/50" />}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button
                    onClick={onSignOut}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium tracking-wide"
                >
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                    <span>Sign Out</span>
                </button>
            </div>
        </>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
        router.refresh()
    }

    const closeMobile = () => setMobileOpen(false)

    const pageTitle = pathname.split('/').filter(Boolean).pop() || 'overview'

    return (
        <div className="min-h-screen bg-[#070B14] flex text-white relative overflow-hidden">
            {/* Background glow */}
            <div className="fixed top-[10%] left-[5%] w-[300px] h-[300px] bg-[#00F0FF]/5 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="fixed bottom-[10%] right-[10%] w-[300px] h-[300px] bg-[#7000FF]/5 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────── */}
            <aside className="hidden md:flex w-64 border-r border-white/5 bg-[#0A0F1A]/50 backdrop-blur-xl flex-col z-10 relative">
                <div className="h-20 flex items-center px-8 border-b border-white/5 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#7000FF] p-[1px]">
                            <div className="w-full h-full bg-[#070B14] rounded-lg flex items-center justify-center group-hover:bg-transparent transition-colors">
                                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">S</span>
                            </div>
                        </div>
                        <span className="text-xl font-light tracking-widest text-white/90">SKILLION</span>
                    </Link>
                </div>
                <div className="flex flex-col flex-1">
                    <NavContent pathname={pathname} onNavClick={closeMobile} onSignOut={handleSignOut} />
                </div>
            </aside>

            {/* ── MOBILE SIDEBAR OVERLAY ───────────────────────────────────── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={closeMobile} />
            )}
            <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0A0F1A] border-r border-white/5 z-40 flex flex-col transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-3" onClick={closeMobile}>
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#7000FF] p-[1px]">
                            <div className="w-full h-full bg-[#070B14] rounded-lg flex items-center justify-center">
                                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 text-sm">S</span>
                            </div>
                        </div>
                        <span className="text-lg font-light tracking-widest text-white/90">SKILLION</span>
                    </Link>
                    <button
                        onClick={closeMobile}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close navigation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-col flex-1 overflow-y-auto">
                    <NavContent pathname={pathname} onNavClick={closeMobile} onSignOut={handleSignOut} />
                </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
            <main className="flex-1 relative z-10 flex flex-col h-screen overflow-y-auto">
                {/* Top Header */}
                <div className="h-16 md:h-20 border-b border-white/5 bg-[#0A0F1A]/30 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
                    <button
                        className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors mr-2"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                        type="button"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <h1 className="text-lg md:text-xl font-light tracking-wide text-white/90 capitalize">
                        {pageTitle.replace(/-/g, ' ')}
                    </h1>

                    <div className="flex items-center gap-3">
                        <div className="bg-[#1A2235]/50 border border-white/10 px-3 md:px-4 py-1.5 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]" />
                            <span className="text-xs font-mono text-[#00F0FF]/90 uppercase tracking-widest hidden sm:block">Aurion Active</span>
                            <span className="text-xs font-mono text-[#00F0FF]/90 sm:hidden">AI</span>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
