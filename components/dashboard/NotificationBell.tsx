'use client'

import { useState } from 'react'
import { Bell, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import type { TriggerSignal } from '@/lib/klara/triggers'

interface Props {
  signals: TriggerSignal[]
}

export default function NotificationBell({ signals }: Props) {
  const [open, setOpen] = useState(false)
  const count = signals.length

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
        aria-label="Benachrichtigungen"
      >
        <Bell size={18} strokeWidth={1.5} className="text-text-secondary" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#D04A2C] rounded-full" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[14px] font-semibold text-text-primary">Benachrichtigungen</p>
              <p className="text-[12px] text-text-secondary mt-0.5">
                {count === 0 ? 'Alles im Griff' : `${count} aktiv`}
              </p>
            </div>

            {count === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] text-text-secondary">Keine neuen Benachrichtigungen</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {signals.map(signal => (
                  <SignalItem
                    key={signal.signal_typ}
                    signal={signal}
                    onClose={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function SignalItem({ signal, onClose }: { signal: TriggerSignal; onClose: () => void }) {
  const Icon = signal.schwere === 'wichtig' ? AlertCircle : Info
  const iconColor = (
    signal.schwere === 'wichtig' ? '#D04A2C' :
    signal.schwere === 'hinweis' ? '#F0A030' :
    '#1B6B45'
  )

  const content = (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-100">
      <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-text-primary">{signal.titel}</p>
        <p className="text-[12px] text-text-secondary mt-0.5">{signal.beschreibung}</p>
      </div>
    </div>
  )

  if (signal.link_ziel) {
    return (
      <Link href={signal.link_ziel} onClick={onClose} className="block">
        {content}
      </Link>
    )
  }

  return <div>{content}</div>
}
