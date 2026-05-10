'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { mockOutdoorEnhance } from '@/lib/mock-image-api'
import FileDropZone from '../components/FileDropZone'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import ToolHero from '../components/ToolHero'
import LockedOverlay from '../components/LockedOverlay'
import type { Tier } from '@/lib/tier'

const BENEFITS = [
  { text: 'Twilight-Fotos erzeugen laut Studien 35 % mehr Klicks' },
  { text: 'Grauer Himmel wird zum Sommertag — in Sekunden' },
  { text: 'Automatische Erkennung: kein Übermalen von Personen oder Schildern' },
]

const STEPS = [
  { title: 'Außenfoto hochladen', description: 'JPG, PNG oder WebP, max. 10 MB' },
  { title: 'Aufwertung wählen', description: 'Himmel ersetzen und/oder Twilight-Effekt' },
  { title: 'Vorher/Nachher', description: 'Ergebnis per Slider vergleichen' },
]

interface AussenaufnahmenProps {
  userId: string
  count: number
  tier: Tier
  isLocked: boolean
}

export default function Aussenaufnahmen({ userId, count, tier, isLocked }: AussenaufnahmenProps) {
  const [file, setFile] = useState<File | null>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const [himmel, setHimmel] = useState(false)
  const [twilight, setTwilight] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [heroCollapsed, setHeroCollapsed] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

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
    setResultUrl(null)
  }

  async function handleEnhance() {
    if (!file || (!himmel && !twilight)) return
    setStatus('processing')

    try {
      const supabase = createClient()
      const result = await mockOutdoorEnhance(file, { himmel, twilight })
      setResultUrl(result)
      setStatus('done')
      await supabase.from('bild_jobs').insert({
        user_id: userId,
        job_type: 'outdoor',
        status: 'done',
        input_url: 'mock://local-file-phase1',
        output_urls: [result],
        metadata: { himmel, twilight },
        completed_at: new Date().toISOString(),
      })
    } catch {
      setStatus('idle')
    }
  }

  const canEnhance = !!file && (himmel || twilight) && status === 'idle'

  return (
    <div className="space-y-6">
      <ToolHero
        title="Außenaufnahmen aufwerten"
        subtitle="Auch bei grauem Himmel."
        beforeImage="/samples/outdoor-before.jpg"
        afterImage="/samples/outdoor-sky.jpg"
        benefits={BENEFITS}
        steps={STEPS}
        collapsed={heroCollapsed}
        onToggleCollapsed={() => setHeroCollapsed((v) => !v)}
      />

      {/* Counter */}
      <p className="text-[13px] text-text-secondary">
        Diese Laufzeit: {count} {count === 1 ? 'Aufnahme' : 'Aufnahmen'} aufgewertet · unbegrenzt
      </p>

      {/* Drop zone or locked */}
      {isLocked ? (
        <LockedOverlay requiredTier="premium" currentTier={tier} feature="Außenaufnahmen" />
      ) : (
        <FileDropZone onFiles={handleFile} disabled={status === 'processing'} />
      )}

      {/* Preview */}
      {!isLocked && localUrl && status !== 'done' && (
        <div className="rounded-xl overflow-hidden aspect-[4/3] bg-surface">
          <img src={localUrl} alt="Original" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Toggles */}
      {!isLocked && file && (
        <div className="space-y-3">
          <p className="text-[14px] font-semibold text-text-primary">Aufwertung wählen</p>
          <p className="text-[12px] text-text-secondary">Mindestens eine Option erforderlich.</p>

          {[
            {
              key: 'himmel',
              label: 'Himmel ersetzen',
              desc: 'Graue Wolken durch strahlend blauen Himmel ersetzen',
              value: himmel,
              set: setHimmel,
            },
            {
              key: 'twilight',
              label: 'Twilight (Tag → Dämmerung)',
              desc: 'Tagaufnahme in stimmungsvolle Dämmerung umwandeln',
              value: twilight,
              set: setTwilight,
            },
          ].map(({ key, label, desc, value, set }) => (
            <label
              key={key}
              className={[
                'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors duration-150',
                value ? 'border-accent bg-accent-light' : 'border-border bg-white hover:border-accent/50',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => set(e.target.checked)}
                disabled={status === 'processing'}
                className="mt-0.5 w-4 h-4 accent-accent flex-shrink-0 cursor-pointer"
              />
              <div>
                <p className="text-[14px] font-semibold text-text-primary">{label}</p>
                <p className="text-[12px] text-text-secondary mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Enhance button */}
      {!isLocked && file && (
        <button
          type="button"
          onClick={handleEnhance}
          disabled={!canEnhance}
          className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-semibold px-5 h-11 transition-colors duration-150 active:scale-[0.98]"
        >
          {status === 'processing' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Aufnahme wird aufgewertet…
            </>
          ) : (
            'Aufwerten'
          )}
        </button>
      )}

      {/* Result */}
      {!isLocked && status === 'done' && localUrl && resultUrl && (
        <div className="space-y-3 pt-2">
          <h3 className="text-[15px] font-bold text-text-primary headline-sub">Ergebnis</h3>
          <BeforeAfterSlider before={localUrl} after={resultUrl} />
        </div>
      )}
    </div>
  )
}
