import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/tier'
import { fillTemplate, mergeExpose } from '@/lib/pdf/fill-template'

export const maxDuration = 60

// Cached browser instance — avoids 3-5s Chrome startup on repeated calls
let cachedBrowser: unknown = null

type PuppeteerPage = {
  setDefaultTimeout: (ms: number) => void
  goto: (url: string, opts: unknown) => Promise<void>
  evaluate: (fn: () => unknown) => Promise<unknown>
  pdf: (opts: unknown) => Promise<Buffer>
  emulateMediaType: (type: string) => Promise<void>
  addStyleTag: (opts: { content: string }) => Promise<unknown>
}

async function getBrowser(puppeteer: { launch: (opts: unknown) => Promise<unknown> }) {
  const b = cachedBrowser as { connected?: boolean } | null
  if (!b || !b.connected) {
    cachedBrowser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  }
  return cachedBrowser as { newPage: () => Promise<PuppeteerPage> }
}

export async function GET(req: NextRequest) {
  let tmpPath: string | null = null
  try {
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
      .select(
        'id, objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, zustand, preis, energieausweis_klasse, grundriss_url, fotos, expose_html, expose_edits, badezimmer, schlafzimmer, etage, nutzflaeche_qm, grundstueck_qm, renovierungsjahr, heizungsart, energieausweis_typ, energieverbrauch, energietraeger, ausstattung_items, lat, lon, infra_json, standort_anzeige'
      )
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!listing?.expose_html) {
      return NextResponse.json({ error: 'Bitte zuerst Inserat-Texte generieren.' }, { status: 400 })
    }

    let aiExpose
    try {
      aiExpose = JSON.parse(listing.expose_html)
    } catch {
      return NextResponse.json(
        { error: 'Ungültige Exposé-Daten. Bitte Texte neu generieren.' },
        { status: 400 }
      )
    }

    const expose = mergeExpose(aiExpose, listing.expose_edits)

    const html = await fillTemplate({
      listing: { ...listing, fotos: Array.isArray(listing.fotos) ? listing.fotos : [] },
      expose,
      userName: user.user_metadata?.full_name ?? user.email?.split('@')[0],
      userEmail: user.email,
    })

    // Write HTML to temp file — avoids CDP 83MB message-size limit from base64 inlining
    tmpPath = join(tmpdir(), `expose-${Date.now()}.html`)
    writeFileSync(tmpPath, html, 'utf8')
    const fileUrl = `file:///${tmpPath.replace(/\\/g, '/')}`
    console.log('[expose-pdf] HTML written to temp file, size:', html.length)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const puppeteer = require('puppeteer')
    const browser = await getBrowser(puppeteer)
    const page = await browser.newPage()
    page.setDefaultTimeout(0)

    // Apply print media BEFORE loading so @media print CSS is active during layout
    await page.emulateMediaType('print')

    console.log('[expose-pdf] Loading from file://')
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 0 })

    // Log cover page dimensions to diagnose white strip
    const coverHeight = await page.evaluate(() => {
      const el = document.querySelector('.page-cover') as HTMLElement | null
      return el ? el.getBoundingClientRect().height : -1
    })
    console.log('[expose-pdf] .page-cover height (px):', coverHeight)

    // Inject style: body black fills any sub-pixel gap, cover forced to full height
    await page.addStyleTag({
      content: `
        body { background: #000 !important; }
        .page:not(.page-cover) { background: #fff !important; }
        .page-cover {
          height: 100vh !important;
          min-height: 100vh !important;
          background: #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `,
    })

    // Wait for images (cover photo, gallery, floor plan) — max 12s, ignore failures
    console.log('[expose-pdf] Waiting for images...')
    await Promise.race([
      page.evaluate(() =>
        Promise.allSettled(
          Array.from(document.images).map((img) =>
            (img as HTMLImageElement).complete
              ? Promise.resolve()
              : new Promise((r) => {
                  ;(img as HTMLImageElement).onload = r
                  ;(img as HTMLImageElement).onerror = r
                })
          )
        )
      ),
      new Promise((r) => setTimeout(r, 12000)),
    ])

    console.log('[expose-pdf] Generating PDF...')
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      timeout: 0,
    })
    console.log('[expose-pdf] Done, size:', (pdf as Buffer).length)

    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="expose.pdf"',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err)
    console.error('[expose-pdf] ERROR:', msg)
    return new NextResponse(`<pre style="color:red;padding:2rem">${msg}</pre>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  } finally {
    if (tmpPath) {
      try { unlinkSync(tmpPath) } catch { /* ignore cleanup errors */ }
    }
  }
}
