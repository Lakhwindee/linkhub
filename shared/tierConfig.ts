export interface Tier {
  level: number;
  description: string;
  range: string;
  price: number;
  minSubscribers: number;
  maxSubscribers: number | null;
}

export const TIERS: Tier[] = [
  { level: 1, description: "Micro-Influencers", range: "30K-70K", price: 100, minSubscribers: 30000, maxSubscribers: 70000 },
  { level: 2, description: "Small Influencers", range: "70K-150K", price: 150, minSubscribers: 70000, maxSubscribers: 150000 },
  { level: 3, description: "Mid-Tier Influencers", range: "150K-300K", price: 200, minSubscribers: 150000, maxSubscribers: 300000 },
  { level: 4, description: "Growing Influencers", range: "300K-500K", price: 280, minSubscribers: 300000, maxSubscribers: 500000 },
  { level: 5, description: "Established Influencers", range: "500K-800K", price: 360, minSubscribers: 500000, maxSubscribers: 800000 },
  { level: 6, description: "Major Influencers", range: "800K-1.2M", price: 440, minSubscribers: 800000, maxSubscribers: 1200000 },
  { level: 7, description: "Top Influencers", range: "1.2M-1.6M", price: 520, minSubscribers: 1200000, maxSubscribers: 1600000 },
  { level: 8, description: "Premium Influencers", range: "1.6M-2M", price: 590, minSubscribers: 1600000, maxSubscribers: 2000000 },
  { level: 9, description: "Celebrity Influencers", range: "2M-3M", price: 650, minSubscribers: 2000000, maxSubscribers: 3000000 },
  { level: 10, description: "Mega Influencers", range: "3M-4M", price: 720, minSubscribers: 3000000, maxSubscribers: 4000000 },
  { level: 11, description: "Super Influencers", range: "4M-5M", price: 800, minSubscribers: 4000000, maxSubscribers: 5000000 },
  { level: 12, description: "Elite Influencers", range: "5M-6.5M", price: 880, minSubscribers: 5000000, maxSubscribers: 6500000 },
  { level: 13, description: "Ultra Influencers", range: "6.5M-8M", price: 960, minSubscribers: 6500000, maxSubscribers: 8000000 },
  { level: 14, description: "Legendary Influencers", range: "8M-10M", price: 1050, minSubscribers: 8000000, maxSubscribers: 10000000 },
  { level: 15, description: "Icon Influencers", range: "10M+", price: 1150, minSubscribers: 10000000, maxSubscribers: null },
];

/**
 * Get the tier level based on subscriber count
 */
export function subscribersToTier(subscribers: number): number {
  for (const tier of TIERS) {
    if (subscribers >= tier.minSubscribers && (tier.maxSubscribers === null || subscribers < tier.maxSubscribers)) {
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