'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import InteressentCard from './InteressentCard'
import FilterTabs from './FilterTabs'
import InteressentCreateModal from './InteressentCreateModal'

type Interessent = Record<string, unknown>

interface Props {
  interessenten: Interessent[]
  ausgewaehltId: string | null
  filter: string
  tab: string
  tier: string
  listingId: string
  onCreate: (formData: FormData) => Promise<{ ok: boolean; id?: string; error?: string }>
}

function applyFilter(items: Interessent[], filter: string): Interessent[] {
  switch (filter) {
    case 'unbeantwortet':
      return items.filter(i => i.antwortet_am === null)
    case 'neu':
      return items.filter(i => i.status === 'neu')
    case 'aktiv':
      return items.filter(i =>
        ['vorqualifiziert', 'besichtigung_geplant', 'besichtigt', 'angebot_abgegeben', 'verhandlung'].includes(
          (i.status as string) ?? ''
        )
      )
    case 'abgeschlossen':
      return items.filter(i => ['zugesagt', 'abgesagt'].includes((i.status as string) ?? ''))
    default:
      return items
  }
}

export default function InteressentenListe({
  interessenten,
  ausgewaehltId,
  filter,
  tab,
  tier,
  onCreate,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = applyFilter(interessenten, filter)

  function updateUrl(params: { ausgewaehlt?: string | null; filter?: string; tab?: string }) {
    const current = new URLSearchParams(searchParams.toString())
    if (params.ausgewaehlt === null) {
      current.delete('ausgewaehlt')
      current.delete('tab')
    } else if (params.ausgewaehlt) {
      current.set('ausgewaehlt', params.ausgewaehlt)
    }
    if (params.filter !== undefined) {
      current.set('filter', params.filter)
      current.delete('ausgewaehlt')
      current.delete('tab')
    }
    if (params.tab) current.set('tab', params.tab)
    router.push(`/dashboard/interessenten?${current.toString()}`, { scroll: false })
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>
          Interessenten
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B6B45] text-white rounded-md text-[13px] font-medium hover:bg-[#145538] transition-colors"
        >
          <Plus size={15} /> Neu anlegen
        </button>
      </div>

      <FilterTabs
        current={filter}
        onChange={(f) => updateUrl({ filter: f })}
        counts={{
          alle: interessenten.length,
          unbeantwortet: interessenten.filter(i => i.antwortet_am === null).length,
          neu: interessenten.filter(i => i.status === 'neu').length,
          aktiv: interessenten.filter(i =>
            ['vorqualifiziert', 'besichtigung_geplant', 'besichtigt', 'angebot_abgegeben', 'verhandlung'].includes(
              (i.status as string) ?? ''
            )
          ).length,
          abgeschlossen: interessenten.filter(i =>
            ['zugesagt', 'abgesagt'].includes((i.status as string) ?? '')
          ).length,
        }}
      />

      <div className="space-y-3 mt-4">
        {filtered.length === 0 ? (
          <p className="text-text-secondary text-center py-12">
            {interessenten.length === 0
              ? 'Noch keine Interessenten — leg den ersten manuell an.'
              : 'Keine Anfragen in diesem Filter.'}
          </p>
        ) : (
          filtered.map(i => (
            <InteressentCard
              key={i.id as string}
              interessent={i}
              open={ausgewaehltId === (i.id as string)}
              activeTab={tab}
              tier={tier}
              onToggle={() =>
                updateUrl({
                  ausgewaehlt: ausgewaehltId === (i.id as string) ? null : (i.id as string),
                })
              }
              onTabChange={(newTab) => updateUrl({ tab: newTab })}
            />
          ))
        )}
      </div>

      {modalOpen && (
        <InteressentCreateModal onCreate={onCreate} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
