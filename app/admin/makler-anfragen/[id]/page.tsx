import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import AdminAnfrageActions from './AdminAnfrageActions'

const THEMA_LABELS: Record<string, string> = {
  preisverhandlung: 'Preisverhandlung',
  vertragsfragen: 'Vertragsfragen',
  besichtigung: 'Besichtigung',
  sonstiges: 'Sonstiges',
}

const TAGESZEIT_LABELS: Record<string, string> = {
  vormittags: 'Vormittags (ca. 10 Uhr)',
  nachmittags: 'Nachmittags (ca. 14 Uhr)',
  abends: 'Abends (ca. 18 Uhr)',
  'wochenende-flexibel': 'Wochenende – flexibel',
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  neu: { label: 'Neu', className: 'bg-[#FFF4E0] text-[#C07000]' },
  bestätigt: { label: 'Bestätigt', className: 'bg-[#E8F5EE] text-[#1B6B45]' },
  abgelehnt: { label: 'Abgelehnt', className: 'bg-[#FEE2E2] text-[#B91C1C]' },
  abgeschlossen: { label: 'Abgeschlossen', className: 'bg-[#F3F4F6] text-[#6B7280]' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminAnfrageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const service = createServiceClient()

  const { data: anfrage } = await service
    .from('makler_anfragen')
    .select('*')
    .eq('id', id)
    .single()

  if (!anfrage) notFound()

  const { data: profile } = await service
    .from('profiles')
    .select('vorname, nachname, paket_tier')
    .eq('id', anfrage.user_id as string)
    .single()

  const { data: authUser } = await service.auth.admin.getUserById(anfrage.user_id as string)
  const kundeEmail = authUser?.user?.email ?? '—'

  const badge = STATUS_LABELS[anfrage.status as string] ?? { label: anfrage.status, className: '' }
  const wunschtermine = (anfrage.wunschtermine as Array<{ datum: string; tageszeit: string }>) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/makler-anfragen" className="text-[13px] text-text-secondary hover:text-text-primary">
          ← Alle Anfragen
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[22px] font-bold text-text-primary" style={{ letterSpacing: '-0.2px' }}>
          Anfrage von {(profile?.vorname as string | null) ?? '—'}
        </h1>
        <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kunden-Info */}
        <div className="bg-white rounded-xl border border-[#EEEEEE] p-5">
          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-3">Kunde</p>
          <div className="space-y-2">
            <p className="text-[14px] text-text-primary">
              <span className="text-text-secondary">Name:</span>{' '}
              {(profile?.vorname as string | null) ?? ''} {(profile?.nachname as string | null) ?? ''}
            </p>
            <p className="text-[14px] text-text-primary">
              <span className="text-text-secondary">E-Mail:</span>{' '}
              <a href={`mailto:${kundeEmail}`} className="text-[#1B6B45] hover:underline">{kundeEmail}</a>
            </p>
            <p className="text-[14px] text-text-primary">
              <span className="text-text-secondary">Telefon:</span> {anfrage.telefon as string}
            </p>
            <p className="text-[14px] text-text-primary">
              <span className="text-text-secondary">Paket:</span>{' '}
              <span className="font-medium capitalize">{(profile?.paket_tier as string | null) ?? '—'}</span>
            </p>
          </div>
        </div>

        {/* Anfrage-Details */}
        <div className="bg-white rounded-xl border border-[#EEEEEE] p-5">
          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-3">Anfrage</p>
          <div className="space-y-2">
            <p className="text-[14px] text-text-primary">
              <span className="text-text-secondary">Thema:</span>{' '}
              {THEMA_LABELS[anfrage.thema as string] ?? (anfrage.thema as string)}
            </p>
            <p className="text-[14px] text-text-primary">
              <span className="text-text-secondary">Eingegangen:</span>{' '}
              {formatDate(anfrage.created_at as string)}
            </p>
            {anfrage.bestätigter_termin && (
              <p className="text-[14px] text-text-primary">
                <span className="text-text-secondary">Bestätigter Termin:</span>{' '}
                <strong>{formatDateTime(anfrage.bestätigter_termin as string)}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Beschreibung */}
      <div className="bg-white rounded-xl border border-[#EEEEEE] p-5">
        <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-3">Beschreibung</p>
        <p className="text-[14px] text-text-primary whitespace-pre-wrap leading-relaxed">
          {anfrage.beschreibung as string}
        </p>
      </div>

      {/* Wunschtermine */}
      <div className="bg-white rounded-xl border border-[#EEEEEE] p-5">
        <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-3">Wunschtermine</p>
        <div className="space-y-2">
          {wunschtermine.map((t, i) => (
            <div key={i} className="flex items-center gap-3 text-[14px]">
              <span className="w-6 h-6 rounded-full bg-[#E8F5EE] text-[#1B6B45] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-text-primary">
                <strong>{formatDate(t.datum)}</strong> — {TAGESZEIT_LABELS[t.tageszeit] ?? t.tageszeit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin-Notiz (falls vorhanden) */}
      {anfrage.admin_notiz && (
        <div className="bg-[#FFF4E0] border border-[#C07000]/30 rounded-xl p-5">
          <p className="text-[12px] font-semibold text-[#C07000] uppercase tracking-wider mb-2">Admin-Notiz</p>
          <p className="text-[14px] text-[#7A4500] whitespace-pre-wrap">{anfrage.admin_notiz as string}</p>
        </div>
      )}

      {/* Aktions-Bereich */}
      <AdminAnfrageActions
        anfrageId={id}
        status={anfrage.status as string}
        wunschtermine={wunschtermine}
      />
    </div>
  )
}
