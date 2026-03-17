import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, TrendingDown, BarChart2, AlertCircle } from 'lucide-react'

interface Trade {
    id: string
    symbol: string
    trade_type: 'buy' | 'sell'
    lots: number
    open_time: string | null
    close_time: string | null
    open_price: number
    close_price: number
    profit: number
    commission: number
    swap: number
    platform: string
    mt_login: string
}

function fmt(n: number, decimals = 2): string {
    return (n >= 0 ? '+' : '') + n.toFixed(decimals)
}

function netPnl(t: Trade): number {
    return t.profit + (t.commission || 0) + (t.swap || 0)
}

export default async function TradesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: trades, error } = await supabase
        .from('mt4_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('close_time', { ascending: false })
        .limit(500)

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-white/50 text-sm">Failed to load trade history. Try again later.</p>
            </div>
        )
    }

    if (!trades || trades.length === 0) {
        return (
            <div className="max-w-lg mx-auto text-center py-20 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mx-auto">
                    <BarChart2 className="w-8 h-8 text-[#00F0FF]" />
                </div>
                <h2 className="text-2xl font-light text-white">No trades yet</h2>
                <p className="text-white/40 text-sm leading-relaxed">
                    Upload your MT4/MT5 statement from the Connect page to populate your trade history.
                </p>
                <a href="/dashboard/connect" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium hover:bg-[#00F0FF]/20 transition-colors">
                    Go to Connect →
                </a>
            </div>
        )
    }

    // Compute summary stats
    const pnls = trades.map(t => netPnl(t as Trade))
    const totalPnl = pnls.reduce((a, b) => a + b, 0)
    const winners = trades.filter(t => netPnl(t as Trade) > 0)
    const losers = trades.filter(t => netPnl(t as Trade) < 0)
    const winRate = Math.round((winners.length / trades.length) * 100)
    const avgWin = winners.length > 0 ? winners.reduce((a, t) => a + netPnl(t as Trade), 0) / winners.length : 0
    const avgLoss = losers.length > 0 ? losers.reduce((a, t) => a + netPnl(t as Trade), 0) / losers.length : 0
    const symbols = [...new Set(trades.map(t => t.symbol?.toUpperCase() || 'UNKNOWN'))]

    return (
        <div className="space-y-6 pb-16">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-light text-white tracking-wide mb-1">Trade History</h2>
                <p className="text-white/40 text-sm">{trades.length} closed trades · {symbols.length} instruments</p>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Net P&L', value: `${fmt(totalPnl, 0)}`, good: totalPnl > 0 },
                    { label: 'Win Rate', value: `${winRate}%`, good: winRate >= 50 },
                    { label: 'Avg Winner', value: `${fmt(avgWin, 0)}`, good: true },
                    { label: 'Avg Loser', value: `${fmt(avgLoss, 0)}`, good: false },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#0d1220]/60 border border-white/5 rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1">{stat.label}</p>
                        <p className={`text-xl font-light ${stat.good
                            ? (stat.value.startsWith('+') || !stat.value.startsWith('-') ? 'text-emerald-400' : 'text-red-400')
                            : 'text-red-400'
                            }`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Symbol legend */}
            <div className="flex flex-wrap gap-2">
                {symbols.slice(0, 12).map(sym => (
                    <span key={sym} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-xs text-white/50 font-mono">
                        {sym}
                    </span>
                ))}
                {symbols.length > 12 && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-xs text-white/30">
                        +{symbols.length - 12} more
                    </span>
                )}
            </div>

            {/* Trade Table */}
            <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-white/70">
                        <thead className="bg-white/[0.04] text-[10px] uppercase text-white/30 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider">Symbol</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider">Lots</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider hidden md:table-cell">Entry</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider hidden md:table-cell">Exit</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider hidden lg:table-cell">Open Price</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider hidden lg:table-cell">Close Price</th>
                                <th className="px-4 py-3 text-right font-semibold tracking-wider">Net P&L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {trades.map((trade) => {
                                const net = netPnl(trade as Trade)
                                const isWin = net > 0
                                return (
                                    <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-white/80">
                                            {trade.symbol?.toUpperCase() || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${trade.trade_type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {trade.trade_type === 'buy'
                                                    ? <TrendingUp className="w-3 h-3" />
                                                    : <TrendingDown className="w-3 h-3" />
                                                }
                                                {trade.trade_type?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-white/50 font-mono">{trade.lots}</td>
                                        <td className="px-4 py-3 text-xs text-white/35 hidden md:table-cell">
                                            {trade.open_time ? new Date(trade.open_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-white/35 hidden md:table-cell">
                                            {trade.close_time ? new Date(trade.close_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-white/40 font-mono hidden lg:table-cell">{trade.open_price}</td>
                                        <td className="px-4 py-3 text-xs text-white/40 font-mono hidden lg:table-cell">{trade.close_price}</td>
                                        <td className={`px-4 py-3 text-right font-mono text-sm font-medium ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {fmt(net)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-white/5 flex justify-between text-xs text-white/30">
                    <span>Showing {trades.length} trades (max 500)</span>
                    <span>{winners.length}W / {losers.length}L</span>
                </div>
            </div>
        </div>
    )
}
