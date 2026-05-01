import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64, mediaType } = await req.json()
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ raumtyp: null, beschreibung: null, konfidenz: 0 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `Du bist ein Assistent für Immobilien-Exposés in Deutschland.
Analysiere das Foto einer Immobilie und antworte AUSSCHLIESSLICH mit einem JSON-Objekt.
Kein erklärender Text, keine Markdown-Backticks, nur reines JSON.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Welcher Raumtyp ist auf diesem Immobilienfoto zu sehen?
Antworte nur als JSON:
{
  "raumtyp": "<exakt einer von: Wohnzimmer | Küche | Schlafzimmer | Badezimmer | Gäste-WC | Kinderzimmer | Arbeitszimmer | Esszimmer | Flur | Keller | Dachboden | Garage | Carport | Garten | Terrasse | Balkon | Außenansicht | Grundriss | Sonstiges>",
  "beschreibung": "<Ein präziser deutscher Satz was auf dem Bild zu sehen ist, max. 15 Wörter>",
  "konfidenz": <Zahl zwischen 0.0 und 1.0>
}`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ raumtyp: null, beschreibung: null, konfidenz: 0 })
  }
}
