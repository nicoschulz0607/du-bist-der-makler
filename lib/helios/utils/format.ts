/**
 * Format EUR cents as a human-readable currency string.
 *
 * Special case: amounts below 1 cent (0 < cents < 1) display as "<0,01 €"
 * instead of "0,00 €" so micro-costs from AI calls are never silently hidden.
 */
export function formatCents(cents: number): string {
  if (cents === 0) return '0,00 €'
  if (cents > 0 && cents < 1) return '<0,01 €'
  return (cents / 100).toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a percentage (0–100) with one decimal place.
 * Returns "—" when value is null (e.g. no PostHog data).
 */
export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)} %`
}

/**
 * Shorten a call_site string for display: strips leading "app/api/" prefix,
 * truncates long paths to the last two segments.
 */
export function shortCallSite(site: string): string {
  const clean = site.replace(/^app\/api\//, '')
  const parts = clean.split('/')
  return parts.length > 2 ? parts.slice(-2).join('/') : clean
}
