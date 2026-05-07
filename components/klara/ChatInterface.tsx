'use client'

import { useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { useKlaraChat } from '@/hooks/useKlaraChat'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import KlaraAvatar from './KlaraAvatar'

const SUGGESTIONS = [
  'Welche Unterlagen brauche ich für den Verkauf?',
  'Was kostet ein Notar beim Immobilienverkauf?',
  'Muss ich einen Energieausweis haben?',
  'Wie lange dauert ein Immobilienverkauf?',
]

const CONTEXT_SUGGESTIONS: Record<string, string> = {
  interessenten: 'Wie schreibe ich Interessenten am besten an?',
  exposé: 'Kannst du den Exposé-Text sprachlich verbessern?',
  checkliste: 'Was sollte ich als nächstes erledigen?',
  preisrechner: 'Wie verhandle ich beim Immobilienverkauf erfolgreich?',
}

const WIZARD_STATION_SUGGESTIONS: Record<number, string[]> = {
  1: ['Was erwartet mich im geführten Wizard?', 'Was ist der wichtigste erste Schritt?', 'Wie lange dauert ein typischer Immobilienverkauf?'],
  2: ['Warum brauche ich Kontaktdaten im Inserat?', 'Welche Infos werden öffentlich sichtbar?', 'Was sind die Pflichtangaben bei Privatverkäufen?'],
  3: ['Was gilt als Wohnfläche — Keller, Balkon, Dachboden?', 'Was passiert wenn ich die Straße nicht angeben will?', 'Wie genau muss die Wohnfläche stimmen?'],
  4: ['Was beeinflusst den Lage-Score meiner Immobilie?', 'Wie stark wirkt sich die Lage auf den Preis aus?', 'Was tun bei einer mittelguten Lage?'],
  5: ['Was passiert wenn ich zu teuer anbiete?', 'Wie viel Verhandlungspuffer sollte ich einkalkulieren?', 'Wie verhandle ich den Preis mit Interessenten?'],
  6: ['Welche Strafe droht ohne Energieausweis?', 'Was ist der Unterschied zwischen Verbrauchs- und Bedarfsausweis?', 'Wie schnell und günstig komme ich zu einem Energieausweis?'],
  7: ['Was macht ein gutes Immobilienfoto aus?', 'Welche Räume muss ich unbedingt fotografieren?', 'Reicht das Smartphone für Fotos?'],
  8: ['Wozu brauche ich einen Grundriss im Inserat?', 'Wie erstelle ich schnell einen Grundriss ohne Profi?', 'Welches Format soll der Grundriss haben?'],
  9: ['Was darf ich laut AGG nicht schreiben?', 'Welche Merkmale erhöhen den Preis am meisten?', 'Wie lang sollte die Beschreibung sein?'],
  10: ['Was macht einen guten Inseratstitel aus?', 'Kann ich den KI-Text noch nachträglich ändern?', 'Wie viele Highlights sollte ich nennen?'],
  11: ['Welche Pflichtangaben braucht ein Immobilieninserat?', 'Muss ich Provisionsfreiheit explizit angeben?', 'Was passiert rechtlich wenn etwas im Inserat falsch ist?'],
  12: ['Was sind die nächsten Schritte nach der Veröffentlichung?', 'Wie schnell kommen die ersten Anfragen?', 'Wie reagiere ich am besten auf Interessenten?'],
}

function getWizardStation(contextOrigin: string): number | null {
  const m = contextOrigin.match(/wizard:station_(\d+)_/)
  return m ? parseInt(m[1]) : null
}

type Props = {
  conversationId?: string
  contextOrigin: string
  variant: 'fullscreen' | 'sidebar' | 'embedded'
  prefilledQuestion?: string
}

export default function ChatInterface({ conversationId, contextOrigin, variant, prefilledQuestion }: Props) {
  const { messages, loading, streaming, send, error } = useKlaraChat(conversationId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasSentPrefill = useRef(false)
  const isCompact = variant === 'sidebar'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-send prefilledQuestion once on mount (wizard proactive briefing)
  useEffect(() => {
    if (prefilledQuestion && !hasSentPrefill.current && messages.length === 0 && !loading) {
      hasSentPrefill.current = true
      send(prefilledQuestion, contextOrigin)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledQuestion, loading])

  const wizardStation = getWizardStation(contextOrigin)
  const wizardSuggestions = wizardStation ? WIZARD_STATION_SUGGESTIONS[wizardStation] : null
  const extraSuggestion = wizardSuggestions ? null : CONTEXT_SUGGESTIONS[contextOrigin]
  const allSuggestions = wizardSuggestions
    ? wizardSuggestions
    : extraSuggestion
    ? [extraSuggestion, ...SUGGESTIONS.slice(0, 3)]
    : SUGGESTIONS

  const isEmpty = messages.length === 0 && !loading

  return (
    <div className={`flex flex-col bg-white ${variant === 'fullscreen' ? 'h-full' : 'h-full'} overflow-hidden`}>
      {/* Disclaimer-Header */}
      <div className={`flex items-center gap-3 px-5 ${isCompact ? 'py-3' : 'py-4'} border-b border-[#EEEEEE] flex-shrink-0`}>
        <KlaraAvatar size={isCompact ? 'sm' : 'md'} />
        <div className="min-w-0">
          <p className={`${isCompact ? 'text-[13px]' : 'text-[14px]'} font-semibold text-text-primary`}>Klara</p>
          <p className="text-[11px] text-text-tertiary truncate">
            KI-Assistent · Kein Rechts- oder Steuerberatungs-Ersatz
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[11px] font-medium text-text-secondary">Online</span>
        </div>
      </div>

      {/* Chat-Bereich */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}

        {isEmpty && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center pt-8 pb-4">
            <KlaraAvatar size="lg" />
            <h3 className="mt-4 text-[16px] font-semibold text-text-primary">
              Hallo! Ich bin Klara.
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary max-w-[280px]">
              Dein KI-Assistent für alle Fragen rund um den Immobilienverkauf.
            </p>
            <div className={`mt-6 w-full flex flex-wrap gap-2 justify-center`}>
              {allSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s, contextOrigin)}
                  className="text-[12px] font-medium text-text-primary bg-surface border border-[#DDDDDD] rounded-full px-3 py-1.5 hover:border-accent hover:text-accent transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLastAssistant = i === messages.length - 1 && msg.role === 'assistant'
          return (
            <ChatMessage
              key={i}
              message={msg}
              isStreaming={isLastAssistant && streaming}
            />
          )
        })}

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 bg-[#FDECEA] border border-[#C13515]/20 rounded-xl">
            <AlertCircle size={14} className="text-[#C13515] mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-[#C13515]">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={(text) => send(text, contextOrigin)}
        disabled={streaming}
        prefilledMessage={prefilledQuestion}
      />
    </div>
  )
}
