interface FortschrittsBalkenProps {
  vorhandenCount: number
  gesamtPflicht: number
}

export default function FortschrittsBalken({ vorhandenCount, gesamtPflicht }: FortschrittsBalkenProps) {
  const prozent = gesamtPflicht > 0 ? Math.round((vorhandenCount / gesamtPflicht) * 100) : 0
  const fertig = vorhandenCount >= gesamtPflicht

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[14px] font-semibold text-text-primary">
            {fertig
              ? '✓ Alle Pflichtdokumente vorhanden'
              : `${vorhandenCount} von ${gesamtPflicht} Pflichtdokumenten vorhanden`}
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {fertig
              ? 'Deine Unterlagen sind bereit für Käufer und Notar.'
              : 'Sammle die fehlenden Dokumente, um Käufer- und Notar-Anfragen schnell beantworten zu können.'}
          </p>
        </div>
        <span className={`text-[20px] font-bold tabular-nums ${fertig ? 'text-accent' : 'text-text-primary'}`}>
          {prozent}%
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700"
          style={{ width: `${prozent}%` }}
        />
      </div>
    </div>
  )
}
