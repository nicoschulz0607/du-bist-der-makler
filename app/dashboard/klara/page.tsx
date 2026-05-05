'use client'

import { useState } from 'react'
import ConversationList from '@/components/klara/ConversationList'
import ChatInterface from '@/components/klara/ChatInterface'

export default function KlaraPage() {
  const [activeConvId, setActiveConvId] = useState<string | undefined>()

  return (
    <div className="-mx-8 -my-7 h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar: Konversationsliste (25%) */}
      <div className="w-64 flex-shrink-0">
        <ConversationList
          activeConvId={activeConvId}
          onSelect={setActiveConvId}
          onNew={() => setActiveConvId(undefined)}
        />
      </div>

      {/* Haupt-Chat (75%) */}
      <div className="flex-1 flex flex-col overflow-hidden border-l border-[#EEEEEE]">
        {/* Header */}
        <div className="px-8 py-4 border-b border-[#EEEEEE] bg-white flex-shrink-0">
          <h1
            className="text-[22px] font-bold text-text-primary mb-0.5"
            style={{ letterSpacing: '-0.18px' }}
          >
            Klara
          </h1>
          <p className="text-[12px] text-text-tertiary">
            KI-Assistent · Kein Rechts-, Steuer- oder Anlageberatungs-Ersatz.
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatInterface
            key={activeConvId ?? 'new'}
            conversationId={activeConvId}
            contextOrigin="standalone"
            variant="fullscreen"
          />
        </div>
      </div>
    </div>
  )
}
