'use client'

import { useState, useTransition } from 'react'
import { saveStation2Profile } from '@/lib/wizard/actions'

interface ProfileData {
  vorname: string | null
  nachname: string | null
  telefon: string | null
  anschrift: string | null
}

interface Props {
  initialData: ProfileData
  userEmail: string
}

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

export default function Station2Eckdaten({ initialData, userEmail }: Props) {
  const [form, setForm] = useState({
    vorname: initialData.vorname ?? '',
    nachname: initialData.nachname ?? '',
    telefon: initialData.telefon ?? '',
    anschrift: initialData.anschrift ?? '',
  })
  const [, startTransition] = useTransition()

  function handleBlur(field: keyof typeof form) {
    startTransition(async () => {
      await saveStation2Profile({ [field]: form[field] })
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelBase}>Vorname</label>
          <input
            type="text"
            value={form.vorname}
            onChange={(e) => setForm((p) => ({ ...p, vorname: e.target.value }))}
            onBlur={() => handleBlur('vorname')}
            placeholder="Max"
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Nachname</label>
          <input
            type="text"
            value={form.nachname}
            onChange={(e) => setForm((p) => ({ ...p, nachname: e.target.value }))}
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
          value={form.telefon}
          onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value }))}
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
          value={form.anschrift}
          onChange={(e) => setForm((p) => ({ ...p, anschrift: e.target.value }))}
          onBlur={() => handleBlur('anschrift')}
          placeholder="Musterstraße 12, 10115 Berlin"
          className={inputBase}
        />
      </div>
    </div>
  )
}
