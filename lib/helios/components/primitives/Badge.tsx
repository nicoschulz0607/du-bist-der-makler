import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-helios-accent-soft text-helios-success',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-helios-danger',
  info:    'bg-blue-50 text-helios-info',
  neutral: 'bg-helios-surface-muted text-helios-text-muted',
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
