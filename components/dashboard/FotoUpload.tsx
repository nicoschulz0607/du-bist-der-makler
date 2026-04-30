'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FotoUploadProps {
  userId: string
  listingId: string | null
  initialFotos: string[]
  onChange: (urls: string[]) => void
}

export default function FotoUpload({ userId, listingId, initialFotos, onChange }: FotoUploadProps) {
  const [fotos, setFotos] = useState<string[]>(initialFotos)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  async function handleFiles(files: FileList) {
    const supabase = createClient()
    const newUrls: string[] = []
    const errors: string[] = []
    const remaining = 30 - fotos.length
    const selected = Array.from(files).slice(0, remaining)

    setUploading(true)
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

      const ext = file.name.split('.').pop() ?? 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `${userId}/${listingId}/${filename}`

      const { error } = await supabase.storage.from('listing-photos').upload(path, file)
      if (error) {
        errors.push(`${file.name}: Upload fehlgeschlagen`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
      newUrls.push(publicUrl)
    }

    setUploading(false)
    if (errors.length > 0) setUploadError(errors.join(' · '))

    if (newUrls.length > 0) {
      const updated = [...fotos, ...newUrls]
      setFotos(updated)
      onChange(updated)
    }
  }

  function handleDelete(url: string) {
    const updated = fotos.filter((u) => u !== url)
    setFotos(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => fotos.length < 30 && !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-[8px] p-8 flex flex-col items-center text-center transition-colors duration-150 ${
          fotos.length >= 30 || uploading
            ? 'border-[#DDDDDD] cursor-default'
            : 'border-[#DDDDDD] hover:border-accent hover:bg-[#F7FFF9] cursor-pointer'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 size={24} className="text-accent mb-3 animate-spin" />
            <p className="text-[14px] font-medium text-accent">Fotos werden hochgeladen...</p>
          </>
        ) : (
          <>
            <Upload size={24} className="text-text-secondary mb-3" strokeWidth={1.5} />
            <p className="text-[14px] font-medium text-text-primary">
              {fotos.length >= 30 ? 'Maximum erreicht (30 Fotos)' : 'Fotos hierher ziehen oder klicken'}
            </p>
            <p className="text-[12px] text-text-tertiary mt-1">JPEG · PNG · WEBP · max. 10 MB pro Foto</p>
            {fotos.length > 0 && fotos.length < 30 && (
              <p className="text-[12px] font-semibold text-accent mt-2">{fotos.length}/30 hochgeladen</p>
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

      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {fotos.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-[6px] overflow-hidden bg-surface group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-accent text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  Titelbild
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(url)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
