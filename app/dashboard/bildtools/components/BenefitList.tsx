import { CheckCircle2 } from 'lucide-react'

interface BenefitListProps {
  benefits: { text: string }[]
}

export default function BenefitList({ benefits }: BenefitListProps) {
  return (
    <ul className="space-y-2">
      {benefits.map((b, i) => (
        <li key={i} className="flex items-start gap-2">
          <CheckCircle2 size={15} className="text-accent flex-shrink-0 mt-0.5" strokeWidth={2} />
          <span className="text-[13px] text-text-secondary leading-relaxed">{b.text}</span>
        </li>
      ))}
    </ul>
  )
}
