type Status = 'fehlt' | 'angefragt' | 'vorhanden' | 'nicht_relevant'

const CONFIG: Record<Status, { label: string; className: string }> = {
  vorhanden: { label: 'Vorhanden', className: 'bg-green-100 text-green-700' },
  angefragt: { label: 'Angefragt', className: 'bg-amber-100 text-amber-700' },
  fehlt: { label: 'Fehlt', className: 'bg-gray-100 text-gray-500' },
  nicht_relevant: { label: 'Nicht relevant', className: 'bg-gray-100 text-gray-400' },
}

export default function DokumentStatusBadge({ status }: { status: Status }) {
  const { label, className } = CONFIG[status] ?? CONFIG.fehlt
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  )
}
