import type { ReactNode } from 'react'

const paddingMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' }

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={`bg-helios-surface border border-helios-border rounded-xl shadow-sm ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  )
}
