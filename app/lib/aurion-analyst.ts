/**
 * Aurion Analyst v2
 * Expanded behavioral analysis with trading style classification,
 * risk profiling, and actionable recommendations.
 */

import OpenAI from 'openai';
import { SDIResult } from './sdi-engine';

export interface AurionReport {
    summary: string;
    flags: string[];
    strengths: string[];
    validationOk: boolean;
    confidence: number;
    tier_comment: string;
    // v2 fields
    risk_profile: 'conservative' | 'moderate' | 'aggressive' | 'unknown';
    trading_style: 'scalper' | 'day_trader' | 'swing_trader' | 'position_trader' | 'unknown';
    key_recommendation: string;
    next_tier_gap: string;
}

function buildPrompt(metrics: SDIResult, tradeCount: number, calendarDays: number, userEmail: string): string {
    // Build symbol context (top 3 by trade count)
    const topSymbols = metrics.symbolBreakdown?.slice(0, 3)
        .map(s => `${s.symbol}: ${s.trades} trades, WR ${(s.winRate * 100).toFixed(0)}%, P&L €${s.netPnl.toFixed(0)}`)
        .join(' | ') || 'N/A';

    // Best/worst month
    const sortedMonths = [...(metrics.monthlyReturns || [])].sort((a, b) => b.pnl - a.pnl);
    const bestMonth = sortedMonths[0] ? `${sortedMonths[0].month} (€${sortedMonths[0].pnl.toFixed(0)})` : 'N/A';
    const worstMonth = sortedMonths[sortedMonths.length - 1] ? `${sortedMonths[sortedMonths.length - 1].month} (€${sortedMonths[sortedMonths.length - 1].pnl.toFixed(0)})` : 'N/A';

    // Tier gap context
    const tierGaps: Record<string, string> = {
        explorer: 'Punteggio target: 300/1000 (Builder). Focus: aumentare il numero di trade, ridurre il max drawdown.',
        builder: 'Punteggio target: 500/1000 (Strategist). Focus: Sharpe > 1.5, Sortino > 1.5, Win Rate > 55%.',
        strategist: 'Punteggio target: 700/1000 (Architect). Focus: consistenza Z-Score, Profit Factor > 2.0.',
        architect: 'Punteggio target: 850/1000 (Elite). Focus: eccellenza in tutte le dimensioni, dati copertura > 80%.',
        elite: 'Tier massimo raggiunto. Mantenere performance elevata e diversificazione strumenti.',
    };

    return `Sei Aurion, il layer di intelligenza analitica di Skillion Finance.

Hai appena ricevuto lo statement di trading di ${userEmail}. Analizza i seguenti dati e produci una valutazione strutturata del profilo comportamentale del trader.

=== DATI SDI ===
Score totale: ${metrics.sdi}/1000 — Tier: ${metrics.tier.toUpperCase()}
Trade totali: ${tradeCount} | Giorni di trading: ${metrics.tradingDays} | Giorni calendario: ${calendarDays}
Net Profit: €${metrics.netProfit.toFixed(2)} | Win Rate: ${(metrics.winRate * 100).toFixed(1)}%

=== METRICHE PER DIMENSIONE ===
• Sharpe Ratio: ${metrics.sharpe} (${metrics.breakdown.find(d => d.name === 'Sharpe Ratio')?.contribution ?? 0} pt)
• Sortino Ratio: ${metrics.sortino} (${metrics.breakdown.find(d => d.name === 'Sortino Ratio')?.contribution ?? 0} pt)
• Max Drawdown: ${metrics.maxDrawdownPct}% (${metrics.breakdown.find(d => d.name === 'Max Drawdown')?.contribution ?? 0} pt)
• Win Rate: ${(metrics.winRate * 100).toFixed(1)}% (${metrics.breakdown.find(d => d.name === 'Win Rate')?.contribution ?? 0} pt)
• Z-Score Consistency (CV): ${metrics.zScoreConsistency} (${metrics.breakdown.find(d => d.name === 'Z-Score Consistency')?.contribution ?? 0} pt)
• Profit Factor: ${metrics.profitFactor} (${metrics.breakdown.find(d => d.name === 'Profit Factor')?.contribution ?? 0} pt)
• Data Coverage: ${(metrics.dataCoverage * 100).toFixed(0)}% (${metrics.breakdown.find(d => d.name === 'Data Coverage')?.contribution ?? 0} pt)

=== BREAKDOWN P&L ===
Gross Profit: €${metrics.grossProfit.toFixed(2)} | Gross Loss: €${metrics.grossLoss.toFixed(2)}
Avg Profit/Trade: €${metrics.avgProfit.toFixed(2)} | Avg Loss/Trade: €${metrics.avgLoss.toFixed(2)}

=== TOP STRUMENTI TRADATI ===
${topSymbols}

=== PERFORMANCE TEMPORALE ===
Mese migliore: ${bestMonth} | Mese peggiore: ${worstMonth}
Drawdown periods rilevati: ${metrics.drawdownPeriods?.length ?? 0}

=== PERCORSO TIER ===
${tierGaps[metrics.tier] || ''}

Produci una risposta JSON con questa struttura ESATTA (niente testo fuori dal JSON):
{
  "summary": "<3-4 frasi in italiano che descrivono il profilo comportamentale del trader>",
  "tier_comment": "<1 frase sul tier attuale e percorso di crescita>",
  "strengths": ["<punto di forza 1>", "<punto di forza 2>"],
  "flags": ["<criticità 1 se presente, altrimenti array vuoto>"],
  "validationOk": true,
  "confidence": <numero 60-98>,
  "risk_profile": "<conservative|moderate|aggressive>",
  "trading_style": "<scalper|day_trader|swing_trader|position_trader>",
  "key_recommendation": "<1 azione concreta e specifica per migliorare il score SDI>",
  "next_tier_gap": "<cosa manca specificamente per raggiungere il tier successivo>"
}

Usa tono professionale e istituzionale. Non dare mai consigli finanziari personali.`;
}

