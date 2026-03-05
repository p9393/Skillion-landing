/**
 * Metrics Engine — computes metrics from normalized trades and daily equity curve
 * and upserts results into metrics_daily table.
 */

import { createClient } from '@supabase/supabase-js'
import { computeAllMetrics } from '../metrics/formulas'
import { computeSDI, dataQualityScore } from '../scoring/sdi'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ComputeOptions {
    accountId: string
    userId: string
    periodDays?: number  // default 90
}

/**
 * Main entry point — reads trades from DB, computes metrics, upserts, computes SDI.
 */
export async function computeAndSaveMetrics(opts: ComputeOptions): Promise<{
    metricsId: string
    snapshotId: string
    sdiTotal: number
}> {
    const { accountId, userId, periodDays = 90 } = opts
    const periodEnd = new Date()
    const periodStart = new Date()
    periodStart.setDate(periodEnd.getDate() - periodDays)

    // ── Fetch trades ─────────────────────────────────────────────────────────
    const { data: trades, error: tradesErr } = await supabaseAdmin
        .from('normalized_trades')
        .select('net_pnl, realized_pnl, fee, funding, is_closed, holding_secs, symbol, leverage, close_time')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .gte('close_time', periodStart.toISOString())
        .lte('close_time', periodEnd.toISOString())

    if (tradesErr) throw new Error(`Fetch trades error: ${tradesErr.message}`)

    // ── Fetch equity curve ───────────────────────────────────────────────────
    const { data: equity, error: equityErr } = await supabaseAdmin
        .from('daily_equity_curve')
        .select('date, ending_balance, daily_return')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .gte('date', periodStart.toISOString().split('T')[0])
        .lte('date', periodEnd.toISOString().split('T')[0])
        .order('date', { ascending: true })

    if (equityErr) throw new Error(`Fetch equity error: ${equityErr.message}`)

    // Handle empty data gracefully
    const tradeList = trades ?? []
    const equityList = equity ?? []
    const equityCurve = equityList.map(e => e.ending_balance ?? 0).filter(b => b > 0)
    const dailyReturns = equityList.map(e => e.daily_return ?? 0)

    // ── Compute metrics ──────────────────────────────────────────────────────
    const rawMetrics = computeAllMetrics({
        trades: tradeList.map(t => ({
            net_pnl: t.net_pnl ?? 0,
            realized_pnl: t.realized_pnl ?? 0,
            fee: t.fee ?? 0,
            funding: t.funding ?? 0,
            is_closed: t.is_closed ?? true,
            holding_secs: t.holding_secs,
            symbol: t.symbol ?? 'UNKNOWN',
            leverage: t.leverage,
        })),
        equityCurve,
        dailyReturns,
        periodDays,
    })

    // ── Upsert metrics_daily ─────────────────────────────────────────────────
    const { data: metricsRow, error: metricsErr } = await supabaseAdmin
        .from('metrics_daily')
        .upsert({
            account_id: accountId,
            user_id: userId,
            computed_at: new Date().toISOString(),
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            ...rawMetrics,
        }, {
            onConflict: 'account_id,period_start,period_end',
        })
        .select('id')
        .single()

    if (metricsErr || !metricsRow) throw new Error(`Metrics upsert error: ${metricsErr?.message}`)

    // ── Compute SDI ──────────────────────────────────────────────────────────
    const metricsInput = rawMetrics as unknown as import('../scoring/sdi').MetricsInput
    const dq = dataQualityScore(metricsInput)
    const sdiResult = computeSDI(metricsInput, dq)

    // ── Upsert score_snapshot ────────────────────────────────────────────────
    const { data: snapshot, error: snapErr } = await supabaseAdmin
        .from('score_snapshots')
        .insert({
            user_id: userId,
            account_id: accountId,
            computed_at: new Date().toISOString(),
            sdi_total: sdiResult.sdi_total,
            risk_discipline: sdiResult.risk_discipline,
            consistency: sdiResult.consistency,
            efficiency: sdiResult.efficiency,
            professionalism: sdiResult.professionalism,
            tier: sdiResult.tier,
            data_quality_score: sdiResult.data_quality_score,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            metrics_daily_id: metricsRow.id,
            raw_metrics: rawMetrics,
        })
        .select('id')
        .single()

    if (snapErr || !snapshot) throw new Error(`Score snapshot insert error: ${snapErr?.message}`)

    // ── Upsert score_factors ─────────────────────────────────────────────────
    if (sdiResult.factors.length > 0) {
        await supabaseAdmin
            .from('score_factors')
            .insert(sdiResult.factors.map(f => ({
                snapshot_id: snapshot.id,
                user_id: userId,
                ...f,
            })))
    }

    console.log(`[metrics] Account ${accountId}: SDI=${sdiResult.sdi_total} (${sdiResult.tier})`)
    return { metricsId: metricsRow.id, snapshotId: snapshot.id, sdiTotal: sdiResult.sdi_total }
}
