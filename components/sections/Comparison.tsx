import { Check, Minus } from 'lucide-react'

interface Row {
  feature: string
  us: string
  broker: string
  competitor: string
}

const rows: Row[] = [
  {
    feature: 'Kosten',
    us: 'ab 399 €',
    broker: '~17.850 €*',
    competitor: '129–399 €',
  },
  { feature: 'KI-Tools', us: '✓', broker: '—', competitor: '—' },
  { feature: 'Makler-Support', us: '✓', broker: '✓', competitor: '—' },
  { feature: 'ImmoScout-Listing', us: '✓ Premium', broker: '✓', competitor: '✓' },
  { feature: 'Interessenten-CRM', us: '✓', broker: '—', competitor: '—' },
  { feature: 'Einmalige Zahlung', us: '✓', broker: '—', competitor: '✓' },
]

function CellValue({ value, isUs }: { value: string; isUs?: boolean }) {
  if (value === '✓') {
    return (
      <span className="inline-flex items-center justify-center">
        <Check
          size={18}
          className={isUs ? 'text-accent' : 'text-text-secondary'}
          strokeWidth={2.5}
          aria-label="Ja"
        />
      </span>
    )
  }
  if (value === '—') {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus
          size={16}
          className="text-text-tertiary"
          strokeWidth={2}
          aria-label="Nein"
        />
      </span>
    )
  }
  return (
    <span
      className={[
        'text-[14px] font-semibold',
        isUs ? 'text-accent' : value.includes('17.850') ? 'text-error' : 'text-text-primary',
      ].join(' ')}
    >
      {value}
    </span>
  )
}

export default function Comparison() {
  return (
    <section
      className="section-padding bg-white"
      aria-labelledby="comparison-heading"
    >
      <div className="container-landing">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            id="comparison-heading"
            className="text-[36px] md:text-[42px] font-bold text-text-primary headline-section mb-4"
          >
            Der direkte Vergleich
          </h2>
          <p className="text-[17px] font-medium text-text-secondary max-w-[480px] mx-auto">
            Warum klassische Makler und Billigportale beide nicht die Antwort sind.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-card border border-[#DDDDDD] shadow-card">
          <table className="w-full min-w-[560px]" aria-label="Vergleich: du bist der makler vs. Makler vs. ohne-makler.net">
            <thead>
              <tr className="border-b border-[#EEEEEE]">
                <th
                  scope="col"
                  className="text-left text-[12px] font-semibold text-text-secondary uppercase tracking-wider py-4 px-6 bg-surface"
                >
                  Merkmal
                </th>
                <th
                  scope="col"
                  className="text-center text-[12px] font-bold text-accent uppercase tracking-wider py-4 px-6 bg-accent-light"
                >
                  Wir
                </th>
                <th
                  scope="col"
                  className="text-center text-[12px] font-semibold text-text-secondary uppercase tracking-wider py-4 px-6 bg-surface"
                >
                  Makler
                </th>
                <th
                  scope="col"
                  className="text-center text-[12px] font-semibold text-text-secondary uppercase tracking-wider py-4 px-6 bg-surface"
                >
                  ohne-makler.net
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}
                >
                  <td className="text-[14px] font-semibold text-text-primary py-4 px-6 border-t border-[#EEEEEE]">
                    {row.feature}
                  </td>
                  <td className="text-center py-4 px-6 border-t border-[#EEEEEE] bg-accent-light/40">
                    <CellValue value={row.us} isUs />
                  </td>
                  <td className="text-center py-4 px-6 border-t border-[#EEEEEE]">
                    <CellValue value={row.broker} />
                  </td>
                  <td className="text-center py-4 px-6 border-t border-[#EEEEEE]">
                    <CellValue value={row.competitor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footnote */}
        <p className="text-[12px] font-medium text-text-tertiary mt-4 text-center">
          * Beispielrechnung: 500.000 € Kaufpreis × 3,57 % übliche Maklercourtage = 17.850 € (inkl. MwSt.). Tatsächliche Provision je nach Bundesland und Vereinbarung. Stand: 2026.
        </p>
      </div>
    </section>
  )
}
