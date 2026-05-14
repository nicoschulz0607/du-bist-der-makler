'use client'

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { chartTheme } from './ChartTheme'

// ── Formatters defined inside the Client Component ────────────────────────────
// Cannot be passed as props from Server Components — must live here.

const MONTHS = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

const X_FORMAT = {
  'date-short': (iso: string) => {
    const parts = String(iso).split('-')
    const d = parseInt(parts[2] ?? '1', 10)
    const m = parseInt(parts[1] ?? '1', 10)
    return `${d}. ${MONTHS[m] ?? ''}`
  },
}

// Axis ticks: compact (whole euros, no decimals)
const AXIS_FORMAT = {
  eur:     (v: number) => v === 0 ? '0 €' : `${Math.round(v / 100).toLocaleString('de-DE')} €`,
  percent: (v: number) => `${v.toFixed(0)} %`,
  number:  (v: number) => v.toLocaleString('de-DE'),
}

// Tooltip: full precision including the <0,01 € special case
const TOOLTIP_FORMAT = {
  eur: (v: number) => {
    if (v === 0) return '0,00 €'
    if (v > 0 && v < 1) return '<0,01 €'
    return (v / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  },
  percent: (v: number) => `${v.toFixed(1)} %`,
  number:  (v: number) => v.toLocaleString('de-DE'),
}

// ─────────────────────────────────────────────────────────────────────────────

type YFormat = 'eur' | 'percent' | 'number'
type XFormat = 'date-short'

interface AreaChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  height?: number
  formatY?: YFormat
  formatX?: XFormat
}

export function AreaChart({
  data,
  xKey,
  yKey,
  height = 200,
  formatY = 'number',
  formatX,
}: AreaChartProps) {
  const axisY   = AXIS_FORMAT[formatY]
  const tipY    = TOOLTIP_FORMAT[formatY]
  const fmtX    = formatX ? X_FORMAT[formatX] : undefined

  const allZero = data.length === 0 || data.every((d) => (d[yKey] as number) === 0)
  if (allZero) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <p className="text-xs text-helios-text-subtle">
          {data.length === 0 ? 'Keine Daten im Zeitraum' : 'Noch keine KI-Kosten im Zeitraum'}
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={chartTheme.colors.primary} stopOpacity={0.15} />
            <stop offset="95%" stopColor={chartTheme.colors.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray={chartTheme.grid.strokeDasharray}
          stroke={chartTheme.grid.stroke}
          vertical={false}
        />
        <XAxis
          dataKey={xKey}
          tick={chartTheme.axis.tick}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtX}
        />
        <YAxis
          tick={chartTheme.axis.tick}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={axisY}
        />
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          formatter={(v) => [tipY(v as number), '']}
          labelFormatter={fmtX ? (l) => fmtX(String(l)) : undefined}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={chartTheme.colors.primary}
          strokeWidth={2}
          fill="url(#areaGradient)"
          dot={false}
          activeDot={{ r: 4, fill: chartTheme.colors.primary }}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
