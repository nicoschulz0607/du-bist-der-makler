import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, raumtyp } = await req.json()
  if (!url) return NextResponse.json({ error: 'Keine URL' }, { status: 400 })

  // Fetch image from Supabase Storage URL and convert to base64
  const imgRes = await fetch(url)
  if (!imgRes.ok) return NextResponse.json({ error: 'Bild nicht abrufbar' }, { status: 400 })

  const rawContentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
  const contentType = rawContentType.split(';')[0].trim()
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const mediaType = validTypes.includes(contentType) ? contentType : 'image/jpeg'

  const arrayBuffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

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
                data: base64,
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
  } catch {
    return NextResponse.json({ error: 'Generierung fehlgeschlagen' }, { status: 500 })
  }
}
