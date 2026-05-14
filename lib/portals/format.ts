export function formatSyncTime(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'gerade synchronisiert'
  if (diffMin < 60) return `vor ${diffMin} Min synchronisiert`
  if (diffHours < 24) return `vor ${diffHours} Std synchronisiert`
  if (diffDays === 1) return 'gestern synchronisiert'
  if (diffDays < 7) return `vor ${diffDays} Tagen synchronisiert`
  return `synchronisiert am ${date.toLocaleDateString('de-DE')}`
}
