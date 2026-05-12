'use client'

import { Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Props {
  stationNumber: number
}

export default function ContextHelpSidebar({ stationNumber }: Props) {
  if (stationNumber === 1) return <Station1Help />
  if (stationNumber === 3) return <Station3Help />
  if (stationNumber === 5) return <Station5Help />
  return null
}

function Station1Help() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1B6B45]/20 bg-[#E8F5EE]/30 p-5">
        <h4 className="text-[13px] font-bold text-text-primary mb-2 flex items-center gap-2">
          <Lightbulb size={14} className="text-[#1B6B45]" /> Warum diese Daten?
        </h4>
        <p className="text-[12px] text-text-secondary leading-relaxed">
          Mit Adresse und Eckdaten berechnen wir im nächsten Schritt automatisch Marktwert, Vergleichsverkäufe und die Lage-Analyse deiner Immobilie.
        </p>
      </div>

      <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Häufige Fragen
        </h4>
        <ul className="space-y-3 text-[12px]">
          <li>
            <p className="font-semibold text-text-primary mb-0.5">Was zählt zur Wohnfläche?</p>
            <p className="text-text-secondary leading-relaxed">Beheizbare Räume zu 100 %, Balkon/Terrasse zu 25–50 %, Keller meist 0 %.</p>
          </li>
          <li>
            <p className="font-semibold text-text-primary mb-0.5">Adresse genau angeben?</p>
            <p className="text-text-secondary leading-relaxed">Ja — wir nutzen sie nur zur Analyse. Ob die Hausnummer im Inserat erscheint, entscheidest du später.</p>
          </li>
          <li>
            <p className="font-semibold text-text-primary mb-0.5">Baujahr unbekannt?</p>
            <p className="text-text-secondary leading-relaxed">Optional. Steht meist im Energieausweis oder Grundbuch.</p>
          </li>
        </ul>
      </div>
    </div>
  )
}

function Station3Help() {
  const klassen = [
    { k: 'A+', color: '#019C66' }, { k: 'A', color: '#2BA770' },
    { k: 'B', color: '#7AB832' }, { k: 'C', color: '#C7C72A' },
    { k: 'D', color: '#E8B71F' }, { k: 'E', color: '#E89923' },
    { k: 'F', color: '#D9701F' }, { k: 'G', color: '#C13515' },
    { k: 'H', color: '#931F11' },
  ]
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
        <h4 className="text-[13px] font-bold text-amber-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={14} /> Pflicht beim Verkauf
        </h4>
        <p className="text-[12px] text-amber-900/90 leading-relaxed">
          Spätestens bei der Besichtigung musst du den Energieausweis vorzeigen können. Bei Verstößen drohen bis zu <strong>15.000 € Bußgeld</strong>.
        </p>
      </div>

      <div className="rounded-xl bg-[#F5F5F5] p-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
          Energieklassen
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {klassen.map(({ k, color }) => (
            <span key={k} className="text-[10px] font-bold px-2 py-1 rounded text-white" style={{ background: color }}>
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Station5Help() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Brauche ich einen Grundriss?
        </h4>
        <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
          Erfahrung zeigt: Inserate <strong className="text-text-primary">mit Grundriss bekommen mehr Anfragen</strong>, weil Interessenten besser einschätzen können was sie sehen. Pflicht ist er aber nicht.
        </p>
        <p className="text-[12px] text-text-secondary leading-relaxed">
          Wenn du keinen hast: eine saubere Handzeichnung mit Maßen reicht oft.
        </p>
      </div>

      <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">
          So erstellst du einen Grundriss
        </h4>
        <ul className="space-y-2 text-[12px] text-text-primary">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={12} className="text-[#1B6B45] shrink-0 mt-0.5" />
            <span><strong>Roomle</strong> (kostenlos) — Online-Tool, du legst Wände & Räume an</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={12} className="text-[#1B6B45] shrink-0 mt-0.5" />
            <span><strong>Bauplan</strong> aus Aktenordner oder Grundbuch nutzen</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={12} className="text-[#1B6B45] shrink-0 mt-0.5" />
            <span><strong>Handzeichnung</strong> sauber abfotografieren</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
