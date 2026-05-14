'use client'

import { useState, useTransition } from 'react'
import { FileCheck, FileX, Clock, Upload, CheckCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveGrundriss } from '@/lib/wizard/actions'

interface Props {
  listingId: string | null
  userId: string
  initialStatus: string | null
  initialUrl: string | null
  onCanAdvanceChange: (can: boolean) => void
}

type GStatus = 'vorhanden' | 'keiner' | 'besichtigung'

export default function Station5Grundriss({
  listingId,
  userId,
  initialStatus,
  initialUrl,
  onCanAdvanceChange: _onCanAdvanceChange,
}: Props) {
  const [status, setStatus] = useState<GStatus | null>(initialStatus as GStatus | null)
  const [grundrissUrl, setGrundrissUrl] = useState<string | null>(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function selectStatus(s: GStatus) {
    setStatus(s)
    if (!listingId) return
    startTransition(async () => {
      await saveGrundriss(listingId, { status: s })
    })
  }

  async function handleFileUpload(file: File) {
    if (!listingId) return
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'pdf'
      const filename = `grundriss-${Date.now()}.${ext}`
      const path = `${userId}/${listingId}/${filename}`
      const { error } = await supabase.storage.from('listing-photos').upload(path, file)
      if (error) throw new Error(error.message)
      const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
      setGrundrissUrl(publicUrl)
      startTransition(async () => {
        await saveGrundriss(listingId, { status: 'vorhanden', url: publicUrl })
      })
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
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
            <h3 className="text-[15px] font-bold text-text-primary mb-1.5">Habe ich</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Lade deinen Grundriss als PDF oder Bild hoch.
            </p>
          </button>

          <button
            onClick={() => selectStatus('keiner')}
            className="rounded-2xl border-2 border-[#EEEEEE] hover:border-[#1B6B45] bg-white p-6 text-left transition-all hover:shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] flex items-center justify-center mb-4">
              <FileX size={20} className="text-[#1B6B45]" />
            </div>
            <h3 className="text-[15px] font-bold text-text-primary mb-1.5">Habe keinen</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Viele Käufer fragen nicht danach. Du kannst auch ohne verkaufen.
            </p>
          </button>

          <button
            onClick={() => selectStatus('besichtigung')}
            className="rounded-2xl border-2 border-[#EEEEEE] hover:border-[#1B6B45] bg-white p-6 text-left transition-all hover:shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] flex items-center justify-center mb-4">
              <Clock size={20} className="text-[#1B6B45]" />
            </div>
            <h3 className="text-[15px] font-bold text-text-primary mb-1.5">Bringe ich mit</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Du zeigst den Grundriss vor Ort den Interessenten.
            </p>
          </button>
        </div>
      )}

      {/* Vorhanden: Upload */}
      {status === 'vorhanden' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
            <p className="text-[13px] font-semibold text-text-primary mb-3">Grundriss hochladen</p>
            {grundrissUrl ? (
              <div className="flex items-center gap-3 p-3 bg-[#E8F5EE] rounded-xl">
                <CheckCircle size={18} className="text-[#1B6B45] shrink-0" />
                <span className="text-[13px] text-[#1B6B45] font-medium flex-1 truncate">Grundriss hochgeladen</span>
                <button
                  onClick={() => {
                    setGrundrissUrl(null)
                    if (listingId) startTransition(async () => { await saveGrundriss(listingId, { status: 'vorhanden', url: null }) })
                  }}
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
          <button onClick={() => setStatus(null)} className="text-[13px] text-text-tertiary hover:text-text-secondary underline">
            Anderen Status wählen
          </button>
        </div>
      )}

      {/* Keiner */}
      {status === 'keiner' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5 flex items-start gap-3">
            <FileX size={20} className="text-text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-text-primary">Kein Grundriss vorhanden</p>
              <p className="text-[13px] text-text-secondary mt-1">Das ist in Ordnung — viele Verkäufe laufen auch ohne.</p>
            </div>
          </div>
          <button onClick={() => setStatus(null)} className="text-[13px] text-text-tertiary hover:text-text-secondary underline">
            Anderen Status wählen
          </button>
        </div>
      )}

      {/* Besichtigung */}
      {status === 'besichtigung' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5 flex items-start gap-3">
            <Clock size={20} className="text-text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-text-primary">Grundriss wird zur Besichtigung mitgebracht</p>
              <p className="text-[13px] text-text-secondary mt-1">Du zeigst ihn Interessenten vor Ort.</p>
            </div>
          </div>
          <button onClick={() => setStatus(null)} className="text-[13px] text-text-tertiary hover:text-text-secondary underline">
            Anderen Status wählen
          </button>
        </div>
      )}

      {/* Collapsed hint */}
      <details className="rounded-lg border border-[#EEEEEE] bg-surface p-4">
        <summary className="text-[13px] font-medium text-text-primary cursor-pointer select-none">
          Keinen Grundriss? So erstellst du einen
        </summary>
        <div className="text-[13px] text-text-secondary mt-3 leading-relaxed">
          <p>Eine einfache Skizze mit Maßen reicht oft aus. Kostenlose Tools:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong>Roomle</strong> — einfacher Online-Grundrissplaner (kostenlos)</li>
            <li><strong>Handzeichnung</strong> — mit Maßangaben fotografiert und hochgeladen</li>
            <li>Viele Käufer akzeptieren auch einen vereinfachten Grundriss</li>
          </ul>
        </div>
      </details>

      {isPending && <span className="sr-only">Wird gespeichert…</span>}
    </div>
  )
}
