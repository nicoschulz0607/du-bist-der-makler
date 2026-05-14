'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, Image } from 'lucide-react'

interface DokumentUploadProps {
  onUpload: (file: File) => Promise<void>
  isPending?: boolean
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export default function DokumentUpload({ onUpload, isPending }: DokumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Nur PDF, JPG oder PNG erlaubt.'
    if (file.size > MAX_SIZE) return 'Datei darf maximal 10 MB groß sein.'
    return null
  }

  async function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    await onUpload(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onClick={() => !isPending && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isPending
            ? 'opacity-50 cursor-not-allowed border-gray-200'
            : isDragging
            ? 'border-accent bg-accent/5'
            : 'border-gray-200 hover:border-accent hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={onInputChange}
          disabled={isPending}
        />
        {isPending ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-text-secondary">Wird hochgeladen…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2 text-text-secondary">
              <FileText size={18} strokeWidth={1.5} />
              <Image size={18} strokeWidth={1.5} />
              <Upload size={18} strokeWidth={1.5} />
            </div>
            <p className="text-[13px] font-medium text-text-primary">Datei hierher ziehen</p>
            <p className="text-[12px] text-text-secondary">oder klicken zum Auswählen</p>
            <p className="text-[11px] text-text-secondary mt-1">PDF, JPG, PNG · max. 10 MB</p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-[12px] text-red-600">{error}</p>
      )}
    </div>
  )
}
