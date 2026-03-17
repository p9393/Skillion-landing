/**
 * Skillion Discipline Index (SDI) Engine v2
 * Computes a 0–1000 reputation score from raw trade data.
 *
 * 7 Weighted Dimensions:
 *  1. Sharpe Ratio          (20%) — risk-adjusted return annualized
 *  2. Sortino Ratio         (20%) — downside risk penalized
 *  3. Max Drawdown          (20%) — peak-to-trough, heavily penalized
 *  4. Win Rate              (10%) — profitable trades ratio
 *  5. Z-Score Consistency   (15%) — daily P&L distribution stability
 *  6. Profit Factor         (10%) — gross profit / gross loss
 *  7. Data Coverage         (5%)  — trading continuity
 *
 * v2 additions:
 *  - dailyPnlMap: Record<string, number>   — daily P&L for heatmap
 *  - symbolBreakdown: SymbolStat[]         — per-symbol performance
 *  - monthlyReturns: MonthlyReturn[]       — monthly P&L chart data
 *  - drawdownPeriods: DrawdownPeriod[]     — DD start/end for visualization
 */

export interface RawTrade {
    ticket: number;
    symbol: string;
    type: 'buy' | 'sell';
    lots: number;
    openTime?: number;   // unix timestamp (MT4)
    closeTime: number;   // unix timestamp
    openPrice?: number;
    closePrice?: number;
    profit: number;
    commission: number;
    swap: number;
    comment?: string;
}

export interface SymbolStat {
    symbol: string;
    trades: number;
    netPnl: number;
    winRate: number;
    avgProfit: number;
    avgLoss: number;
}

export interface MonthlyReturn {
    month: string;   // "2024-01"
    pnl: number;
    trades: number;
    winRate: number;
}

export interface DrawdownPeriod {
    start: string;   // ISO date
    end: string;
    depth: number;   // % drawdown
}

export interface DimensionScore {
    name: string;
    weight: number;
    raw: number;
    normalized: number;   // 0–1
    contribution: number; // points to SDI
}

export interface ValidationResult {
    isValid: boolean;
    status: 'validated' | 'insufficient_data' | 'anomaly_detected';
    reason: string;
    warnings: string[];
    minTradesRequired: number;
    minDaysRequired: number;
    actualTrades: number;
    actualDays: number;
}

export interface SDIResult {
    sdi: number;          // 0–1000
    tier: string;         // explorer|builder|strategist|architect|elite
    sharpe: number;
    sortino: number;
    maxDrawdownPct: number;
    winRate: number;
    zScoreConsistency: number;
    profitFactor: number;
    dataCoverage: number;
    totalTrades: number;
    tradingDays: number;
    netProfit: number;
    grossProfit: number;
    grossLoss: number;
    avgProfit: number;
    avgLoss: number;
    breakdown: DimensionScore[];
    // v2 analytics
    dailyPnlMap: Record<string, number>;
    symbolBreakdown: SymbolStat[];
    monthlyReturns: MonthlyReturn[];
    drawdownPeriods: DrawdownPeriod[];
}

// ─── Validation Gate ──────────────────────────────────────────────────────────

