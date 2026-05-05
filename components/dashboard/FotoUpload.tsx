'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react'
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
  merkmale?: string[] | null
  zustand?: string | null
  score?: number | null
}

interface FotoUploadProps {
  userId: string
  listingId: string | null
  initialFotos: FotoItem[]
  onChange: (fotos: FotoItem[]) => void
}

function resizeImageUrlToBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const MAX = 1200
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas nicht verfügbar')); return }
      ctx.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' })
    }
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    img.src = url
  })
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
    merkmale: s.merkmale,
    zustand: s.zustand,
    score: s.score,
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
      merkmale: f.merkmale ?? null,
      zustand: f.zustand ?? null,
      score: f.score ?? null,
    }))
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isUploading = fotoStates.some(f => f.analyse_status === 'uploading')
  const completedCount = fotoStates.filter(f => f.url).length
  const lightboxIndex = lightboxId ? fotoStates.findIndex(f => f.id === lightboxId) : -1

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
    return res.json() as Promise<{
      raumtyp: string | null
      beschreibung: string | null
      konfidenz: number
      merkmale: string[] | null
      zustand: string | null
      score: number | null
    }>
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
                  ? {
                      ...f,
                      raumtyp: result.raumtyp,
                      beschreibung: result.beschreibung,
                      ki_konfidenz: result.konfidenz,
                      merkmale: result.merkmale,
                      zustand: result.zustand,
                      score: result.score,
                      analyse_status: 'done' as const,
                    }
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

  function handleLightboxSave(id: string, updates: { raumtyp: string | null; beschreibung: string | null }) {
    const supabase = createClient()
    let savedStates: FotoState[] = []
    setFotoStates(prev => {
      const next = prev.map(f =>
        f.id === id
          ? { ...f, raumtyp: updates.raumtyp, beschreibung: updates.beschreibung, raumtyp_manuell: true }
          : f
      )
      savedStates = next
      return next
    })
    if (listingId) {
      Promise.resolve().then(() => {
        const items = savedStates.map(toFotoItem).filter((f): f is FotoItem => f !== null)
        supabase.from('listings').update({ fotos: items }).eq('id', listingId).eq('user_id', userId).then(() => {})
      })
    }
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setDragOverIndex(index)
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const supabase = createClient()
    setFotoStates(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      // Auto-save new order
      if (listingId) {
        const items = next.map(toFotoItem).filter((f): f is FotoItem => f !== null)
        supabase.from('listings').update({ fotos: items }).eq('id', listingId).eq('user_id', userId).then(() => {})
      }
      return next
    })
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDragOverIndex(null)
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
              index={i}
              isTitelbild={i === 0 && foto.url !== null}
              isDropdownOpen={openDropdownId === foto.id}
              isDragging={dragIndex === i}
              isDragOver={dragOverIndex === i}
              onDropdownToggle={() => setOpenDropdownId(prev => prev === foto.id ? null : foto.id)}
              onRaumtypChange={(rt) => handleRaumtypChange(foto.id, rt)}
              onDelete={() => handleDelete(foto.id)}
              onOpen={() => setLightboxId(foto.id)}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}

      {openDropdownId && <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />}

      {lightboxId !== null && lightboxIndex >= 0 && (
        <FotoLightbox
          fotos={fotoStates}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxId(null)}
          onNavigate={(newIndex) => setLightboxId(fotoStates[newIndex].id)}
          onSave={handleLightboxSave}
        />
      )}
    </div>
  )
}

interface FotoKachelProps {
  foto: FotoState
  index: number
  isTitelbild: boolean
  isDropdownOpen: boolean
  isDragging: boolean
  isDragOver: boolean
  onDropdownToggle: () => void
  onRaumtypChange: (raumtyp: string) => void
  onDelete: () => void
  onOpen: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
}

