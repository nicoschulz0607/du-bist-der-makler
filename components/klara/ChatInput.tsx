'use client'

import { useRef, useState, useCallback, KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'

type Props = {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
  prefilledMessage?: string
}

export default function ChatInput({ onSend, disabled, placeholder = 'Stell eine Frage...', prefilledMessage }: Props) {
  const [value, setValue] = useState(prefilledMessage ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div className="flex items-end gap-3 p-4 border-t border-[#EEEEEE] bg-white">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); handleInput() }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-[8px] border border-[#DDDDDD] px-4 py-3 text-[14px] text-text-primary bg-white outline-none placeholder:text-text-tertiary focus:border-[#222222] focus:ring-2 focus:ring-[rgba(27,107,69,0.12)] transition-colors overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minHeight: '44px', maxHeight: '160px' }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0 transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ArrowUp size={16} className="text-white" strokeWidth={2.5} />
      </button>
    </div>
  )
}
