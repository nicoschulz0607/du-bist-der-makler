import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe'
import {
  getPriceId,
  getReactivationPriceId,
  getPaketPreis,
  TOOLPAKET_PRICE_ID,
  MAKLERSTUNDE_PRICE_ID,
  type Tier,
  type Laufzeit,
} from '@/lib/stripe-config'
import {
  istWechselErlaubt,
  berechneVerbleibendeTage,
  berechneGesamtTage,
  berechneUpgradeKosten,
} from '@/lib/upgrade'

type CheckoutBody =
  | { kind: 'paket'; tier: Tier; laufzeit: Laufzeit }
  | { kind: 'reaktivierung'; tier: Tier }
  | { kind: 'addon'; addon_type: 'toolpaket' | 'maklerstunde' }

function parseCheckoutBody(raw: unknown): CheckoutBody | { error: string } {
  if (typeof raw !== 'object' || raw === null) {
    return { error: 'Body muss ein Objekt sein' }
  }
  const body = raw as Record<string, unknown>

  if (body.kind === 'paket') {
    if (!['basic', 'pro', 'premium'].includes(body.tier as string)) {
      return { error: 'Ungueltiges tier' }
    }
    if (![1, 3, 6].includes(body.laufzeit as number)) {
      return { error: 'Ungueltige laufzeit' }
    }
    return { kind: 'paket', tier: body.tier as Tier, laufzeit: body.laufzeit as Laufzeit }
  }

  if (body.kind === 'reaktivierung') {
    if (!['basic', 'pro', 'premium'].includes(body.tier as string)) {
      return { error: 'Ungueltiges tier' }
    }
    return { kind: 'reaktivierung', tier: body.tier as Tier }
  }

  if (body.kind === 'addon') {
    if (!['toolpaket', 'maklerstunde'].includes(body.addon_type as string)) {
      return { error: 'Ungueltiges addon_type' }
    }
    return { kind: 'addon', addon_type: body.addon_type as 'toolpaket' | 'maklerstunde' }
  }

  return { error: 'Ungueltiger kind' }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const raw = await req.json()
  const parsed = parseCheckoutBody(raw)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const body = parsed

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, vorname')
    .eq('id', user.id)
    .single()

  // ── Paket-Wechsel-Logik ──────────────────────────────────────────────────────
  // These are populated when an upgrade is confirmed and need to pass into the session
  let wechselVonPaketId: string | null = null
  let wechselAngerechneterBetrag: string | null = null
  let wechselCouponId: string | null = null

  if (body.kind === 'paket') {
    const service = createServiceClient()
    const { data: aktivesPaket } = await service
      .from('pakete')
      .select('id, tier, laufzeit_monate, start_datum, ende_datum')
      .eq('user_id', user.id)
      .eq('status', 'aktiv')
      .gt('ende_datum', new Date().toISOString())
      .neq('typ', 'addon')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (aktivesPaket) {
      console.log('[stripe-checkout] Active paket found:', aktivesPaket.id, aktivesPaket.tier, aktivesPaket.laufzeit_monate)

      // 1. Wechsel-Erlaubnis prüfen
      const wechsel = istWechselErlaubt({
        altTier: aktivesPaket.tier as Tier,
        altLaufzeit: aktivesPaket.laufzeit_monate as Laufzeit,
        neuTier: body.tier,
        neuLaufzeit: body.laufzeit,
      })

      if (!wechsel.erlaubt) {
        console.log('[stripe-checkout] Wechsel abgelehnt:', wechsel.grund)
        return NextResponse.json({
          error: 'wechsel_nicht_erlaubt',
          grund: wechsel.grund,
          aktuelles_paket: {
            tier: aktivesPaket.tier,
            laufzeit_monate: aktivesPaket.laufzeit_monate,
            ende_datum: aktivesPaket.ende_datum,
          },
        }, { status: 403 })
      }

      // 2. Restwert + Aufpreis berechnen (server-side, nicht Frontend-Werte vertrauen)
      const aktivBis = new Date(aktivesPaket.ende_datum)
      const aktiviertAm = new Date(aktivesPaket.start_datum)
      const verbleibendeTage = berechneVerbleibendeTage(aktivBis)
      const gesamtTage = berechneGesamtTage(aktiviertAm, aktivBis)
      const altPreisEur = getPaketPreis(aktivesPaket.tier as Tier, aktivesPaket.laufzeit_monate as Laufzeit)
      const neuPreisEur = getPaketPreis(body.tier, body.laufzeit)
      const { restwert, aufpreis } = berechneUpgradeKosten({
        altPreisEur,
        gesamtTage,
        verbleibendeTage,
        neuPreisEur,
      })

      console.log('[stripe-checkout] Restwert:', restwert, 'EUR / Aufpreis:', aufpreis, 'EUR')

      // 3. Ohne Bestätigungs-Header: 409 mit allen Zahlen zurückgeben
      if (req.headers.get('X-Confirm-Paketwechsel') !== 'true') {
        return NextResponse.json({
          error: 'aktives_paket_vorhanden',
          aktuelles_paket: {
            tier: aktivesPaket.tier,
            laufzeit_monate: aktivesPaket.laufzeit_monate,
            ende_datum: aktivesPaket.ende_datum,
            preis: altPreisEur,
            verbleibende_tage: verbleibendeTage,
            gesamt_tage: gesamtTage,
            restwert,
          },
          neues_paket: {
            tier: body.tier,
            laufzeit_monate: body.laufzeit,
            preis: neuPreisEur,
          },
          aufpreis,
        }, { status: 409 })
      }

      // 4. User hat bestätigt — Wechsel-Metadaten merken
      wechselVonPaketId = aktivesPaket.id
      wechselAngerechneterBetrag = restwert.toFixed(2)

      // Coupon erstellen wenn Restwert > 0
      if (restwert > 0) {
        try {
          const coupon = await stripe.coupons.create({
            amount_off: Math.round(restwert * 100),
            currency: 'eur',
            duration: 'once',
            name: `Anrechnung ${aktivesPaket.tier} (${restwert.toFixed(2)} EUR)`,
            metadata: {
              user_id: user.id,
              altes_paket_id: aktivesPaket.id,
              restwert_eur: restwert.toFixed(2),
            },
          })
          wechselCouponId = coupon.id
          console.log('[stripe-checkout] Coupon erstellt:', coupon.id, 'restwert:', restwert)
        } catch (e) {
          console.error('[stripe-checkout] Coupon-Erstellung fehlgeschlagen:', e)
          return NextResponse.json({ error: 'Stripe-Fehler beim Coupon', message: String(e) }, { status: 500 })
        }
      }
    }
  }

  // ── Customer ID Resolution ────────────────────────────────────────────────────
  let customerId = (profile?.stripe_customer_id as string | null) ?? null

  if (!customerId) {
    // TODO: Race-Condition moeglich wenn User parallel in 2 Tabs Checkout startet.
    // Beide Routen wuerden neuen Customer erstellen. Fuer MVP akzeptiert,
    // "verwaiste" Customer in Stripe sind kostenlos und stoeren nicht.
    const customer = await stripe.customers.create({
      email: user.email!,
      name: (profile?.vorname as string | null) || undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    const service = createServiceClient()
    await service
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // ── Price ID + Metadata ───────────────────────────────────────────────────────
  let priceId: string
  const metadata: Record<string, string> = {
    user_id: user.id,
    kind: body.kind,
  }

  if (body.kind === 'paket') {
    priceId = getPriceId(body.tier, body.laufzeit)
    metadata.tier = body.tier
    metadata.laufzeit_monate = String(body.laufzeit)
    if (wechselVonPaketId) {
      metadata.wechsel_von_paket_id = wechselVonPaketId
      metadata.angerechneter_betrag = wechselAngerechneterBetrag!
    }
  } else if (body.kind === 'reaktivierung') {
    priceId = getReactivationPriceId(body.tier)
    metadata.tier = body.tier
  } else {
    priceId = body.addon_type === 'toolpaket' ? TOOLPAKET_PRICE_ID : MAKLERSTUNDE_PRICE_ID
    metadata.addon_type = body.addon_type
  }

  // ── Stripe Session erstellen ──────────────────────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      locale: 'de',
      billing_address_collection: 'required',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe=cancelled`,
      metadata,
      payment_intent_data: { metadata: { user_id: user.id, kind: body.kind } },
      ...(wechselCouponId ? { discounts: [{ coupon: wechselCouponId }] } : {}),
    })

    console.log('[stripe-checkout] Session erstellt:', session.id, body.kind)
    return NextResponse.json({ url: session.url, session_id: session.id })
  } catch (e) {
    console.error('[stripe/checkout]', e)
    return NextResponse.json({ error: 'Stripe-Fehler', message: String(e) }, { status: 500 })
  }
}
