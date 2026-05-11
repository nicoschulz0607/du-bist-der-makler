import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { trackBusiness } from '@/lib/analytics/track'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      default:
        console.log('[stripe/webhook] Ignored event type:', event.type)
    }
  } catch (err) {
    console.error('[stripe/webhook] Handler error:', err)
    return new Response('Internal Error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata
  if (!meta?.user_id || !meta?.kind) {
    console.error('[stripe/webhook] Missing metadata on session:', session.id)
    return
  }

  if (!['paket', 'reaktivierung', 'addon'].includes(meta.kind)) {
    console.error('[stripe/webhook] Unknown kind in metadata:', meta.kind)
    return
  }

  const service = createServiceClient()

  // Idempotenz-Check: zuerst prüfen ob Session bereits verarbeitet wurde
  const { data: existing } = await service
    .from('pakete')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (existing) {
    console.log('[stripe/webhook] Already processed:', session.id)
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  const betragCent = session.amount_total ?? 0
  const now = new Date()

  let insertData: Record<string, unknown>

  if (meta.kind === 'paket' || meta.kind === 'reaktivierung') {
    const tier = meta.tier as string
    const laufzeit = meta.kind === 'paket' ? Number(meta.laufzeit_monate) : 1

    const endeDate = new Date(now)
    endeDate.setMonth(endeDate.getMonth() + laufzeit)
    endeDate.setHours(23, 59, 59, 999)

    // Altes aktives Hauptpaket stornieren (Add-ons bleiben unangetastet)
    await service
      .from('pakete')
      .update({ status: 'storniert' })
      .eq('user_id', meta.user_id)
      .eq('status', 'aktiv')
      .neq('typ', 'addon')

    const angerechneterBetrag = meta.wechsel_von_paket_id
      ? parseFloat(meta.angerechneter_betrag ?? '0')
      : null

    console.log('[stripe/webhook] Wechsel von Paket:', meta.wechsel_von_paket_id ?? 'Erstkauf', 'angerechnet:', angerechneterBetrag)

    insertData = {
      user_id: meta.user_id,
      typ: meta.kind,
      tier,
      laufzeit_monate: laufzeit,
      addon_type: null,
      start_datum: now.toISOString(),
      ende_datum: endeDate.toISOString(),
      status: 'aktiv',
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      betrag_cent: betragCent,
      waehrung: session.currency ?? 'eur',
      angerechneter_betrag: angerechneterBetrag,
    }

    const { error: insertError } = await service.from('pakete').insert(insertData)

    if (insertError) {
      // UNIQUE-Constraint-Verletzung (backup idempotenz-Sicherheitsnetz)
      if (insertError.code === '23505') {
        console.log('[stripe/webhook] Insert skipped (duplicate):', session.id)
        return
      }
      throw new Error(`pakete insert failed: ${insertError.message}`)
    }

    // Profiles-Cache aktualisieren
    const { error: profileError } = await service
      .from('profiles')
      .update({
        paket_tier: tier,
        paket_aktiv_bis: endeDate.toISOString(),
        paket_laufzeit_monate: laufzeit,
        paket_aktiviert_am: now.toISOString(),
      })
      .eq('id', meta.user_id)

    if (profileError) {
      console.error('[stripe/webhook] Profile cache update failed:', profileError.message)
      // pakete-Eintrag bleibt — Source of Truth ist intakt, Cache kann re-synct werden
    }
  } else {
    // kind === 'addon'
    const addonType = meta.addon_type as string

    if (!['toolpaket', 'maklerstunde'].includes(addonType)) {
      console.error('[stripe/webhook] Unknown addon_type:', addonType)
      return
    }

    // Bei addon: ende_datum = start_datum (Add-ons haben keine Laufzeit,
    // ende_datum ist hier nur Constraint-Filler und sollte fuer Add-ons
    // in Queries ignoriert werden.)
    insertData = {
      user_id: meta.user_id,
      typ: 'addon',
      tier: null,
      laufzeit_monate: null,
      addon_type: addonType,
      start_datum: now.toISOString(),
      ende_datum: now.toISOString(),
      status: 'aktiv',
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      betrag_cent: betragCent,
      waehrung: session.currency ?? 'eur',
    }

    const { error: insertError } = await service.from('pakete').insert(insertData)

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('[stripe/webhook] Insert skipped (duplicate):', session.id)
        return
      }
      throw new Error(`pakete insert failed (addon): ${insertError.message}`)
    }
    // Kein profiles-Cache-Update bei Add-ons — betrifft den Tier nicht
  }

  await trackBusiness('checkout_abgeschlossen', {
    user_id: meta.user_id,
    paket_tier: meta.tier ?? meta.addon_type ?? null,
    betrag_cent: betragCent,
    kind: meta.kind,
    stripe_session_id: session.id,
  })

  console.log('[stripe/webhook] Processed checkout.session.completed:', session.id, meta.kind)
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : (charge.payment_intent as Stripe.PaymentIntent | null)?.id ?? null

  if (!piId) {
    console.warn('[stripe/webhook] charge.refunded without payment_intent:', charge.id)
    return
  }

  const service = createServiceClient()

  const { data: paket } = await service
    .from('pakete')
    .select('id, user_id, ende_datum, typ')
    .eq('stripe_payment_intent_id', piId)
    .limit(1)
    .maybeSingle()

  if (!paket) {
    console.warn('[stripe/webhook] No pakete entry found for payment_intent:', piId)
    return
  }

  await service
    .from('pakete')
    .update({ status: 'refunded' })
    .eq('id', paket.id)

  // Prüfen ob User noch ein weiteres aktives Hauptpaket hat
  const { data: otherActive } = await service
    .from('pakete')
    .select('id')
    .eq('user_id', paket.user_id)
    .eq('status', 'aktiv')
    .gt('ende_datum', new Date().toISOString())
    .in('typ', ['paket', 'reaktivierung'])
    .limit(1)
    .maybeSingle()

  if (!otherActive) {
    await service
      .from('profiles')
      .update({
        paket_tier: null,
        paket_aktiv_bis: null,
        paket_laufzeit_monate: null,
        paket_aktiviert_am: null,
      })
      .eq('id', paket.user_id)
  }

  await trackBusiness('refund_ausgelöst', {
    user_id: paket.user_id,
    charge_id: charge.id,
    paket_id: paket.id,
  })

  console.log('[stripe/webhook] Processed charge.refunded:', charge.id, 'paket:', paket.id)
}
