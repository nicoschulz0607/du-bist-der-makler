import { heliosTokens } from '@/lib/helios/tokens'

// Recharts-kompatibles Theme — alle Werte von heliosTokens abgeleitet.
// Nutzung: <CartesianGrid stroke={chartTheme.grid.stroke} />
export const chartTheme = {
  colors: {
    primary:   heliosTokens.colors.accent,
    secondary: heliosTokens.colors.accentSoft,
    success:   heliosTokens.colors.success,
    warning:   heliosTokens.colors.warning,
    danger:    heliosTokens.colors.danger,
    info:      heliosTokens.colors.info,
    muted:     heliosTokens.colors.textSubtle,
  },

  // Sequentielle Farbpalette für Multi-Series (Balken, Linien, Torte)
  series: [
    heliosTokens.colors.accent,
    heliosTokens.colors.info,
    heliosTokens.colors.warning,
    heliosTokens.colors.success,
    heliosTokens.colors.danger,
    heliosTokens.colors.textMuted,
  ] as string[],

  grid: {
    stroke:          heliosTokens.colors.border,
    strokeDasharray: '3 3',
  },

  axis: {
    tick: { fill: heliosTokens.colors.textSubtle, fontSize: 12 },
    line: { stroke: heliosTokens.colors.border },
  },

  tooltip: {
    contentStyle: {
      background:   heliosTokens.colors.surface,
      border:       `1px solid ${heliosTokens.colors.border}`,
      borderRadius: heliosTokens.radii.md,
      boxShadow:    heliosTokens.shadows.md,
      fontSize:     '0.875rem',
      color:        heliosTokens.colors.text,
    },
  },
} as const

export type ChartTheme = typeof chartTheme
