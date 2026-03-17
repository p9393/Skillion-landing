/**
 * Bybit V5 REST Connector — Read-Only
 * Fetches executed trades (executions) from the Unified Trading Account.
 * Supports: USDT Perpetuals, Inverse, Spot.
 *
 * Docs: https://bybit-exchange.github.io/docs/v5/trade/execution
 */

import { createHmac } from 'crypto'
import type { ConnectorConfig, RawTrade, FetchResult } from './types'

const BASE_URL = 'https://api.bybit.com'
const MAX_RETRIES = 4
const LIMIT = 100

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/** HMAC-SHA256 signature for Bybit v5 */
function signBybit(
    apiKey: string,
    apiSecret: string,
    timestamp: string,
    queryString: string
): string {
    const payload = `${timestamp}${apiKey}5000${queryString}`
    return createHmac('sha256', apiSecret).update(payload).digest('hex')
}

/** Normalize a single Bybit execution into RawTrade */
function normalizeExecution(raw: Record<string, unknown>, cfg: ConnectorConfig): RawTrade {
    const symbol = String(raw.symbol ?? '')
    const side = String(raw.side ?? '').toLowerCase() as 'buy' | 'sell'
    const execType = String(raw.execType ?? '')
    const isClose = execType === 'trade'

    // Direction: Bybit perp has side (Buy/Sell) and position side indirectly
    let direction: RawTrade['direction'] = null
    if (String(raw.orderLinkId ?? '').includes('long') || side === 'buy') direction = 'long'
    if (String(raw.orderLinkId ?? '').includes('short') || side === 'sell') direction = 'short'

    const execPrice = parseFloat(String(raw.execPrice ?? 0))
    const execQty = parseFloat(String(raw.execQty ?? 0))
    const execFee = parseFloat(String(raw.execFee ?? 0))
    const closedPnl = parseFloat(String(raw.closedPnl ?? 0))
    const execTime = parseInt(String(raw.execTime ?? 0), 10)
    const leverage = parseFloat(String(raw.leverage ?? 0)) || null
    const notionalUsd = execPrice * execQty

    // Category → contractType
    const category = String(raw.category ?? '')
    const contractType =
        category === 'spot' ? 'spot' :
            category === 'linear' || category === 'inverse' ? 'perp' :
                'perp'

    // symbol parsing: BTCUSDT → base=BTC, quote=USDT
    const baseAsset = symbol.replace(/USDT$|USD$|BUSD$/, '')
    const quoteAsset = symbol.includes('USDT') ? 'USDT' : 'USD'

    return {
        exchange: 'bybit',
        exchangeTradeId: String(raw.execId ?? `${execTime}-${symbol}`),
        symbol,
        baseAsset,
        quoteAsset,
        contractType,
        side,
        direction,
        qty: execQty,
        entryPrice: isClose ? null : execPrice,
        exitPrice: isClose ? execPrice : null,
        openTime: execTime,
        closeTime: isClose ? execTime : null,
        realizedPnl: closedPnl,
        fee: Math.abs(execFee),
        funding: 0, // fetched separately
        leverage,
        notionalUsd,
        isClosed: closedPnl !== 0 || isClose,
        rawPayload: raw,
    }
}

/** Fetch a page of executions from Bybit */
async function fetchPage(
    cfg: ConnectorConfig,
    category: string,
    cursor?: string
): Promise<{ trades: RawTrade[]; nextCursor?: string }> {
    const params: Record<string, string> = {
        category,
        limit: String(LIMIT),
        ...(cursor ? { cursor } : {}),
    }
    const queryString = new URLSearchParams(params).toString()
    const ts = Date.now().toString()
    const sig = signBybit(cfg.apiKey, cfg.apiSecret, ts, queryString)

    const res = await fetch(`${BASE_URL}/v5/execution/list?${queryString}`, {
        headers: {
            'X-BAPI-API-KEY': cfg.apiKey,
            'X-BAPI-TIMESTAMP': ts,
            'X-BAPI-RECV-WINDOW': '5000',
            'X-BAPI-SIGN': sig,
        },
    })

    if (!res.ok) {
        throw { code: 'NETWORK', message: `HTTP ${res.status}`, retryable: true }
    }

    const json = await res.json() as {
        retCode: number
        retMsg: string
        result: { list: Record<string, unknown>[]; nextPageCursor?: string }
    }

    if (json.retCode === 10002 || json.retCode === 10016) {
        throw { code: 'RATE_LIMIT', message: json.retMsg, retryable: true }
    }
    if (json.retCode !== 0) {
        throw { code: 'INVALID_KEY', message: json.retMsg, retryable: false }
    }

    const trades = (json.result.list ?? []).map(raw =>
        normalizeExecution({ ...raw, category }, cfg)
    )

    return {
        trades,
        nextCursor: json.result.nextPageCursor || undefined,
    }
}

/**
 * Fetch all trades from a Bybit account with retry/backoff.
 * Fetches both linear (USDT perp) and spot.
 */
export async function fetchBybitTrades(
    cfg: ConnectorConfig,
    cursor?: string
): Promise<FetchResult> {
    const categories = ['linear', 'spot']
    const allTrades: RawTrade[] = []
    let lastCursor: string | undefined

    for (const category of categories) {
        let pageCursor = cursor
        let attempt = 0

        while (true) {
            try {
                const { trades, nextCursor } = await fetchPage(cfg, category, pageCursor)
                allTrades.push(...trades)
                lastCursor = nextCursor

                if (!nextCursor) break
                pageCursor = nextCursor
                await sleep(200) // polite rate limit
                attempt = 0
            } catch (err: unknown) {
                const e = err as { code: string; retryable: boolean; message: string }
                if (!e.retryable || attempt >= MAX_RETRIES) throw err
                const delay = e.code === 'RATE_LIMIT' ? 5000 : 2 ** attempt * 800
                await sleep(delay)
                attempt++
            }
        }
    }

    return {
        trades: allTrades,
        nextCursor: lastCursor,
        hasMore: !!lastCursor,
    }
}

/**
 * Verify that Bybit API credentials are valid (read-only check).
 */
export async function verifyBybitCredentials(apiKey: string, apiSecret: string): Promise<boolean> {
    try {
        const ts = Date.now().toString()
        const sig = signBybit(apiKey, apiSecret, ts, '')
        const res = await fetch(`${BASE_URL}/v5/account/info`, {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-TIMESTAMP': ts,
                'X-BAPI-RECV-WINDOW': '5000',
                'X-BAPI-SIGN': sig,
            },
        })
        const json = await res.json() as { retCode: number }
        return json.retCode === 0
    } catch {
        return false
    }
}
