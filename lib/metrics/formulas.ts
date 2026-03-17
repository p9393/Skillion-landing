/**
 * Metrics Formulas — Pure Functions
 * All functions are stateless and deterministic.
 * No I/O, no side effects. Safe to unit test in isolation.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

export function mean(arr: number[]): number {
    if (arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function stddev(arr: number[]): number {
    if (arr.length < 2) return 0
    const m = mean(arr)
    const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1)
    return Math.sqrt(variance)
}

export function round2(n: number): number {
    return Math.round(n * 100) / 100
}

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n))
}

function skewness(arr: number[]): number {
    if (arr.length < 3) return 0
    const m = mean(arr)
    const s = stddev(arr)
    if (s === 0) return 0
    const n = arr.length
    const sum = arr.reduce((acc, x) => acc + ((x - m) / s) ** 3, 0)
    return round2((n / ((n - 1) * (n - 2))) * sum)
}

function kurtosis(arr: number[]): number {
    if (arr.length < 4) return 0
    const m = mean(arr)
    const s = stddev(arr)
    if (s === 0) return 0
    const n = arr.length
    const sum = arr.reduce((acc, x) => acc + ((x - m) / s) ** 4, 0)
    return round2(sum / n - 3) // excess kurtosis
}

// ─── Returns ────────────────────────────────────────────────────────────────

/** Sharpe Ratio annualized — based on daily returns */
export function sharpe(dailyReturns: number[]): number {
    if (dailyReturns.length < 10) return 0
    const μ = mean(dailyReturns)
    const σ = stddev(dailyReturns)
    if (σ === 0) return μ > 0 ? 3 : 0
    return round2((μ / σ) * Math.sqrt(252))
}

/** Sortino Ratio annualized — penalizes only downside deviation */
export function sortino(dailyReturns: number[]): number {
    if (dailyReturns.length < 10) return 0
    const μ = mean(dailyReturns)
    const downs = dailyReturns.filter(r => r < 0)
    const σd = downs.length >= 2 ? stddev(downs) : 0
    if (σd === 0) return μ > 0 ? 5 : 0
    return round2((μ / σd) * Math.sqrt(252))
}

/** Calmar Ratio — annualized return / max drawdown */
export function calmar(totalReturnPct: number, maxDrawdownPct: number, days: number): number {
    if (maxDrawdownPct <= 0 || days < 30) return 0
    const annualizedReturn = totalReturnPct * (365 / days)
    return round2(annualizedReturn / maxDrawdownPct)
}

/** Daily volatility annualized */
export function volatilityAnnualized(dailyReturns: number[]): number {
    if (dailyReturns.length < 5) return 0
    return round2(stddev(dailyReturns) * Math.sqrt(252))
}

// ─── Risk ───────────────────────────────────────────────────────────────────

/** Max Drawdown — peak-to-trough on equity curve */
export function maxDrawdown(equityCurve: number[]): { pct: number; abs: number } {
    if (equityCurve.length < 2) return { pct: 0, abs: 0 }
    let peak = equityCurve[0]
    let maxDD = 0
    let maxDDAbs = 0

    for (const eq of equityCurve) {
        if (eq > peak) peak = eq
        const dd = peak > 0 ? (peak - eq) / peak : 0
        const ddAbs = peak - eq
        if (dd > maxDD) { maxDD = dd; maxDDAbs = ddAbs }
    }
    return { pct: round2(maxDD), abs: round2(maxDDAbs) }
}

/** Average Drawdown — mean of all drawdown periods */
export function avgDrawdown(equityCurve: number[]): number {
    if (equityCurve.length < 2) return 0
    const drawdowns: number[] = []
    let peak = equityCurve[0]

    for (const eq of equityCurve) {
        if (eq > peak) { peak = eq; continue }
        if (peak > 0) drawdowns.push((peak - eq) / peak)
    }
    return round2(drawdowns.length > 0 ? mean(drawdowns) : 0)
}

/** CVaR 95% — Expected loss in worst 5% of days */
export function cvar95(dailyReturns: number[]): number {
    if (dailyReturns.length < 20) return 0
    const sorted = [...dailyReturns].sort((a, b) => a - b)
    const cutoff = Math.max(1, Math.floor(sorted.length * 0.05))
    return round2(mean(sorted.slice(0, cutoff)))
}

// ─── Trade Stats ─────────────────────────────────────────────────────────────

export interface TradeStats {
    totalTrades: number
    winCount: number
    lossCount: number
    winRate: number
    grossProfit: number
    grossLoss: number
    profitFactor: number
    avgWinUsd: number
    avgLossUsd: number
    winLossRatio: number
    avgHoldingSecs: number
    totalPnl: number
    totalFees: number
    totalFunding: number
}

