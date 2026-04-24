'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'Darf ich meine Immobilie ohne Makler verkaufen?',
    answer:
      'Ja, absolut. Privatpersonen dürfen ihre eigene Immobilie in Deutschland jederzeit ohne Makler verkaufen. Du übernimmst dabei selbst die Verantwortung für Inserat, Kommunikation und Verhandlung — wir liefern dir dafür alle notwendigen Werkzeuge.',
  },
  {
    question: 'Was passiert, wenn ich nach 6 Monaten noch nicht verkauft habe?',
    answer:
      'Kein Problem. Du kannst dein Paket verlängern. Die genauen Konditionen für eine Verlängerung klären wir direkt mit dir — unser Ziel ist es, dass du erfolgreich verkaufst, nicht dass die Uhr abläuft.',
  },
  {
    question: 'Brauche ich technisches Wissen, um die Plattform zu nutzen?',
    answer:
      'Nein. Die Plattform ist für Privatpersonen ohne Vorkenntnisse gebaut. Schritt-für-Schritt-Anleitungen, ein 24/7-KI-Chatbot und bei Bedarf direkter Makler-Support begleiten dich durch den gesamten Prozess.',
  },
  {
    question: 'Was ist, wenn ich doch Hilfe von einem echten Makler brauche?',
    answer:
      'Du kannst jederzeit eine Makler-Stunde für 50 €/h hinzubuchen — direkt über die Plattform via Calendly und Stripe. Im Premium-Paket ist die erste Stunde bereits inklusive. Kein Knebelvertrag, keine Provision.',
  },
  {
    question: 'Welches Paket ist das richtige für mich?',
    answer:
      'Für den Einstieg empfehlen wir das Pro-Paket: Es enthält den KI-Exposé Generator und den Preisrechner, die erfahrungsgemäß den größten Unterschied bei Verkaufserfolg und -dauer machen. Das Starter-Paket eignet sich, wenn du bereits ein fertiges Exposé hast. Premium lohnt sich, wenn du maximale Reichweite und aktiven Makler-Support willst.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section
      id="faq"
      className="section-padding bg-surface"
      aria-labelledby="faq-heading"
    >
      <div className="container-landing">
        <div className="max-w-[760px] mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <h2
              id="faq-heading"
              className="text-[36px] md:text-[42px] font-bold text-text-primary headline-section mb-4"
            >
              Häufige Fragen
            </h2>
            <p className="text-[17px] font-medium text-text-secondary">
              Du hast Fragen? Wir haben Antworten.
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index
              return (
                <div
                  key={item.question}
                  className={[
                    'bg-white rounded-[14px] border overflow-hidden transition-all duration-200',
                    isOpen
                      ? 'border-accent shadow-[0_0_0_3px_#E8F5EE]'
                      : 'border-[#DDDDDD] shadow-card hover:border-accent/40',
                  ].join(' ')}
                >
                  <button
                    onClick={() => toggle(index)}
                    className="flex items-center justify-between w-full px-6 py-5 text-left gap-6 group min-h-[68px]"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] font-semibold text-text-primary group-hover:text-accent transition-colors duration-150">
                      {item.question}
                    </span>
                    <span
                      className={[
                        'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                        isOpen
                          ? 'bg-accent text-white'
                          : 'bg-surface text-text-secondary group-hover:bg-accent-light group-hover:text-accent',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {isOpen ? (
                        <Minus size={14} strokeWidth={2.5} />
                      ) : (
                        <Plus size={14} strokeWidth={2.5} />
                      )}
                    </span>
                  </button>

                  <div
                    className={[
                      'overflow-hidden transition-all duration-200',
                      isOpen ? 'max-h-[400px]' : 'max-h-0',
                    ].join(' ')}
                    aria-hidden={!isOpen}
                  >
                    <p className="px-6 pb-5 text-[14px] font-medium text-text-secondary leading-relaxed border-t border-[#F0F0F0] pt-4">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
