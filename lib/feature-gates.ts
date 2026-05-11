import { canAccess, type Tier } from '@/lib/tier'

export function canAccessFeature(
  tier: Tier,
  feature: 'enhance' | 'staging' | 'outdoor'
): boolean {
  if (feature === 'enhance') return canAccess(tier, 'pro')
  return canAccess(tier, 'premium')
}
