import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 20

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64, mediaType, raumtyp } = await req.json()
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'Kein Bild übergeben' }, { status: 400 })
  }

  const raumtypHinweis = raumtyp
    ? `Du weißt bereits, dass dieses Foto ein "${raumtyp}" zeigt.`
    : 'Der Raumtyp ist unbekannt.'

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: `Du bist ein Immobilien-Experte in Deutschland. Schreibe präzise, verkaufsrelevante Beschreibungen für Immobilienfotos. Antworte NUR mit dem Beschreibungstext — kein JSON, keine Anführungszeichen, kein erklärender Text.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `${raumtypHinweis} Schreibe eine einzige, präzise deutsche Beschreibung für dieses Immobilienfoto. Max. 20 Wörter. Hebe die auffälligsten und verkaufsrelevantesten sichtbaren Merkmale hervor. Nur den Beschreibungstext, ohne Anführungszeichen.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    return NextResponse.json({ beschreibung: text })
  } catch (e) {
    return NextResponse.json({ error: `Anthropic-Fehler: ${String(e)}` }, { status: 500 })
  }
}
