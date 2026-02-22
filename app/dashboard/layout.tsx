'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Link as LinkIcon, Star, Settings, LogOut, ChevronRight } from 'lucide-react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
        router.refresh()
    }

    const navItems = [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Connect Sources', href: '/dashboard/connect', icon: LinkIcon },
        { label: 'Reputation Score', href: '/dashboard/score', icon: Star },
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-[#070B14] flex text-white relative overflow-hidden">
            {/* Background glow elements */}
            <div className="fixed top-[10%] left-[5%] w-[300px] h-[300px] bg-[#00F0FF]/5 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="fixed bottom-[10%] right-[10%] w-[300px] h-[300px] bg-[#7000FF]/5 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-white/5 bg-[#0A0F1A]/50 backdrop-blur-xl flex flex-col justify-between z-10 relative">
                <div>
                    {/* Logo Area */}
                    <div className="h-20 flex items-center px-8 border-b border-white/5">
                        <Link href="/" className="flex items-center gap-3 group">
                            {/* Simple Logo Placeholder (or use actual SVG) */}
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#7000FF] p-[1px]">
                                <div className="w-full h-full bg-[#070B14] rounded-lg flex items-center justify-center group-hover:bg-transparent transition-colors">
                                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">S</span>
                                </div>
                            </div>
                            <span className="text-xl font-light tracking-widest text-white/90">SKILLION</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-4 space-y-2 mt-4">
                        {navItems.map((item) => {
                            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
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
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium tracking-wide"
                    >
                        <LogOut className="w-5 h-5" strokeWidth={1.5} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 flex flex-col h-screen overflow-y-auto custom-scrollbar">
                {/* Top Header Bar */}
                <header className="h-20 border-b border-white/5 bg-[#0A0F1A]/30 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20">
                    <h1 className="text-xl font-light tracking-wide text-white/90 capitalize">
                        {pathname.split('/').pop() || 'Overview'}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="bg-[#1A2235]/50 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]"></div>
                            <span className="text-xs font-mono text-[#00F0FF]/90 uppercase tracking-widest">Aurion Active</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
