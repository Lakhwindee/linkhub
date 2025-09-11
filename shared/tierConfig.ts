export interface Tier {
  level: number;
  description: string;
  range: string;
  price: number;
  minSubscribers: number;
  maxSubscribers: number | null;
}

export const TIERS: Tier[] = [
  { level: 1, description: "Emerging Creator", range: "30K-40K", price: 125, minSubscribers: 30000, maxSubscribers: 40000 },
  { level: 2, description: "Growing Creator", range: "40K-70K", price: 300, minSubscribers: 40000, maxSubscribers: 70000 },
  { level: 3, description: "Established Creator", range: "70K+", price: 450, minSubscribers: 70000, maxSubscribers: null },
];

/**
 * Get the tier level based on subscriber count
 */
export function subscribersToTier(subscribers: number): number {
  for (const tier of TIERS) {
    if (subscribers >= tier.minSubscribers && (tier.maxSubscribers === null || subscribers <= tier.maxSubscribers)) {
      return tier.level;
    }
  }
  // If no tier matches (below minimum), return tier 0 (ineligible)
  return 0;
}

/**
 * Get tier information by level
 */
export function getTierByLevel(level: number): Tier | undefined {
  return TIERS.find(tier => tier.level === level);
}

/**
 * Get tier information by subscriber count
 */
export function getTierBySubscribers(subscribers: number): Tier | null {
  const level = subscribersToTier(subscribers);
  if (level === 0) return null; // Ineligible
  return getTierByLevel(level) || null;
}

/**
 * Compute tier level from subscriber count (alias for subscribersToTier)
 */
export function computeTierFromSubscribers(subscribers: number): number {
  return subscribersToTier(subscribers);
}