import { MessageSquare, Sparkles } from 'lucide-react'

export const metadata = { title: 'KI-Chatbot — Dashboard' }

const suggestions = [
  'Welche Unterlagen brauche ich für den Verkauf?',
  'Was kostet ein Notar beim Immobilienverkauf?',
  'Muss ich einen Energieausweis haben?',
  'Wie lange dauert ein Immobilienverkauf?',
]

export default function ChatbotPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          KI-Chatbot 24/7
        </h1>
        <p className="text-[14px] text-text-secondary">
          Dein Verkaufs-Assistent für alle Fragen rund um den Immobilienverkauf.
        </p>
      </div>

      <div className="bg-[#FFF4E0] border border-[#C07000] rounded-xl px-5 py-3">
        <p className="text-[13px] font-medium text-[#C07000]">
          Der KI-Chatbot wird gerade gebaut und ist in Kürze verfügbar.
        </p>
      </div>

      {/* Chat-Mockup */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EEEEEE]">
          <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
            <Sparkles size={16} className="text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-text-primary">Verkaufs-Assistent</p>
            <p className="text-[11px] text-text-tertiary">Kein Rechtsrat — nur allgemeine Informationen</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DDDDDD]" />
            <span className="text-[12px] font-medium text-text-tertiary">Bald verfügbar</span>
          </div>
        </div>

        {/* Chat-Bereich */}
        <div className="p-5 space-y-4 min-h-[300px] flex flex-col justify-end">
          <div className="flex justify-start">
            <div className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-[14px] text-text-primary">
                Hallo! Ich bin dein KI-Verkaufsassistent. Ich helfe dir bei allen Fragen rund um den Immobilienverkauf. Was möchtest du wissen?
              </p>
            </div>
          </div>
        </div>

        {/* Vorschläge */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Häufige Fragen</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled
                className="text-[12px] font-medium text-text-secondary bg-surface border border-[#DDDDDD] rounded-full px-3 py-1.5 cursor-not-allowed opacity-60"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-[#EEEEEE] p-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Stell eine Frage..."
            disabled
            className="flex-1 rounded-[8px] border border-[#DDDDDD] px-4 h-11 text-[14px] text-text-primary bg-white outline-none placeholder:text-text-tertiary cursor-not-allowed opacity-60"
          />
          <button
            type="button"
            disabled
            className="w-11 h-11 rounded-full bg-accent flex items-center justify-center opacity-40 cursor-not-allowed"
          >
            <MessageSquare size={16} className="text-white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