export function validateTradeData(trades: RawTrade[]): ValidationResult {
    const MIN_TRADES = 10;
    const MIN_DAYS = 30;
    const warnings: string[] = [];

    const closed = trades.filter(t => t.closeTime > 0 && typeof t.profit === 'number' && !isNaN(t.profit));
    const actualTrades = closed.length;

    // Calendar days
    const times = closed.map(t => t.closeTime).sort((a, b) => a - b);
    const actualDays = times.length >= 2
        ? Math.floor((times[times.length - 1] - times[0]) / 86400)
        : 0;

    // Min trades
    if (actualTrades < MIN_TRADES) {
        return {
            isValid: false, status: 'insufficient_data',
            reason: `At least ${MIN_TRADES} closed trades are required. Found: ${actualTrades}.`,
            warnings, minTradesRequired: MIN_TRADES, minDaysRequired: MIN_DAYS,
            actualTrades, actualDays,
        };
    }

    // Min days
    if (actualDays < MIN_DAYS) {
        return {
            isValid: false, status: 'insufficient_data',
            reason: `At least ${MIN_DAYS} calendar days of trading history required. Found: ${actualDays} days.`,
            warnings, minTradesRequired: MIN_TRADES, minDaysRequired: MIN_DAYS,
            actualTrades, actualDays,
        };
    }

    // Symbol diversity
    const symbols = new Set(closed.map(t => t.symbol?.toUpperCase() || 'UNKNOWN'));
    if (symbols.size === 1) warnings.push('Single instrument traded — diversification score may be limited.');

    // Anomaly: suspiciously perfect win rate
    const wins = closed.filter(t => (t.profit + (t.commission || 0) + (t.swap || 0)) > 0).length;
    const winRate = wins / actualTrades;
    if (winRate >= 0.98 && actualTrades >= 20) {
        warnings.push('Win rate ≥ 98% — potential data anomaly or backtest data detected.');
    }

    // Anomaly: all trades on the same day
    const tradingDays = new Set(times.map(t => new Date(t * 1000).toDateString())).size;
    if (tradingDays < 3 && actualTrades > 20) {
        warnings.push('All trades concentrated on fewer than 3 days — continuity score will be low.');
    }

    return {
        isValid: true, status: 'validated',
        reason: `${actualTrades} trades over ${actualDays} days — sufficient for full SDI analysis.`,
        warnings, minTradesRequired: MIN_TRADES, minDaysRequired: MIN_DAYS,
        actualTrades, actualDays,
    };
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function calculateSDI(trades: RawTrade[]): SDIResult {
    const closed = trades.filter(t =>
        t.closeTime > 0 &&
        typeof t.profit === 'number' &&
        !isNaN(t.profit)
    );

    if (closed.length < 5) {
        return emptyResult(closed.length);
    }

    const pnls = closed.map(t => t.profit + (t.commission || 0) + (t.swap || 0));

    // ── 1–7: Core dimensions ──
    const { sharpe, normalized: sharpeN } = computeSharpe(pnls, closed);
    const { sortino, normalized: sortinoN } = computeSortino(pnls, closed);
    const { maxDrawdownPct, normalized: ddN } = computeMaxDrawdown(pnls);
    const wins = pnls.filter(p => p > 0).length;
    const winRate = wins / closed.length;
    const winRateN = clamp(winRate, 0, 1);
    const { zScore, normalized: zN } = computeZScoreConsistency(pnls, closed);
    const { profitFactor, normalized: pfN, grossProfit, grossLoss } = computeProfitFactor(pnls);
    const { coverage, tradingDays } = computeDataCoverage(closed);
    const coverageN = clamp(coverage, 0, 1);

    // ── Weighted SDI ──
    const weights = { sharpe: 0.20, sortino: 0.20, maxDD: 0.20, winRate: 0.10, zScore: 0.15, pf: 0.10, coverage: 0.05 };
    const rawScore =
        sharpeN * weights.sharpe + sortinoN * weights.sortino + ddN * weights.maxDD +
        winRateN * weights.winRate + zN * weights.zScore + pfN * weights.pf + coverageN * weights.coverage;
    const sdi = Math.round(clamp(rawScore, 0, 1) * 1000);

    const netProfit = pnls.reduce((a, b) => a + b, 0);
    const profits = pnls.filter(p => p > 0);
    const losses = pnls.filter(p => p < 0);

    const breakdown: DimensionScore[] = [
        { name: 'Sharpe Ratio', weight: weights.sharpe, raw: sharpe, normalized: sharpeN, contribution: Math.round(sharpeN * weights.sharpe * 1000) },
        { name: 'Sortino Ratio', weight: weights.sortino, raw: sortino, normalized: sortinoN, contribution: Math.round(sortinoN * weights.sortino * 1000) },
        { name: 'Max Drawdown', weight: weights.maxDD, raw: maxDrawdownPct, normalized: ddN, contribution: Math.round(ddN * weights.maxDD * 1000) },
        { name: 'Win Rate', weight: weights.winRate, raw: winRate, normalized: winRateN, contribution: Math.round(winRateN * weights.winRate * 1000) },
        { name: 'Z-Score Consistency', weight: weights.zScore, raw: zScore, normalized: zN, contribution: Math.round(zN * weights.zScore * 1000) },
        { name: 'Profit Factor', weight: weights.pf, raw: profitFactor, normalized: pfN, contribution: Math.round(pfN * weights.pf * 1000) },
        { name: 'Data Coverage', weight: weights.coverage, raw: coverage, normalized: coverageN, contribution: Math.round(coverageN * weights.coverage * 1000) },
    ];

    // ── v2: Analytics ──
    const dailyPnlMap = buildDailyPnlMap(pnls, closed);
    const symbolBreakdown = buildSymbolBreakdown(pnls, closed);
    const monthlyReturns = buildMonthlyReturns(pnls, closed);
    const drawdownPeriods = buildDrawdownPeriods(pnls, closed);

    return {
        sdi, tier: scoreToTier(sdi), sharpe, sortino, maxDrawdownPct, winRate,
        zScoreConsistency: zScore, profitFactor, dataCoverage: coverage,
        totalTrades: closed.length, tradingDays, netProfit,
        grossProfit, grossLoss,
        avgProfit: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
        avgLoss: losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
        breakdown,
        dailyPnlMap,
        symbolBreakdown,
        monthlyReturns,
        drawdownPeriods,
    };
}

// ─── v2: Analytics Builders ──────────────────────────────────────────────────

function buildDailyPnlMap(pnls: number[], trades: RawTrade[]): Record<string, number> {
    const map: Record<string, number> = {};
    trades.forEach((t, i) => {
        const day = new Date(t.closeTime * 1000).toISOString().slice(0, 10); // YYYY-MM-DD
        map[day] = round2((map[day] || 0) + pnls[i]);
    });
    return map;
}

function buildSymbolBreakdown(pnls: number[], trades: RawTrade[]): SymbolStat[] {
    const symbolMap = new Map<string, { pnls: number[] }>();
    trades.forEach((t, i) => {
        const sym = (t.symbol || 'UNKNOWN').toUpperCase();
        if (!symbolMap.has(sym)) symbolMap.set(sym, { pnls: [] });
        symbolMap.get(sym)!.pnls.push(pnls[i]);
    });

    const result: SymbolStat[] = [];
    symbolMap.forEach((data, symbol) => {
        const wins = data.pnls.filter(p => p > 0);
        const lossList = data.pnls.filter(p => p < 0);
        const netPnl = data.pnls.reduce((a, b) => a + b, 0);
        result.push({
            symbol,
            trades: data.pnls.length,
            netPnl: round2(netPnl),
            winRate: round2(wins.length / data.pnls.length),
            avgProfit: wins.length > 0 ? round2(wins.reduce((a, b) => a + b, 0) / wins.length) : 0,
            avgLoss: lossList.length > 0 ? round2(lossList.reduce((a, b) => a + b, 0) / lossList.length) : 0,
        });
    });

    return result.sort((a, b) => b.trades - a.trades);
}

function buildMonthlyReturns(pnls: number[], trades: RawTrade[]): MonthlyReturn[] {
    const monthMap = new Map<string, { pnls: number[] }>();
    trades.forEach((t, i) => {
        const month = new Date(t.closeTime * 1000).toISOString().slice(0, 7); // YYYY-MM
        if (!monthMap.has(month)) monthMap.set(month, { pnls: [] });
        monthMap.get(month)!.pnls.push(pnls[i]);
    });

    const result: MonthlyReturn[] = [];
    monthMap.forEach((data, month) => {
        const wins = data.pnls.filter(p => p > 0);
        result.push({
            month,
            pnl: round2(data.pnls.reduce((a, b) => a + b, 0)),
            trades: data.pnls.length,
            winRate: round2(wins.length / data.pnls.length),
        });
    });

    return result.sort((a, b) => a.month.localeCompare(b.month));
}

function buildDrawdownPeriods(pnls: number[], trades: RawTrade[]): DrawdownPeriod[] {
    const periods: DrawdownPeriod[] = [];
    let equity = 0;
    let peak = 0;
    let drawdownStart: string | null = null;
    let peakEquity = 0;

    for (let i = 0; i < pnls.length; i++) {
        equity += pnls[i];
        if (equity > peak) {
            // New peak — close any open drawdown period
            if (drawdownStart && peakEquity > 0) {
                const depth = round2(((peakEquity - Math.min(equity, peak)) / peakEquity) * 100);
                if (depth > 2) { // Only record drawdowns > 2%
                    periods.push({
                        start: drawdownStart,
                        end: new Date(trades[i].closeTime * 1000).toISOString().slice(0, 10),
                        depth,
                    });
                }
                drawdownStart = null;
            }
            peak = equity;
            peakEquity = equity;
        } else if (equity < peak && !drawdownStart) {
            drawdownStart = new Date(trades[i].closeTime * 1000).toISOString().slice(0, 10);
        }
    }

    return periods.slice(0, 10); // Return top 10 drawdown periods
}

// ─── Dimension Calculators ───────────────────────────────────────────────────

function computeSharpe(pnls: number[], trades: RawTrade[]): { sharpe: number; normalized: number } {
    const dailyPnls = groupByDay(pnls, trades);
    if (dailyPnls.length < 5) return { sharpe: 0, normalized: 0 };
    const mean = avg(dailyPnls);
    const std = stdDev(dailyPnls);
    if (std === 0) return { sharpe: 0, normalized: 0 };
    const sharpe = (mean / std) * Math.sqrt(252);
    const normalized = clamp((sharpe + 1) / 4, 0, 1);
    return { sharpe: round2(sharpe), normalized };
}

function computeSortino(pnls: number[], trades: RawTrade[]): { sortino: number; normalized: number } {
    const dailyPnls = groupByDay(pnls, trades);
    if (dailyPnls.length < 5) return { sortino: 0, normalized: 0 };
    const mean = avg(dailyPnls);
    const downside = dailyPnls.filter(p => p < 0);
    const downsideStd = downside.length > 1 ? stdDev(downside) : 0;
    if (downsideStd === 0) return { sortino: mean > 0 ? 3 : 0, normalized: mean > 0 ? 1 : 0 };
    const sortino = (mean / downsideStd) * Math.sqrt(252);
    const normalized = clamp((sortino + 1) / 5, 0, 1);
    return { sortino: round2(sortino), normalized };
}

function computeMaxDrawdown(pnls: number[]): { maxDrawdownPct: number; normalized: number } {
    let peak = 0, equity = 0, maxDDAbsolute = 0, peakAtMaxDD = 1;
    for (const p of pnls) {
        equity += p;
        if (equity > peak) peak = equity;
        const ddAbs = peak - equity;
        if (ddAbs > maxDDAbsolute) { maxDDAbsolute = ddAbs; peakAtMaxDD = peak; }
    }
    let ddRatio: number;
    if (peakAtMaxDD > 0.01) {
        ddRatio = maxDDAbsolute / peakAtMaxDD;
    } else {
        const grossLoss = Math.abs(pnls.filter(p => p < 0).reduce((a, b) => a + b, 0));
        ddRatio = grossLoss > 0 ? Math.min(maxDDAbsolute / grossLoss, 1) : 0;
    }
    ddRatio = Math.min(ddRatio, 1.0);
    const maxDrawdownPct = round2(ddRatio * 100);
    const normalized = clamp(1 - (ddRatio / 0.50), 0, 1);
    return { maxDrawdownPct, normalized };
}

function computeZScoreConsistency(pnls: number[], trades: RawTrade[]): { zScore: number; normalized: number } {
    const dailyPnls = groupByDay(pnls, trades);
    if (dailyPnls.length < 5) return { zScore: 0, normalized: 0 };
    const std = stdDev(dailyPnls);
    const mean = Math.abs(avg(dailyPnls));
    if (mean === 0) return { zScore: 0, normalized: 0 };
    const cv = std / (mean + 1e-9);
    const normalized = clamp(1 - (cv / 3), 0, 1);
    return { zScore: round2(cv), normalized };
}

function computeProfitFactor(pnls: number[]): { profitFactor: number; normalized: number; grossProfit: number; grossLoss: number } {
    const grossProfit = pnls.filter(p => p > 0).reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(pnls.filter(p => p < 0).reduce((a, b) => a + b, 0));
    const profitFactor = grossLoss > 0 ? round2(grossProfit / grossLoss) : (grossProfit > 0 ? 10 : 0);
    const normalized = clamp((profitFactor - 0.5) / 2, 0, 1);
    return { profitFactor, normalized, grossProfit: round2(grossProfit), grossLoss: round2(grossLoss) };
}

function computeDataCoverage(trades: RawTrade[]): { coverage: number; tradingDays: number } {
    const times = trades.map(t => t.closeTime).sort((a, b) => a - b);
    if (times.length < 2) return { coverage: 0, tradingDays: 1 };
    const calendarDays = (times[times.length - 1] - times[0]) / 86400;
    const tradingDays = new Set(times.map(t => new Date(t * 1000).toDateString())).size;
    const coverage = calendarDays > 0 ? clamp(tradingDays / (calendarDays * 0.4), 0, 1) : 0;
    return { coverage: round2(coverage), tradingDays };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function groupByDay(pnls: number[], trades: RawTrade[]): number[] {
    const dayMap = new Map<string, number>();
    trades.forEach((t, i) => {
        const day = new Date(t.closeTime * 1000).toDateString();
        dayMap.set(day, (dayMap.get(day) || 0) + pnls[i]);
    });
    return Array.from(dayMap.values());
}

function avg(arr: number[]): number { return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length; }
function stdDev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = avg(arr);
    return Math.sqrt(arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length);
}
function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
function round2(v: number): number { return Math.round(v * 100) / 100; }

function scoreToTier(sdi: number): string {
    if (sdi >= 850) return 'elite';
    if (sdi >= 700) return 'architect';
    if (sdi >= 500) return 'strategist';
    if (sdi >= 300) return 'builder';
    return 'explorer';
}

function emptyResult(tradeCount: number): SDIResult {
    return {
        sdi: 0, tier: 'explorer', sharpe: 0, sortino: 0, maxDrawdownPct: 0, winRate: 0,
        zScoreConsistency: 0, profitFactor: 0, dataCoverage: 0, totalTrades: tradeCount,
        tradingDays: 0, netProfit: 0, grossProfit: 0, grossLoss: 0, avgProfit: 0, avgLoss: 0,
        breakdown: [], dailyPnlMap: {}, symbolBreakdown: [], monthlyReturns: [], drawdownPeriods: [],
    };
}
