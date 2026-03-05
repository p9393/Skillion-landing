/**
 * Aurion System Prompt + Output Format Enforcement
 * Keeps all prompt logic in one place for easy iteration.
 */

export const AURION_SYSTEM_PROMPT = `You are Aurion, the analytical intelligence layer of Skillion Finance.
You analyze trader performance data objectively and provide structured, actionable insights.

CORE IDENTITY:
- You are a quantitative performance analyst, not a financial advisor.
- You speak with institutional precision: direct, data-driven, non-emotional.
- You never fabricate metrics. If data is missing, acknowledge it explicitly.
- You frame every insight as analysis, never as endorsement or financial advice.

NON-NEGOTIABLE RULES:
1. NEVER give buy/sell instructions for specific assets.
2. NEVER promise returns or guarantee outcomes.
3. ALWAYS present options as trade-offs, never as directives.
4. ALWAYS append the disclaimer at the end of every response.
5. Acknowledge data limitations and confidence levels explicitly.

OUTPUT FORMAT (follow EXACTLY — no deviations):

**SUMMARY**
[One sentence describing the overall performance situation.]

**TOP INSIGHTS**
• [Data-driven insight 1 with specific metrics]
• [Data-driven insight 2 with specific metrics]
• [Data-driven insight 3 with specific metrics]

**CURRENT RISKS**
• [Active risk flag or "No critical risks detected." if clean]
• [Additional risk if applicable]

**OPTIONS** _(not directives — analytical trade-offs only)_
**Option A:** [Description] — Pros: [pros] / Cons: [cons]
**Option B:** [Description] — Pros: [pros] / Cons: [cons]

**SCORE EXPLANATION**
[What moved the SDI score and why. Reference specific factors and sub-scores.]
Current: [SDI_TOTAL] ([tier]) | Risk: [risk_discipline]/250 | Consistency: [consistency]/250 | Edge: [efficiency]/250 | Prof: [professionalism]/250

**7-DAY COACHING PLAN**
1. [Day 1-3] [Specific measurable task] → target metric: [X]
2. [Day 3-5] [Specific measurable task] → target metric: [X]
3. [Day 5-7] [Specific measurable task] → target metric: [X]

**DATA QUALITY**
Completeness: [X]% | Confidence: [High/Medium/Low] | [Any data anomalies noted]

---
_This analysis is for informational purposes only. Past performance does not guarantee future results. Skillion Finance does not provide financial advice or manage funds._`

export const AURION_TOOLS_SCHEMA = [
    {
        type: 'function',
        function: {
            name: 'get_score_context',
            description: 'Get the user latest SDI score, sub-scores, tier, and top contributing factors.',
            parameters: {
                type: 'object',
                properties: {
                    accountId: { type: 'string', description: 'Optional: scope to a specific exchange account.' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_metrics_summary',
            description: 'Get computed trading metrics (Sharpe, win rate, drawdown, fees, leverage, etc.) for a date range.',
            parameters: {
                type: 'object',
                properties: {
                    accountId: { type: 'string', description: 'Optional: scope to specific account.' },
                    period: { type: 'string', enum: ['7d', '30d', '90d', 'all'], description: 'Analysis period.' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_score_delta',
            description: 'Get the score change between the last two snapshots with natural language explanations.',
            parameters: {
                type: 'object',
                properties: {
                    accountId: { type: 'string', description: 'Optional: scope to specific account.' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_risk_flags',
            description: 'Get active behavioral risk flags: overtrading, high leverage, high concentration, tail risk, excessive fees.',
            parameters: {
                type: 'object',
                properties: {
                    accountId: { type: 'string', description: 'Optional: scope to specific account.' },
                },
            },
        },
    },
]

/** Map user intent to which tools to pre-load */
export type QueryIntent = 'analysis' | 'coaching' | 'explanation' | 'risk_check' | 'chat'

export function classifyIntent(message: string): QueryIntent {
    const lower = message.toLowerCase()
    if (/why.*score|score.*chang|drop|increas|improv|declin|diff/.test(lower)) return 'explanation'
    if (/risk|danger|exposure|drawdown|leverage|safe|flag|concern/.test(lower)) return 'risk_check'
    if (/improve|how to|plan|better|next step|coach|goal|target/.test(lower)) return 'coaching'
    if (/performance|analyz|review|summary|how am|overview|report/.test(lower)) return 'analysis'
    return 'chat'
}

/** Pre-load tools based on intent for faster, more targeted responses */
export function getToolsForIntent(intent: QueryIntent): string[] {
    switch (intent) {
        case 'explanation': return ['get_score_delta', 'get_score_context']
        case 'risk_check': return ['get_risk_flags', 'get_metrics_summary']
        case 'coaching': return ['get_score_context', 'get_metrics_summary', 'get_risk_flags']
        case 'analysis': return ['get_score_context', 'get_metrics_summary']
        case 'chat': return ['get_score_context']
    }
}
