'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/helios/auth'
import { logAudit } from '@/lib/helios/audit'
import { isLiveMode } from '@/lib/helios/stripeMode'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'
import { resend, FROM_SUPPORT, REPLY_TO_SUPPORT } from '@/lib/resend'

export type ActionResult = { ok: true; message: string } | { ok: false; message: string }

async function getAdminEmail(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  await requireAdmin(user?.email)
  return user!.email!
}

export async function issueRefund(paketId: string): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const service = createServiceClient()

    const { data: paket } = await service
      .from('pakete')
      .select('id, stripe_payment_intent_id, status, betrag_cent, user_id')
      .eq('id', paketId)
      .maybeSingle()

    if (!paket) return { ok: false, message: 'Paket nicht gefunden' }
    if (paket.status !== 'aktiv') return { ok: false, message: 'Paket ist nicht aktiv' }
    if (!paket.stripe_payment_intent_id) return { ok: false, message: 'Keine Payment-Intent-ID vorhanden' }

    const paymentIntent = await stripe.paymentIntents.retrieve(paket.stripe_payment_intent_id)

    if (paymentIntent.livemode !== isLiveMode()) {
      return { ok: false, message: 'Stripe Mode-Mismatch — Refund abgebrochen' }
    }

    await stripe.refunds.create({ payment_intent: paket.stripe_payment_intent_id })

    await service
      .from('pakete')
      .update({ status: 'refunded' })
      .eq('id', paketId)

    // Prüfe ob User noch ein weiteres aktives Hauptpaket hat
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
          paket_aktiviert_am: null,
          paket_laufzeit_monate: null,
        })
        .eq('id', paket.user_id)
    }

    await logAudit(adminEmail, 'refund_issued', 'paket', paketId, { betrag_cent: paket.betrag_cent })
    revalidatePath('/helios/kunden')
    revalidatePath('/helios')

    return { ok: true, message: 'Erstattung erfolgreich ausgelöst' }
  } catch (err) {
    console.error('[helios/actions] issueRefund error:', err)
    return { ok: false, message: 'Fehler beim Auslösen der Erstattung' }
  }
}

export async function setListingStatus(
  listingId: string,
  newStatus: 'draft' | 'aktiv' | 'verkauft'
): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const service = createServiceClient()

    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'verkauft') {
      updateData.verkauft_am = new Date().toISOString()
      // updated_at intentionally NOT set — it's used for inactivity detection
    }

    const { error } = await service
      .from('listings')
      .update(updateData)
      .eq('id', listingId)

    if (error) throw error

    await logAudit(adminEmail, 'listing_status_changed', 'listing', listingId, { newStatus })
    revalidatePath('/helios/listings')
    revalidatePath('/helios')

    return { ok: true, message: 'Status aktualisiert' }
  } catch (err) {
    console.error('[helios/actions] setListingStatus error:', err)
    return { ok: false, message: 'Fehler beim Aktualisieren des Status' }
  }
}

export async function setImmoScoutStatus(
  listingId: string,
  newStatus: string | null
): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const service = createServiceClient()

    const { error } = await service
      .from('listings')
      .update({ immoscout_status: newStatus })
      .eq('id', listingId)

    if (error) throw error

    await logAudit(adminEmail, 'immoscout_status_changed', 'listing', listingId, {
      newStatus: newStatus ?? 'unset',
    })
    revalidatePath('/helios/listings')
    revalidatePath(`/helios/listings/${listingId}`)

    return { ok: true, message: 'ImmoScout-Status aktualisiert' }
  } catch (err) {
    console.error('[helios/actions] setImmoScoutStatus error:', err)
    return { ok: false, message: 'Fehler beim Aktualisieren des ImmoScout-Status' }
  }
}

export async function sendCustomEmail(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()

    const userId = formData.get('user_id') as string
    const betreff = formData.get('betreff') as string
    const body = formData.get('body') as string

    if (!userId || !betreff?.trim() || !body?.trim()) {
      return { ok: false, message: 'Bitte alle Felder ausfüllen' }
    }

    const service = createServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle()

    if (!profile?.email) {
      return { ok: false, message: 'Keine E-Mail-Adresse gefunden' }
    }

    await resend.emails.send({
      from: FROM_SUPPORT,
      to: profile.email,
      replyTo: REPLY_TO_SUPPORT,
      subject: betreff,
      html: '<p>' + body.replace(/\n/g, '<br>') + '</p>',
    })

    // body NOT logged (DSGVO)
    await logAudit(adminEmail, 'custom_email_sent', 'user', userId, { betreff })

    return { ok: true, message: 'E-Mail gesendet' }
  } catch (err) {
    console.error('[helios/actions] sendCustomEmail error:', err)
    return { ok: false, message: 'Fehler beim Senden der E-Mail' }
  }
}
