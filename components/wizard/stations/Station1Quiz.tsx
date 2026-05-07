'use client'

import { useState, useTransition } from 'react'
import { saveWizardProfile } from '@/lib/wizard/actions'
import type { WizardProfile } from '@/lib/wizard/types'

interface Props {
  initialProfile: WizardProfile
}

type ZeithorizontOption = 'so_schnell' | 'drei_sechs_monate' | 'kein_druck'
type TempoOption = 'gefuehrt' | 'selbstaendig'

function PillButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full border text-[14px] font-medium transition-colors ${
        selected
          ? 'bg-[#E8F5EE] border-accent text-accent'
          : 'bg-white border-[#DDDDDD] text-text-primary hover:border-[#AAAAAA]'
      }`}
    >
      {children}
    </button>
  )
}

export default function Station1Quiz({ initialProfile }: Props) {
  const [profile, setProfile] = useState<WizardProfile>(initialProfile)
  const [, startTransition] = useTransition()

  function handleChange<K extends keyof WizardProfile>(key: K, value: WizardProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }))
    startTransition(async () => {
      await saveWizardProfile({ [key]: value })
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[15px] font-semibold text-text-primary mb-3">
          Ist das deine erste Immobilie, die du verkaufst?
        </p>
        <div className="flex gap-3 flex-wrap">
          <PillButton
            selected={profile.erste_immobilie === true}
            onClick={() => handleChange('erste_immobilie', true)}
          >
            Ja
          </PillButton>
          <PillButton
            selected={profile.erste_immobilie === false}
            onClick={() => handleChange('erste_immobilie', false)}
          >
            Nein
          </PillButton>
        </div>
      </div>

      <div>
        <p className="text-[15px] font-semibold text-text-primary mb-3">
          Wann möchtest du verkaufen?
        </p>
        <div className="flex gap-3 flex-wrap">
          {(
            [
              { value: 'so_schnell' as ZeithorizontOption, label: 'So schnell wie möglich' },
              { value: 'drei_sechs_monate' as ZeithorizontOption, label: 'In 3–6 Monaten' },
              { value: 'kein_druck' as ZeithorizontOption, label: 'Kein fester Zeitplan' },
            ] as const
          ).map(({ value, label }) => (
            <PillButton
              key={value}
              selected={profile.zeithorizont === value}
              onClick={() => handleChange('zeithorizont', value)}
            >
              {label}
            </PillButton>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[15px] font-semibold text-text-primary mb-3">
          Wie möchtest du vorgehen?
        </p>
        <div className="flex gap-3 flex-wrap">
          {(
            [
              { value: 'gefuehrt' as TempoOption, label: 'Geführt — ich brauche Unterstützung' },
              { value: 'selbstaendig' as TempoOption, label: 'Selbständig — ich weiß, was ich tue' },
            ] as const
          ).map(({ value, label }) => (
            <PillButton
              key={value}
              selected={profile.tempo === value}
              onClick={() => handleChange('tempo', value)}
            >
              {label}
            </PillButton>
          ))}
        </div>
      </div>
    </div>
  )
}
