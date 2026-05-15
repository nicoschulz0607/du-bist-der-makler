'use client'

import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'

export type StatSeverity = 'info' | 'hinweis' | 'wichtig'

interface SubInfo {
  text: string
  severity?: StatSeverity
}

interface StatCardProps {
  label: string
  value: string | number
  subInfo?: SubInfo
  href?: string
  onClick?: () => void
  showArrow?: boolean
}

const SEVERITY_STYLES: Record<StatSeverity, { color: string; showIcon: boolean }> = {
  info:    { color: 'text-text-secondary', showIcon: false },
  hinweis: { color: 'text-[#C07000]',      showIcon: false },
  wichtig: { color: 'text-[#D04A2C]',      showIcon: true  },
}

export default function StatCard({ label, value, subInfo, href, onClick, showArrow }: StatCardProps) {
  const severity = subInfo?.severity ?? 'info'
  const subStyle = SEVERITY_STYLES[severity]

  const inner = (
    <>
      <p className="text-[11px] uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className="text-[28px] font-semibold text-text-primary leading-none mt-2">
        {value}
      </p>
      {subInfo && (
        <div className={`flex items-center gap-1 text-[12px] mt-2 ${subStyle.color}`}>
          {subStyle.showIcon && <AlertCircle size={12} strokeWidth={2.5} />}
          <span>{subInfo.text}</span>
          {showArrow && <ArrowRight size={12} strokeWidth={2.5} className="ml-auto text-accent" />}
        </div>
      )}
    </>
  )

  const baseClasses = 'bg-white border border-gray-200 rounded-xl p-4 flex flex-col'
  const interactiveClasses = 'hover:border-gray-300 transition-colors cursor-pointer'

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${interactiveClasses}`}>
        {inner}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses} text-left w-full`}
      >
        {inner}
      </button>
    )
  }

  return <div className={baseClasses}>{inner}</div>
}
