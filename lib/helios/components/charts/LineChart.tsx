'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { chartTheme } from './ChartTheme'

// ── Formatters defined inside the Client Component ────────────────────────────

const MONTHS = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

const X_FORMAT = {
  'date-short': (iso: string) => {
    const parts = String(iso).split('-')
    const d = parseInt(parts[2] ?? '1', 10)
    const m = parseInt(parts[1] ?? '1', 10)
    return `${d}. ${MONTHS[m] ?? ''}`
  },
}

const AXIS_FORMAT = {
  number:  (v: number) => v.toLocaleString('de-DE'),
  percent: (v: number) => `${v.toFixed(0)} %`,
  eur:     (v: number) => v === 0 ? '0 €' : `${Math.round(v / 100).toLocaleString('de-DE')} €`,
}

const TOOLTIP_FORMAT = {
  number:  (v: number) => v.toLocaleString('de-DE'),
  percent: (v: number) => `${v.toFixed(1)} %`,
  eur: (v: number) => {
    if (v === 0) return '0,00 €'
    if (v > 0 && v < 1) return '<0,01 €'
    return (v / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  },
}

// ─────────────────────────────────────────────────────────────────────────────

type YFormat = 'eur' | 'percent' | 'number'
type XFormat = 'date-short'

interface LineChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  height?: number
  formatY?: YFormat
  formatX?: XFormat
  color?: string
}

export function LineChart({
  data,
  xKey,
  yKey,
  height = 200,
  formatY = 'number',
  formatX,
  color,
}: LineChartProps) {
  const axisY      = AXIS_FORMAT[formatY]
  const tipY       = TOOLTIP_FORMAT[formatY]
  const fmtX       = formatX ? X_FORMAT[formatX] : undefined
  const lineColor  = color ?? chartTheme.colors.primary

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <p className="text-xs text-helios-text-subtle">Keine Daten im Zeitraum</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
          width={44}
          tickFormatter={axisY}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          formatter={(v) => [tipY(v as number), '']}
          labelFormatter={fmtX ? (l) => fmtX(String(l)) : undefined}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: lineColor }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
