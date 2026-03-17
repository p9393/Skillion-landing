/**
 * SDI Scoring Engine — 0-1000 with 4 sub-scores
 *
 * Sub-scores (0-250 each):
 *   1) Risk Discipline   — drawdown, CVaR, leverage behavior
 *   2) Consistency       — Sharpe, Sortino, CV of returns, positive days
 *   3) Efficiency/Edge   — win rate, profit factor, win/loss ratio, fees drag
 *   4) Professionalism   — concentration, holding time, overtrading, max leverage
 */

import { clamp, round2 } from '../metrics/formulas'

export interface MetricsInput {
    max_drawdown_pct: number
    avg_drawdown_pct: number
    cvar_95: number
    avg_leverage: number
    max_leverage: number
    sharpe_ratio: number
    sortino_ratio: number
    z_score_cv: number
    positive_days_pct: number
    win_rate: number
    profit_factor: number
    win_loss_ratio: number
    fees_drag_pct: number
    funding_drag_pct: number
    concentration_hhi: number
    avg_holding_secs: number
    trade_freq_per_day: number
    total_trades: number
    total_pnl: number
}

export interface ScoreFactor {
    sub_score: 'risk_discipline' | 'consistency' | 'efficiency' | 'professionalism'
    factor_name: string
    raw_value: number
    normalized_0_1: number
    weight: number
    contribution: number    // points to sub-score
    direction: 'positive' | 'negative' | 'neutral'
    explanation: string
}

export interface SDIResult {
    sdi_total: number
    risk_discipline: number
    consistency: number
    efficiency: number
    professionalism: number
    tier: 'explorer' | 'builder' | 'strategist' | 'architect' | 'elite'
    data_quality_score: number
    factors: ScoreFactor[]
}

// ─── Tier Mapping ────────────────────────────────────────────────────────────

export function toTier(sdi: number): SDIResult['tier'] {
    if (sdi >= 850) return 'elite'
    if (sdi >= 700) return 'architect'
    if (sdi >= 500) return 'strategist'
    if (sdi >= 300) return 'builder'
    return 'explorer'
}

// ─── Holding Time Score ──────────────────────────────────────────────────────
// Rewards structured traders over pure scalpers
// < 1min=0, 1h=0.30, 4h=0.60, 1day=0.85, 3day+=1.0

function holdingTimeScore(avgSecs: number): number {
    const h = avgSecs / 3600
    if (h < 0.017) return 0       // < 1 minute
    if (h < 1) return 0.3
    if (h < 4) return 0.6
    if (h < 24) return 0.85
    return Math.min(h / 72, 1.0)  // caps at 72h (3 days)
}

// ─── Factor Builder Helper ────────────────────────────────────────────────────

function makeFactor(
    subScore: ScoreFactor['sub_score'],
    name: string,
    rawValue: number,
    normalizedValue: number,
    weight: number,
    maxSubScore: number,
    explanation: string,
    higherIsBetter = true
): ScoreFactor {
    const norm = clamp(normalizedValue, 0, 1)
    const contribution = round2(norm * weight * maxSubScore)
    return {
        sub_score: subScore,
        factor_name: name,
        raw_value: round2(rawValue),
        normalized_0_1: round2(norm),
        weight,
        contribution,
        direction: norm >= 0.6 ? 'positive' : norm <= 0.35 ? 'negative' : 'neutral',
        explanation,
    }
}

// ─── Main Scorer ─────────────────────────────────────────────────────────────

