export type Tier = 'starter' | 'pro' | 'premium' | null

export function canAccess(tier: Tier, required: 'starter' | 'pro' | 'premium'): boolean {
  if (!tier) return false
  const levels = { starter: 1, pro: 2, premium: 3 }
  return levels[tier] >= levels[required]
}

export function getTierLabel(tier: Tier): string {
  const labels = { starter: 'Basic', pro: 'Pro', premium: 'Premium' }
  return tier ? labels[tier] : 'Kein Paket'
}

export function getUpgradeTarget(tier: Tier): 'pro' | 'premium' | null {
  if (tier === 'starter') return 'pro'
  if (tier === 'pro') return 'premium'
  return null
}

export function getUpgradeText(tier: Tier): { title: string; sub: string; cta: string } | null {
  if (tier === 'starter') return {
    title: 'Mit Pro: KI-Exposé, Preisrechner und Interessenten-CRM',
    sub: 'Einmaliges Upgrade — kein Abo, keine versteckten Kosten.',
    cta: 'Upgrade auf Pro (599 €) →',
  }
  if (tier === 'pro') return {
    title: 'Mit Premium: ImmoScout-Listing, Bildverbesserung & Makler-Hotline',
    sub: 'Noch 200 € mehr — dein Inserat geht auf alle großen Portale.',
    cta: 'Upgrade auf Premium (799 €) →',
  }
  return null
}
