'use client'

import { useState } from 'react'
import { Copy, Star, Check } from 'lucide-react'
import KlaraAvatar from './KlaraAvatar'

export type Message = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  saved?: boolean
}

type Props = {
  message: Message
  isStreaming?: boolean
  onSave?: (id: string) => void
}

export default function ChatMessage({ message, isStreaming, onSave }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-surface border border-[#EEEEEE] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          <p className="text-[14px] text-text-primary whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  // Assistant-Message
  return (
    <div className="flex items-start gap-3 group">
      <KlaraAvatar size="md" />
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-[#EEEEEE] rounded-2xl rounded-tl-sm px-4 py-3 relative">
          {isStreaming && message.content === '' ? (
            <TypingIndicator />
          ) : (
            <div className="text-[14px] text-text-primary leading-relaxed prose-klara whitespace-pre-wrap">
              {message.content}
            </div>
          )}
          {isStreaming && message.content !== '' && (
            <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
          )}

          {/* Action-Icons — erscheinen beim Hover */}
          {!isStreaming && message.content && (
            <div className="absolute -top-3 right-3 hidden group-hover:flex items-center gap-1 bg-white border border-[#EEEEEE] rounded-full px-2 py-1 shadow-sm">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-full hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
                title="Kopieren"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
              {message.id && onSave && (
                <button
                  type="button"
                  onClick={() => onSave(message.id!)}
                  className={`p-1 rounded-full hover:bg-surface transition-colors ${
                    message.saved ? 'text-accent' : 'text-text-tertiary hover:text-text-primary'
                  }`}
                  title={message.saved ? 'Gespeichert' : 'Merken'}
                >
                  <Star size={12} fill={message.saved ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 h-5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
