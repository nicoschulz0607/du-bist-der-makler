import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export type KPIFormat = 'eur' | 'number' | 'percent' | 'days'
export type KPIStatus = 'positive' | 'negative' | 'neutral' | 'warning'

interface KPICardProps {
  label: string
  value: number | string
  format?: KPIFormat
  trend?: { value: number; label: string }
  status?: KPIStatus
  suffix?: string
}

function formatValue(value: number | string, format: KPIFormat): string {
  if (typeof value === 'string') return value
  switch (format) {
    case 'eur':
      return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    case 'percent':
      return `${value.toFixed(1)} %`
    case 'days':
      return `${value} Tage`
    default:
      return value.toLocaleString('de-DE')
  }
}

const trendColors: Record<KPIStatus, string> = {
  positive: 'text-helios-success',
  negative: 'text-helios-danger',
  neutral:  'text-helios-text-muted',
  warning:  'text-helios-warning',
}

export function KPICard({ label, value, format = 'number', trend, status = 'neutral', suffix }: KPICardProps) {
  const trendColor = trendColors[status]

  return (
    <div className="bg-helios-surface border border-helios-border rounded-xl p-5 flex flex-col gap-2">
      <p className="text-xs font-medium text-helios-text-muted uppercase tracking-wide">{label}</p>

      <div className="flex items-end gap-1.5">
        <p className="text-2xl font-bold text-helios-text leading-none">
          {formatValue(value, format)}
        </p>
        {suffix && (
          <p className="text-xs text-helios-text-subtle mb-0.5">{suffix}</p>
        )}
      </div>

      {trend && (
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          {status === 'positive' ? <TrendingUp size={12} /> :
           status === 'negative' ? <TrendingDown size={12} /> :
           <Minus size={12} />}
          <span>{trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)} %</span>
          <span className="text-helios-text-subtle">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
