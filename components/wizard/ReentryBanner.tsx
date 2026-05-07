'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'
import { dismissReentryBanner } from '@/lib/wizard/actions'

interface Props {
  station: number
  totalStations: number
}

export default function ReentryBanner({ station, totalStations }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [, startTransition] = useTransition()

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    startTransition(async () => {
      await dismissReentryBanner()
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-[#E8F5EE] border border-accent/30 rounded-xl px-5 py-3">
      <p className="text-[14px] font-medium text-accent">
        Du bist bei Schritt {station} von {totalStations} — weitermachen?
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/dashboard/start"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
        >
          Weitermachen <ArrowRight size={14} />
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-accent/10 transition-colors"
          aria-label="Schließen"
        >
          <X size={14} className="text-accent" />
        </button>
      </div>
    </div>
  )
}
