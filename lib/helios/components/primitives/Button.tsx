import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-helios-accent hover:bg-helios-accent-hover text-white',
  secondary: 'border border-helios-border bg-helios-surface hover:bg-helios-surface-muted text-helios-text',
  ghost:     'hover:bg-helios-surface-muted text-helios-text-muted hover:text-helios-text',
  danger:    'bg-helios-danger hover:opacity-90 text-white',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 h-8 text-xs',
  md: 'px-4 h-9 text-sm',
  lg: 'px-5 h-10 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-helios-accent disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
