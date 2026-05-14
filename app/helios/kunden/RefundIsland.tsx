'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/lib/helios/components/feedback/ConfirmDialog'
import { Toast } from '@/lib/helios/components/feedback/Toast'
import { issueRefund, type ActionResult } from '@/app/helios/actions'

interface RefundIslandProps {
  paketId: string
  betragCent: number
}

export function RefundIsland({ paketId, betragCent }: RefundIslandProps) {
  const [result, setResult] = useState<ActionResult | null>(null)

  const euroAmount = String(Math.round(betragCent / 100))
  const euroFormatted = (betragCent / 100).toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  })

  return (
    <>
      <ConfirmDialog
        trigger={
          <button className="text-xs font-medium text-helios-danger hover:underline">
            Refund
          </button>
        }
        title="Erstattung auslösen?"
        description={`Gib den Betrag ${euroFormatted} als Zahl ein, um den Refund zu bestätigen. Dieser Vorgang ist irreversibel.`}
        onConfirm={() => issueRefund(paketId)}
        actionLabel="Erstattung auslösen"
        variant="danger"
        confirmText={euroAmount}
        onResult={setResult}
      />
      <Toast result={result} onDismiss={() => setResult(null)} />
    </>
  )
}
