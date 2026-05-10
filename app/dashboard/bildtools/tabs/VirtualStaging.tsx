'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { mockStageRoom } from '@/lib/mock-image-api'
import FileDropZone from '../components/FileDropZone'
import StyleCard from '../components/StyleCard'
import ToolHero from '../components/ToolHero'
import LockedOverlay from '../components/LockedOverlay'
import type { Tier } from '@/lib/tier'

const BENEFITS = [
  { text: 'Möblierte Räume erzielen laut Studien 1–5 % höhere Verkaufspreise' },
  { text: 'Wähle aus 4 Einrichtungsstilen — passend zu deiner Zielgruppe' },
  { text: 'Marktpreis: 16–40 € pro Bild — bei dir inklusive' },
]

const STEPS = [
  { title: 'Leeren Raum hochladen', description: 'Ein Foto des leerstehenden Raums' },
  { title: 'Stil auswählen', description: 'Modern, Skandinavisch, Klassisch oder Familie' },
  { title: '3 Varianten erhalten', description: 'Favorit auswählen und herunterladen' },
]

const STYLES = [
  { id: 'modern', label: 'Modern', gradient: 'linear-gradient(135deg, #E8E8E8 0%, #BDBDBD 100%)' },
  { id: 'skandinavisch', label: 'Skandinavisch', gradient: 'linear-gradient(135deg, #F5F0E8 0%, #D9CEBE 100%)' },
  { id: 'klassisch', label: 'Klassisch', gradient: 'linear-gradient(135deg, #F5ECD5 0%, #C8A96E 100%)' },
  { id: 'familie', label: 'Familie', gradient: 'linear-gradient(135deg, #F5E8E0 0%, #C8856E 100%)' },
]

const LOADING_TEXTS = [
  'Möbel werden platziert…',
  'Beleuchtung wird angepasst…',
  'Finalisierung…',
]

interface VirtualStagingProps {
  userId: string
  count: number
  tier: Tier
  isLocked: boolean
}

export default function VirtualStaging({ userId, count, tier, isLocked }: VirtualStagingProps) {
  const [file, setFile] = useState<File | null>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle')
  const [variants, setVariants] = useState<string[]>([])
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [progressText, setProgressText] = useState(LOADING_TEXTS[0])
  const [heroCollapsed, setHeroCollapsed] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (status !== 'processing') return
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_TEXTS.length
      setProgressText(LOADING_TEXTS[idx])
    }, 3000)
    return () => clearInterval(interval)
  }, [status])

  function handleFile(files: File[]) {
    const f = files[0]
    if (!f) return
    if (!heroCollapsed) setHeroCollapsed(true)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(f)
    objectUrlRef.current = url
    setFile(f)
    setLocalUrl(url)
    setStatus('idle')
    setVariants([])
    setSelectedVariant(null)
    setDisclaimerChecked(false)
  }

  async function handleGenerate() {
    if (!file || !selectedStyle || !disclaimerChecked) return
    setStatus('processing')
    setProgressText(LOADING_TEXTS[0])

    try {
      const supabase = createClient()
      const results = await mockStageRoom(file, selectedStyle)
      setVariants(results)
      setStatus('done')
      await supabase.from('bild_jobs').insert({
        user_id: userId,
        job_type: 'staging',
        status: 'done',
        input_url: 'mock://local-file-phase1',
        output_urls: results,
        metadata: { style: selectedStyle },
        completed_at: new Date().toISOString(),
      })
    } catch {
      setStatus('idle')
    }
  }

  const canGenerate = !!file && disclaimerChecked && !!selectedStyle && status === 'idle'

  return (
    <div className="space-y-6">
      <ToolHero
        title="Virtual Staging"
        subtitle="Leere Räume zum Wohnen erweckt."
        beforeImage="/samples/staging-empty-room.jpg"
        afterImage="/samples/staging-modern.jpg"
        benefits={BENEFITS}
        steps={STEPS}
        collapsed={heroCollapsed}
        onToggleCollapsed={() => setHeroCollapsed((v) => !v)}
      />

      {/* Permanent disclaimer — always visible */}
      <p className="text-[12px] text-text-secondary leading-relaxed">
        <span className="font-semibold">Hinweis:</span> Virtual Staging ist nur für tatsächlich
        leerstehende Räume zulässig. Bei bewohnten Räumen entsteht Täuschungsgefahr gegenüber
        Käufern.
      </p>

      {/* Counter */}
      <p className="text-[13px] text-text-secondary">
        Diese Laufzeit: {count} {count === 1 ? 'Raum' : 'Räume'} gestaged · unbegrenzt
      </p>

      {/* Drop zone or locked */}
      {isLocked ? (
        <LockedOverlay requiredTier="premium" currentTier={tier} feature="Virtual Staging" />
      ) : (
        <FileDropZone onFiles={handleFile} disabled={status === 'processing'} />
      )}

      {/* Preview of uploaded file */}
      {!isLocked && localUrl && (
        <div className="rounded-xl overflow-hidden aspect-[4/3] bg-surface">
          <img src={localUrl} alt="Originalraum" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Confirmation checkbox (separate from disclaimer text above) */}
      {!isLocked && file && (
        <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface cursor-pointer">
          <input
            type="checkbox"
            checked={disclaimerChecked}
            onChange={(e) => setDisclaimerChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-accent flex-shrink-0 cursor-pointer"
          />
          <span className="text-[13px] text-text-primary leading-relaxed">
            Ich bestätige: Dieser Raum ist tatsächlich leer.
          </span>
        </label>
      )}

      {/* Style selector */}
      {!isLocked && file && (
        <div>
          <p className="text-[14px] font-semibold text-text-primary mb-3">Einrichtungsstil wählen</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STYLES.map((s) => (
              <StyleCard
                key={s.id}
                label={s.label}
                gradient={s.gradient}
                selected={selectedStyle === s.id}
                onSelect={() => setSelectedStyle(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      {!isLocked && file && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-semibold px-5 h-11 transition-colors duration-150 active:scale-[0.98]"
        >
          {status === 'processing' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {progressText}
            </>
          ) : (
            'Staging generieren'
          )}
        </button>
      )}

      {/* Variants */}
      {!isLocked && status === 'done' && variants.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-[15px] font-bold text-text-primary headline-sub">
            3 Varianten — wähle deinen Favoriten
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {variants.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedVariant(i)}
                className={[
                  'rounded-xl overflow-hidden border-2 transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  selectedVariant === i
                    ? 'border-accent shadow-[var(--shadow-hover)]'
                    : 'border-border hover:border-accent/50',
                ].join(' ')}
              >
                <div className="aspect-[4/3] relative">
                  <img src={url} alt={`Variante ${i + 1}`} className="w-full h-full object-cover" />
                  {selectedVariant === i && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-accent" />
                    </div>
                  )}
                </div>
                <div className="px-3 py-2">
                  <span className="text-[13px] font-semibold text-text-primary">Variante {i + 1}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
