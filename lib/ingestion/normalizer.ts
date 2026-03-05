/**
 * Normalizer — converts RawTrade into the DB schema for normalized_trades.
 * Handles edge cases: missing prices, spot (no direction), zero qty etc.
 */

import type { RawTrade } from '../connectors/types'

export interface NormalizedTradeInsert {
    account_id: string
    user_id: string
    exchange_trade_id: string
    symbol: string
    base_asset: string
    quote_asset: string
    contract_type: string
    side: string
    direction: string | null
    qty: number
    entry_price: number | null
    exit_price: number | null
    open_time: string          // ISO
    close_time: string | null  // ISO
    realized_pnl: number
    fee: number
    funding: number
    leverage: number | null
    notional_usd: number | null
    currency: string
    is_closed: boolean
}

export function normalizeToDb(
    trade: RawTrade,
    accountId: string,
    userId: string
): NormalizedTradeInsert {
    return {
        account_id: accountId,
        user_id: userId,
        exchange_trade_id: trade.exchangeTradeId,
        symbol: trade.symbol,
        base_asset: trade.baseAsset,
        quote_asset: trade.quoteAsset,
        contract_type: trade.contractType,
        side: trade.side,
        direction: trade.direction,
        qty: Math.max(0, trade.qty),
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice,
        open_time: new Date(trade.openTime).toISOString(),
        close_time: trade.closeTime ? new Date(trade.closeTime).toISOString() : null,
        realized_pnl: trade.realizedPnl ?? 0,
        fee: Math.abs(trade.fee ?? 0),
        funding: trade.funding ?? 0,
        leverage: trade.leverage,
        notional_usd: trade.notionalUsd,
        currency: 'USD',
        is_closed: trade.isClosed,
    }
}

/** Batch normalize and deduplicate by exchangeTradeId */
export function batchNormalize(
    trades: RawTrade[],
    accountId: string,
    userId: string
): NormalizedTradeInsert[] {
    const seen = new Set<string>()
    const result: NormalizedTradeInsert[] = []

    for (const trade of trades) {
        // Skip malformed trades
        if (!trade.exchangeTradeId || trade.qty <= 0 || !trade.openTime) continue
        // Deduplicate within batch
        const key = `${accountId}:${trade.exchangeTradeId}`
        if (seen.has(key)) continue
        seen.add(key)
        result.push(normalizeToDb(trade, accountId, userId))
    }

    return result
}
