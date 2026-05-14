'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { chartTheme } from './ChartTheme'

// ── Formatters defined inside the Client Component ────────────────────────────

const AXIS_FORMAT = {
  eur:     (v: number) => v === 0 ? '0 €' : `${Math.round(v / 100).toLocaleString('de-DE')} €`,
  percent: (v: number) => `${v.toFixed(0)} %`,
  number:  (v: number) => v.toLocaleString('de-DE'),
}

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

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  height?: number
  formatY?: YFormat
  // When true, renders horizontal bars (better for long labels)
  horizontal?: boolean
}

export function BarChart({
  data,
  xKey,
  yKey,
  height = 200,
  formatY = 'number',
  horizontal = false,
}: BarChartProps) {
  const axisY  = AXIS_FORMAT[formatY]
  const tipY   = TOOLTIP_FORMAT[formatY]

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

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={chartTheme.axis.tick}
            tickLine={false}
            axisLine={false}
            tickFormatter={axisY}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            tick={chartTheme.axis.tick}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            formatter={(v) => [tipY(v as number), '']}
          />
          <Bar dataKey={yKey} radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={chartTheme.series[i % chartTheme.series.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
        />
        <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={chartTheme.series[i % chartTheme.series.length]} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
