import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parseMT4Statement } from '@/app/lib/mt4-parser'
import { calculateSDI, validateTradeData, RawTrade } from '@/app/lib/sdi-engine'
import { analyzeWithAurion } from '@/app/lib/aurion-analyst'

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get('file') as File | null
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

        if (file.size > 15 * 1024 * 1024)
            return NextResponse.json({ error: 'File too large (max 15 MB)' }, { status: 400 })

        const admin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll: () => [], setAll: () => { } } }
        )

        // ── 1. Parse HTML ─────────────────────────────────────────────────────
        const html = new TextDecoder('utf-8').decode(await file.arrayBuffer())
        const parsed = parseMT4Statement(html)

        console.log(`[upload] Parsed: ${parsed.trades.length} trades | ${parsed.platform} | login: ${parsed.login}`)

        if (parsed.trades.length === 0) {
            return NextResponse.json({
                success: false,
                validation_status: 'insufficient_data',
                message: 'No closed BUY/SELL trades found. In MT4: Account History tab → right-click → All History → Save as Report',
                actualTrades: 0,
                actualDays: 0,
                minTradesRequired: 10,
                minDaysRequired: 30,
            }, { status: 422 })
        }

        // ── 2. Validation Gate ────────────────────────────────────────────────
        const rawTrades: RawTrade[] = parsed.trades.map(t => ({
            ticket: t.ticket,
            symbol: t.symbol,
            type: t.type,
            lots: t.lots,
            openTime: t.openTime,
            closeTime: t.closeTime,
            openPrice: t.openPrice,
            closePrice: t.closePrice,
            profit: t.profit,
            commission: t.commission,
            swap: t.swap,
        }))

        const validation = validateTradeData(rawTrades)
        console.log(`[upload] Validation: ${validation.status} — ${validation.reason}`)

        if (!validation.isValid) {
            return NextResponse.json({
                success: false,
                validation_status: validation.status,
                message: validation.reason,
                warnings: validation.warnings,
                actualTrades: validation.actualTrades,
                actualDays: validation.actualDays,
                minTradesRequired: validation.minTradesRequired,
                minDaysRequired: validation.minDaysRequired,
            }, { status: 422 })
        }

        // ── 3. SDI Calculation (all 7 dimensions) ─────────────────────────────
        const sdiResult = calculateSDI(rawTrades)
        console.log(`[upload] SDI: ${sdiResult.sdi} | Tier: ${sdiResult.tier}`)

        // ── 4. Aurion Analysis (AI validation + behavioral profile) ───────────
        console.log('[upload] Calling Aurion for behavioral analysis...')
        const aurionReport = await analyzeWithAurion(
            sdiResult,
            validation.actualTrades,
            validation.actualDays,
            user.email ?? 'trader',
        )
        console.log(`[upload] Aurion: confidence=${aurionReport.confidence} | valid=${aurionReport.validationOk}`)

        // ── 5. Upsert trades ──────────────────────────────────────────────────
        const tradeRows = parsed.trades.map(t => ({
            user_id: user.id,
            ticket: t.ticket,
            symbol: t.symbol || 'UNKNOWN',
            trade_type: t.type,
            lots: t.lots,
            open_time: t.openTime ? new Date(t.openTime * 1000).toISOString() : null,
            close_time: t.closeTime ? new Date(t.closeTime * 1000).toISOString() : null,
            open_price: t.openPrice,
            close_price: t.closePrice,
            profit: t.profit,
            commission: t.commission,
            swap: t.swap,
            platform: parsed.platform,
            broker: '',
            mt_login: parsed.login,
            mt_server: parsed.server,
        }))

        await admin.from('mt4_trades')
            .upsert(tradeRows, { onConflict: 'user_id,ticket', ignoreDuplicates: true })
            .then(({ error }) => { if (error) console.error('[upload] Upsert trades error:', error.message) })

        // ── 6. Save SDI Score + Aurion Report ────────────────────────────────
        await admin.from('sdi_scores').upsert({
            user_id: user.id,
            computed_at: new Date().toISOString(),
            sdi_score: sdiResult.sdi,
            sharpe_ratio: sdiResult.sharpe,
            sortino_ratio: sdiResult.sortino,
            max_drawdown_pct: sdiResult.maxDrawdownPct,
            win_rate: sdiResult.winRate,
            profit_factor: sdiResult.profitFactor,
            z_score_consistency: sdiResult.zScoreConsistency,
            total_trades: sdiResult.totalTrades,
            trading_days: sdiResult.tradingDays,
            tier: sdiResult.tier,
            net_profit: sdiResult.netProfit,
            gross_profit: sdiResult.grossProfit,
            gross_loss: sdiResult.grossLoss,
            raw_metrics: {
                breakdown: sdiResult.breakdown,
                aurion: aurionReport,
                validation: validation,
                avgProfit: sdiResult.avgProfit,
                avgLoss: sdiResult.avgLoss,
                dataCoverage: sdiResult.dataCoverage,
            },
            platform: parsed.platform,
            broker: '',
            mt_login: parsed.login,
            mt_server: parsed.server,
        }, { onConflict: 'user_id' })
            .then(({ error }) => { if (error) console.error('[upload] Upsert sdi_scores error:', error.message) })

        // ── 7. Update data_sources ────────────────────────────────────────────
        try {
            await admin.from('data_sources').upsert({
                user_id: user.id,
                source_type: 'upload',
                provider: `${parsed.platform}_statement`,
                verification_level: 'statement',
                status: 'verified',
                metadata: {
                    originalFilename: file.name,
                    tradeCount: parsed.trades.length,
                    platform: parsed.platform,
                    login: parsed.login,
                    parsedAt: new Date().toISOString(),
                }
            }, { onConflict: 'user_id,source_type' })
        } catch {
            await admin.from('data_sources').insert({
                user_id: user.id,
                source_type: 'upload',
                provider: `${parsed.platform}_statement`,
                verification_level: 'statement',
                status: 'verified',
                metadata: { originalFilename: file.name, tradeCount: parsed.trades.length }
            }).then(() => { })
        }

        // ── 8. Return ─────────────────────────────────────────────────────────
        return NextResponse.json({
            success: true,
            validation_status: 'validated',
            sdi: sdiResult.sdi,
            tier: sdiResult.tier,
            trades: sdiResult.totalTrades,
            tradingDays: sdiResult.tradingDays,
            platform: parsed.platform,
            login: parsed.login,
            warnings: validation.warnings,
            aurion: {
                summary: aurionReport.summary,
                tier_comment: aurionReport.tier_comment,
                strengths: aurionReport.strengths,
                flags: aurionReport.flags,
                confidence: aurionReport.confidence,
                validationOk: aurionReport.validationOk,
            },
            metrics: {
                sharpe: sdiResult.sharpe,
                sortino: sdiResult.sortino,
                maxDrawdown: sdiResult.maxDrawdownPct,
                winRate: Math.round(sdiResult.winRate * 100),
                profitFactor: sdiResult.profitFactor,
                netProfit: sdiResult.netProfit,
            },
        })

    } catch (err: unknown) {
        console.error('[upload] Unhandled error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
    }
}
