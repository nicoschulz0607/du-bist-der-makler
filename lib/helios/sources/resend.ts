import { unstable_cache } from 'next/cache'
import { resend } from '@/lib/resend'

export interface EmailStats {
  sent: number
  delivered: number
  bounced: number
  complained: number
  // Resend does not expose open-rate via REST API — requires webhook tracking
  openRate: null
}

export const fetchEmailStats = unstable_cache(
  async (tage = 30): Promise<EmailStats> => {
    const stats: EmailStats = { sent: 0, delivered: 0, bounced: 0, complained: 0, openRate: null }

    try {
      // Resend SDK: list emails (max 100 per page, newest first)
      // Filter by date client-side — Resend API has no date filter on list endpoint
      const cutoff = new Date(Date.now() - tage * 86400_000)

      let offset = 0
      const limit = 100
      let reachedCutoff = false

      while (!reachedCutoff) {
        const { data, error } = await resend.emails.list({ limit, offset } as Parameters<typeof resend.emails.list>[0])
        if (error || !data) break

        const emails = (data as unknown as { data: Array<{ created_at: string; last_event: string }> }).data ?? []
        if (emails.length === 0) break

        for (const email of emails) {
          const createdAt = new Date(email.created_at)
          if (createdAt < cutoff) {
            reachedCutoff = true
            break
          }

          stats.sent++
          const status = email.last_event?.toLowerCase() ?? ''
          if (status === 'delivered') stats.delivered++
          else if (status === 'bounced' || status === 'hard_bounced' || status === 'soft_bounced') stats.bounced++
          else if (status === 'complained') stats.complained++
        }

        // If we got fewer items than the limit, we've reached the end
        if (emails.length < limit) break
        offset += limit
      }
    } catch {
      // Email stats are non-critical — return zeros on any error
    }

    return stats
  },
  ['helios-resend-stats'],
  { revalidate: 1800 }   // 30 min
)
