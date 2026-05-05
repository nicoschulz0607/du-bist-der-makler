'use client'

import { Sparkles } from 'lucide-react'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, { wrapper: string; icon: number }> = {
  sm: { wrapper: 'w-6 h-6', icon: 12 },
  md: { wrapper: 'w-8 h-8', icon: 16 },
  lg: { wrapper: 'w-10 h-10', icon: 20 },
}

export default function KlaraAvatar({ size = 'md' }: { size?: Size }) {
  const s = sizes[size]
  return (
    <div
      className={`${s.wrapper} rounded-full bg-accent flex items-center justify-center flex-shrink-0`}
    >
      <Sparkles size={s.icon} className="text-white" strokeWidth={2} />
    </div>
  )
}