// ─── Main Function ────────────────────────────────────────────────────────────

export async function analyzeWithAurion(
    metrics: SDIResult,
    tradeCount: number,
    calendarDays: number,
    userEmail: string,
): Promise<AurionReport> {

    const fallback: AurionReport = {
        summary: `Analisi completata. Il trader ha registrato ${tradeCount} operazioni con uno score SDI di ${metrics.sdi}/1000 (Tier: ${metrics.tier}). Il profilo mostra dati sufficienti per la validazione del punteggio.`,
        tier_comment: `Tier ${metrics.tier.charAt(0).toUpperCase() + metrics.tier.slice(1)} confermato sulla base delle metriche analizzate.`,
        strengths: [],
        flags: [],
        validationOk: true,
        confidence: 75,
        risk_profile: 'unknown',
        trading_style: 'unknown',
        key_recommendation: 'Continua a monitorare le performance e carica statement aggiornati per migliorare il punteggio.',
        next_tier_gap: 'Carica più dati storici per una valutazione più precisa.',
    };

    if (!process.env.OPENAI_API_KEY) {
        console.warn('[Aurion] No API key — using fallback report');
        return fallback;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    for (const model of ['gpt-4o-mini', 'gpt-4o']) {
        try {
            const completion = await openai.chat.completions.create({
                model,
                temperature: 0.3,
                max_tokens: 900,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'Sei Aurion, il layer di intelligenza analitica di Skillion Finance. Rispondi sempre e solo con JSON valido, nessun testo aggiuntivo.',
                    },
                    {
                        role: 'user',
                        content: buildPrompt(metrics, tradeCount, calendarDays, userEmail),
                    },
                ],
            });

            const raw = completion.choices?.[0]?.message?.content?.trim() ?? '';
            const parsed = JSON.parse(raw) as Partial<AurionReport>;

            const validRiskProfiles = ['conservative', 'moderate', 'aggressive'];
            const validStyles = ['scalper', 'day_trader', 'swing_trader', 'position_trader'];

            return {
                summary: parsed.summary || fallback.summary,
                tier_comment: parsed.tier_comment || fallback.tier_comment,
                strengths: parsed.strengths || [],
                flags: parsed.flags || [],
                validationOk: parsed.validationOk !== false,
                confidence: typeof parsed.confidence === 'number'
                    ? Math.min(98, Math.max(50, parsed.confidence))
                    : fallback.confidence,
                risk_profile: validRiskProfiles.includes(parsed.risk_profile as string)
                    ? parsed.risk_profile as AurionReport['risk_profile']
                    : 'unknown',
                trading_style: validStyles.includes(parsed.trading_style as string)
                    ? parsed.trading_style as AurionReport['trading_style']
                    : 'unknown',
                key_recommendation: parsed.key_recommendation || fallback.key_recommendation,
                next_tier_gap: parsed.next_tier_gap || fallback.next_tier_gap,
            };

        } catch (err) {
            console.error(`[Aurion] ${model} error:`, err instanceof Error ? err.message : err);
            if (model === 'gpt-4o') return fallback;
        }
    }

    return fallback;
}
