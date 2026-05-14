export const heliosTokens = {
  colors: {
    bg:           'hsl(0 0% 100%)',
    surface:      'hsl(0 0% 99%)',
    surfaceMuted: 'hsl(150 20% 97%)',
    border:       'hsl(150 10% 90%)',
    text:         'hsl(150 10% 15%)',
    textMuted:    'hsl(150 5% 45%)',
    textSubtle:   'hsl(150 5% 60%)',
    accent:       'hsl(150 60% 26%)',
    accentHover:  'hsl(150 60% 20%)',
    accentSoft:   'hsl(150 50% 95%)',
    success:      'hsl(140 60% 35%)',
    warning:      'hsl(38 90% 50%)',
    danger:       'hsl(0 70% 50%)',
    info:         'hsl(210 70% 50%)',
  },

  typography: {
    fontFamily:     'Inter, system-ui, sans-serif',
    fontFamilyMono: 'JetBrains Mono, monospace',
    sizes: {
      xs:   '0.75rem',
      sm:   '0.875rem',
      base: '1rem',
      lg:   '1.125rem',
      xl:   '1.5rem',
      '2xl':'2rem',
      '3xl':'3rem',
    },
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },

  spacing: {
    1: '0.25rem', 2: '0.5rem',  3: '0.75rem', 4: '1rem',
    6: '1.5rem',  8: '2rem',   12: '3rem',   16: '4rem',
  },

  radii: {
    sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 2px 8px rgba(0, 0, 0, 0.06)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
  },

  motion: {
    fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '320ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

export type HeliosTokens = typeof heliosTokens
