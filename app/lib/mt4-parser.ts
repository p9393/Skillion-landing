/**
 * MT4 / MT5 HTML Statement Parser
 * Parses the standard MetaTrader "Account History" HTML report
 * and extracts closed BUY/SELL trades for SDI calculation.
 */

export interface ParsedTrade {
    ticket: number;
    openTime: number;  // unix timestamp
    closeTime: number;  // unix timestamp
    symbol: string;
    type: 'buy' | 'sell';
    lots: number;
    openPrice: number;
    closePrice: number;
    stopLoss: number;
    takeProfit: number;
    commission: number;
    swap: number;
    profit: number;
    comment: string;
}

export interface ParseResult {
    platform: 'MT4' | 'MT5';
    login: string;
    server: string;
    currency: string;
    balance: number;
    trades: ParsedTrade[];
    errors: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDate(s: string): number {
    if (!s) return 0;
    // MT4 format: "2023.01.15 14:30"  or  "2023-01-15 14:30:00"
    const clean = s.trim().replace(/\./g, '-');
    const d = new Date(clean.replace(' ', 'T') + (clean.includes(':') && clean.split(':').length < 3 ? ':00' : ''));
    return isNaN(d.getTime()) ? 0 : Math.floor(d.getTime() / 1000);
}

function parseNum(s: string): number {
    if (!s) return 0;
    const n = parseFloat(s.replace(/\s/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
}

function stripHtml(s: string): string {
    return s.replace(/<[^>]*>/g, '').trim();
}

// Extract text content from a <td> element
function tdText(s: string): string {
    const m = s.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
    return m ? stripHtml(m[1]) : '';
}

// Split a table row into cells
function splitRow(row: string): string[] {
    const cells: string[] = [];
    const re = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let m;
    while ((m = re.exec(row)) !== null) {
        cells.push(stripHtml(m[1]));
    }
    return cells;
}

// ─── Main Parser ─────────────────────────────────────────────────────────────

export function parseMT4Statement(html: string): ParseResult {
    const result: ParseResult = {
        platform: 'MT4',
        login: '',
        server: '',
        currency: 'USD',
        balance: 0,
        trades: [],
        errors: [],
    };

    try {
        // ── Detect platform ───────────────────────────────────────────────
        if (html.includes('MetaTrader 5') || html.includes('MT5')) {
            result.platform = 'MT5';
        }

        // ── Extract account info (in the report header) ───────────────────
        const loginMatch = html.match(/Account:\s*(\d+)/i) || html.match(/Conto:\s*(\d+)/i);
        const serverMatch = html.match(/(?:Server:|server:)\s*([^\s<\r\n,]+)/i);
        const currencyMatch = html.match(/Currency:\s*([A-Z]{3})/i) || html.match(/Valuta:\s*([A-Z]{3})/i);
        const balanceMatch = html.match(/Balance:\s*([\d\s.,]+)/i) || html.match(/Saldo:\s*([\d\s.,]+)/i);

        if (loginMatch) result.login = loginMatch[1].trim();
        if (serverMatch) result.server = serverMatch[1].trim();
        if (currencyMatch) result.currency = currencyMatch[1].trim();
        if (balanceMatch) result.balance = parseNum(balanceMatch[1]);

        // Also search in cells
        if (!result.login) {
            const loginCell = html.match(/>Account:<\/td>\s*<td[^>]*>(\d+)</i) ||
                html.match(/>Conto:<\/td>\s*<td[^>]*>(\d+)</i);
            if (loginCell) result.login = loginCell[1];
        }

        // ── Find all table rows ───────────────────────────────────────────
        const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRe.exec(html)) !== null) {
            const rowHtml = rowMatch[1];
            const cells = splitRow('<tr>' + rowHtml + '</tr>');

            // MT4 Account History rows have 14 columns:
            // [0] Ticket [1] OpenTime [2] Type [3] Size [4] Symbol
            // [5] OpenPrice [6] SL [7] TP [8] CloseTime [9] ClosePrice
            // [10] Commission [11] Swap [12] Profit [13] Comment
            //
            // Some brokers have 13 columns (no comment). Check > 11.

            if (cells.length < 12) continue;

            const typeStr = cells[2]?.trim().toLowerCase();

            // Only BUY/SELL (skip balance, credit, etc.)
            if (typeStr !== 'buy' && typeStr !== 'sell' &&
                typeStr !== 'buy limit' && typeStr !== 'sell limit' &&
                typeStr !== 'buy stop' && typeStr !== 'sell stop') {
                continue;
            }

            // Skip if ticket is not a number
            const ticket = parseInt(cells[0]);
            if (isNaN(ticket)) continue;

            // Skip if no close time (= still open)
            const closeTime = parseDate(cells[8]);
            if (!closeTime) continue;

            const trade: ParsedTrade = {
                ticket,
                openTime: parseDate(cells[1]),
                closeTime,
                symbol: cells[4]?.trim() || '',
                type: typeStr.startsWith('sell') ? 'sell' : 'buy',
                lots: parseNum(cells[3]),
                openPrice: parseNum(cells[5]),
                closePrice: parseNum(cells[9]),
                stopLoss: parseNum(cells[6]),
                takeProfit: parseNum(cells[7]),
                commission: parseNum(cells[10]),
                swap: parseNum(cells[11]),
                profit: parseNum(cells[12]),
                comment: cells[13] || '',
            };

            result.trades.push(trade);
        }

        // ── MT5 format (deal-based, different column layout) ─────────────
        // MT5 has: Deal | Time | Symbol | Type | Direction | Volume | Price | Order | Commission | Swap | Profit | Balance | Comment
        if (result.trades.length === 0 && result.platform === 'MT5') {
            const rowRe5 = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
            const allRows: string[][] = [];
            let rm;
            while ((rm = rowRe5.exec(html)) !== null) {
                const c = splitRow('<tr>' + rm[1] + '</tr>');
                if (c.length >= 10) allRows.push(c);
            }

            // Group MT5 deals: in/out pairs
            const inDeals = new Map<string, string[]>();
            for (const c of allRows) {
                const dir = c[4]?.trim().toLowerCase();
                if (dir === 'in' || dir === 'in,sl' || dir === 'in,tp') {
                    inDeals.set(c[0], c);
                } else if ((dir === 'out' || dir === 'out,sl' || dir === 'out,tp') && c[2]) {
                    const sym = c[2].trim();
                    const closeTm = parseDate(c[1]);
                    if (!closeTm) continue;

                    const trade: ParsedTrade = {
                        ticket: parseInt(c[0]) || 0,
                        openTime: 0,
                        closeTime: closeTm,
                        symbol: sym,
                        type: c[3]?.toLowerCase().includes('sell') ? 'sell' : 'buy',
                        lots: parseNum(c[5]),
                        openPrice: 0,
                        closePrice: parseNum(c[6]),
                        stopLoss: 0,
                        takeProfit: 0,
                        commission: parseNum(c[8]),
                        swap: parseNum(c[9]),
                        profit: parseNum(c[10]),
                        comment: c[12] || '',
                    };
                    result.trades.push(trade);
                }
            }
        }

        console.log(`[parseMT4] Platform: ${result.platform} | Login: ${result.login} | Trades found: ${result.trades.length}`);

    } catch (err) {
        result.errors.push(err instanceof Error ? err.message : String(err));
    }

    return result;
}
