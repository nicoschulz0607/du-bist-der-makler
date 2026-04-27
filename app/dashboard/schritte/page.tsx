import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CHECKLIST } from '@/lib/checklist'
import { type Tier } from '@/lib/tier'
import ChecklistClient from './ChecklistClient'

export const metadata = { title: 'Schritt-für-Schritt — Dashboard' }

async function toggleChecklistItem(aufgabeId: string, completed: boolean) {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('checkliste_status').upsert(
    {
      user_id: user.id,
      aufgabe_id: aufgabeId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,aufgabe_id' }
  )
}

export default async function SchrittePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, statusRes] = await Promise.all([
    supabase.from('profiles').select('paket_tier').eq('id', user.id).single(),
    supabase.from('checkliste_status').select('aufgabe_id, completed').eq('user_id', user.id),
  ])

  const tier = (profileRes.data?.paket_tier ?? null) as Tier
  const completedIds = new Set(
    (statusRes.data ?? []).filter((i) => i.completed).map((i) => i.aufgabe_id)
  )

  const totalItems = CHECKLIST.flatMap((p) => p.items).length
  const completedCount = completedIds.size

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Schritt-für-Schritt
        </h1>
        <p className="text-[14px] text-text-secondary">
          Dein geführter Weg von der Vorbereitung bis zum Notartermin.
        </p>
      </div>

      {/* Fortschrittsbalken */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[14px] font-semibold text-text-primary">Gesamtfortschritt</p>
          <p className="text-[14px] font-bold text-accent">
            {completedCount} / {totalItems}
          </p>
        </div>
        <div className="h-2 bg-surface-mid rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${totalItems > 0 ? (completedCount / totalItems) * 100 : 0}%` }}
          />
        </div>
        <p className="text-[12px] text-text-tertiary mt-2">
          {totalItems - completedCount} Aufgaben noch offen
        </p>
      </div>

      <ChecklistClient
        checklist={CHECKLIST}
        completedIds={Array.from(completedIds)}
        tier={tier}
        toggleItem={toggleChecklistItem}
      />
    </div>
  )
}
