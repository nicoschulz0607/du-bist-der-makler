'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import ChatInterface from '@/components/klara/ChatInterface'
import { WIZARD_STATIONS } from '@/lib/wizard/config'

interface KlaraOpenEvent extends CustomEvent {
  detail: { context: string }
}

function getStationOpeningQuestion(context: string): string | undefined {
  const m = context.match(/wizard:station_(\d+)_/)
  if (!m) return undefined
  const stationNum = parseInt(m[1])
  const station = WIZARD_STATIONS.find((s) => s.stationNum === stationNum)
  if (!station) return undefined
  return `Ich bin gerade bei Station ${stationNum} — "${station.title}". Schau dir meinen aktuellen Stand an und sag mir proaktiv: Was muss ich hier tun, was ist noch offen, und hast du konkrete Tipps oder rechtliche Hinweise für diese Station?`
}

export default function KlaraSlideOver() {
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState('wizard:allgemein')

  useEffect(() => {
    function handleOpen(e: Event) {
      const event = e as KlaraOpenEvent
      setContext(event.detail?.context ?? 'wizard:allgemein')
      setOpen(true)
    }

    window.addEventListener('wizard:openKlara', handleOpen)
    return () => window.removeEventListener('wizard:openKlara', handleOpen)
  }, [])

  const openingQuestion = getStationOpeningQuestion(context)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[69] bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[480px] max-w-full z-[70] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#EEEEEE] flex-shrink-0">
          <span className="text-[14px] font-semibold text-text-primary">Frage an Klara</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        </div>
        <div className="h-[calc(100%-53px)]">
          {/* key=context remounts ChatInterface (fresh conversation) when station changes */}
          <ChatInterface
            key={context}
            contextOrigin={context}
            variant="sidebar"
            prefilledQuestion={openingQuestion}
          />
        </div>
      </div>
    </>
  )
}
