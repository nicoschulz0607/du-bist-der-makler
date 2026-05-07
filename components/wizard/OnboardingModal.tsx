'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dismissOnboarding } from '@/lib/wizard/actions'

interface Props {
  show: boolean
}

export default function OnboardingModal({ show }: Props) {
  const [visible, setVisible] = useState(show)
  const [, startTransition] = useTransition()
  const router = useRouter()

  if (!visible) return null

  function handleYes() {
    startTransition(async () => {
      await dismissOnboarding(true)
      router.push('/dashboard/start')
    })
  }

  function handleNo() {
    setVisible(false)
    startTransition(async () => {
      await dismissOnboarding(false)
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={handleNo} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 pointer-events-auto">
          <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center mb-5">
            <span className="text-[22px]">🏡</span>
          </div>
          <h2 className="text-[20px] font-bold text-text-primary mb-2" style={{ letterSpacing: '-0.18px' }}>
            Schritt für Schritt zum Verkauf
          </h2>
          <p className="text-[14px] text-text-secondary mb-7">
            Unser geführter Wizard begleitet dich durch alle 12 Schritte — von den Grunddaten bis zur Veröffentlichung. Dauert ca. 20–30 Minuten.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleYes}
              className="w-full rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold h-11 transition-colors duration-150"
            >
              Ja, jetzt starten →
            </button>
            <button
              type="button"
              onClick={handleNo}
              className="w-full text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Nein danke, selbst erkunden
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
