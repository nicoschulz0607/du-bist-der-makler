import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function generateTitleIfNeeded(
  convId: string,
  supabase: SupabaseClient,
  anthropic: Anthropic
): Promise<void> {
  const { data: conv } = await supabase
    .from('klara_conversations')
    .select('title')
    .eq('id', convId)
    .single()

  if (conv?.title) return

  const { data: msgs } = await supabase
    .from('klara_messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(4)

  if (!msgs || msgs.length < 2) return

  try {
    const result = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 30,
      messages: [
        {
          role: 'user',
          content: `Fasse den Inhalt dieser Konversation in maximal 5 Wörtern auf Deutsch zusammen. Nur den Titel, keine Anführungszeichen, kein Punkt am Ende.\n\n${msgs.map((m) => `${m.role}: ${m.content}`).join('\n\n')}`,
        },
      ],
    })

    const title = (result.content[0] as { text: string }).text.trim()
    await supabase
      .from('klara_conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', convId)
  } catch {
    // Titel-Generierung ist nicht kritisch — Fehler ignorieren
  }
}
