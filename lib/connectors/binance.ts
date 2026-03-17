/**
 * Binance REST Connector — Read-Only
 * Fetches trade history from Spot + USD-M Futures (USDT perpetuals).
 *
 * Docs:
 *  Spot trades: GET /api/v3/myTrades
 *  Futures trades: GET /fapi/v1/userTrades
 */

import { createHmac } from 'crypto'
import type { ConnectorConfig, RawTrade, FetchResult } from './types'

const SPOT_BASE = 'https://api.binance.com'
const FUTURES_BASE = 'https://fapi.binance.com'
const MAX_RETRIES = 4
const LIMIT = 1000

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function signBinance(secret: string, params: URLSearchParams): string {
    return createHmac('sha256', secret).update(params.toString()).digest('hex')
}

/** Normalize Binance Spot trade → RawTrade */
function normalizeSpotTrade(raw: Record<string, unknown>, cfg: ConnectorConfig): RawTrade {
    const symbol = String(raw.symbol ?? '')
    const isBuyer = Boolean(raw.isBuyer)
    const price = parseFloat(String(raw.price ?? 0))
    const qty = parseFloat(String(raw.qty ?? 0))
    const quoteQty = parseFloat(String(raw.quoteQty ?? 0))
    const commission = parseFloat(String(raw.commission ?? 0))
    const time = parseInt(String(raw.time ?? 0), 10)

    const baseAsset = symbol.replace(/USDT$|BUSD$|BTC$|ETH$|BNB$/, '')
    const quoteAsset = symbol.includes('USDT') ? 'USDT' : 'BUSD'

    return {
        exchange: 'binance',
        exchangeTradeId: `spot-${String(raw.id ?? '')}`,
        symbol,
        baseAsset,
        quoteAsset,
        contractType: 'spot',
        side: isBuyer ? 'buy' : 'sell',
        direction: null,
        qty,
        entryPrice: isBuyer ? price : null,
        exitPrice: !isBuyer ? price : null,
        openTime: time,
        closeTime: time,
        realizedPnl: 0, // spot: PnL computed from equity curve
        fee: commission,
        funding: 0,
        leverage: null,
        notionalUsd: quoteQty,
        isClosed: true,
        rawPayload: raw,
    }
}

/** Normalize Binance Futures trade → RawTrade */
function normalizeFuturesTrade(raw: Record<string, unknown>, cfg: ConnectorConfig): RawTrade {
    const symbol = String(raw.symbol ?? '')
    const side = String(raw.side ?? '').toLowerCase() as 'buy' | 'sell'
    const positionSide = String(raw.positionSide ?? '').toLowerCase()
    const qty = parseFloat(String(raw.qty ?? 0))
    const price = parseFloat(String(raw.price ?? 0))
    const realizedPnl = parseFloat(String(raw.realizedPnl ?? 0))
    const commission = parseFloat(String(raw.commission ?? 0))
    const time = parseInt(String(raw.time ?? 0), 10)

    let direction: RawTrade['direction'] = null
    if (positionSide === 'long') direction = 'long'
    else if (positionSide === 'short') direction = 'short'
    else direction = side === 'buy' ? 'long' : 'short'

    const baseAsset = symbol.replace(/USDT$|USD$|BUSD$/, '')

    return {
        exchange: 'binance',
        exchangeTradeId: `fut-${String(raw.id ?? '')}`,
        symbol,
        baseAsset,
        quoteAsset: 'USDT',
        contractType: 'perp',
        side,
        direction,
        qty,
        entryPrice: direction === 'long' && side === 'buy' ? price : null,
        exitPrice: null,
        openTime: time,
        closeTime: realizedPnl !== 0 ? time : null,
        realizedPnl,
        fee: Math.abs(commission),
        funding: 0,
        leverage: null, // Binance doesn't return leverage per trade
        notionalUsd: qty * price,
        isClosed: realizedPnl !== 0,
        rawPayload: raw,
    }
}

