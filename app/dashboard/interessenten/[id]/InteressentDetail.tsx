'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, AlertCircle, Star, Loader2, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { canAccess, type Tier } from '@/lib/tier'
import KiScoreCard from './KiScoreCard'

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[48px] text-[14px] text-text-primary bg-white outline-none transition-all focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-tertiary'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

const selectBase = `${inputBase} appearance-none cursor-pointer`

const STATUS_OPTIONS = [
  { value: 'neu', label: 'Neu' },
  { value: 'vorqualifiziert', label: 'Vorqualifiziert' },
  { value: 'besichtigung_geplant', label: 'Besichtigung geplant' },
  { value: 'besichtigt', label: 'Besichtigt' },
  { value: 'angebot_abgegeben', label: 'Angebot abgegeben' },
  { value: 'verhandlung', label: 'Verhandlung' },
  { value: 'zugesagt', label: 'Zugesagt' },
  { value: 'abgesagt', label: 'Abgesagt' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelBase}>{label}</label>
      {children}
    </div>
  )
}

function SelectField({ label, name, value, options, placeholder }: {
  label: string; name: string; value: string | null; options: { value: string; label: string }[]; placeholder?: string
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <select name={name} defaultValue={value ?? ''} className={selectBase}>
          <option value="">{placeholder ?? '— Bitte wählen —'}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
      </div>
    </Field>
  )
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-4">
      <h3 className="text-[14px] font-bold text-text-primary">{title}</h3>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

interface TerminRow {
  id: string; datum: string; uhrzeit_von: string; uhrzeit_bis: string;
  status: string; notiz: string | null; eingeladen_per_mail: boolean;
  zugesagt: boolean | null; erschienen: boolean | null
}

interface Props {
  interessent: Record<string, any>
  termine: TerminRow[]
  tier: Tier
  onSave: (fd: FormData) => Promise<{ ok: boolean; error?: string }>
}

export default function InteressentDetail({ interessent: int, termine, tier, onSave }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [stars, setStars] = useState<number>(int.bewertung_stars ?? 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    setSaveError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('bewertung_stars', stars > 0 ? stars.toString() : '')
    startTransition(async () => {
      const result = await onSave(fd)
      if (result.ok) {
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 3000)
      } else {
        setSaveError(result.error ?? 'Fehler')
      }
    })
  }

  const canScore = canAccess(tier, 'pro') && int.finanzierung_status && int.zeithorizont

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/interessenten"
            className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-accent transition-colors mb-2"
          >
            <ArrowLeft size={13} />
            Alle Interessenten
          </Link>
          <h1 className="text-[22px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>
            {int.name}
          </h1>
          {int.email && <p className="text-[13px] text-text-secondary mt-0.5">{int.email}</p>}
        </div>
      </div>

      {/* Save feedback */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#E8F5EE] border border-accent/20 rounded-xl">
          <CheckCircle2 size={15} className="text-accent" />
          <p className="text-[13px] font-medium text-accent">Gespeichert</p>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#FDECEA] border border-[#C13515]/20 rounded-xl">
          <AlertCircle size={15} className="text-[#C13515]" />
          <p className="text-[13px] text-[#C13515]">{saveError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Stufe 1: Erstkontakt */}
        <CardSection title="Stufe 1 — Erstkontakt">
          <Grid2>
            <Field label="Name *">
              <input name="name" type="text" defaultValue={int.name} required className={inputBase} />
            </Field>
            <Field label="E-Mail">
              <input name="email" type="email" defaultValue={int.email ?? ''} className={inputBase} />
            </Field>
            <Field label="Telefon">
              <input name="telefon" type="tel" defaultValue={int.telefon ?? ''} className={inputBase} />
            </Field>
            <SelectField
              label="Quelle"
              name="quelle"
              value={int.quelle}
              options={[
                { value: 'manuell', label: 'Manuell' },
                { value: 'eigene_seite', label: 'Eigene Seite' },
                { value: 'immoscout', label: 'ImmoScout' },
                { value: 'kleinanzeigen', label: 'Kleinanzeigen' },
              ]}
            />
          </Grid2>
          <Field label="Nachricht">
            <textarea name="nachricht" rows={3} defaultValue={int.nachricht ?? ''} className={`${inputBase} py-3 min-h-[80px] resize-none`} />
          </Field>
        </CardSection>

        {/* Stufe 2: Vorqualifizierung */}
        <CardSection title="Stufe 2 — Vorqualifizierung">
          <Grid2>
            <SelectField label="Haushalt" name="haushalt" value={int.haushalt} options={[
              { value: 'single', label: 'Single' },
              { value: 'paar', label: 'Paar' },
              { value: 'familie_1_kind', label: 'Familie (1 Kind)' },
              { value: 'familie_2_kinder', label: 'Familie (2 Kinder)' },
              { value: 'familie_3_plus', label: 'Familie (3+ Kinder)' },
            ]} />
            <Field label="Beruf / Branche">
              <input name="beruf" type="text" defaultValue={int.beruf ?? ''} placeholder="z. B. Ingenieur" className={inputBase} />
            </Field>
            <SelectField label="Aktuelle Wohnsituation" name="wohnsituation_aktuell" value={int.wohnsituation_aktuell} options={[
              { value: 'miete', label: 'Miete' },
              { value: 'eigentum', label: 'Eigentum' },
              { value: 'bei_eltern', label: 'Bei Eltern' },
              { value: 'sonstiges', label: 'Sonstiges' },
            ]} />
            <SelectField label="Finanzierungsstatus" name="finanzierung_status" value={int.finanzierung_status} options={[
              { value: 'eigenkapital_vorhanden', label: 'Eigenkapital vorhanden' },
              { value: 'bank_vorpruefung', label: 'Bank-Vorprüfung läuft' },
              { value: 'finanzierung_laeuft', label: 'Finanzierung bewilligt' },
              { value: 'barzahler', label: 'Barzahler' },
              { value: 'nicht_geklaert', label: 'Noch nicht geklärt' },
            ]} />
            <SelectField label="Eigenkapital" name="eigenkapital_range" value={int.eigenkapital_range} options={[
              { value: '<50k', label: 'Unter 50.000 €' },
              { value: '50-100k', label: '50.000 – 100.000 €' },
              { value: '100-200k', label: '100.000 – 200.000 €' },
              { value: '200k+', label: 'Über 200.000 €' },
              { value: 'unbekannt', label: 'Unbekannt' },
            ]} />
            <SelectField label="Zeithorizont" name="zeithorizont" value={int.zeithorizont} options={[
              { value: 'sofort', label: 'Sofort' },
              { value: '1-3_monate', label: '1–3 Monate' },
              { value: '3-6_monate', label: '3–6 Monate' },
              { value: '6+_monate', label: 'Mehr als 6 Monate' },
              { value: 'flexibel', label: 'Flexibel' },
            ]} />
          </Grid2>
          <Field label="Motivation">
            <textarea name="motivation" rows={2} defaultValue={int.motivation ?? ''} placeholder="Warum möchte der Interessent kaufen?" className={`${inputBase} py-3 min-h-[72px] resize-none`} />
          </Field>
          <Field label="Andere Objekte besichtigt">
            <textarea name="andere_objekte_besichtigt" rows={2} defaultValue={int.andere_objekte_besichtigt ?? ''} placeholder="Hat der Interessent bereits andere Objekte gesehen?" className={`${inputBase} py-3 min-h-[72px] resize-none`} />
          </Field>
          <Field label="Eindruck aus Erstgespräch">
            <textarea name="eindruck_erstgespraech" rows={2} defaultValue={int.eindruck_erstgespraech ?? ''} placeholder="Persönlicher Eindruck nach dem ersten Kontakt…" className={`${inputBase} py-3 min-h-[72px] resize-none`} />
          </Field>
        </CardSection>

        {/* Stufe 3: Besichtigung */}
        <CardSection title="Stufe 3 — Besichtigung">
          {termine.length > 0 ? (
            <div className="space-y-2 mb-4">
              {termine.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-surface rounded-lg px-4 py-2.5">
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">
                      {new Date(t.datum).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' · '}{t.uhrzeit_von.slice(0,5)} – {t.uhrzeit_bis.slice(0,5)} Uhr
                    </p>
                    {t.notiz && <p className="text-[12px] text-text-secondary">{t.notiz}</p>}
                  </div>
                  <Link href="/dashboard/termine" className="text-[12px] text-accent hover:underline">
                    → Kalender
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-text-secondary">
              Noch kein Termin geplant. <Link href="/dashboard/termine" className="text-accent hover:underline">Termin im Kalender anlegen →</Link>
            </p>
          )}
          <Field label="Eindruck nach Besichtigung">
            <textarea name="eindruck_nach_besichtigung" rows={2} defaultValue={int.eindruck_nach_besichtigung ?? ''} placeholder="Wie hat der Interessent auf die Besichtigung reagiert?" className={`${inputBase} py-3 min-h-[72px] resize-none`} />
          </Field>
          <Field label="Reaktion auf den Preis">
            <textarea name="reaktion_auf_preis" rows={2} defaultValue={int.reaktion_auf_preis ?? ''} placeholder="Hat er/sie zum Preis etwas gesagt?" className={`${inputBase} py-3 min-h-[72px] resize-none`} />
          </Field>
          <Field label="Bedenken / Einwände">
            <textarea name="bedenken" rows={2} defaultValue={int.bedenken ?? ''} placeholder="Welche Einwände oder Fragen hatte der Interessent?" className={`${inputBase} py-3 min-h-[72px] resize-none`} />
          </Field>
        </CardSection>

        {/* Stufe 4: Entscheidung */}
        <CardSection title="Stufe 4 — Entscheidung">
          <Grid2>
            <SelectField label="Status" name="status" value={int.status ?? 'neu'} options={STATUS_OPTIONS} />
            <Field label="Abgegebenes Angebot (€)">
              <input
                name="abgegebenes_angebot"
                type="number"
                step="1000"
                defaultValue={int.abgegebenes_angebot ?? ''}
                placeholder="z. B. 380000"
                className={inputBase}
              />
            </Field>
          </Grid2>

          {/* Sterne-Bewertung */}
          <div>
            <label className={labelBase}>Bewertung</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(stars === n ? 0 : n)}
                  className="transition-colors"
                >
                  <Star
                    size={22}
                    className={n <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-[#DDDDDD]'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          <Field label="Notizen">
            <textarea name="notizen" rows={3} defaultValue={int.notizen ?? ''} placeholder="Sonstige Notizen…" className={`${inputBase} py-3 min-h-[80px] resize-none`} />
          </Field>
        </CardSection>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 min-h-[48px] rounded-[8px] bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold transition-colors disabled:opacity-70"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Speichern
          </button>
        </div>
      </form>

      {/* KI-Score Card (outside form) */}
      <KiScoreCard
        interessentId={int.id}
        score={int.ki_score}
        ampel={int.ki_ampel}
        begruendung={int.ki_begruendung}
        klaerungsfragen={int.ki_klaerungsfragen ?? []}
        redFlags={int.ki_red_flags ?? []}
        basisFelder={int.ki_score_basis_felder}
        aktualisiert={int.ki_score_aktualisiert_am}
        canScore={!!canScore}
        tier={tier}
        finanzierungSet={!!int.finanzierung_status}
        zeithorizontSet={!!int.zeithorizont}
      />
    </div>
  )
}
