'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type FotoItem, RAUMTYPEN } from '@/lib/foto'

interface FotoState {
  id: string
  url: string | null
  raumtyp?: string | null
  beschreibung?: string | null
  ki_konfidenz?: number | null
  raumtyp_manuell?: boolean
  analyse_status: 'uploading' | 'analysing' | 'done' | 'error'
}

interface FotoUploadProps {
  userId: string
  listingId: string | null
  initialFotos: FotoItem[]
  onChange: (fotos: FotoItem[]) => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function toFotoItem(s: FotoState): FotoItem | null {
  if (!s.url) return null
  return {
    url: s.url,
    raumtyp: s.raumtyp,
    beschreibung: s.beschreibung,
    ki_konfidenz: s.ki_konfidenz,
    raumtyp_manuell: s.raumtyp_manuell,
    analyse_status:
      s.analyse_status === 'uploading' || s.analyse_status === 'analysing'
        ? 'ausstehend'
        : s.analyse_status === 'done'
        ? 'analysiert'
        : 'fehler',
  }
}

export default function FotoUpload({ userId, listingId, initialFotos, onChange }: FotoUploadProps) {
  const [fotoStates, setFotoStates] = useState<FotoState[]>(() =>
    initialFotos.map(f => ({
      id: f.url,
      url: f.url,
      raumtyp: f.raumtyp,
      beschreibung: f.beschreibung,
      ki_konfidenz: f.ki_konfidenz,
      raumtyp_manuell: f.raumtyp_manuell,
      analyse_status: f.analyse_status === 'fehler' ? 'error' : 'done',
    }))
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isUploading = fotoStates.some(f => f.analyse_status === 'uploading')
  const completedCount = fotoStates.filter(f => f.url).length

  useEffect(() => {
    const items = fotoStates.map(toFotoItem).filter((f): f is FotoItem => f !== null)
    onChange(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fotoStates])

  if (!listingId) {
    return (
      <div className="border-2 border-dashed border-[#DDDDDD] rounded-[8px] p-8 flex flex-col items-center text-center">
        <Upload size={24} className="text-[#DDDDDD] mb-3" strokeWidth={1.5} />
        <p className="text-[14px] font-medium text-text-secondary">Fotos hochladen</p>
        <p className="text-[12px] text-text-tertiary mt-1">
          Speichere zuerst die Basisdaten — dann werden Fotos freigeschaltet
        </p>
      </div>
    )
  }

  async function uploadFile(file: File): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const storagePath = `${userId}/${listingId}/${filename}`
    const { error } = await supabase.storage.from('listing-photos').upload(storagePath, file)
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(storagePath)
    return publicUrl
  }

  async function analyzePhoto(base64: string, mediaType: string) {
    const res = await fetch('/api/analyze-foto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mediaType }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error('analyze failed')
    return res.json() as Promise<{ raumtyp: string | null; beschreibung: string | null; konfidenz: number }>
  }

  async function handleFiles(files: FileList) {
    const supabase = createClient()
    const remaining = 30 - completedCount
    const selected = Array.from(files).slice(0, remaining)
    const errors: string[] = []
    const validFiles: { file: File; tempId: string }[] = []

    setUploadError(null)

    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        errors.push(`${file.name}: Nur JPEG, PNG oder WEBP`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: Maximal 10 MB`)
        continue
      }
      validFiles.push({ file, tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}` })
    }

    if (errors.length > 0) setUploadError(errors.join(' · '))
    if (validFiles.length === 0) return

    setFotoStates(prev => [
      ...prev,
      ...validFiles.map(({ tempId }) => ({ id: tempId, url: null, analyse_status: 'uploading' as const })),
    ])

    // Upload all in parallel
    const uploadResults = await Promise.allSettled(
      validFiles.map(async ({ file, tempId }) => {
        const url = await uploadFile(file)
        setFotoStates(prev => prev.map(f => f.id === tempId ? { ...f, url, analyse_status: 'analysing' } : f))
        return { tempId, url, file }
      })
    )

    uploadResults.forEach((r, i) => {
      if (r.status === 'rejected') {
        const { tempId } = validFiles[i]
        setFotoStates(prev => prev.map(f => f.id === tempId ? { ...f, analyse_status: 'error' } : f))
      }
    })

    const successful = uploadResults
      .filter((r): r is PromiseFulfilledResult<{ tempId: string; url: string; file: File }> => r.status === 'fulfilled')
      .map(r => r.value)

    // Analyze in batches of 5
    const BATCH = 5
    let finalStates: FotoState[] = []

    for (let i = 0; i < successful.length; i += BATCH) {
      const batch = successful.slice(i, i + BATCH)
      await Promise.allSettled(
        batch.map(async ({ tempId, file }) => {
          try {
            const base64 = await fileToBase64(file)
            const result = await analyzePhoto(base64, file.type)
            setFotoStates(prev => {
              const next = prev.map(f =>
                f.id === tempId
                  ? { ...f, raumtyp: result.raumtyp, beschreibung: result.beschreibung, ki_konfidenz: result.konfidenz, analyse_status: 'done' as const }
                  : f
              )
              finalStates = next
              return next
            })
          } catch {
            setFotoStates(prev => {
              const next = prev.map(f => f.id === tempId ? { ...f, analyse_status: 'error' as const } : f)
              finalStates = next
              return next
            })
          }
        })
      )
      if (i + BATCH < successful.length) await new Promise(r => setTimeout(r, 300))
    }

    // Auto-save labels to DB so they persist even without form submit
    if (finalStates.length > 0 && listingId) {
      const items = finalStates.map(toFotoItem).filter((f): f is FotoItem => f !== null)
      supabase.from('listings').update({ fotos: items }).eq('id', listingId).eq('user_id', userId).then(() => {})
    }
  }

  function handleDelete(id: string) {
    setFotoStates(prev => prev.filter(f => f.id !== id))
  }

  function handleRaumtypChange(id: string, raumtyp: string) {
    setFotoStates(prev => prev.map(f => f.id === id ? { ...f, raumtyp, raumtyp_manuell: true, analyse_status: 'done' } : f))
    setOpenDropdownId(null)
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => completedCount < 30 && !isUploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-[8px] p-8 flex flex-col items-center text-center transition-colors duration-150 ${
          completedCount >= 30 || isUploading
            ? 'border-[#DDDDDD] cursor-default'
            : 'border-[#DDDDDD] hover:border-accent hover:bg-[#F7FFF9] cursor-pointer'
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 size={24} className="text-accent mb-3 animate-spin" />
            <p className="text-[14px] font-medium text-accent">Fotos werden hochgeladen...</p>
          </>
        ) : (
          <>
            <Upload size={24} className="text-text-secondary mb-3" strokeWidth={1.5} />
            <p className="text-[14px] font-medium text-text-primary">
              {completedCount >= 30 ? 'Maximum erreicht (30 Fotos)' : 'Fotos hierher ziehen oder klicken'}
            </p>
            <p className="text-[12px] text-text-tertiary mt-1">JPEG · PNG · WEBP · max. 10 MB pro Foto</p>
            {completedCount > 0 && completedCount < 30 && (
              <p className="text-[12px] font-semibold text-accent mt-2">{completedCount}/30 hochgeladen</p>
            )}
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {uploadError && (
        <div className="flex items-start gap-2 bg-[#FFF0F0] border border-[#FFCCCC] rounded-lg px-4 py-3">
          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-red-600">{uploadError}</p>
        </div>
      )}

      {fotoStates.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {fotoStates.map((foto, i) => (
            <FotoKachel
              key={foto.id}
              foto={foto}
              isTitelbild={i === 0 && foto.url !== null}
              isDropdownOpen={openDropdownId === foto.id}
              onDropdownToggle={() => setOpenDropdownId(prev => prev === foto.id ? null : foto.id)}
              onRaumtypChange={(rt) => handleRaumtypChange(foto.id, rt)}
              onDelete={() => handleDelete(foto.id)}
            />
          ))}
        </div>
      )}

      {openDropdownId && <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />}
    </div>
  )
}

interface FotoKachelProps {
  foto: FotoState
  isTitelbild: boolean
  isDropdownOpen: boolean
  onDropdownToggle: () => void
  onRaumtypChange: (raumtyp: string) => void
  onDelete: () => void
}

function FotoKachel({ foto, isTitelbild, isDropdownOpen, onDropdownToggle, onRaumtypChange, onDelete }: FotoKachelProps) {
  const isUnsicher = foto.ki_konfidenz != null && foto.ki_konfidenz < 0.7 && !foto.raumtyp_manuell
  const showBadge = (foto.analyse_status === 'done' || foto.analyse_status === 'error') && foto.url

  return (
    <div className="relative aspect-square rounded-[6px] overflow-visible bg-surface group">
      {foto.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto.url}
          alt="Foto"
          className={`w-full h-full object-cover rounded-[6px] ${foto.analyse_status === 'analysing' ? 'ring-2 ring-accent' : ''}`}
        />
      ) : (
        <div className="w-full h-full rounded-[6px] bg-[#F0F0F0] flex flex-col items-center justify-center gap-1">
          <Loader2 size={18} className="text-text-tertiary animate-spin" />
          <span className="text-[9px] text-text-tertiary font-medium">Hochladen...</span>
        </div>
      )}

