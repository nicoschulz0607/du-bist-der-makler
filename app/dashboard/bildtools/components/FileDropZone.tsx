'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTS = '.jpg,.jpeg,.png,.webp'

interface FileDropZoneProps {
  multiple?: boolean
  onFiles: (files: File[]) => void
  disabled?: boolean
}

function validateFiles(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = []
  const errors: string[] = []
  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: Format nicht unterstützt (JPG, PNG, WebP)`)
    } else if (file.size > MAX_SIZE) {
      errors.push(`${file.name}: Datei zu groß (max. 10 MB)`)
    } else {
      valid.push(file)
    }
  }
  return { valid, errors }
}

export default function FileDropZone({ multiple = false, onFiles, disabled = false }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const { valid, errors: errs } = validateFiles(Array.from(fileList))
    setErrors(errs)
    if (valid.length > 0) onFiles(valid)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        disabled={disabled}
        className={[
          'w-full min-h-[140px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors duration-150 px-4 py-6',
          isDragging
            ? 'border-accent bg-accent-light'
            : 'border-border hover:border-accent hover:bg-accent-light/40',
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <Upload size={24} className={isDragging ? 'text-accent' : 'text-text-secondary'} strokeWidth={1.75} />
        <div className="text-center">
          <p className="text-[14px] font-semibold text-text-primary">
            {multiple ? 'Fotos hierher ziehen' : 'Foto hierher ziehen'}
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5">oder klicken zum Auswählen · JPG, PNG, WebP · max. 10 MB</p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTS}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {errors.length > 0 && (
        <ul className="mt-2 space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-[12px] text-[#C13515] font-medium">{err}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
