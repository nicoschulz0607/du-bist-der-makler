'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/components/klara/ChatMessage'

export function useKlaraChat(initialConvId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(!!initialConvId)
  const [streaming, setStreaming] = useState(false)
  const [convId, setConvId] = useState<string | undefined>(initialConvId)
  const [error, setError] = useState<string | null>(null)

  // Vorhandene Nachrichten laden wenn convId beim Mount bekannt ist
  useEffect(() => {
    if (!initialConvId) {
      setMessages([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const supabase = createClient()
    supabase
      .from('klara_messages')
      .select('id, role, content, saved')
      .eq('conversation_id', initialConvId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        setMessages(
          (data ?? []).map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            saved: m.saved ?? false,
          }))
        )
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [initialConvId])

  const send = useCallback(
    async (text: string, contextOrigin: string = 'standalone') => {
      if (streaming) return
      setError(null)

      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setStreaming(true)
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/klara/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: convId, message: text, contextOrigin }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (res.status === 429) {
            setError(body.message ?? 'Tageslimit erreicht. Morgen geht\'s weiter.')
          } else {
            setError('Klara hat gerade ein Problem. Bitte versuche es erneut.')
          }
          setMessages((prev) => prev.slice(0, -1))
          setStreaming(false)
          return
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let assistantText = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const raw = decoder.decode(value)
          for (const line of raw.split('\n')) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))
              if (event.chunk) {
                assistantText += event.chunk
                setMessages((prev) => {
                  const last = prev[prev.length - 1]
                  return [...prev.slice(0, -1), { ...last, content: assistantText }]
                })
              }
              if (event.conversationId && !convId) {
                setConvId(event.conversationId)
              }
              if (event.error) {
                setError('Klara hat gerade ein Problem. Bitte versuche es erneut.')
              }
            } catch {
              // ungültige SSE-Zeile ignorieren
            }
          }
        }
      } catch {
        setError('Verbindungsfehler. Bitte prüfe deine Internetverbindung.')
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setStreaming(false)
      }
    },
    [streaming, convId]
  )

  function reset() {
    setMessages([])
    setConvId(undefined)
    setError(null)
  }

  return { messages, loading, streaming, send, convId, error, reset }
}
