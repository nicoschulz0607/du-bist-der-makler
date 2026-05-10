'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BeforeAfterSliderProps {
  before: string
  after: string
}

export default function BeforeAfterSlider({ before, after }: BeforeAfterSliderProps) {
  const [value, setValue] = useState(50)

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface select-none">
      {/* Before image */}
      <img
        src={before}
        alt="Vorher"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* After image clipped to left portion */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
      >
        <img
          src={after}
          alt="Nachher"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Drag handle */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none z-10 w-px bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        style={{ left: `${value}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
          <ChevronLeft size={12} className="text-text-secondary" />
          <ChevronRight size={12} className="text-text-secondary" />
        </div>
      </div>

      {/* Transparent range input covering full area */}
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
        aria-label="Vorher/Nachher-Vergleich"
      />

      {/* Labels */}
      <span className="absolute top-2 left-2 text-[11px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full pointer-events-none z-10">
        Vorher
      </span>
      <span className="absolute top-2 right-2 text-[11px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full pointer-events-none z-10">
        Nachher
      </span>
    </div>
  )
}
