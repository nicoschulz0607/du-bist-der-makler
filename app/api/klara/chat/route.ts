import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/klara/build-system-prompt'
import { checkRateLimit, recordUsage } from '@/lib/klara/rate-limit'
import { generateTitleIfNeeded } from '@/lib/klara/title-generator'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Nicht eingeloggt' }), { status: 401 })
    }

    // Rate-Limit prüfen
    const rateCheck = await checkRateLimit(user.id, supabase)
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'rate_limit', remaining: 0, message: rateCheck.message }),
        { status: 429 }
      )
    }

    const { conversationId, message, contextOrigin = 'standalone' } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Leere Nachricht' }), { status: 400 })
    }

    // Konversation laden oder erstellen
    let convId: string = conversationId
    if (!convId) {
      const { data: newConv, error } = await supabase
        .from('klara_conversations')
        .insert({ user_id: user.id, context_origin: contextOrigin })
        .select('id')
        .single()
      if (error || !newConv) {
        return new Response(JSON.stringify({ error: 'Konversation konnte nicht erstellt werden' }), { status: 500 })
      }
      convId = newConv.id
    }

    // User-Message speichern
    await supabase.from('klara_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message.trim(),
    })

    // Bisherige Messages für Context (max. 20)
    const { data: history } = await supabase
      .from('klara_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20)

    // System-Prompt bauen
    const systemPrompt = await buildSystemPrompt(user.id, contextOrigin, supabase)

    // Claude API Streaming
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: (history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = event.delta.text
              fullResponse += chunk
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
              )
            }
          }

          // Done-Event mit conversationId
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`)
          )
          controller.close()

          // Async speichern (nach Stream-Close)
          const finalMsg = await stream.finalMessage()
          const tokensIn = finalMsg.usage.input_tokens
          const tokensOut = finalMsg.usage.output_tokens

          await supabase.from('klara_messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
          })

          await supabase
            .from('klara_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId)

          // Usage tracken und Titel generieren (non-blocking)
          Promise.all([
            recordUsage(user.id, { input_tokens: tokensIn, output_tokens: tokensOut }, supabase),
            generateTitleIfNeeded(convId, supabase, anthropic),
          ]).catch(() => {})
        } catch (err) {
          console.error('[klara/chat] Stream-Fehler:', err instanceof Error ? err.message : err)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'stream_failed' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('[klara/chat] Fehler:', err instanceof Error ? err.message : err)
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), { status: 500 })
  }
}
