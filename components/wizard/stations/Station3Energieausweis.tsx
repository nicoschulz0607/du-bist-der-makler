'use client'

import { useState, useTransition } from 'react'
import { FileCheck, ShoppingCart, Clock, Upload, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveEnergiausweis } from '@/lib/wizard/actions'

interface Props {
  listingId: string | null
  userId: string
  initialStatus: string | null
  initialKlasse: string | null
  initialTyp: string | null
  initialVerbrauch: number | null
  initialDateiUrl: string | null
  onCanAdvanceChange: (can: boolean) => void
}

type EStatus = 'vorhanden' | 'bestellt' | 'nachzureichen'

const KLASSEN = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const TYPEN = [
  { value: 'verbrauch', label: 'Verbrauchsausweis' },
  { value: 'bedarf', label: 'Bedarfsausweis' },
]

export default function Station3Energieausweis({
  listingId,
  userId,
  initialStatus,
  initialKlasse,
  initialTyp,
  initialVerbrauch,
  initialDateiUrl,
  onCanAdvanceChange: _onCanAdvanceChange,
}: Props) {
  const [status, setStatus] = useState<EStatus | null>(initialStatus as EStatus | null)
  const [dateiUrl, setDateiUrl] = useState<string | null>(initialDateiUrl)
  const [klasse, setKlasse] = useState<string>(initialKlasse ?? '')
  const [typ, setTyp] = useState<string>(initialTyp ?? '')
  const [verbrauch, setVerbrauch] = useState<string>(initialVerbrauch != null ? String(initialVerbrauch) : '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  // canAdvance is always true for this station (skipable)
  // _onCanAdvanceChange already set to true by WizardShell default

  async function handleFileUpload(file: File) {
    if (!listingId) return
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'pdf'
      const filename = `energie-${Date.now()}.${ext}`
      const path = `${userId}/${listingId}/${filename}`
      const { error } = await supabase.storage.from('listing-photos').upload(path, file)
      if (error) throw new Error(error.message)
      const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
      setDateiUrl(publicUrl)
      startTransition(async () => {
        await saveEnergiausweis(listingId, {
          status: 'vorhanden',
          dateiUrl: publicUrl,
          klasse: klasse || null,
          typ: typ || null,
          verbrauch: verbrauch ? parseFloat(verbrauch) : null,
        })
      })
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  function handleFieldSave() {
    if (!listingId) return
    startTransition(async () => {
      await saveEnergiausweis(listingId, {
        status: 'vorhanden',
        klasse: klasse || null,
        typ: typ || null,
        verbrauch: verbrauch ? parseFloat(verbrauch) : null,
      })
    })
  }

  function selectStatus(s: EStatus) {
    setStatus(s)
    if (!listingId) return
    startTransition(async () => {
      await saveEnergiausweis(listingId, { status: s })
    })
    if (s === 'bestellt') setShowModal(true)
  }

  return (
    <div className="space-y-5">
      {/* Card-Auswahl */}
      {!status && (
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => selectStatus('vorhanden')}
            className="rounded-2xl border-2 border-[#EEEEEE] hover:border-[#1B6B45] bg-white p-6 text-left transition-all hover:shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] flex items-center justify-center mb-4">
              <FileCheck size={20} className="text-[#1B6B45]" />
            </div>
            <h3 className="text-[15px] font-bold text-text-primary mb-1.5">Habe ich schon</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Lade deinen Energieausweis als PDF oder Bild hoch.
            </p>
          </button>

          <button
            onClick={() => selectStatus('bestellt')}
            className="rounded-2xl border-2 border-[#EEEEEE] hover:border-[#1B6B45] bg-white p-6 text-left transition-all hover:shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] flex items-center justify-center mb-4">
              <ShoppingCart size={20} className="text-[#1B6B45]" />
            </div>
            <h3 className="text-[15px] font-bold text-text-primary mb-1.5">Jetzt bestellen</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Über unseren Partner. Geht in 2–3 Werktagen, ab 79 €.
            </p>
          </button>

          <button
            onClick={() => selectStatus('nachzureichen')}
            className="rounded-2xl border-2 border-[#EEEEEE] hover:border-[#1B6B45] bg-white p-6 text-left transition-all hover:shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] flex items-center justify-center mb-4">
              <Clock size={20} className="text-[#1B6B45]" />
            </div>
            <h3 className="text-[15px] font-bold text-text-primary mb-1.5">Bringe ich mit</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Zur Besichtigung vorzeigen. Wir markieren ihn als "wird nachgereicht".
            </p>
          </button>
        </div>
      )}

      {/* Vorhanden: Upload + Felder */}
      {status === 'vorhanden' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
            <p className="text-[13px] font-semibold text-text-primary mb-3">Energieausweis hochladen</p>
            {dateiUrl ? (
              <div className="flex items-center gap-3 p-3 bg-[#E8F5EE] rounded-xl">
                <CheckCircle size={18} className="text-[#1B6B45] shrink-0" />
                <span className="text-[13px] text-[#1B6B45] font-medium flex-1 truncate">Datei hochgeladen</span>
                <button
                  onClick={() => { setDateiUrl(null); if (listingId) startTransition(async () => { await saveEnergiausweis(listingId, { status: 'vorhanden', dateiUrl: null }) }) }}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#DDDDDD] rounded-xl p-6 cursor-pointer hover:border-[#1B6B45] transition-colors">
                <Upload size={20} className="text-text-tertiary mb-2" />
                <span className="text-[13px] text-text-secondary">PDF, JPG oder PNG — klicken oder ablegen</span>
                {uploadError && <span className="text-[12px] text-red-600 mt-2">{uploadError}</span>}
                {uploading && <span className="text-[12px] text-[#1B6B45] mt-2">Wird hochgeladen…</span>}
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                />
              </label>
            )}
          </div>

          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5 space-y-4">
            <p className="text-[13px] font-semibold text-text-primary">Angaben (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-text-tertiary block mb-1">Energieklasse</label>
                <select
                  value={klasse}
                  onChange={(e) => setKlasse(e.target.value)}
                  onBlur={handleFieldSave}
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2 text-[13px] text-text-primary bg-white focus:outline-none focus:border-[#1B6B45]"
                >
                  <option value="">— wählen —</option>
                  {KLASSEN.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] text-text-tertiary block mb-1">Ausweistyp</label>
                <select
                  value={typ}
                  onChange={(e) => setTyp(e.target.value)}
                  onBlur={handleFieldSave}
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2 text-[13px] text-text-primary bg-white focus:outline-none focus:border-[#1B6B45]"
                >
                  <option value="">— wählen —</option>
                  {TYPEN.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[12px] text-text-tertiary block mb-1">Endenergiebedarf / -verbrauch (kWh/m²a)</label>
                <input
                  type="number"
                  value={verbrauch}
                  onChange={(e) => setVerbrauch(e.target.value)}
                  onBlur={handleFieldSave}
                  placeholder="z.B. 145"
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-[#1B6B45]"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => { setStatus(null); setDateiUrl(null) }}
            className="text-[13px] text-text-tertiary hover:text-text-secondary underline"
          >
            Anderen Status wählen
          </button>
        </div>
      )}

      {/* Bestellt */}
      {status === 'bestellt' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E8F5EE] bg-[#F6FBF8] p-5 flex items-start gap-3">
            <CheckCircle size={20} className="text-[#1B6B45] shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-[#1B6B45]">Energieausweis bestellt</p>
              <p className="text-[13px] text-text-secondary mt-1">Wird in 2–3 Werktagen erstellt und dir zugeschickt.</p>
              <p className="text-[11px] text-text-tertiary mt-3">In der finalen Version wird hier die Bestellseite unseres Partners via iFrame eingebunden.</p>
            </div>
          </div>
          <button onClick={() => setStatus(null)} className="text-[13px] text-text-tertiary hover:text-text-secondary underline">
            Anderen Status wählen
          </button>
        </div>
      )}

      {/* Nachzureichen */}
      {status === 'nachzureichen' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5 flex items-start gap-3">
            <Clock size={20} className="text-text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-text-primary">Energieausweis wird zur Besichtigung mitgebracht</p>
              <p className="text-[13px] text-text-secondary mt-1">Wir markieren den Ausweis als "wird nachgereicht".</p>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-800 leading-relaxed">
              <strong>Achtung:</strong> Spätestens bei der Besichtigung musst du den Ausweis vorlegen können. Verstöße können bis zu <strong>15.000 €</strong> Bußgeld kosten.
            </p>
          </div>
          <button onClick={() => setStatus(null)} className="text-[13px] text-text-tertiary hover:text-text-secondary underline">
            Anderen Status wählen
          </button>
        </div>
      )}

      {/* Mock Bestell-Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-text-primary">Energieausweis bestellen</h3>
              <button onClick={() => setShowModal(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl bg-surface border border-[#EEEEEE] p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-2">
                <FileCheck size={20} className="text-[#1B6B45]" />
              </div>
              <p className="text-[13px] text-text-secondary">Hier öffnet sich die Bestellseite unseres Partners — wird gerade eingebunden.</p>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-text-tertiary">Adresse</label>
                <div className="mt-0.5 px-3 py-2 rounded-lg border border-[#EEEEEE] bg-surface text-[13px] text-text-secondary">Vorausgefüllt aus deinem Objekt</div>
              </div>
              <div>
                <label className="text-[11px] text-text-tertiary">Ausweistyp</label>
                <div className="mt-0.5 px-3 py-2 rounded-lg border border-[#EEEEEE] bg-surface text-[13px] text-text-secondary">Wird automatisch ermittelt</div>
              </div>
            </div>
            <button
              disabled={isPending}
              onClick={() => { setShowModal(false) }}
              className="w-full bg-[#1B6B45] text-white rounded-lg py-3 text-[14px] font-semibold hover:bg-[#154F34] transition-colors disabled:opacity-60"
            >
              Bestellung abschicken (Demo)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
