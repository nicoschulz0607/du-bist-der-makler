import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/tier'
import { generiereExpose } from '@/lib/claude/expose'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('paket_tier')
    .eq('id', user.id)
    .single()

  if (!canAccess(profile?.paket_tier ?? null, 'pro')) {
    return NextResponse.json({ error: 'Pro-Paket erforderlich' }, { status: 403 })
  }

  let body: { wasIstBesonders?: string; idealeKaeufer?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const { wasIstBesonders = '', idealeKaeufer = '' } = body

  const { data: listing } = await supabase
    .from('listings')
    .select('id, objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, zustand, preis, energieausweis_klasse, beschreibung')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  try {
    const expose = await generiereExpose({
      objekttyp: listing?.objekttyp ?? null,
      adresse_strasse: listing?.adresse_strasse ?? null,
      adresse_plz: listing?.adresse_plz ?? null,
      adresse_ort: listing?.adresse_ort ?? null,
      wohnflaeche_qm: listing?.wohnflaeche_qm ?? null,
      zimmer: listing?.zimmer ?? null,
      baujahr: listing?.baujahr ?? null,
      zustand: listing?.zustand ?? null,
      preis: listing?.preis ?? null,
      energieausweis_klasse: listing?.energieausweis_klasse ?? null,
      beschreibung: listing?.beschreibung ?? null,
      wasIstBesonders,
      idealeKaeufer,
    })

    if (listing?.id) {
      await supabase
        .from('listings')
        .update({
          expose_html: JSON.stringify(expose),
          expose_generiert_at: new Date().toISOString(),
        })
        .eq('id', listing.id)
    }

    return NextResponse.json({ expose })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('abort') || message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Die KI hat zu lange gebraucht. Bitte versuche es erneut.' },
        { status: 504 }
      )
    }
    console.error('Exposé-Generierung fehlgeschlagen:', message)
    return NextResponse.json(
      { error: 'Etwas hat nicht geklappt. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}
