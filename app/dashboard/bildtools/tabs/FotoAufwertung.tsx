'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { mockEnhancePhoto } from '@/lib/mock-image-api'
import FileDropZone from '../components/FileDropZone'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import ToolHero from '../components/ToolHero'
import LockedOverlay from '../components/LockedOverlay'
import type { Tier } from '@/lib/tier'

const PRO_LIMIT = 30

const BENEFITS = [
  { text: 'Helle, scharfe Fotos verkaufen 73 % schneller (NAR-Studie)' },
  { text: 'Automatischer Weißabgleich, schärfere Details, ausgewogene Belichtung' },
  { text: 'Funktioniert auch mit Handy-Aufnahmen' },
]

const STEPS = [
  { title: 'Fotos hochladen', description: 'Bis zu 30 Bilder gleichzeitig' },
  { title: 'KI verarbeitet', description: 'Ca. 3 Sekunden pro Bild' },
  { title: 'Vorher/Nachher', description: 'Einzeln vergleichen und herunterladen' },
]

interface ImageItem {
  file: File
  localUrl: string
  status: 'idle' | 'processing' | 'done' | 'error'
  resultUrl?: string
}

interface FotoAufwertungProps {
  tier: Tier
  userId: string
  count: number
  isLocked: boolean
}

export default function FotoAufwertung({ tier, userId, count, isLocked }: FotoAufwertungProps) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [heroCollapsed, setHeroCollapsed] = useState(false)
  const objectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(URL.revokeObjectURL)
    }
  }, [])

  function addFiles(files: File[]) {
    if (!heroCollapsed) setHeroCollapsed(true)
    const newItems: ImageItem[] = files.map((file) => {
      const localUrl = URL.createObjectURL(file)
      objectUrlsRef.current.push(localUrl)
      return { file, localUrl, status: 'idle' }
    })
    setImages((prev) => [...prev, ...newItems])
  }

  async function handleProcessAll() {
    const pending = images.filter((img) => img.status === 'idle')
    if (!pending.length) return
    setIsProcessing(true)
    const supabase = createClient()

    for (let i = 0; i < images.length; i++) {
      if (images[i].status !== 'idle') continue

      setImages((prev) =>
        prev.map((img, idx) => (idx === i ? { ...img, status: 'processing' } : img))
      )

      try {
        const resultUrl = await mockEnhancePhoto(images[i].file)
        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, status: 'done', resultUrl } : img))
        )
        await supabase.from('bild_jobs').insert({
          user_id: userId,
          job_type: 'enhance',
          status: 'done',
          input_url: 'mock://local-file-phase1',
          output_urls: [resultUrl],
          completed_at: new Date().toISOString(),
        })
      } catch {
        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, status: 'error' } : img))
        )
      }
    }

    setIsProcessing(false)
  }

  const idleCount = images.filter((img) => img.status === 'idle').length
  const doneCount = images.filter((img) => img.status === 'done').length

  return (
    <div className="space-y-6">
      <ToolHero
        title="Foto-Aufwertung"
        subtitle="Aus okay wird wow."
        beforeImage="/samples/enhance-before.jpg"
        afterImage="/samples/enhance-after.jpg"
        benefits={BENEFITS}
        steps={STEPS}
        collapsed={heroCollapsed}
        onToggleCollapsed={() => setHeroCollapsed((v) => !v)}
      />

      {/* Counter */}
      <p className="text-[13px] text-text-secondary">
        {tier === 'premium'
          ? `Diese Laufzeit: ${count} · unbegrenzt`
          : `${count} von ${PRO_LIMIT} verbraucht`}
      </p>

      {/* Drop zone or locked */}
      {isLocked ? (
        <LockedOverlay requiredTier="pro" currentTier={tier} feature="Foto-Aufwertung" />
      ) : (
        <FileDropZone multiple onFiles={addFiles} disabled={isProcessing} />
      )}

      {/* Thumbnail grid */}
      {!isLocked && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] bg-surface">
              <img src={img.localUrl} alt="" className="w-full h-full object-cover" />

              {img.status === 'processing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}
              {img.status === 'done' && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-accent" />
                </div>
              )}
              {img.status === 'error' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <AlertCircle size={20} className="text-[#C13515]" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Process button */}
      {!isLocked && images.length > 0 && (
        <button
          type="button"
          onClick={handleProcessAll}
          disabled={isProcessing || idleCount === 0}
          className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold px-5 h-11 transition-colors duration-150 active:scale-[0.98]"
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Wird aufgewertet…
            </>
          ) : (
            <>
              <ImageIcon size={16} />
              {idleCount > 0
                ? `${idleCount} ${idleCount === 1 ? 'Bild' : 'Bilder'} aufwerten`
                : 'Alle aufgewertet'}
            </>
          )}
        </button>
      )}

      {/* Before/After results */}
      {!isLocked && doneCount > 0 && (
        <div className="space-y-6 pt-2">
          <h3 className="text-[15px] font-bold text-text-primary headline-sub">Ergebnisse</h3>
          {images
            .filter((img) => img.status === 'done' && img.resultUrl)
            .map((img, i) => (
              <div key={i} className="space-y-3">
                <BeforeAfterSlider before={img.localUrl} after={img.resultUrl!} />
                {/* Phase 2: use fetch + URL.createObjectURL for reliable download */}
                <a
                  href={img.resultUrl}
                  download={`aufgewertet-${i + 1}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:underline"
                >
                  <Download size={14} />
                  Herunterladen
                </a>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