export function computeSDI(m: MetricsInput, dataQuality = 1.0): SDIResult {
    const factors: ScoreFactor[] = []
    const MAX = 250

    // ── 1. Risk Discipline (250 pts) ──────────────────────────────────────────
    // Max DD: 0% best, 50%+ worst
    const ddN = clamp(1 - m.max_drawdown_pct / 0.50, 0, 1)
    factors.push(makeFactor('risk_discipline', 'max_drawdown', m.max_drawdown_pct,
        ddN, 0.45, MAX,
        `Max drawdown ${round2(m.max_drawdown_pct * 100)}% — ${ddN >= 0.7 ? 'well controlled' : ddN >= 0.4 ? 'moderate' : 'significant risk'}`
    ))

    // CVaR 95%: 0% best, -5% daily worst
    const cvarN = clamp(1 - Math.abs(m.cvar_95) / 0.05, 0, 1)
    factors.push(makeFactor('risk_discipline', 'cvar_95', m.cvar_95,
        cvarN, 0.30, MAX,
        `CVaR 95%: worst 5% of days avg ${round2(m.cvar_95 * 100)}% — ${cvarN >= 0.7 ? 'tail risk contained' : 'heavy tail losses detected'}`
    ))

    // Avg leverage: 0 ideal, 20x worst
    const levN = clamp(1 - m.avg_leverage / 20, 0, 1)
    factors.push(makeFactor('risk_discipline', 'avg_leverage', m.avg_leverage,
        levN, 0.25, MAX,
        `Average leverage ${round2(m.avg_leverage)}x — ${levN >= 0.7 ? 'conservative' : levN >= 0.4 ? 'moderate' : 'high risk exposure'}`
    ))

    const riskScore = factors
        .filter(f => f.sub_score === 'risk_discipline')
        .reduce((s, f) => s + f.contribution, 0)
    const riskDiscipline = Math.round(clamp(riskScore, 0, MAX))

    // ── 2. Consistency (250 pts) ─────────────────────────────────────────────
    // Sharpe: [-1, 3] → [0, 1]
    const sharpeN = clamp((m.sharpe_ratio + 1) / 4, 0, 1)
    factors.push(makeFactor('consistency', 'sharpe_ratio', m.sharpe_ratio,
        sharpeN, 0.30, MAX,
        `Sharpe ratio ${round2(m.sharpe_ratio)} — ${m.sharpe_ratio >= 1.5 ? 'excellent risk-adjusted return' : m.sharpe_ratio >= 0.5 ? 'acceptable' : 'returns not justifying risk'}`
    ))

    // Sortino: [-1, 5] → [0, 1]
    const sortinoN = clamp((m.sortino_ratio + 1) / 6, 0, 1)
    factors.push(makeFactor('consistency', 'sortino_ratio', m.sortino_ratio,
        sortinoN, 0.25, MAX,
        `Sortino ratio ${round2(m.sortino_ratio)} — ${m.sortino_ratio >= 2 ? 'strong downside control' : m.sortino_ratio >= 0.5 ? 'moderate' : 'poor downside management'}`
    ))

    // CV: 0 ideal (consistent), 3+ chaotic
    const cvN = clamp(1 - m.z_score_cv / 3, 0, 1)
    factors.push(makeFactor('consistency', 'return_consistency', m.z_score_cv,
        cvN, 0.25, MAX,
        `Daily return CV: ${round2(m.z_score_cv)} — ${cvN >= 0.7 ? 'highly consistent' : cvN >= 0.4 ? 'moderate variation' : 'highly erratic returns'}`
    ))

    // Positive days %
    const posDaysN = clamp(m.positive_days_pct, 0, 1)
    factors.push(makeFactor('consistency', 'positive_days_pct', m.positive_days_pct,
        posDaysN, 0.20, MAX,
        `${round2(m.positive_days_pct * 100)}% of trading days positive — ${posDaysN >= 0.55 ? 'more good than bad days' : 'majority negative days'}`
    ))

    const consistScore = factors
        .filter(f => f.sub_score === 'consistency')
        .reduce((s, f) => s + f.contribution, 0)
    const consistency = Math.round(clamp(consistScore, 0, MAX))

    // ── 3. Efficiency / Edge (250 pts) ───────────────────────────────────────
    const winRateN = clamp(m.win_rate, 0, 1)
    factors.push(makeFactor('efficiency', 'win_rate', m.win_rate,
        winRateN, 0.25, MAX,
        `Win rate ${round2(m.win_rate * 100)}% — ${m.win_rate >= 0.6 ? 'strong edge' : m.win_rate >= 0.45 ? 'acceptable' : 'more losses than wins'}`
    ))

    // Profit Factor: 0.5 worst (never meaningful < 1), 3.0 excellent
    const pfN = clamp((m.profit_factor - 0.5) / 2.5, 0, 1)
    factors.push(makeFactor('efficiency', 'profit_factor', m.profit_factor,
        pfN, 0.35, MAX,
        `Profit factor ${round2(m.profit_factor)} — ${m.profit_factor >= 2 ? 'profitable edge confirmed' : m.profit_factor >= 1 ? 'marginal edge' : 'loses more than wins'}`
    ))

    // Win/Loss Ratio: 0.5 worst, 3.5 best
    const wlN = clamp((m.win_loss_ratio - 0.5) / 3, 0, 1)
    factors.push(makeFactor('efficiency', 'win_loss_ratio', m.win_loss_ratio,
        wlN, 0.25, MAX,
        `Avg win/loss ratio ${round2(m.win_loss_ratio)} — ${m.win_loss_ratio >= 2 ? 'winners much larger than losers' : m.win_loss_ratio >= 1 ? 'balanced' : 'losses larger than wins'}`
    ))

    // Fees drag: 0 = no drag, 1 = all profit eaten by fees
    const feesN = clamp(1 - m.fees_drag_pct, 0, 1)
    factors.push(makeFactor('efficiency', 'fees_drag', m.fees_drag_pct,
        feesN, 0.15, MAX,
        `Fees consumed ${round2(m.fees_drag_pct * 100)}% of gross profit — ${feesN >= 0.85 ? 'low cost trading' : feesN >= 0.6 ? 'moderate drag' : 'high fee drag eroding edge'}`
    ))

    const efficiencyScore = factors
        .filter(f => f.sub_score === 'efficiency')
        .reduce((s, f) => s + f.contribution, 0)
    const efficiency = Math.round(clamp(efficiencyScore, 0, MAX))

    // ── 4. Professionalism (250 pts) ─────────────────────────────────────────
    // Concentration HHI: 0 diversified, 1 fully concentrated
    const concN = clamp(1 - m.concentration_hhi, 0, 1)
    factors.push(makeFactor('professionalism', 'concentration', m.concentration_hhi,
        concN, 0.25, MAX,
        `Asset concentration HHI: ${round2(m.concentration_hhi)} — ${concN >= 0.7 ? 'well diversified' : concN >= 0.4 ? 'moderate concentration' : 'high single-asset risk'}`
    ))

    // Holding time
    const holdN = holdingTimeScore(m.avg_holding_secs)
    factors.push(makeFactor('professionalism', 'holding_time', m.avg_holding_secs / 3600,
        holdN, 0.25, MAX,
        `Avg holding time ${round2(m.avg_holding_secs / 3600)}h — ${holdN >= 0.8 ? 'structured multi-hour trades' : holdN >= 0.5 ? 'intraday discipline' : 'ultra-short-term scalping pattern'}`
    ))

    // Overtrading: 0 trades/day ideal for discipline, >50 chaotic
    const overtrdN = clamp(1 - m.trade_freq_per_day / 50, 0, 1)
    factors.push(makeFactor('professionalism', 'trade_frequency', m.trade_freq_per_day,
        overtrdN, 0.25, MAX,
        `${round2(m.trade_freq_per_day)} trades/day — ${overtrdN >= 0.8 ? 'selective and disciplined' : overtrdN >= 0.5 ? 'active but controlled' : 'potential overtrading detected'}`
    ))

    // Max leverage hygiene: 0 ideal, >50x worst
    const maxLevN = clamp(1 - m.max_leverage / 50, 0, 1)
    factors.push(makeFactor('professionalism', 'max_leverage', m.max_leverage,
        maxLevN, 0.25, MAX,
        `Peak leverage ${round2(m.max_leverage)}x — ${maxLevN >= 0.8 ? 'conservative leverage ceiling' : maxLevN >= 0.5 ? 'moderate spikes' : 'dangerous leverage spikes detected'}`
    ))

    const profeshScore = factors
        .filter(f => f.sub_score === 'professionalism')
        .reduce((s, f) => s + f.contribution, 0)
    const professionalism = Math.round(clamp(profeshScore, 0, MAX))

    // ── Total ─────────────────────────────────────────────────────────────────
    const rawTotal = riskDiscipline + consistency + efficiency + professionalism
    // Apply data quality penalty (low completeness = score capped)
    const sdiTotal = Math.round(clamp(rawTotal * clamp(dataQuality, 0.3, 1.0), 0, 1000))

    return {
        sdi_total: sdiTotal,
        risk_discipline: riskDiscipline,
        consistency,
        efficiency,
        professionalism,
        tier: toTier(sdiTotal),
        data_quality_score: round2(dataQuality),
        factors,
    }
}

/** Data quality score — 0-1 based on data completeness */
export function dataQualityScore(metrics: MetricsInput): number {
    let score = 1.0
    if (metrics.total_trades < 10) score -= 0.3  // too few trades
    if (metrics.total_trades < 30) score -= 0.1
    if (metrics.avg_holding_secs === 0) score -= 0.1
    if (metrics.avg_leverage === 0) score -= 0.05 // no leverage data
    return round2(clamp(score, 0, 1))
}