function FotoKachel({ foto, index, isTitelbild, isDropdownOpen, isDragging, isDragOver, onDropdownToggle, onRaumtypChange, onDelete, onOpen, onDragStart, onDragOver, onDrop, onDragEnd }: FotoKachelProps) {
  const isUnsicher = foto.ki_konfidenz != null && foto.ki_konfidenz < 0.7 && !foto.raumtyp_manuell
  const showBadge = (foto.analyse_status === 'done' || foto.analyse_status === 'error') && foto.url
  const isDraggable = !!foto.url && (foto.analyse_status === 'done' || foto.analyse_status === 'error')

  return (
    <div
      className={`relative aspect-square rounded-[6px] overflow-visible bg-surface group transition-opacity duration-150 ${isDragging ? 'opacity-40' : 'opacity-100'} ${isDragOver ? 'ring-2 ring-accent ring-offset-1' : ''}`}
      draggable={isDraggable}
      onDragStart={isDraggable ? onDragStart : undefined}
      onDragOver={isDraggable ? onDragOver : undefined}
      onDrop={isDraggable ? onDrop : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
    >
      {foto.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto.url}
          alt="Foto"
          loading={index < 6 ? 'eager' : 'lazy'}
          fetchPriority={index < 6 ? 'high' : 'auto'}
          decoding="async"
          onClick={foto.analyse_status === 'done' || foto.analyse_status === 'error' ? onOpen : undefined}
          className={`w-full h-full object-cover rounded-[6px] ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} ${foto.analyse_status === 'analysing' ? 'ring-2 ring-accent' : ''}`}
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

interface FotoLightboxProps {
  fotos: FotoState[]
  currentIndex: number
  onClose: () => void
  onNavigate: (newIndex: number) => void
  onSave: (id: string, updates: { raumtyp: string | null; beschreibung: string | null }) => void
}

function FotoLightbox({ fotos, currentIndex, onClose, onNavigate, onSave }: FotoLightboxProps) {
  const foto = fotos[currentIndex]
  const visibleFotos = fotos.filter(f => f.url)
  const visibleIndex = visibleFotos.findIndex(f => f.id === foto.id)

  const [editRaumtyp, setEditRaumtyp] = useState<string | null>(foto.raumtyp ?? null)
  const [editBeschreibung, setEditBeschreibung] = useState<string>(foto.beschreibung ?? '')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showRaumtypDropdown, setShowRaumtypDropdown] = useState(false)
  const [generatingBeschreibung, setGeneratingBeschreibung] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Sync editable state when navigating
  useEffect(() => {
    const current = fotos[currentIndex]
    setEditRaumtyp(current.raumtyp ?? null)
    setEditBeschreibung(current.beschreibung ?? '')
    setSaveStatus('idle')
    setShowRaumtypDropdown(false)
    setGeneratingBeschreibung(false)
    setGenerateError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  async function handleGenerateBeschreibung() {
    if (!foto.url) return
    setGeneratingBeschreibung(true)
    setGenerateError(null)
    try {
      const { base64, mediaType } = await resizeImageUrlToBase64(foto.url)
      const res = await fetch('/api/generate-beschreibung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType, raumtyp: editRaumtyp }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      if (data.beschreibung) {
        setEditBeschreibung(data.beschreibung)
      } else {
        setGenerateError(data.error ?? 'Unbekannter Fehler')
      }
    } catch (e) {
      setGenerateError(String(e))
    } finally {
      setGeneratingBeschreibung(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < fotos.length - 1) onNavigate(currentIndex + 1)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, fotos.length, onClose, onNavigate])

  function handleSave() {
    setSaveStatus('saving')
    onSave(foto.id, { raumtyp: editRaumtyp, beschreibung: editBeschreibung })
    setTimeout(() => setSaveStatus('saved'), 300)
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* LEFT: Photo */}
        <div className="flex-1 bg-black flex items-center justify-center min-w-0 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto.url ?? ''}
            alt={foto.raumtyp ?? 'Foto'}
            className="max-w-full max-h-[90vh] object-contain"
          />

          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {currentIndex < fotos.length - 1 && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          )}

          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
            {visibleIndex + 1} / {visibleFotos.length}
          </span>
        </div>

        {/* RIGHT: Edit panel */}
        <div className="w-72 flex-shrink-0 flex flex-col border-l border-[#EEEEEE] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEEEEE]">
            <h3 className="text-[14px] font-bold text-text-primary">Foto bearbeiten</h3>
            <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* Raumtyp */}
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1">Raumtyp</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRaumtypDropdown(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 border border-[#DDDDDD] rounded-[8px] px-3 py-2 text-[13px] text-text-primary bg-white hover:border-[#AAAAAA] transition-colors"
                >
                  <span className="truncate">{editRaumtyp ?? 'Nicht erkannt'}</span>
                  <ChevronDown size={14} className="flex-shrink-0 text-text-tertiary" />
                </button>
                {showRaumtypDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#DDDDDD] rounded-[8px] shadow-lg z-10 max-h-48 overflow-y-auto">
                    {RAUMTYPEN.map(rt => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => { setEditRaumtyp(rt); setShowRaumtypDropdown(false) }}
                        className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#F7FFF9] transition-colors ${editRaumtyp === rt ? 'font-semibold text-accent' : 'text-text-primary'}`}
                      >
                        {rt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Beschreibung */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-semibold text-text-secondary">Beschreibung</label>
                <button
                  type="button"
                  onClick={handleGenerateBeschreibung}
                  disabled={generatingBeschreibung}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingBeschreibung ? (
                    <><Loader2 size={11} className="animate-spin" /> Generiert...</>
                  ) : (
                    <><Sparkles size={11} /> KI generieren</>
                  )}
                </button>
              </div>
              <textarea
                value={editBeschreibung}
                onChange={e => setEditBeschreibung(e.target.value)}
                rows={3}
                className="w-full border border-[#DDDDDD] rounded-[8px] px-3 py-2 text-[13px] text-text-primary bg-white outline-none resize-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all placeholder:text-text-tertiary"
                placeholder="Beschreibung dieses Fotos..."
              />
              {generateError && (
                <p className="text-[11px] text-red-500 mt-1 break-all">{generateError}</p>
              )}
            </div>

            {/* Merkmale (only if analysed) */}
            {foto.merkmale && foto.merkmale.length > 0 && (
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">Merkmale</label>
                <div className="flex flex-wrap gap-1.5">
                  {foto.merkmale.map(m => (
                    <span key={m} className="inline-block bg-[#E8F5EE] text-accent text-[11px] font-medium px-2 py-0.5 rounded-full">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Zustand (only if analysed) */}
            {foto.zustand && (
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Zustand</label>
                <span className={`inline-block text-[12px] font-medium px-2.5 py-1 rounded-full ${
                  foto.zustand === 'gut'
                    ? 'bg-[#E8F5EE] text-accent'
                    : foto.zustand === 'mittel'
                    ? 'bg-orange-50 text-orange-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {foto.zustand === 'gut' ? 'Gut' : foto.zustand === 'mittel' ? 'Mittel' : 'Renovierungsbedürftig'}
                </span>
              </div>
            )}

            {/* Score (only if analysed) */}
            {foto.score != null && (
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Foto-Qualität</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${foto.score * 10}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-text-primary">{foto.score}/10</span>
                </div>
              </div>
            )}
          </div>

          {/* Save button — pinned bottom */}
          <div className="p-4 border-t border-[#EEEEEE]">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                saveStatus === 'saved'
                  ? 'bg-[#E8F5EE] text-accent'
                  : 'bg-accent hover:bg-accent-hover text-white'
              }`}
            >
              {saveStatus === 'saved' ? (
                <><Check size={14} /> Gespeichert</>
              ) : saveStatus === 'saving' ? (
                <><Loader2 size={14} className="animate-spin" /> Speichern...</>
              ) : (
                'Speichern'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
