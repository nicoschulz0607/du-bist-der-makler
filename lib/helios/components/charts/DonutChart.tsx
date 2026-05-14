'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { chartTheme } from './ChartTheme'

// ── Formatters defined inside the Client Component ────────────────────────────

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

type ValueFormat = 'eur' | 'percent' | 'number'

export interface DonutSlice {
  name: string
  value: number
}

interface DonutChartProps {
  data: DonutSlice[]
  height?: number
  formatValue?: ValueFormat
  innerRadius?: number
  outerRadius?: number
}

export function DonutChart({
  data,
  height = 200,
  formatValue = 'number',
  innerRadius = 55,
  outerRadius = 80,
}: DonutChartProps) {
  const tipFmt = TOOLTIP_FORMAT[formatValue]

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <p className="text-xs text-helios-text-subtle">Keine Daten im Zeitraum</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={chartTheme.series[i % chartTheme.series.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          formatter={(v) => [tipFmt(v as number), '']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: chartTheme.axis.tick.fill }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
