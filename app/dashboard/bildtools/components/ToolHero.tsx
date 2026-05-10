'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import BeforeAfterSlider from './BeforeAfterSlider'
import BenefitList from './BenefitList'
import HowItWorks from './HowItWorks'

interface Step {
  title: string
  description: string
}

interface ToolHeroProps {
  title: string
  subtitle: string
  beforeImage: string
  afterImage: string
  benefits: { text: string }[]
  steps: Step[]
  collapsed: boolean
  onToggleCollapsed: () => void
}

export default function ToolHero({
  title,
  subtitle,
  beforeImage,
  afterImage,
  benefits,
  steps,
  collapsed,
  onToggleCollapsed,
}: ToolHeroProps) {
  const [imagesReady, setImagesReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadImg = (src: string) =>
      new Promise<void>((res, rej) => {
        const img = new window.Image()
        img.onload = () => res()
        img.onerror = rej
        img.src = src
      })

    Promise.all([loadImg(beforeImage), loadImg(afterImage)])
      .then(() => { if (!cancelled) setImagesReady(true) })
      .catch(() => { if (!cancelled) setImagesReady(false) })

    return () => { cancelled = true }
  }, [beforeImage, afterImage])

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex items-center gap-2 text-[12px] font-medium text-text-tertiary hover:text-text-secondary transition-colors duration-150 mb-2"
      >
        <ChevronDown size={14} />
        Erklärung anzeigen
      </button>
    )
  }

  return (
    <div className="space-y-5 pb-4 border-b border-[#EEEEEE]">
      {/* Slider or placeholder */}
      {imagesReady ? (
        <div className="relative max-h-[280px] overflow-hidden rounded-xl">
          <BeforeAfterSlider before={beforeImage} after={afterImage} />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <span className="bg-black/50 text-white text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              Beispielbild — echte Beispiele folgen
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-[4/3] max-h-[200px] rounded-xl bg-surface flex items-center justify-center text-center px-6">
          <p className="text-[13px] text-text-secondary">
            Beispielbilder folgen — Tool ist bereits funktional
          </p>
        </div>
      )}

      {/* Title + Subtitle */}
      <div>
        <h2 className="text-[18px] font-bold text-text-primary">{title}</h2>
        <p className="text-[13px] text-text-secondary mt-0.5">{subtitle}</p>
      </div>

      {/* Benefits */}
      <div>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
          Was bringt&apos;s
        </p>
        <BenefitList benefits={benefits} />
      </div>

      {/* Steps */}
      <div>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
          So funktioniert&apos;s
        </p>
        <HowItWorks steps={steps} />
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex items-center gap-2 text-[12px] font-medium text-text-tertiary hover:text-text-secondary transition-colors duration-150"
      >
        <ChevronUp size={14} />
        Erklärung minimieren
      </button>
    </div>
  )
}
