import { Sparkles } from 'lucide-react'

export const metadata = { title: 'KI-Käufer-Empfehlung — Dashboard' }

export default function EmpfehlungPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          KI-Käufer-Empfehlung
        </h1>
        <p className="text-[14px] text-text-secondary">Coming soon — wird nach dem ersten echten Verkauf gebaut.</p>
      </div>
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-10 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mb-4">
          <Sparkles size={24} className="text-accent" strokeWidth={1.75} />
        </div>
        <p className="text-[16px] font-bold text-text-primary mb-2">Demnächst verfügbar</p>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Die KI analysiert deine Interessenten-Daten und empfiehlt, wem du den Zuschlag geben solltest — basierend auf Finanzierung, Zeithorizont, Motivation und deinen persönlichen Eindrücken.
        </p>
        <p className="text-[12px] text-text-tertiary mt-4">
          Wird nach dem ersten abgeschlossenen Verkauf mit echten Daten validiert und veröffentlicht.
        </p>
      </div>
    </div>
  )
}