/** Fetch Binance spot trades with retry/backoff */
async function fetchSpotTrades(
    cfg: ConnectorConfig,
    fromId?: string
): Promise<{ trades: RawTrade[]; hasMore: boolean; lastId?: string }> {
    let attempt = 0

    while (attempt < MAX_RETRIES) {
        try {
            const params = new URLSearchParams({
                limit: String(LIMIT),
                recvWindow: '5000',
                timestamp: Date.now().toString(),
                ...(fromId ? { fromId } : {}),
            })
            const sig = signBinance(cfg.apiSecret, params)
            params.append('signature', sig)

            const res = await fetch(`${SPOT_BASE}/api/v3/myTrades?${params}`, {
                headers: { 'X-MBX-APIKEY': cfg.apiKey },
            })

            if (res.status === 429 || res.status === 418) {
                const retryAfter = parseInt(res.headers.get('Retry-After') ?? '5', 10)
                await sleep(retryAfter * 1000)
                attempt++
                continue
            }

            const json = await res.json() as Record<string, unknown>[]
            const trades = json.map(raw => normalizeSpotTrade(raw, cfg))
            const lastId = trades.length > 0 ? String(trades[trades.length - 1].rawPayload.id) : undefined

            return { trades, hasMore: trades.length === LIMIT, lastId }
        } catch (err) {
            if (attempt >= MAX_RETRIES - 1) throw err
            await sleep(2 ** attempt * 800)
            attempt++
        }
    }
    throw new Error('Max retries exceeded for Binance spot')
}

/** Fetch Binance futures trades with retry/backoff */
async function fetchFuturesTrades(
    cfg: ConnectorConfig,
    fromId?: string
): Promise<{ trades: RawTrade[]; hasMore: boolean; lastId?: string }> {
    let attempt = 0

    while (attempt < MAX_RETRIES) {
        try {
            const params = new URLSearchParams({
                limit: String(LIMIT),
                recvWindow: '5000',
                timestamp: Date.now().toString(),
                ...(fromId ? { fromId } : {}),
            })
            const sig = signBinance(cfg.apiSecret, params)
            params.append('signature', sig)

            const res = await fetch(`${FUTURES_BASE}/fapi/v1/userTrades?${params}`, {
                headers: { 'X-MBX-APIKEY': cfg.apiKey },
            })

            if (res.status === 429 || res.status === 418) {
                const retryAfter = parseInt(res.headers.get('Retry-After') ?? '5', 10)
                await sleep(retryAfter * 1000)
                attempt++
                continue
            }

            const json = await res.json() as Record<string, unknown>[]
            const trades = json.map(raw => normalizeFuturesTrade(raw, cfg))
            const lastId = trades.length > 0 ? String(trades[trades.length - 1].rawPayload.id) : undefined

            return { trades, hasMore: trades.length === LIMIT, lastId }
        } catch (err) {
            if (attempt >= MAX_RETRIES - 1) throw err
            await sleep(2 ** attempt * 800)
            attempt++
        }
    }
    throw new Error('Max retries exceeded for Binance futures')
}

/**
 * Fetch all trades from Binance (spot + futures) with pagination.
 */
export async function fetchBinanceTrades(
    cfg: ConnectorConfig,
    cursor?: string
): Promise<FetchResult> {
    const allTrades: RawTrade[] = []

    // Spot
    let spotFromId: string | undefined
    do {
        const { trades, hasMore, lastId } = await fetchSpotTrades(cfg, spotFromId)
        allTrades.push(...trades)
        spotFromId = hasMore ? lastId : undefined
        if (hasMore) await sleep(300)
    } while (spotFromId)

    // Futures
    let futFromId: string | undefined
    do {
        const { trades, hasMore, lastId } = await fetchFuturesTrades(cfg, futFromId)
        allTrades.push(...trades)
        futFromId = hasMore ? lastId : undefined
        if (hasMore) await sleep(300)
    } while (futFromId)

    return { trades: allTrades, hasMore: false }
}

/**
 * Verify Binance API credentials (read-only check via account endpoint).
 */
export async function verifyBinanceCredentials(apiKey: string, apiSecret: string): Promise<boolean> {
    try {
        const params = new URLSearchParams({
            recvWindow: '5000',
            timestamp: Date.now().toString(),
        })
        const sig = signBinance(apiSecret, params)
        params.append('signature', sig)

        const res = await fetch(`${SPOT_BASE}/api/v3/account?${params}`, {
            headers: { 'X-MBX-APIKEY': apiKey },
        })
        return res.ok
    } catch {
        return false
    }
}
