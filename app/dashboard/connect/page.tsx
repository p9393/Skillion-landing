import Link from 'next/link'
import { FileUp, TrendingUp, Wallet, ArrowRightLeft, ShieldCheck } from 'lucide-react'

const connectOptions = [
    {
        id: 'broker',
        title: 'Traditional Broker',
        description: 'Upload statements or connect directly to traditional brokers (CFD, Futures, Stocks).',
        icon: TrendingUp,
        badge: 'Phase 1',
        verified: 'Statement Verified',
        href: '/dashboard/connect/broker',
        color: 'from-[#00F0FF]/10 to-transparent',
        iconColor: 'text-[#00F0FF]',
    },
    {
        id: 'upload',
        title: 'Universal Upload',
        description: 'Universal catch-all import for custom CSV statements or unsupported platforms data.',
        icon: FileUp,
        badge: 'Phase 1',
        verified: 'Statement Verified',
        href: '/dashboard/connect/broker', // Currently routing to universal broker upload
        color: 'from-white/10 to-transparent',
        iconColor: 'text-white/80',
    },
    {
        id: 'cefi',
        title: 'CeFi Exchange',
        description: 'Import trading history via read-only API from centralized exchanges like Binance, Bybit, OKX.',
        icon: ArrowRightLeft,
        badge: 'Phase 2',
        verified: 'API Verified',
        href: '#', // '/dashboard/connect/cefi'
        color: 'from-[#eab308]/10 to-transparent',
        iconColor: 'text-[#eab308]',
        disabled: true,
    },
    {
        id: 'defi',
        title: 'DeFi Wallet',
        description: 'Connect non-custodial wallets via Web3 Signature (MetaMask, WalletConnect) to analyze on-chain activity.',
        icon: Wallet,
        badge: 'Phase 3',
        verified: 'Signature Verified',
        href: '#', // '/dashboard/connect/defi'
        color: 'from-[#a855f7]/10 to-transparent',
        iconColor: 'text-[#a855f7]',
        disabled: true,
    }
]

export default function ConnectPage() {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-light text-white mb-2 tracking-wide">Universal Account Connection</h2>
                <p className="text-white/50 max-w-2xl leading-relaxed">
                    Skillion allows you to connect any type of trading or investment account securely.
                    Your data is used strictly for generating your Merit-based Reputation Score.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {connectOptions.map((option) => {
                    const Icon = option.icon
                    return (
                        <Link
                            key={option.id}
                            href={option.disabled ? '#' : option.href}
                            className={`block bg-[#1A2235]/40 border border-white/5 rounded-2xl p-6 transition-all relative overflow-hidden group ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1A2235]/60 hover:border-white/10 hover:shadow-xl hover:shadow-[#00F0FF]/5 hover:-translate-y-1'
                                }`}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${option.color} rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />

                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 ${option.iconColor}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                {option.badge && (
                                    <span className="text-[10px] uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5 text-white/50 font-medium">
                                        {option.badge}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-medium text-white/90 mb-2 relative z-10">{option.title}</h3>
                            <p className="text-sm text-white/50 leading-relaxed mb-6 line-clamp-2 relative z-10">
                                {option.description}
                            </p>

                            <div className="flex items-center justify-between border-t border-white/5 pt-4 relative z-10">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-[#00F0FF]/70" />
                                    <span className="text-xs font-medium text-[#00F0FF]/80 uppercase tracking-wider">{option.verified}</span>
                                </div>
                                {!option.disabled && (
                                    <span className="text-white/30 group-hover:text-white/70 transition-colors text-sm font-medium flex items-center gap-1">
                                        Connect <span className="text-lg leading-none">→</span>
                                    </span>
                                )}
                                {option.disabled && (
                                    <span className="text-white/30 text-xs font-medium uppercase tracking-wider">Coming Soon</span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
