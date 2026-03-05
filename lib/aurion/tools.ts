/**
 * Aurion Agent Tools — 4 tool implementations
 * Each tool queries the DB and returns structured context for the LLM.
 */

import { createClient } from '@supabase/supabase-js'
import { explainScoreDelta } from '../scoring/explainability'

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export interface ToolResult {
    tool: string
    data: unknown
    error?: string
}

// ── Tool 1: get_score_context ────────────────────────────────────────────────
export async function getScoreContext(userId: string, accountId?: string): Promise<ToolResult> {
    try {
        const admin = getAdmin()
        let query = admin
            .from('score_snapshots')
            .select('id, sdi_total, risk_discipline, consistency, efficiency, professionalism, tier, data_quality_score, computed_at, period_start, period_end')
            .eq('user_id', userId)
            .order('computed_at', { ascending: false })
            .limit(1)

        if (accountId) query = query.eq('account_id', accountId)
        const { data: snapshot } = await query.single()
        if (!snapshot) return { tool: 'get_score_context', data: null }

        const { data: factors } = await admin
            .from('score_factors')
            .select('sub_score, factor_name, raw_value, normalized_0_1, contribution, direction, explanation')
            .eq('snapshot_id', snapshot.id)
            .order('contribution', { ascending: false })

        return {
            tool: 'get_score_context',
            data: { snapshot, factors: factors ?? [], topFactors: (factors ?? []).slice(0, 6) },
        }
    } catch (e) {
        return { tool: 'get_score_context', data: null, error: String(e) }
    }
}

// ── Tool 2: get_metrics_summary ──────────────────────────────────────────────
export async function getMetricsSummary(
    userId: string,
    accountId?: string,
    period = '30d'
): Promise<ToolResult> {
    try {
        const admin = getAdmin()
        let query = admin
            .from('metrics_daily')
            .select('total_trades, total_pnl, win_rate, profit_factor, max_drawdown_pct, sharpe_ratio, sortino_ratio, avg_leverage, fees_drag_pct, concentration_hhi, trade_freq_per_day, avg_holding_secs, cvar_95, positive_days_pct, computed_at')
            .eq('user_id', userId)
            .order('computed_at', { ascending: false })
            .limit(1)

        if (accountId) query = query.eq('account_id', accountId)
        const { data: metrics } = await query.single()

        return { tool: 'get_metrics_summary', data: { metrics, period } }
    } catch (e) {
        return { tool: 'get_metrics_summary', data: null, error: String(e) }
    }
}

// ── Tool 3: get_score_delta ──────────────────────────────────────────────────
export async function getScoreDelta(userId: string, accountId?: string): Promise<ToolResult> {
    try {
        const admin = getAdmin()
        let query = admin
            .from('score_snapshots')
            .select('id, sdi_total, risk_discipline, consistency, efficiency, professionalism, tier, computed_at')
            .eq('user_id', userId)
            .order('computed_at', { ascending: false })
            .limit(2)

        if (accountId) query = query.eq('account_id', accountId)
        const { data: snapshots } = await query

        if (!snapshots || snapshots.length < 2) {
            return { tool: 'get_score_delta', data: { delta: null, message: 'Not enough history for delta analysis.' } }
        }

        const [curr, prev] = snapshots
        const delta = explainScoreDelta(
            { ...prev, factors: undefined },
            { ...curr, factors: undefined }
        )

        return { tool: 'get_score_delta', data: { delta, current: curr, previous: prev } }
    } catch (e) {
        return { tool: 'get_score_delta', data: null, error: String(e) }
    }
}

// ── Tool 4: get_risk_flags ───────────────────────────────────────────────────
export async function getRiskFlags(userId: string, accountId?: string): Promise<ToolResult> {
    try {
        const admin = getAdmin()
        let query = admin
            .from('metrics_daily')
            .select('max_drawdown_pct, avg_leverage, max_leverage, trade_freq_per_day, concentration_hhi, cvar_95, fees_drag_pct, funding_drag_pct')
            .eq('user_id', userId)
            .order('computed_at', { ascending: false })
            .limit(1)

        if (accountId) query = query.eq('account_id', accountId)
        const { data: m } = await query.single()

        if (!m) return { tool: 'get_risk_flags', data: { flags: [] } }

        const flags: { severity: 'warning' | 'critical'; flag: string; detail: string }[] = []

        if (m.max_drawdown_pct > 0.30)
            flags.push({ severity: 'critical', flag: 'high_drawdown', detail: `Max drawdown ${Math.round(m.max_drawdown_pct * 100)}% exceeds 30%` })
        else if (m.max_drawdown_pct > 0.15)
            flags.push({ severity: 'warning', flag: 'elevated_drawdown', detail: `Max drawdown ${Math.round(m.max_drawdown_pct * 100)}% — monitor closely` })

        if (m.avg_leverage > 15)
            flags.push({ severity: 'critical', flag: 'high_leverage', detail: `Avg leverage ${m.avg_leverage}x — significant margin exposure` })
        else if (m.avg_leverage > 8)
            flags.push({ severity: 'warning', flag: 'elevated_leverage', detail: `Avg leverage ${m.avg_leverage}x — moderate risk` })

        if (m.trade_freq_per_day > 30)
            flags.push({ severity: 'warning', flag: 'overtrading', detail: `${Math.round(m.trade_freq_per_day)} trades/day — potential overtrading pattern` })

        if (m.concentration_hhi > 0.7)
            flags.push({ severity: 'warning', flag: 'high_concentration', detail: `HHI ${m.concentration_hhi.toFixed(2)} — heavy concentration in single assets` })

        if (m.cvar_95 < -0.04)
            flags.push({ severity: 'critical', flag: 'tail_risk', detail: `CVaR 95%: ${(m.cvar_95 * 100).toFixed(1)}% — extreme tail losses detected` })

        if (m.fees_drag_pct > 0.6)
            flags.push({ severity: 'warning', flag: 'high_fees', detail: `Fees consuming ${Math.round(m.fees_drag_pct * 100)}% of gross profit` })

        return { tool: 'get_risk_flags', data: { flags, riskLevel: flags.some(f => f.severity === 'critical') ? 'critical' : flags.length > 0 ? 'elevated' : 'normal' } }
    } catch (e) {
        return { tool: 'get_risk_flags', data: null, error: String(e) }
    }
}

/** Dispatch a tool call by name */
export async function dispatchTool(
    toolName: string,
    args: Record<string, string>,
    userId: string
): Promise<ToolResult> {
    switch (toolName) {
        case 'get_score_context': return getScoreContext(userId, args.accountId)
        case 'get_metrics_summary': return getMetricsSummary(userId, args.accountId, args.period)
        case 'get_score_delta': return getScoreDelta(userId, args.accountId)
        case 'get_risk_flags': return getRiskFlags(userId, args.accountId)
        default: return { tool: toolName, data: null, error: `Unknown tool: ${toolName}` }
    }
}
