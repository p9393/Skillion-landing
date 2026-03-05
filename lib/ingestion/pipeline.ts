/**
 * Ingestion Pipeline Orchestrator
 * Coordinates: fetch → normalize → upsert → trigger metrics recompute
 *
 * Design principles:
 * - Idempotent: uses upsert with onConflict:'account_id,exchange_trade_id'
 * - Auditable: every run logged in ingestion_runs
 * - Safe: never exposes plaintext secrets
 */

import { createClient } from '@supabase/supabase-js'
import { fetchBybitTrades } from '../connectors/bybit'
import { fetchBinanceTrades } from '../connectors/binance'
import { batchNormalize } from './normalizer'
import { decrypt } from '../encryption'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BATCH_SIZE = 500

async function createIngestionRun(accountId: string, userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from('ingestion_runs')
        .insert({
            account_id: accountId,
            user_id: userId,
            status: 'running',
        })
        .select('id')
        .single()

    if (error) throw new Error(`Failed to create ingestion run: ${error.message}`)
    return data.id
}

async function completeRun(runId: string, tradesNew: number, tradesFetched: number) {
    await supabaseAdmin
        .from('ingestion_runs')
        .update({
            status: 'completed',
            trades_fetched: tradesFetched,
            trades_new: tradesNew,
            completed_at: new Date().toISOString(),
        })
        .eq('id', runId)
}

async function failRun(runId: string, errorMsg: string) {
    await supabaseAdmin
        .from('ingestion_runs')
        .update({
            status: 'failed',
            error_msg: errorMsg.slice(0, 500),
            completed_at: new Date().toISOString(),
        })
        .eq('id', runId)
}

async function getDecryptedCredentials(accountId: string) {
    const { data, error } = await supabaseAdmin
        .from('api_credentials')
        .select('api_key_enc, api_secret_enc, iv')
        .eq('account_id', accountId)
        .single()

    if (error || !data) throw new Error(`Credentials not found for account ${accountId}`)

    const apiKey = await decrypt({ cipher: data.api_key_enc, iv: data.iv })
    const apiSecret = await decrypt({ cipher: data.api_secret_enc, iv: data.iv })
    return { apiKey, apiSecret }
}

async function upsertBatch(trades: ReturnType<typeof batchNormalize>): Promise<number> {
    if (trades.length === 0) return 0

    let insertedCount = 0

    // Process in batches to avoid payload size limits
    for (let i = 0; i < trades.length; i += BATCH_SIZE) {
        const batch = trades.slice(i, i + BATCH_SIZE)
        const { error } = await supabaseAdmin
            .from('normalized_trades')
            .upsert(batch, {
                onConflict: 'account_id,exchange_trade_id',
                ignoreDuplicates: true,
            })

        if (error) {
            console.error(`[ingestion] Upsert batch error: ${error.message}`)
        } else {
            insertedCount += batch.length
        }
    }

    return insertedCount
}

async function updateAccountStatus(accountId: string, status: 'active' | 'error', errorMsg?: string) {
    await supabaseAdmin
        .from('exchange_accounts')
        .update({
            status,
            last_sync_at: status === 'active' ? new Date().toISOString() : undefined,
            error_msg: errorMsg ?? null,
        })
        .eq('id', accountId)
}

async function logAudit(userId: string, action: string, metadata: Record<string, unknown>) {
    await supabaseAdmin.from('audit_logs').insert({ user_id: userId, action, metadata })
}

/**
 * Main ingestion entry point.
 * Call this after verifying auth server-side.
 */
export async function runIngestion(
    accountId: string,
    userId: string
): Promise<{ runId: string; tradesNew: number; tradesFetched: number }> {
    const runId = await createIngestionRun(accountId, userId)

    try {
        // Load account info
        const { data: account, error: accErr } = await supabaseAdmin
            .from('exchange_accounts')
            .select('exchange')
            .eq('id', accountId)
            .single()

        if (accErr || !account) throw new Error('Account not found')

        // Decrypt and use credentials
        const { apiKey, apiSecret } = await getDecryptedCredentials(accountId)
        const cfg = { apiKey, apiSecret, exchange: account.exchange as 'bybit' | 'binance', accountId, userId }

        // Fetch trades
        const fetchResult = account.exchange === 'bybit'
            ? await fetchBybitTrades(cfg)
            : await fetchBinanceTrades(cfg)

        const tradesFetched = fetchResult.trades.length

        // Normalize + batch upsert
        const normalized = batchNormalize(fetchResult.trades, accountId, userId)
        const tradesNew = await upsertBatch(normalized)

        // Mark run complete
        await completeRun(runId, tradesNew, tradesFetched)
        await updateAccountStatus(accountId, 'active')
        await logAudit(userId, 'ingestion_completed', { accountId, tradesNew, tradesFetched })

        console.log(`[ingestion/${account.exchange}] Done: ${tradesFetched} fetched, ${tradesNew} new`)
        return { runId, tradesNew, tradesFetched }

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await failRun(runId, msg)
        await updateAccountStatus(accountId, 'error', msg)
        await logAudit(userId, 'ingestion_failed', { accountId, error: msg })
        throw err
    }
}
