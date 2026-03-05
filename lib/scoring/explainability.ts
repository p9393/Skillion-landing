/**
 * Score Explainability Engine
 * Diffs two consecutive score_snapshots and maps deltas to natural language.
 */

import type { ScoreFactor } from '../scoring/sdi'

export interface ScoreSnapshot {
    id: string
    sdi_total: number
    risk_discipline: number
    consistency: number
    efficiency: number
    professionalism: number
    tier: string
    computed_at: string
    factors?: ScoreFactor[]
}

export interface ScoreDelta {
    totalDelta: number
    subDeltas: { name: string; delta: number; direction: 'up' | 'down' | 'stable' }[]
    explanations: string[]
    tierChange: { from: string; to: string; changed: boolean }
    headline: string
}

const SUB_LABELS: Record<string, string> = {
    risk_discipline: 'Risk Discipline',
    consistency: 'Consistency',
    efficiency: 'Efficiency',
    professionalism: 'Professionalism',
}

export function explainScoreDelta(prev: ScoreSnapshot, curr: ScoreSnapshot): ScoreDelta {
    const totalDelta = curr.sdi_total - prev.sdi_total
    const explanations: string[] = []

    const subKeys: (keyof ScoreSnapshot)[] = ['risk_discipline', 'consistency', 'efficiency', 'professionalism']
    const subDeltas = subKeys.map(key => {
        const delta = (curr[key] as number) - (prev[key] as number)
        return {
            name: SUB_LABELS[key as string] ?? String(key),
            delta: Math.round(delta),
            direction: Math.abs(delta) < 3 ? 'stable' as const : delta > 0 ? 'up' as const : 'down' as const,
        }
    })

    // Build explanations for notable sub-score changes
    for (const sub of subDeltas) {
        if (sub.direction === 'stable') continue
        const sign = sub.direction === 'up' ? '▲' : '▼'
        const verb = sub.direction === 'up' ? 'improved' : 'declined'

        // Factor-level explanation if available
        if (curr.factors) {
            const topFactor = curr.factors
                .filter(f => SUB_LABELS[f.sub_score] === sub.name)
                .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))[0]

            if (topFactor) {
                explanations.push(
                    `${sign} ${sub.name} ${verb} by ${Math.abs(sub.delta)} pts — ${topFactor.explanation}`
                )
                continue
            }
        }
        explanations.push(`${sign} ${sub.name} ${verb} by ${Math.abs(sub.delta)} pts`)
    }

    if (explanations.length === 0) {
        explanations.push('Score is stable — no significant changes in this period.')
    }

    // Headline
    let headline: string
    if (Math.abs(totalDelta) < 5) {
        headline = `Score stable at ${curr.sdi_total}`
    } else if (totalDelta > 0) {
        headline = `Score improved by ${totalDelta} pts — now ${curr.sdi_total} (${curr.tier})`
    } else {
        headline = `Score declined by ${Math.abs(totalDelta)} pts — now ${curr.sdi_total} (${curr.tier})`
    }

    return {
        totalDelta,
        subDeltas,
        explanations,
        tierChange: {
            from: prev.tier,
            to: curr.tier,
            changed: prev.tier !== curr.tier,
        },
        headline,
    }
}
