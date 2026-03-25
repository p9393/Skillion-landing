/**
 * Shared Tier Certification Utility
 * Assigns an SDI tier based on score thresholds.
 * Single source of truth used by score API, certification API, and UI.
 */

export type SdiTier = 'explorer' | 'builder' | 'strategist' | 'architect' | 'elite'

export interface TierInfo {
  tier: SdiTier
  label: string
  minScore: number
  maxScore: number | null
  description: string
}

export const TIER_THRESHOLDS: TierInfo[] = [
  { tier: 'elite',      label: 'Elite',      minScore: 850, maxScore: null, description: 'Institutional-grade execution. Top 5% of all traders.' },
  { tier: 'architect',  label: 'Architect',  minScore: 700, maxScore: 849,  description: 'Advanced operator. Strong risk-adjusted performance.' },
  { tier: 'strategist', label: 'Strategist', minScore: 500, maxScore: 699,  description: 'Solid foundation. Repeatable edge and discipline.' },
  { tier: 'builder',    label: 'Builder',    minScore: 300, maxScore: 499,  description: 'Developing consistency. Risk control is key.' },
  { tier: 'explorer',   label: 'Explorer',   minScore: 0,   maxScore: 299,  description: 'Beginning the journey. Focus on disciplined habits.' },
]

/**
 * Assigns the correct tier given an SDI total score (0–1000).
 */
export function assignTier(sdiTotal: number): SdiTier {
  for (const t of TIER_THRESHOLDS) {
    if (sdiTotal >= t.minScore) return t.tier
  }
  return 'explorer'
}

/**
 * Returns the full TierInfo for a given tier slug.
 */
export function getTierInfo(tier: SdiTier): TierInfo {
  return TIER_THRESHOLDS.find(t => t.tier === tier) ?? TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1]
}

/**
 * Returns the next tier above the current one, or null if already elite.
 */
export function getNextTier(tier: SdiTier): TierInfo | null {
  const idx = TIER_THRESHOLDS.findIndex(t => t.tier === tier)
  return idx > 0 ? TIER_THRESHOLDS[idx - 1] : null
}

/**
 * Calculates how many points are needed to reach the next tier.
 */
export function pointsToNextTier(sdiTotal: number, currentTier: SdiTier): number | null {
  const next = getNextTier(currentTier)
  if (!next) return null
  return Math.max(0, next.minScore - sdiTotal)
}
