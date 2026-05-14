import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getKatalogFuerObjekttyp, getPflichtDokumente, type ObjektTyp } from '@/lib/dokumente/katalog'
import { initEnergieausweisBackfill } from './actions'
import UnterlagenClient from './UnterlagenClient'
import { type DokumentMitStatus } from './DokumentKarte'

export const metadata = { title: 'Meine Unterlagen — Dashboard' }

const OBJEKTTYP_LABELS: Record<ObjektTyp, string> = {
  haus: 'Haus',
  wohnung: 'Eigentumswohnung',
  grundstueck: 'Grundstück',
}

export default async function UnterlagenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Listing laden (objekttyp für Katalog-Filter)
  const { data: listing } = await supabase
    .from('listings')
    .select('id, objekttyp')
    .eq('user_id', user.id)
    .maybeSingle()

  const objekttyp = (listing?.objekttyp ?? null) as ObjektTyp | null
  const istVermietet = false // Vermietungs-Flag Phase 2

  // Energieausweis-Backfill beim ersten Aufruf (idempotent)
  await initEnergieausweisBackfill()

  // Dokumente + Shares aus DB laden
  const [{ data: dbDokumente }, { data: sharesData }] = await Promise.all([
    supabase
      .from('dokumente')
      .select('id, dokument_typ, status, datei_url, datei_name, notiz')
      .eq('user_id', user.id),
    supabase
      .from('dokument_shares')
      .select('id, empfaenger_name, empfaenger_email, ablaufdatum, abgerufen_am, zurueckgezogen_am, share_token, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const dbByTyp = new Map(
    (dbDokumente ?? []).map((d) => [d.dokument_typ, d])
  )

  // Katalog mit DB-Status mergen
  const katalog = getKatalogFuerObjekttyp(objekttyp, istVermietet)

  function merge(defs: typeof katalog): DokumentMitStatus[] {
    return defs.map((def) => {
      const db = dbByTyp.get(def.typ)
      return {
        ...def,
        db_id: db?.id ?? undefined,
        status: (db?.status ?? 'fehlt') as DokumentMitStatus['status'],
        datei_name: db?.datei_name ?? null,
        datei_url: db?.datei_url ?? null,
        notiz: db?.notiz ?? '',
      }
    })
  }

  // Basis: relevant für alle Objekttypen (kein spezifischer Typ-Filter nötig —
  // getKatalogFuerObjekttyp gibt bereits die richtige Liste zurück)
  // Trennlinie: Basis = relevant_fuer enthält alle 3 Typen,
  // Spezifisch = nur für 1-2 Typen relevant
  const basisTypen = new Set(['grundbuchauszug', 'energieausweis', 'flurkarte', 'personalausweis'])
  const basisDokumente = merge(katalog.filter((d) => basisTypen.has(d.typ)))
  const spezifischeDokumente = merge(katalog.filter((d) => !basisTypen.has(d.typ)))

  // Pflicht-Fortschritt
  const pflichtKatalog = getPflichtDokumente(objekttyp, istVermietet)
  const pflichtGesamt = pflichtKatalog.length
  const pflichtVorhanden = pflichtKatalog.filter(
    (d) => dbByTyp.get(d.typ)?.status === 'vorhanden'
  ).length

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://du-bist-der-makler.de'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Meine Unterlagen
        </h1>
        <p className="text-[14px] text-text-secondary">
          Sammle hier alle Dokumente, die Käufer und Notar anfragen.
        </p>
        {!listing && (
          <p className="mt-2 text-[13px] text-text-secondary bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Mehr objekttyp-spezifische Dokumente erscheinen, sobald du dein Objekt unter{' '}
            <a href="/dashboard/objekt" className="text-accent underline">Mein Objekt</a> angelegt hast.
          </p>
        )}
      </div>

      <UnterlagenClient
        basisDokumente={basisDokumente}
        spezifischeDokumente={spezifischeDokumente}
        objekttypLabel={objekttyp ? OBJEKTTYP_LABELS[objekttyp] : null}
        pflichtVorhanden={pflichtVorhanden}
        pflichtGesamt={pflichtGesamt}
        shares={(sharesData ?? []) as never}
        appUrl={appUrl}
      />
    </div>
  )
}
