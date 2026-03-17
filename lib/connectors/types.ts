/**
 * Shared types for exchange connectors.
 * All connectors normalize to this canonical schema.
 */

export type Exchange = 'bybit' | 'binance'
export type ContractType = 'spot' | 'perp' | 'futures' | 'option'
export type TradeSide = 'buy' | 'sell'
export type TradeDirection = 'long' | 'short' | 'neutral'

export interface ConnectorConfig {
    apiKey: string
    apiSecret: string
    exchange: Exchange
    accountId: string
    userId: string
}

/** Unified trade representation — output of every connector */
export interface RawTrade {
    exchange: Exchange
    exchangeTradeId: string      // exchange-native unique ID
    symbol: string               // e.g. "BTCUSDT"
    baseAsset: string            // e.g. "BTC"
    quoteAsset: string           // e.g. "USDT"
    contractType: ContractType
    side: TradeSide
    direction: TradeDirection | null
    qty: number                  // position size in base asset
    entryPrice: number | null
    exitPrice: number | null
    openTime: number             // unix ms
    closeTime: number | null     // unix ms
    realizedPnl: number          // in quote currency (USDT)
    fee: number                  // positive = cost
    funding: number              // funding fees (perp only)
    leverage: number | null
    notionalUsd: number | null
    isClosed: boolean
    rawPayload: Record<string, unknown>
}

export interface FetchResult {
    trades: RawTrade[]
    nextCursor?: string          // pagination cursor for next call
    hasMore: boolean
}

export interface ConnectorError {
    code: 'RATE_LIMIT' | 'INVALID_KEY' | 'NETWORK' | 'PARSE' | 'UNKNOWN'
    message: string
    retryable: boolean
}
