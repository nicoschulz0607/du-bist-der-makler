interface Step {
  title: string
  description: string
}

interface HowItWorksProps {
  steps: Step[]
}

export default function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 sm:flex-col sm:gap-2">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-[12px] font-bold text-accent">{i + 1}</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary">{step.title}</p>
            <p className="text-[12px] text-text-secondary mt-0.5">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
