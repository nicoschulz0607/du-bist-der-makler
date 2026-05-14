'use client'

import { useState } from 'react'
import { ExternalLink, Building2 } from 'lucide-react'
import { getBrandLogoUrl } from '@/lib/utils/brandfetch'
import { STATUS_DISPLAY } from '@/lib/portals/config'
import { formatSyncTime } from '@/lib/portals/format'
import type { PortalCardData } from '@/lib/portals/queries'

export default function PortalCard({ data }: { data: PortalCardData }) {
  const [logoError, setLogoError] = useState(false)
  const statusInfo = STATUS_DISPLAY[data.status]
  const logoUrl = getBrandLogoUrl(data.domain, { size: 40, type: 'icon' })
  const showLogo = logoUrl && !logoError

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      {/* Header: Logo + Name + Status */}
      <div className="flex items-center gap-2.5">
        {showLogo ? (
          <img
            src={logoUrl}
            alt={`${data.name} Logo`}
            width={40}
            height={40}
            className="w-10 h-10 rounded-md object-contain flex-shrink-0"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-gray-400" />
          </div>
        )}
        <div>
          <p className="text-[14px] font-semibold text-text-primary">{data.name}</p>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusInfo.pulse ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: statusInfo.color }}
            />
            <span className="text-[12px] text-text-secondary">{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Aufrufe + Anfragen */}
      <div className="flex items-end justify-between mt-1">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">
            Aufrufe (7 Tage)
          </p>
          <p className="text-[24px] font-semibold text-text-primary leading-none">
            {data.aufrufe_7tage !== null ? data.aufrufe_7tage : '—'}
          </p>
        </div>
        <p className="text-[13px] text-text-secondary">
          {data.anfragen_anzahl === 1 ? '1 Anfrage' : `${data.anfragen_anzahl} Anfragen`}
        </p>
      </div>

      {/* Footer: Letzte Sync + Link */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-[11px] text-text-secondary">
          {data.letzte_sync_at
            ? formatSyncTime(data.letzte_sync_at)
            : 'Noch nicht synchronisiert'}
        </span>
        {data.listing_url ? (
          <a
            href={data.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:opacity-80 transition-opacity"
          >
            Inserat ansehen
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-[11px] text-text-secondary italic">
            URL noch nicht verfügbar
          </span>
        )}
      </div>
    </div>
  )
}
