import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { calculateSDI, RawTrade } from '@/app/lib/sdi-engine';

// Rate limiting per token (simple in-memory, resets on cold start)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 1 * 60 * 1000; // 1 minute (testing)

export async function POST(req: Request) {
    try {
        // ── 1. Authenticate via sync token ──────────────────────────────
        const syncToken = req.headers.get('X-Skillion-Token');
        const platform = req.headers.get('X-Skillion-Platform') || 'MT4';

        if (!syncToken || syncToken.length < 10) {
            return NextResponse.json({ error: 'Missing or invalid sync token.' }, { status: 401 });
        }

        // Rate limit check
        const lastCall = rateLimitMap.get(syncToken) || 0;
        if (Date.now() - lastCall < RATE_LIMIT_MS) {
            return NextResponse.json({ error: 'Rate limit: please wait before syncing again.' }, { status: 429 });
        }

        // ── 2. Supabase admin client ─────────────────────────────────────
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll: () => [], setAll: () => { } } }
        );

        // Find user by sync token
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .eq('sync_token', syncToken)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: 'Invalid sync token. Generate a new one in your Skillion dashboard.' }, { status: 401 });
        }

        const userId = profile.id;
        rateLimitMap.set(syncToken, Date.now());

        // ── 3. Parse incoming payload ────────────────────────────────────
        const body = await req.json() as {
            platform: string;
            version: string;
            broker: string;
            login: string;
            server: string;
            currency: string;
            balance: number;
            tradeCount: number;
            trades: RawTrade[];
        };

        if (!body.trades || !Array.isArray(body.trades) || body.trades.length === 0) {
            return NextResponse.json({ success: true, sdi: 0, message: 'No trades received.' });
        }

        console.log(`[mt4/sync] User ${profile.email} | Platform: ${platform} | Trades: ${body.trades.length}`);

        // ── 4. Upsert trades into mt4_trades ─────────────────────────────
        const tradeRows = body.trades.map(t => ({
            user_id: userId,
            ticket: t.ticket,
            symbol: t.symbol || 'UNKNOWN',
            trade_type: t.type || 'buy',
            lots: t.lots || 0,
            open_time: t.openTime ? new Date(t.openTime * 1000).toISOString() : null,
            close_time: t.closeTime ? new Date(t.closeTime * 1000).toISOString() : null,
            open_price: t.openPrice || 0,
            close_price: t.closePrice || 0,
            profit: t.profit || 0,
            commission: t.commission || 0,
            swap: t.swap || 0,
            platform: platform,
            broker: body.broker || '',
            mt_login: body.login || '',
            mt_server: body.server || '',
        }));

        // Upsert — skip duplicates by (user_id, ticket)
        const { error: upsertErr } = await supabaseAdmin
            .from('mt4_trades')
            .upsert(tradeRows, { onConflict: 'user_id,ticket', ignoreDuplicates: true });

        if (upsertErr) {
            console.error('[mt4/sync] Upsert error:', upsertErr.message);
            // Non-fatal — continue with score calculation
        }

        // ── 5. Load ALL trades for this user (for full SDI calc) ─────────
        const { data: allTrades } = await supabaseAdmin
            .from('mt4_trades')
            .select('*')
            .eq('user_id', userId)
            .order('close_time', { ascending: true });

        const tradesForEngine: RawTrade[] = (allTrades || []).map(row => ({
            ticket: row.ticket,
            symbol: row.symbol,
            type: row.trade_type as 'buy' | 'sell',
            lots: row.lots,
            openTime: row.open_time ? Math.floor(new Date(row.open_time).getTime() / 1000) : undefined,
            closeTime: row.close_time ? Math.floor(new Date(row.close_time).getTime() / 1000) : 0,
            openPrice: row.open_price,
            closePrice: row.close_price,
            profit: row.profit,
            commission: row.commission,
            swap: row.swap,
        }));

        // ── 6. Calculate SDI ──────────────────────────────────────────────
        const result = calculateSDI(tradesForEngine);

        // ── 7. Save/update SDI score ─────────────────────────────────────
        const { error: scoreErr } = await supabaseAdmin
            .from('sdi_scores')
            .upsert({
                user_id: userId,
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
                platform: platform,
                broker: body.broker || '',
                mt_login: body.login || '',
                mt_server: body.server || '',
            }, { onConflict: 'user_id' });

        if (scoreErr) {
            console.error('[mt4/sync] Score save error:', scoreErr.message);
        }

        console.log(`[mt4/sync] SDI computed: ${result.sdi} | Tier: ${result.tier}`);

        // ── 8. Return result to EA ────────────────────────────────────────
        return NextResponse.json({
            success: true,
            sdi: result.sdi,
            tier: result.tier,
            trades: result.totalTrades,
            message: `SDI Score: ${result.sdi} — Tier: ${result.tier.charAt(0).toUpperCase() + result.tier.slice(1)}`,
        });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[mt4/sync] Unhandled error:', msg);
        return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 });
    }
}
