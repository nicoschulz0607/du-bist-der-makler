export type Tier = 'basic' | 'pro' | 'premium' | null

export function canAccess(tier: Tier, required: 'basic' | 'pro' | 'premium'): boolean {
  if (!tier) return false
  const levels = { basic: 1, pro: 2, premium: 3 }
  return levels[tier] >= levels[required]
}

export function getTierLabel(tier: Tier): string {
  const labels = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }
  return tier ? labels[tier] : 'Kein Paket'
}

export function getUpgradeTarget(tier: Tier): 'pro' | 'premium' | null {
  if (tier === 'basic') return 'pro'
  if (tier === 'pro') return 'premium'
  return null
}

export function getUpgradeText(tier: Tier): { title: string; sub: string; cta: string } | null {
  if (tier === 'basic') return {
    title: 'Mit Pro: KI-Exposé, Preisrechner und Interessenten-CRM',
    sub: 'Einmaliges Upgrade — kein Abo, keine versteckten Kosten.',
    cta: 'Upgrade auf Pro (169 €) →',
  }
  if (tier === 'pro') return {
    title: 'Mit Premium: KI-Bildoptimierung, alle Portale & Makler-Support (1h inklusive)',
    sub: 'Noch 50 € mehr — dein Inserat geht auf alle verfügbaren Portale.',
    cta: 'Upgrade auf Premium (219 €) →',
  }
  return null
}
