import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata = { title: 'Makler-Anfragen — Helios' }

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  neu: { label: 'Neu', className: 'bg-[#FFF4E0] text-[#C07000]' },
  bestätigt: { label: 'Bestätigt', className: 'bg-[#E8F5EE] text-[#1B6B45]' },
  abgelehnt: { label: 'Abgelehnt', className: 'bg-[#FEE2E2] text-[#B91C1C]' },
  abgeschlossen: { label: 'Abgeschlossen', className: 'bg-[#F3F4F6] text-[#6B7280]' },
}

const THEMA_LABELS: Record<string, string> = {
  preisverhandlung: 'Preisverhandlung',
  vertragsfragen: 'Vertragsfragen',
  besichtigung: 'Besichtigung',
  sonstiges: 'Sonstiges',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function HeliosAnfragenPage() {
  const service = createServiceClient()

  const { data: anfragen } = await service
    .from('makler_anfragen')
    .select('id, user_id, thema, status, created_at, telefon')
    .order('created_at', { ascending: false })

  const userIds = [...new Set((anfragen ?? []).map((a) => a.user_id as string))]
  const profileMap: Record<string, { vorname: string | null; email: string | null }> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await service
      .from('profiles')
      .select('id, vorname, email')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      profileMap[p.id as string] = {
        vorname: p.vorname as string | null,
        email: p.email as string | null,
      }
    }
  }

  const neu = (anfragen ?? []).filter((a) => a.status === 'neu').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary" style={{ letterSpacing: '-0.2px' }}>
            Makler-Anfragen
          </h1>
          {neu > 0 && (
            <p className="text-[13px] text-[#C07000] mt-0.5">{neu} neue Anfrage{neu !== 1 ? 'n' : ''}</p>
          )}
        </div>
        <span className="text-[13px] text-text-secondary">{(anfragen ?? []).length} gesamt</span>
      </div>

      {(!anfragen || anfragen.length === 0) ? (
        <div className="bg-white rounded-xl border border-[#EEEEEE] p-10 text-center">
          <p className="text-[15px] text-text-secondary">Noch keine Anfragen</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#EEEEEE] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#EEEEEE] bg-[#F9F9F9]">
                <th className="px-5 py-3 text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Datum</th>
                <th className="px-5 py-3 text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Kunde</th>
                <th className="px-5 py-3 text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Thema</th>
                <th className="px-5 py-3 text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {anfragen.map((a) => {
                const badge = STATUS_LABELS[a.status as string] ?? { label: a.status, className: 'bg-gray-100 text-gray-600' }
                const profile = profileMap[a.user_id as string]
                return (
                  <tr key={a.id as string} className="border-b border-[#EEEEEE] last:border-0 hover:bg-[#F9F9F9] transition-colors">
                    <td className="px-5 py-4 text-[14px] text-text-secondary whitespace-nowrap">
                      {formatDate(a.created_at as string)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-medium text-text-primary">{profile?.vorname ?? '—'}</p>
                      <p className="text-[12px] text-text-tertiary">{a.telefon as string}</p>
                    </td>
                    <td className="px-5 py-4 text-[14px] text-text-primary">
                      {THEMA_LABELS[a.thema as string] ?? a.thema as string}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/makler-anfragen/${a.id}`}
                        className="text-[13px] font-semibold text-[#1B6B45] hover:underline"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
