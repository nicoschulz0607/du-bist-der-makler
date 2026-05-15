const BRANDFETCH_CDN = 'https://cdn.brandfetch.io'

interface LogoOptions {
  variant?: 'icon' | 'logo' | 'symbol'
  size?: number
  width?: number
  theme?: 'light' | 'dark'
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

  const { variant = 'icon', size = 40, width, theme } = opts

  const segments: string[] = [BRANDFETCH_CDN, 'domain', domain]

  if (variant === 'logo') {
    segments.push('w', String(width ?? 400))
  } else {
    const retinaSize = size * 2
    segments.push('h', String(retinaSize), 'w', String(retinaSize))
  }

  const effectiveTheme = theme ?? (variant === 'logo' ? 'light' : undefined)
  if (effectiveTheme) segments.push('theme', effectiveTheme)

  segments.push(variant)

  return `${segments.join('/')}?c=${clientId}`
}
