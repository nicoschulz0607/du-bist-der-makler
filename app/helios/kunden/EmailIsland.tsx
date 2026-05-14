'use client'

import { useActionState } from 'react'
import { sendCustomEmail } from '@/app/helios/actions'
import { Toast } from '@/lib/helios/components/feedback/Toast'
import { useState } from 'react'

interface EmailIslandProps {
  userId: string
}

export function EmailIsland({ userId }: EmailIslandProps) {
  const [state, formAction, isPending] = useActionState(sendCustomEmail, null)
  const [dismissed, setDismissed] = useState(false)

  // Reset dismissed state when new result comes in
  const toastResult = dismissed ? null : state

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="user_id" value={userId} />
        <div>
          <label className="block text-xs font-medium text-helios-text-muted mb-1">
            Betreff
          </label>
          <input
            name="betreff"
            type="text"
            required
            className="w-full rounded-lg border border-helios-border bg-helios-surface px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
            placeholder="z.B. Rückfrage zu Ihrem Listing"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-helios-text-muted mb-1">
            Nachricht
          </label>
          <textarea
            name="body"
            required
            rows={5}
            className="w-full rounded-lg border border-helios-border bg-helios-surface px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent resize-none"
            placeholder="Ihre Nachricht an den Kunden…"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-helios-accent text-white text-sm font-medium hover:bg-helios-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Wird gesendet…' : 'E-Mail senden'}
        </button>
      </form>

      <Toast
        result={toastResult}
        onDismiss={() => setDismissed(true)}
      />
    </div>
  )
}
