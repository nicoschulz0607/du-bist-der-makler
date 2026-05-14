'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sun, Maximize, Eye, UserX, Sparkles, ArrowRight } from 'lucide-react'
import FotoUpload from '@/components/dashboard/FotoUpload'
import { canAccess } from '@/lib/tier'
import type { FotoItem } from '@/lib/foto'
import type { Tier } from '@/lib/tier'

interface Props {
  userId: string
  listingId: string | null
  initialFotos: FotoItem[]
  userTier: Tier
  onCanAdvanceChange: (can: boolean) => void
}

export default function Station4Fotos({
  userId,
  listingId,
  initialFotos,
  userTier,
  onCanAdvanceChange,
}: Props) {
  const [fotos, setFotos] = useState<FotoItem[]>(initialFotos)

  function handleFotoChange(updated: FotoItem[]) {
    setFotos(updated)
    onCanAdvanceChange(updated.filter((f) => f.url).length >= 1)
  }

  const showLowQualityBanner = fotos.some(
    (f) => typeof f.score === 'number' && f.score < 6
  )

  const isPro = canAccess(userTier, 'pro')

  return (
    <div className="space-y-5">
      {/* Tip card */}
      <div className="rounded-2xl border border-[#EEEEEE] bg-gradient-to-br from-[#FAFAFA] to-white p-6">
        <h3 className="text-[15px] font-bold text-text-primary mb-2">Fotos sind 70 % der Verkaufsentscheidung</h3>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
          Wir empfehlen 8–15 Fotos in guter Qualität. Lade einfach alles hoch — wir analysieren automatisch Raumtypen und Qualität.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
          <div className="flex items-center gap-2 text-text-secondary">
            <Sun size={14} /> Tageslicht
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Maximize size={14} /> Querformat
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Eye size={14} /> Aufgeräumt
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <UserX size={14} /> Keine Personen
          </div>
        </div>
      </div>

      {/* Upload component */}
      <FotoUpload
        userId={userId}
        listingId={listingId}
        initialFotos={initialFotos}
        onChange={handleFotoChange}
      />

      {/* Low-quality cross-link banner */}
      {showLowQualityBanner && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-[14px] font-bold text-amber-900 mb-1">Wir können deine Fotos aufwerten</h4>
              <p className="text-[13px] text-amber-800 leading-relaxed mb-3">
                Einige Fotos haben noch Potenzial. Unsere KI-Bildtools machen helle, scharfe Profi-Bilder daraus — in wenigen Sekunden.
              </p>
              {isPro ? (
                <Link
                  href="/dashboard/bildtools?tab=foto"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-900 hover:text-amber-700"
                >
                  Bildtools öffnen <ArrowRight size={13} />
                </Link>
              ) : (
                <Link
                  href="/#preise"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-900 hover:text-amber-700"
                >
                  Mit Pro/Premium Bilder aufwerten — Mehr erfahren <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
