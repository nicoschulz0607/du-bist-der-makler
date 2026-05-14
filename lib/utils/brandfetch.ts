const BRANDFETCH_CDN = 'https://cdn.brandfetch.io'

interface LogoOptions {
  size?: number
  theme?: 'light' | 'dark'
  type?: 'logo' | 'icon' | 'symbol'
}

/**
 * Liefert Brandfetch-URL für ein Logo.
 * Returnt leeren String wenn Client-ID nicht gesetzt — Caller soll Fallback rendern.
 */
export function getBrandLogoUrl(domain: string, opts: LogoOptions = {}): string {
  const clientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID
  if (!clientId) {
    console.warn('[brandfetch] NEXT_PUBLIC_BRANDFETCH_CLIENT_ID not set')
    return ''
  }

  const { size = 40, theme, type = 'icon' } = opts
  const retinaSize = size * 2

  const segments: string[] = [
    BRANDFETCH_CDN,
    'domain',
    domain,
    'h', String(retinaSize),
    'w', String(retinaSize),
  ]

  if (theme) segments.push('theme', theme)
  segments.push(type)

  return `${segments.join('/')}?c=${clientId}`
}
