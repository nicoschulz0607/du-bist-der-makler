'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, MessageSquare, Pin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Conversation = {
  id: string
  title: string | null
  context_origin: string | null
  pinned: boolean
  updated_at: string
}

type Props = {
  activeConvId?: string
  onSelect: (id: string) => void
  onNew: () => void
}

function groupByDate(convs: Conversation[]) {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)

  const groups: Record<string, Conversation[]> = {
    Pinned: [],
    Heute: [],
    Gestern: [],
    'Diese Woche': [],
    Älter: [],
  }

  for (const c of convs) {
    if (c.pinned) { groups['Pinned'].push(c); continue }
    const d = new Date(c.updated_at)
    if (d.toDateString() === today) groups['Heute'].push(c)
    else if (d.toDateString() === yesterday) groups['Gestern'].push(c)
    else if (d >= weekAgo) groups['Diese Woche'].push(c)
    else groups['Älter'].push(c)
  }

  return groups
}

export default function ConversationList({ activeConvId, onSelect, onNew }: Props) {
  const [convs, setConvs] = useState<Conversation[]>([])
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('klara_conversations')
      .select('id, title, context_origin, pinned, updated_at')
      .eq('archived', false)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(50)
    if (data) setConvs(data)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const groups = groupByDate(convs)

  return (
    <div className="flex flex-col h-full bg-[#F7F7F7] border-r border-[#EEEEEE]">
      <div className="p-4 border-b border-[#EEEEEE]">
        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-full text-[13px] font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          Neue Konversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(groups).map(([label, items]) => {
          if (items.length === 0) return null
          return (
            <div key={label}>
              {label !== 'Heute' && (
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 mb-1">
                  {label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                      activeConvId === c.id
                        ? 'bg-accent-light text-accent font-semibold'
                        : 'text-text-primary hover:bg-[#EEEEEE]'
                    }`}
                  >
                    {c.pinned ? (
                      <Pin size={12} className="flex-shrink-0 text-accent" />
                    ) : (
                      <MessageSquare size={12} className="flex-shrink-0 text-text-tertiary" />
                    )}
                    <span className="text-[13px] truncate">
                      {c.title ?? 'Neue Konversation'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {convs.length === 0 && (
          <p className="text-[12px] text-text-tertiary text-center pt-8">
            Noch keine Konversationen
          </p>
        )}
      </div>
    </div>
  )
}
