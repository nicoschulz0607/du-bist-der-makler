import type { ReactNode } from 'react'

const colsMap = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

interface SectionGridProps {
  children: ReactNode
  cols?: 2 | 3 | 4
  className?: string
}

export function SectionGrid({ children, cols = 4, className = '' }: SectionGridProps) {
  return (
    <div className={`grid ${colsMap[cols]} gap-4 ${className}`}>
      {children}
    </div>
  )
}
