'use client'

import { useEffect, useTransition } from 'react'
import { Phone } from 'lucide-react'
import { saveStation2Profile } from '@/lib/wizard/actions'

export interface ContactFormData {
  vorname: string
  nachname: string
  telefon: string
  anschrift: string
}

interface Props {
  formData: ContactFormData
  onFormChange: (data: ContactFormData) => void
  userEmail: string
  onCanAdvanceChange: (can: boolean) => void
}

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

export default function Station8Kontakt({ formData, onFormChange, userEmail, onCanAdvanceChange }: Props) {
  const [, startTransition] = useTransition()

  useEffect(() => {
    onCanAdvanceChange(!!(formData.vorname && (formData.telefon || userEmail)))
  }, [formData.vorname, formData.telefon, userEmail, onCanAdvanceChange])

  function handleChange(field: keyof ContactFormData, value: string) {
    onFormChange({ ...formData, [field]: value })
  }

  function handleBlur(field: keyof ContactFormData) {
    startTransition(async () => {
      await saveStation2Profile({ [field]: formData[field] })
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-accent/20 bg-accent-light/30 p-5">
        <h3 className="text-[14px] font-bold text-text-primary mb-1.5 flex items-center gap-2">
          <Phone size={14} className="text-accent" /> Diese Daten erscheinen in deinem Inserat
        </h3>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Interessenten kontaktieren dich über die Daten, die du hier hinterlegst. Wir reichen jede Anfrage per E-Mail an dich weiter und führen sie in deinem CRM.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelBase}>Vorname</label>
          <input
            type="text"
            value={formData.vorname}
            onChange={(e) => handleChange('vorname', e.target.value)}
            onBlur={() => handleBlur('vorname')}
            placeholder="Max"
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Nachname</label>
          <input
            type="text"
            value={formData.nachname}
            onChange={(e) => handleChange('nachname', e.target.value)}
            onBlur={() => handleBlur('nachname')}
            placeholder="Mustermann"
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label className={labelBase}>Telefon</label>
        <input
          type="tel"
          value={formData.telefon}
          onChange={(e) => handleChange('telefon', e.target.value)}
          onBlur={() => handleBlur('telefon')}
          placeholder="+49 170 1234567"
          className={inputBase}
        />
      </div>

      <div>
        <label className={labelBase}>E-Mail</label>
        <input
          type="email"
          value={userEmail}
          disabled
          className={`${inputBase} bg-[#F5F5F5] cursor-not-allowed text-text-tertiary`}
        />
        <p className="text-[12px] text-text-tertiary mt-1">Deine Login-E-Mail — nicht änderbar</p>
      </div>

      <div>
        <label className={labelBase}>Deine Adresse <span className="text-text-tertiary font-normal">(optional)</span></label>
        <input
          type="text"
          value={formData.anschrift}
          onChange={(e) => handleChange('anschrift', e.target.value)}
          onBlur={() => handleBlur('anschrift')}
          placeholder="Musterstraße 12, 10115 Berlin"
          className={inputBase}
        />
      </div>
    </div>
  )
}
