'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Lock, ExternalLink, Zap } from 'lucide-react'
import { canAccess, type Tier } from '@/lib/tier'
import { type ChecklistPhase } from '@/lib/checklist'
import InlineButton from '@/components/klara/InlineButton'

// Items die systemseitig automatisch abgehakt werden
const AUTO_CHECK_IDS = new Set(['konto_erstellt', 'objekt_erfasst', 'preis_ermittelt', 'inserat_live'])

interface ChecklistClientProps {
  checklist: ChecklistPhase[]
  completedIds: string[]
  tier: Tier
  toggleItem: (aufgabeId: string, completed: boolean) => Promise<void>
}

export default function ChecklistClient({ checklist, completedIds, tier, toggleItem }: ChecklistClientProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedIds))
  const [open, setOpen] = useState<Set<string>>(new Set([checklist[0]?.id]))
  const [, startTransition] = useTransition()

  function togglePhase(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCheck(aufgabeId: string, checked: boolean) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (checked) next.add(aufgabeId)
      else next.delete(aufgabeId)
      return next
    })
    startTransition(async () => {
      await toggleItem(aufgabeId, checked)
    })
  }

  const totalCompleted = checklist.flatMap((p) => p.items).filter((i) => completed.has(i.id)).length
  const totalItems = checklist.flatMap((p) => p.items).length

  return (
    <div className="space-y-3">
      {checklist.map((phase) => {
        const phaseCompleted = phase.items.filter((i) => completed.has(i.id)).length
        const isOpen = open.has(phase.id)
        const allDone = phaseCompleted === phase.items.length

        return (
          <div key={phase.id} className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => togglePhase(phase.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors duration-100"
            >
              <div className="flex items-center gap-3">
                <span className={`text-[15px] font-semibold ${allDone ? 'text-accent' : 'text-text-primary'}`}>
                  {phase.title}
                </span>
                <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                  allDone
                    ? 'bg-[#E8F5EE] text-accent'
                    : 'bg-surface text-text-secondary'
                }`}>
                  {phaseCompleted}/{phase.items.length}
                </span>
              </div>
              {isOpen ? (
                <ChevronDown size={16} className="text-text-tertiary flex-shrink-0" />
              ) : (
                <ChevronRight size={16} className="text-text-tertiary flex-shrink-0" />
              )}
            </button>

            {isOpen && (
              <ul className="border-t border-[#EEEEEE] divide-y divide-[#EEEEEE]">
                {phase.items.map((item) => {
                  const isCompleted = completed.has(item.id)
                  const isLocked = item.requiredTier ? !canAccess(tier, item.requiredTier) : false
                  const isAuto = AUTO_CHECK_IDS.has(item.id) && isCompleted

                  return (
                    <li key={item.id} className="flex items-start gap-3 px-5 py-4">
                      {isAuto ? (
                        <div className="w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full bg-accent">
                          <Zap size={9} className="text-white" fill="white" />
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={isCompleted}
                          onChange={(e) => handleCheck(item.id, e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-[#DDDDDD] accent-[#1B6B45] flex-shrink-0 cursor-pointer"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={isAuto ? undefined : item.id}
                          className={`flex items-center gap-2 text-[14px] font-semibold ${
                            isAuto ? 'cursor-default' : 'cursor-pointer'
                          } ${isCompleted ? 'line-through text-text-tertiary' : 'text-text-primary'}`}
                        >
                          {item.title}
                          {isLocked && <Lock size={12} className="text-text-tertiary flex-shrink-0" />}
                          {isAuto && (
                            <span className="text-[10px] font-semibold text-accent bg-[#E8F5EE] px-1.5 py-0.5 rounded-full no-underline" style={{ textDecoration: 'none' }}>
                              automatisch
                            </span>
                          )}
                        </label>
                        <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {item.actionLabel && item.actionHref && !isCompleted && (
                            <Link
                              href={item.actionHref}
                              className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline"
                            >
                              {item.actionLabel}
                              <ExternalLink size={11} />
                            </Link>
                          )}
                          <InlineButton
                            compact
                            prefilledQuestion={`Wie erledige ich die Aufgabe: „${item.title}"? ${item.description}`}
                          />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
