import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/tier'
import ExposePdf from '@/lib/pdf/ExposePdf'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('paket_tier')
    .eq('id', user.id)
    .single()

  if (!canAccess(profile?.paket_tier ?? null, 'pro')) {
    return NextResponse.json({ error: 'Pro-Paket erforderlich' }, { status: 403 })
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, preis, fotos, expose_html')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!listing?.expose_html) {
    return NextResponse.json({ error: 'Bitte zuerst Inserat-Texte generieren.' }, { status: 400 })
  }

  let expose
  try {
    expose = JSON.parse(listing.expose_html)
  } catch {
    return NextResponse.json({ error: 'Ungültige Exposé-Daten. Bitte Texte neu generieren.' }, { status: 400 })
  }

  const fotos: string[] = Array.isArray(listing.fotos) ? listing.fotos : []

  try {
    const element = React.createElement(ExposePdf, {
      listing: {
        objekttyp: listing.objekttyp,
        adresse_strasse: listing.adresse_strasse,
        adresse_plz: listing.adresse_plz,
        adresse_ort: listing.adresse_ort,
        wohnflaeche_qm: listing.wohnflaeche_qm,
        zimmer: listing.zimmer,
        baujahr: listing.baujahr,
        preis: listing.preis,
        fotos,
      },
      expose,
    }) as React.ReactElement<DocumentProps>

    const buffer = await renderToBuffer(element)

    const filename = `expose-${listing.adresse_ort ?? 'objekt'}-${new Date().toISOString().slice(0, 10)}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('PDF-Generierung fehlgeschlagen:', err)
    return NextResponse.json(
      { error: 'PDF konnte nicht erstellt werden. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}
