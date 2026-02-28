/**
 * Skillion Discipline Index (SDI) Engine
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
}

export interface DimensionScore {
    name: string;
    weight: number;
    raw: number;
    normalized: number;   // 0–1
    contribution: number; // points to SDI (normalized * weight * 1000)
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function calculateSDI(trades: RawTrade[]): SDIResult {
    // Filter to closed trades with valid profit
    const closed = trades.filter(t =>
        t.closeTime > 0 &&
        typeof t.profit === 'number' &&
        !isNaN(t.profit)
    );

    if (closed.length < 5) {
        return emptyResult(closed.length);
    }

    // Net P&L per trade (profit + commission + swap)
    const pnls = closed.map(t => t.profit + (t.commission || 0) + (t.swap || 0));

    // ── 1. Sharpe Ratio ──
    const { sharpe, normalized: sharpeN } = computeSharpe(pnls, closed);

    // ── 2. Sortino Ratio ──
    const { sortino, normalized: sortinoN } = computeSortino(pnls, closed);

    // ── 3. Max Drawdown ──
    const { maxDrawdownPct, normalized: ddN } = computeMaxDrawdown(pnls);

    // ── 4. Win Rate ──
    const wins = pnls.filter(p => p > 0).length;
    const winRate = wins / closed.length;
    const winRateN = clamp(winRate, 0, 1);

    // ── 5. Z-Score Consistency ──
    const { zScore, normalized: zN } = computeZScoreConsistency(pnls, closed);

    // ── 6. Profit Factor ──
    const { profitFactor, normalized: pfN, grossProfit, grossLoss } = computeProfitFactor(pnls);

    // ── 7. Data Coverage ──
    const { coverage, tradingDays } = computeDataCoverage(closed);
    const coverageN = clamp(coverage, 0, 1);

    // ── Weighted SDI ──
    const weights = {
        sharpe: 0.20,
        sortino: 0.20,
        maxDD: 0.20,
        winRate: 0.10,
        zScore: 0.15,
        pf: 0.10,
        coverage: 0.05,
    };

    const rawScore =
        sharpeN * weights.sharpe +
        sortinoN * weights.sortino +
        ddN * weights.maxDD +
        winRateN * weights.winRate +
        zN * weights.zScore +
        pfN * weights.pf +
        coverageN * weights.coverage;

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

    return {
        sdi,
        tier: scoreToTier(sdi),
        sharpe,
        sortino,
        maxDrawdownPct,
        winRate,
        zScoreConsistency: zScore,
        profitFactor,
        dataCoverage: coverage,
        totalTrades: closed.length,
        tradingDays,
        netProfit,
        grossProfit,
        grossLoss,
        avgProfit: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
        avgLoss: losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
        breakdown,
    };
}

// ─── Dimension Calculators ───────────────────────────────────────────────────

function computeSharpe(pnls: number[], trades: RawTrade[]): { sharpe: number; normalized: number } {
    const dailyPnls = groupByDay(pnls, trades);
    if (dailyPnls.length < 5) return { sharpe: 0, normalized: 0 };

    const mean = avg(dailyPnls);
    const std = stdDev(dailyPnls);
    if (std === 0) return { sharpe: 0, normalized: 0 };

    const sharpe = (mean / std) * Math.sqrt(252);
    // Normalize: Sharpe >3 = excellent; <0 = terrible
    const normalized = clamp((sharpe + 1) / 4, 0, 1); // maps [-1,3] → [0,1]
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
    let peak = 0;
    let equity = 0;
    let maxDD = 0;

    for (const p of pnls) {
        equity += p;
        if (equity > peak) peak = equity;
        const dd = peak > 0 ? (peak - equity) / peak : 0;
        if (dd > maxDD) maxDD = dd;
    }

    const maxDrawdownPct = round2(maxDD * 100);
    // Score: 0% DD = 1.0; 50%+ DD = 0.0
    const normalized = clamp(1 - (maxDD / 0.50), 0, 1);
    return { maxDrawdownPct, normalized };
}

function computeZScoreConsistency(pnls: number[], trades: RawTrade[]): { zScore: number; normalized: number } {
    const dailyPnls = groupByDay(pnls, trades);
    if (dailyPnls.length < 5) return { zScore: 0, normalized: 0 };

    const std = stdDev(dailyPnls);
    const mean = Math.abs(avg(dailyPnls));

    if (mean === 0) return { zScore: 0, normalized: 0 };

    // Coefficient of variation — lower = more consistent
    const cv = std / (mean + 1e-9);
    const zScore = round2(cv);

    // Normalize: cv < 0.5 = great consistency; cv > 3 = chaotic
    const normalized = clamp(1 - (cv / 3), 0, 1);
    return { zScore, normalized };
}

function computeProfitFactor(pnls: number[]): {
    profitFactor: number; normalized: number;
    grossProfit: number; grossLoss: number;
} {
    const grossProfit = pnls.filter(p => p > 0).reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(pnls.filter(p => p < 0).reduce((a, b) => a + b, 0));

    const profitFactor = grossLoss > 0 ? round2(grossProfit / grossLoss) : (grossProfit > 0 ? 10 : 0);

    // Normalize: PF >2 = excellent; PF <1 = losing
    const normalized = clamp((profitFactor - 0.5) / 2, 0, 1);
    return { profitFactor, normalized, grossProfit: round2(grossProfit), grossLoss: round2(grossLoss) };
}

function computeDataCoverage(trades: RawTrade[]): { coverage: number; tradingDays: number } {
    const times = trades.map(t => t.closeTime).sort((a, b) => a - b);
    if (times.length < 2) return { coverage: 0, tradingDays: 1 };

    const calendarDays = (times[times.length - 1] - times[0]) / 86400;
    const tradingDays = new Set(times.map(t => new Date(t * 1000).toDateString())).size;

    // Active trading days as fraction of calendar days (max 40% = 5/7 working days)
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

function avg(arr: number[]): number {
    return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = avg(arr);
    const variance = arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function round2(v: number): number {
    return Math.round(v * 100) / 100;
}

function scoreToTier(sdi: number): string {
    if (sdi >= 850) return 'elite';
    if (sdi >= 700) return 'architect';
    if (sdi >= 500) return 'strategist';
    if (sdi >= 300) return 'builder';
    return 'explorer';
}

function emptyResult(tradeCount: number): SDIResult {
    return {
        sdi: 0,
        tier: 'explorer',
        sharpe: 0, sortino: 0, maxDrawdownPct: 0, winRate: 0,
        zScoreConsistency: 0, profitFactor: 0, dataCoverage: 0,
        totalTrades: tradeCount, tradingDays: 0,
        netProfit: 0, grossProfit: 0, grossLoss: 0, avgProfit: 0, avgLoss: 0,
        breakdown: [],
    };
}