export function computeTradeStats(trades: {
    net_pnl: number
    realized_pnl: number
    fee: number
    funding: number
    is_closed: boolean
    holding_secs: number | null
}[]): TradeStats {
    const closed = trades.filter(t => t.is_closed)
    const wins = closed.filter(t => t.net_pnl > 0)
    const losses = closed.filter(t => t.net_pnl < 0)

    const grossProfit = wins.reduce((s, t) => s + t.net_pnl, 0)
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.net_pnl, 0))
    const totalFees = closed.reduce((s, t) => s + (t.fee ?? 0), 0)
    const totalFunding = closed.reduce((s, t) => s + (t.funding ?? 0), 0)

    const holdingTimes = closed
        .map(t => t.holding_secs)
        .filter((s): s is number => s !== null && s > 0)

    return {
        totalTrades: closed.length,
        winCount: wins.length,
        lossCount: losses.length,
        winRate: closed.length > 0 ? round2(wins.length / closed.length) : 0,
        grossProfit: round2(grossProfit),
        grossLoss: round2(grossLoss),
        profitFactor: grossLoss > 0 ? round2(grossProfit / grossLoss) : (grossProfit > 0 ? 10 : 0),
        avgWinUsd: wins.length > 0 ? round2(grossProfit / wins.length) : 0,
        avgLossUsd: losses.length > 0 ? round2(grossLoss / losses.length) : 0,
        winLossRatio: losses.length > 0 && wins.length > 0
            ? round2((grossProfit / wins.length) / (grossLoss / losses.length))
            : 0,
        avgHoldingSecs: holdingTimes.length > 0 ? Math.round(mean(holdingTimes)) : 0,
        totalPnl: round2(grossProfit - grossLoss),
        totalFees: round2(totalFees),
        totalFunding: round2(totalFunding),
    }
}

// ─── Behavioral ─────────────────────────────────────────────────────────────

/**
 * Herfindahl-Hirschman Index — asset concentration.
 * 0 = fully diversified, 1 = all in one asset.
 */
export function hhi(symbolPnlMap: Record<string, number>): number {
    const values = Object.values(symbolPnlMap).map(Math.abs)
    const total = values.reduce((a, b) => a + b, 0)
    if (total === 0) return 0
    return round2(values.reduce((sum, v) => sum + (v / total) ** 2, 0))
}

/** Trade frequency per calendar day */
export function tradeFrequency(tradeCount: number, periodDays: number): number {
    if (periodDays <= 0) return 0
    return round2(tradeCount / periodDays)
}

/** Fees drag — what % of gross profit was eaten by fees */
export function feesDrag(totalFees: number, grossProfit: number): number {
    if (grossProfit <= 0) return 1
    return round2(clamp(totalFees / grossProfit, 0, 1))
}

/** Funding drag — % of gross profit spent on funding */
export function fundingDrag(totalFunding: number, grossProfit: number): number {
    if (grossProfit <= 0) return 0
    return round2(clamp(Math.abs(totalFunding) / grossProfit, 0, 1))
}

/** Coefficient of variation of daily returns — lower = more consistent */
export function coefficientOfVariation(dailyReturns: number[]): number {
    if (dailyReturns.length < 5) return 3 // worst case default
    const m = mean(dailyReturns)
    const s = stddev(dailyReturns)
    if (Math.abs(m) < 0.0001) return s > 0 ? 3 : 0
    return round2(Math.abs(s / m))
}

/** Positive days percentage */
export function positiveDaysPct(dailyReturns: number[]): number {
    if (dailyReturns.length === 0) return 0
    return round2(dailyReturns.filter(r => r > 0).length / dailyReturns.length)
}

/** Leverage metrics */
export function leverageStats(leverages: number[]): { avg: number; max: number } {
    const valid = leverages.filter(l => l != null && l > 0)
    return {
        avg: valid.length > 0 ? round2(mean(valid)) : 0,
        max: valid.length > 0 ? round2(Math.max(...valid)) : 0,
    }
}

/** Full stats bundle — calls all formulas */
export function computeAllMetrics(input: {
    trades: { net_pnl: number; realized_pnl: number; fee: number; funding: number; is_closed: boolean; holding_secs: number | null; symbol: string; leverage: number | null }[]
    equityCurve: number[]     // ending_balance per day
    dailyReturns: number[]    // daily_return per day
    periodDays: number
}): Record<string, number> {
    const { trades, equityCurve, dailyReturns, periodDays } = input
    const ts = computeTradeStats(trades)
    const dd = maxDrawdown(equityCurve)
    const symbolPnlMap: Record<string, number> = {}
    for (const t of trades) {
        symbolPnlMap[t.symbol] = (symbolPnlMap[t.symbol] ?? 0) + t.net_pnl
    }
    const levs = trades.map(t => t.leverage).filter((l): l is number => l != null)
    const levStats = leverageStats(levs)

    return {
        total_trades: ts.totalTrades,
        total_pnl: ts.totalPnl,
        gross_profit: ts.grossProfit,
        gross_loss: ts.grossLoss,
        win_count: ts.winCount,
        loss_count: ts.lossCount,
        win_rate: ts.winRate,
        profit_factor: ts.profitFactor,
        max_drawdown_pct: dd.pct,
        avg_drawdown_pct: avgDrawdown(equityCurve),
        max_drawdown_abs: dd.abs,
        sharpe_ratio: sharpe(dailyReturns),
        sortino_ratio: sortino(dailyReturns),
        calmar_ratio: calmar(ts.totalPnl, dd.pct, periodDays),
        daily_vol_annualized: volatilityAnnualized(dailyReturns),
        avg_win_usd: ts.avgWinUsd,
        avg_loss_usd: ts.avgLossUsd,
        win_loss_ratio: ts.winLossRatio,
        avg_holding_secs: ts.avgHoldingSecs,
        fees_drag_pct: feesDrag(ts.totalFees, ts.grossProfit),
        funding_drag_pct: fundingDrag(ts.totalFunding, ts.grossProfit),
        avg_leverage: levStats.avg,
        max_leverage: levStats.max,
        concentration_hhi: hhi(symbolPnlMap),
        trade_freq_per_day: tradeFrequency(ts.totalTrades, periodDays),
        cvar_95: cvar95(dailyReturns),
        skewness: skewness(dailyReturns),
        kurtosis: kurtosis(dailyReturns),
        z_score_cv: coefficientOfVariation(dailyReturns),
        positive_days_pct: positiveDaysPct(dailyReturns),
    }
}