      {isTitelbild && (
        <span className="absolute bottom-6 left-1 bg-accent text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full z-20 pointer-events-none">
          Titelbild
        </span>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20"
      >
        <X size={11} />
      </button>

      {foto.analyse_status === 'analysing' && foto.url && (
        <div className="absolute bottom-1 left-1 right-1 z-20">
          <span className="block text-center text-[9px] text-accent font-semibold bg-white/90 rounded px-1 py-0.5 animate-pulse">
            KI erkennt Raum...
          </span>
        </div>
      )}

      {showBadge && (
        <div className="absolute bottom-1 left-1 right-1 z-20">
          <button
            type="button"
            onClick={onDropdownToggle}
            className={`w-full flex items-center justify-between gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
              !foto.raumtyp
                ? 'bg-[#F3F4F6] text-text-secondary hover:bg-[#E5E7EB]'
                : isUnsicher
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-[#E8F5EE] text-accent hover:bg-[#D1FAE5]'
            }`}
          >
            <span className="truncate">{foto.raumtyp ?? 'Nicht erkannt'}{isUnsicher ? ' ?' : ''}</span>
            <ChevronDown size={8} className="flex-shrink-0 ml-0.5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-36 bg-white border border-[#DDDDDD] rounded-[6px] shadow-lg z-30 max-h-48 overflow-y-auto">
              {RAUMTYPEN.map(rt => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => onRaumtypChange(rt)}
                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#F7FFF9] transition-colors ${
                    foto.raumtyp === rt ? 'font-semibold text-accent' : 'text-text-primary'
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
