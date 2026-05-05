'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { X, Sparkles } from 'lucide-react'
import ChatInterface from './ChatInterface'

const STORAGE_KEY = 'klara_bubble'

export default function FloatingBubble() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [convId, setConvId] = useState<string | undefined>()
  const [prefilledQuestion, setPrefilledQuestion] = useState<string | undefined>()
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Hooks müssen alle vor jedem konditionellen Return stehen
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { open: o, convId: c } = JSON.parse(stored)
        setOpen(!!o)
        setConvId(c ?? undefined)
      }
    } catch { /* ignorieren */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, convId }))
    } catch { /* ignorieren */ }
  }, [open, convId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!open || !bubbleRef.current) return
      const target = e.target as HTMLElement
      if (!bubbleRef.current.contains(target) && !target.closest('[data-klara-trigger]')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    function handlePrefill(e: CustomEvent<{ question: string }>) {
      setPrefilledQuestion(e.detail.question)
      setOpen(true)
    }
    window.addEventListener('klara:prefill', handlePrefill as EventListener)
    return () => window.removeEventListener('klara:prefill', handlePrefill as EventListener)
  }, [])

  // Auf der Klara-Vollbild-Seite: Bubble nicht anzeigen
  if (pathname === '/dashboard/klara') return null

  const contextOrigin =
    pathname.startsWith('/dashboard/')
      ? pathname.replace('/dashboard/', '')
      : 'standalone'

  return (
    <>
      {/* Chat-Panel */}
      {open && (
        <div
          ref={bubbleRef}
          className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-24px)] h-[560px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.20)] flex flex-col overflow-hidden border border-[#EEEEEE] animate-slide-up"
        >
          {/* Panel-Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#EEEEEE] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                <Sparkles size={12} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-[14px] font-semibold text-text-primary">Klara hilft</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-text-secondary hover:bg-[#EEEEEE] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <ChatInterface
              conversationId={convId}
              contextOrigin={contextOrigin}
              variant="sidebar"
              prefilledQuestion={prefilledQuestion}
            />
          </div>
        </div>
      )}

      {/* Floating-Button */}
      <button
        type="button"
        data-klara-trigger
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent shadow-[0_4px_16px_rgba(27,107,69,0.4)] flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-all"
        aria-label="Klara öffnen"
      >
        {open ? (
          <X size={20} className="text-white" strokeWidth={2} />
        ) : (
          <Sparkles size={20} className="text-white" strokeWidth={2} />
        )}
      </button>
    </>
  )
}
