'use client'

import { useState, useTransition } from 'react'
import { X, Copy, Check, Lock, Mail } from 'lucide-react'
import { DokumentMitStatus } from './DokumentKarte'
import { createMappeShare } from './actions'

interface TeilenDialogProps {
  dokumente: DokumentMitStatus[]
  onClose: () => void
  onCreated: (share: { share_url: string; share_id: string }) => void
}

const ABLAUF_OPTIONEN = [
  { value: 3, label: '3 Tage' },
  { value: 7, label: '7 Tage' },
  { value: 14, label: '14 Tage (empfohlen)' },
  { value: 30, label: '30 Tage' },
]

export default function TeilenDialog({ dokumente, onClose, onCreated }: TeilenDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [empfaengerName, setEmpfaengerName] = useState('')
  const [empfaengerEmail, setEmpfaengerEmail] = useState('')
  const [ablaufTage, setAblaufTage] = useState(14)
  const [mitPasswort, setMitPasswort] = useState(false)
  const [passwort, setPasswort] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const vorhandeneDokumente = dokumente.filter((d) => d.status === 'vorhanden' && d.db_id)

  function toggleDokument(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSubmit() {
    setError(null)
    if (!empfaengerName.trim()) { setError('Empfänger-Name ist Pflicht.'); return }
    if (selectedIds.length === 0) { setError('Wähle mindestens ein Dokument aus.'); return }
    if (mitPasswort && passwort.length < 4) { setError('Passwort muss mindestens 4 Zeichen haben.'); return }

    startTransition(async () => {
      try {
        const result = await createMappeShare({
          empfaenger_name: empfaengerName.trim(),
          empfaenger_email: empfaengerEmail.trim() || undefined,
          dokument_ids: selectedIds,
          gueltigkeit_tage: ablaufTage,
          passwort: mitPasswort ? passwort : undefined,
        })
        setCreatedUrl(result.share_url)
        onCreated({ share_url: result.share_url, share_id: result.share_id })
      } catch {
        setError('Mappe konnte nicht erstellt werden. Bitte erneut versuchen.')
      }
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={!createdUrl ? onClose : undefined} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl max-w-md mx-auto max-h-[90dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEEEEE]">
          <h2 className="text-[15px] font-semibold text-text-primary">
            {createdUrl ? 'Mappe erstellt ✓' : 'Mappe mit Interessent teilen'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {createdUrl ? (
          /* ── Erfolgsansicht ── */
          <div className="p-5 space-y-4">
            <p className="text-[13px] text-text-primary">
              Der Link ist bereit. Teile ihn mit <strong>{empfaengerName}</strong>.
              {empfaengerEmail && ' Eine E-Mail wurde ebenfalls versendet.'}
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-[#EEEEEE]">
              <p className="flex-1 text-[12px] text-text-secondary break-all">{createdUrl}</p>
              <button
                onClick={() => handleCopy(createdUrl)}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-200 text-text-secondary"
                title="Kopieren"
              >
                {copied ? <Check size={14} strokeWidth={2} className="text-accent" /> : <Copy size={14} strokeWidth={1.75} />}
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-accent/90"
            >
              Fertig
            </button>
          </div>
        ) : (
          /* ── Formular ── */
          <div className="p-5 space-y-4">
            {/* Empfänger */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Empfänger-Name *
              </label>
              <input
                type="text"
                value={empfaengerName}
                onChange={(e) => setEmpfaengerName(e.target.value)}
                placeholder="z. B. Familie Müller"
                className="w-full h-11 px-3 rounded-xl border border-[#DDDDDD] text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* E-Mail */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                E-Mail (optional — für automatischen Versand)
              </label>
              <div className="relative">
                <Mail size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={empfaengerEmail}
                  onChange={(e) => setEmpfaengerEmail(e.target.value)}
                  placeholder="empfaenger@email.de"
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-[#DDDDDD] text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            {/* Dokument-Auswahl */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Dokumente auswählen (nur vorhandene)
              </label>
              {vorhandeneDokumente.length === 0 ? (
                <p className="text-[13px] text-text-secondary py-2">
                  Noch keine Dokumente mit Status „Vorhanden". Lade zuerst Dateien hoch.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {vorhandeneDokumente.map((dok) => (
                    <label key={dok.db_id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(dok.db_id!)}
                        onChange={() => toggleDokument(dok.db_id!)}
                        className="w-4 h-4 rounded accent-accent"
                      />
                      <span className="text-[13px] text-text-primary group-hover:text-accent transition-colors">
                        {dok.name}
                      </span>
                      {dok.datei_name && (
                        <span className="text-[11px] text-text-secondary truncate">{dok.datei_name}</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Ablaufdatum */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Ablaufdatum
              </label>
              <select
                value={ablaufTage}
                onChange={(e) => setAblaufTage(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl border border-[#DDDDDD] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {ABLAUF_OPTIONEN.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Passwort */}
            <div>
              <label className="flex items-center gap-2.5 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={mitPasswort}
                  onChange={(e) => setMitPasswort(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="flex items-center gap-1.5 text-[13px] text-text-primary font-medium">
                  <Lock size={13} strokeWidth={1.75} />
                  Passwort-Schutz
                </span>
              </label>
              {mitPasswort && (
                <input
                  type="password"
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  placeholder="Mindestens 4 Zeichen"
                  className="w-full h-11 px-3 rounded-xl border border-[#DDDDDD] text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              )}
            </div>

            {/* Datenschutz-Hinweis */}
            <p className="text-[11px] text-text-secondary bg-gray-50 px-3 py-2.5 rounded-xl">
              Der Empfänger sieht alle ausgewählten Dokumente. Teile nur Dokumente, die nicht mehr Personen als nötig sehen sollen.
            </p>

            {error && <p className="text-[12px] text-red-600">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={isPending || vorhandeneDokumente.length === 0}
              className="w-full py-3 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Erstelle Mappe…' : 'Mappe erstellen & Link generieren'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
