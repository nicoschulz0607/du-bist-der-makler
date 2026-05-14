export type PortalSlug = 'immoscout' | 'immowelt' | 'ebay_kleinanzeigen'

export type PortalStatus =
  | 'nicht_aktiviert'
  | 'wird_synchronisiert'
  | 'aktiv'
  | 'pausiert'
  | 'sync_fehler'
  | 'inaktiv'

export interface PortalConfig {
  slug: PortalSlug
  name: string
  domain: string
  publicSite: string
  reihenfolge: number
}

export const PORTALS: PortalConfig[] = [
  {
    slug: 'immoscout',
    name: 'ImmoScout24',
    domain: 'immobilienscout24.de',
    publicSite: 'https://www.immobilienscout24.de',
    reihenfolge: 1,
  },
  {
    slug: 'immowelt',
    name: 'ImmoWelt',
    domain: 'immowelt.de',
    publicSite: 'https://www.immowelt.de',
    reihenfolge: 2,
  },
  {
    slug: 'ebay_kleinanzeigen',
    name: 'Kleinanzeigen',
    domain: 'kleinanzeigen.de',
    publicSite: 'https://www.kleinanzeigen.de',
    reihenfolge: 3,
  },
]

export const PORTAL_BY_SLUG: Record<PortalSlug, PortalConfig> =
  Object.fromEntries(PORTALS.map(p => [p.slug, p])) as Record<PortalSlug, PortalConfig>

export interface StatusDisplay {
  label: string
  color: string
  pulse?: boolean
}

export const STATUS_DISPLAY: Record<PortalStatus, StatusDisplay> = {
  aktiv:               { label: 'Aktiv',                  color: '#1B6B45' },
  wird_synchronisiert: { label: 'Wird synchronisiert',    color: '#F0A030', pulse: true },
  pausiert:            { label: 'Pausiert',               color: '#6B7280' },
  sync_fehler:         { label: 'Sync-Fehler',            color: '#D04A2C' },
  inaktiv:             { label: 'Inaktiv',                color: '#6B7280' },
  nicht_aktiviert:     { label: 'Nicht aktiv',            color: '#D1D5DB' },
}
