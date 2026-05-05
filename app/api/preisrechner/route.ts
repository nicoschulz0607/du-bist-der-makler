import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { modus, eingaben, listingId } = await req.json()
  if (!modus || !eingaben) {
    return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `Du bist ein erfahrener deutscher Immobilienmakler mit 20 Jahren Markterfahrung.
Analysiere die folgende Immobilie und gib eine realistische Marktwert-Einschätzung.
Antworte ausschließlich als JSON-Objekt, kein Fließtext, keine Erklärungen außerhalb des JSON.

Format:
{
  "min": number,
  "max": number,
  "mittelwert": number,
  "positive_faktoren": ["...", "..."],
  "negative_faktoren": ["...", "..."],
  "hinweis": "string (1-2 Sätze über die Datenbasis)"
}

Wichtig:
- Keine übertriebenen Preise — lieber konservativ als optimistisch
- Positive und negative Faktoren je 2–5 Punkte, konkret und nachvollziehbar
- Baujahr, Lage (PLZ/Ort), Zustand und Größe sind die wichtigsten Preistreiber
- Vermietete Objekte 10–20% niedriger bewerten (Käuferrisiko)
- Alle Preise in Euro als Ganzzahl`,
      messages: [
        {
          role: 'user',
          content: `Immobilien-Daten (Analyse-Modus: ${modus}):\n\n${JSON.stringify(eingaben, null, 2)}`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
    const result = JSON.parse(clean)

    // Fire-and-forget: save to preisschaetzungen
    supabase
      .from('preisschaetzungen')
      .insert({
        user_id: user.id,
        listing_id: listingId ?? null,
        modus,
        eingaben,
        ergebnis: result,
      })
      .then(() => {})

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: `Fehler: ${String(e)}` }, { status: 500 })
  }
}
