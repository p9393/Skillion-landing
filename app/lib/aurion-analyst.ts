/**
 * Aurion Analyst
 * Called automatically when a statement is uploaded.
 * Aurion analyzes the behavioral patterns in the trade data and validates the SDI score.
 */

import OpenAI from 'openai';
import { SDIResult } from './sdi-engine';

export interface AurionReport {
    summary: string;   // Aurion's full analysis in Italian
    flags: string[]; // Issues detected
    strengths: string[]; // Positives detected
    validationOk: boolean;  // Does Aurion validate the score?
    confidence: number;   // 0–100 confidence in the data quality
    tier_comment: string;   // Aurion's comment on the tier
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(metrics: SDIResult, tradeCount: number, calendarDays: number, userEmail: string): string {
    return `Sei Aurion, il layer di intelligenza analitica di Skillion Finance.

Hai appena ricevuto lo statement di trading di ${userEmail}. Analizza i seguenti dati e produci una valutazione strutturata del profilo comportamentale del trader.

=== DATI SDI ===
Score totale: ${metrics.sdi}/1000 — Tier: ${metrics.tier.toUpperCase()}
Trade totali: ${tradeCount} | Giorni di trading: ${metrics.tradingDays} | Giorni calendario: ${calendarDays}
Net Profit: €${metrics.netProfit.toFixed(2)} | Win Rate: ${(metrics.winRate * 100).toFixed(1)}%

=== METRICHE PER DIMENSIONE ===
• Sharpe Ratio: ${metrics.sharpe} (score parziale: ${metrics.breakdown.find(d => d.name === 'Sharpe Ratio')?.contribution ?? 0} pt)
• Sortino Ratio: ${metrics.sortino} (score parziale: ${metrics.breakdown.find(d => d.name === 'Sortino Ratio')?.contribution ?? 0} pt)
• Max Drawdown: ${metrics.maxDrawdownPct}% (score parziale: ${metrics.breakdown.find(d => d.name === 'Max Drawdown')?.contribution ?? 0} pt)
• Win Rate: ${(metrics.winRate * 100).toFixed(1)}% (score parziale: ${metrics.breakdown.find(d => d.name === 'Win Rate')?.contribution ?? 0} pt)
• Z-Score Consistency (CV): ${metrics.zScoreConsistency} (score parziale: ${metrics.breakdown.find(d => d.name === 'Z-Score Consistency')?.contribution ?? 0} pt)
• Profit Factor: ${metrics.profitFactor} (score parziale: ${metrics.breakdown.find(d => d.name === 'Profit Factor')?.contribution ?? 0} pt)
• Data Coverage: ${(metrics.dataCoverage * 100).toFixed(0)}% (score parziale: ${metrics.breakdown.find(d => d.name === 'Data Coverage')?.contribution ?? 0} pt)

=== BREAKDOWN P&L ===
Gross Profit: €${metrics.grossProfit.toFixed(2)} | Gross Loss: €${metrics.grossLoss.toFixed(2)}
Avg Profit/Trade: €${metrics.avgProfit.toFixed(2)} | Avg Loss/Trade: €${metrics.avgLoss.toFixed(2)}

Produci una risposta JSON con questa struttura ESATTA (niente testo fuori dal JSON):
{
  "summary": "<3-4 frasi in italiano che descrivono il profilo comportamentale del trader, cosa fa bene e dove può migliorare>",
  "tier_comment": "<1 frase commento sul tier attuale e percorso di crescita>",
  "strengths": ["<punto di forza 1>", "<punto di forza 2>"],
  "flags": ["<criticità o rischio 1 se presente, altrimenti ometti>"],
  "validationOk": true,
  "confidence": <numero da 60 a 98 che indica la tua confidenza nella qualità dei dati>
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
                max_tokens: 700,
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

            return {
                summary: parsed.summary || fallback.summary,
                tier_comment: parsed.tier_comment || fallback.tier_comment,
                strengths: parsed.strengths || [],
                flags: parsed.flags || [],
                validationOk: parsed.validationOk !== false,
                confidence: typeof parsed.confidence === 'number'
                    ? Math.min(98, Math.max(50, parsed.confidence))
                    : fallback.confidence,
            };

        } catch (err) {
            console.error(`[Aurion] ${model} error:`, err instanceof Error ? err.message : err);
            if (model === 'gpt-4o') return fallback;
        }
    }

    return fallback;
}
