import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { parseMT4Statement } from '@/app/lib/mt4-parser'
import { calculateSDI, RawTrade } from '@/app/lib/sdi-engine'

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

        const buffer = await file.arrayBuffer()
        const fileBytes = new Uint8Array(buffer)

        if (fileBytes.byteLength > 15 * 1024 * 1024)
            return NextResponse.json({ error: 'File exceeds 15 MB limit' }, { status: 400 })

        const checksum = crypto.createHash('sha256').update(Buffer.from(fileBytes)).digest('hex')

        // ── Admin client ─────────────────────────────────────────────────────
        const admin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll: () => [], setAll: () => { } } }
        )

        // ── 1. Upload raw file to Storage ─────────────────────────────────
        await admin.storage.createBucket('statements', { public: false }).catch(() => { })
        const ext = file.name.split('.').pop() || 'html'
        const filePath = `${user.id}/${Date.now()}.${ext}`

        const { error: uploadErr } = await admin.storage
            .from('statements')
            .upload(filePath, fileBytes, { contentType: file.type || 'text/html' })

        if (uploadErr) {
            console.error('[upload] Storage error:', uploadErr.message)
            // Non-fatal — continue with parse
        }

        // ── 2. Parse HTML statement ───────────────────────────────────────
        const html = new TextDecoder('utf-8').decode(fileBytes)
        const parsed = parseMT4Statement(html)

        console.log(`[upload] Parsed ${parsed.trades.length} trades | Platform: ${parsed.platform} | Login: ${parsed.login}`)

        if (parsed.trades.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No closed BUY/SELL trades found in the file. Make sure you saved "All History" in MT4 before exporting.',
                parsed: { platform: parsed.platform, login: parsed.login, trades: 0 },
            }, { status: 422 })
        }

        // ── 3. Upsert trades into mt4_trades ─────────────────────────────
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

        const { error: upsertErr } = await admin
            .from('mt4_trades')
            .upsert(tradeRows, { onConflict: 'user_id,ticket', ignoreDuplicates: true })

        if (upsertErr) console.error('[upload] Upsert error:', upsertErr.message)

        // ── 4. Calculate SDI ──────────────────────────────────────────────
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

        const result = calculateSDI(rawTrades)

        // ── 5. Upsert SDI score ───────────────────────────────────────────
        await admin.from('sdi_scores').upsert({
            user_id: user.id,
            computed_at: new Date().toISOString(),
            sdi_score: result.sdi,
            sharpe_ratio: result.sharpe,
            sortino_ratio: result.sortino,
            max_drawdown_pct: result.maxDrawdownPct,
            win_rate: result.winRate,
            profit_factor: result.profitFactor,
            z_score_consistency: result.zScoreConsistency,
            total_trades: result.totalTrades,
            trading_days: result.tradingDays,
            tier: result.tier,
            net_profit: result.netProfit,
            gross_profit: result.grossProfit,
            gross_loss: result.grossLoss,
            raw_metrics: result.breakdown,
            platform: parsed.platform,
            broker: '',
            mt_login: parsed.login,
            mt_server: parsed.server,
        }, { onConflict: 'user_id' })

        // ── 6. Update data_sources status ────────────────────────────────
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
            // fallback: insert if no unique constraint
            await admin.from('data_sources').insert({
                user_id: user.id,
                source_type: 'upload',
                provider: `${parsed.platform}_statement`,
                verification_level: 'statement',
                status: 'verified',
                metadata: { originalFilename: file.name, tradeCount: parsed.trades.length, platform: parsed.platform, login: parsed.login }
            })
        }

        console.log(`[upload] SDI: ${result.sdi} | Tier: ${result.tier} | Trades: ${result.totalTrades}`)

        return NextResponse.json({
            success: true,
            sdi: result.sdi,
            tier: result.tier,
            trades: result.totalTrades,
            platform: parsed.platform,
            login: parsed.login,
            message: `SDI Score: ${result.sdi} — Tier: ${result.tier.charAt(0).toUpperCase() + result.tier.slice(1)}`,
        })

    } catch (err: unknown) {
        console.error('[upload] Error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
    }
}
