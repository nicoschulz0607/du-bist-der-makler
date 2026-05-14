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

// ── Einstellungen-Actions ──────────────────────────────────────────────────────

function parseBetragZuCent(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.').replace(/[^0-9.]/g, '')
  const val = parseFloat(normalized)
  if (isNaN(val) || val < 0) return null
  return Math.round(val * 100)
}

export async function addAdminUser(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const email = (formData.get('email') as string | null)?.toLowerCase().trim()
    if (!email) return { ok: false, message: 'E-Mail-Adresse fehlt' }

    const service = createServiceClient()
    const { data: existing } = await service
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existing) return { ok: false, message: `${email} ist bereits Admin` }

    const { error } = await service
      .from('admin_users')
      .insert({ email, added_by: adminEmail })
    if (error) throw error

    await logAudit(adminEmail, 'admin_user_added', 'admin_user', undefined, { email })
    revalidatePath('/helios/einstellungen')
    return { ok: true, message: `${email} als Admin hinzugefügt` }
  } catch (err) {
    console.error('[helios/actions] addAdminUser error:', err)
    return { ok: false, message: 'Fehler beim Hinzufügen' }
  }
}

export async function removeAdminUser(adminId: string): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const service = createServiceClient()

    const { data: target } = await service
      .from('admin_users')
      .select('email')
      .eq('id', adminId)
      .maybeSingle()
    if (!target) return { ok: false, message: 'Admin nicht gefunden' }
    if (target.email === adminEmail) return { ok: false, message: 'Eigenes Konto kann nicht entfernt werden' }

    const { count } = await service
      .from('admin_users')
      .select('id', { count: 'exact', head: true })
    if ((count ?? 0) <= 1) return { ok: false, message: 'Es muss mindestens ein Admin verbleiben' }

    const { error } = await service.from('admin_users').delete().eq('id', adminId)
    if (error) throw error

    await logAudit(adminEmail, 'admin_user_removed', 'admin_user', adminId, { email: target.email })
    revalidatePath('/helios/einstellungen')
    return { ok: true, message: `${target.email} entfernt` }
  } catch (err) {
    console.error('[helios/actions] removeAdminUser error:', err)
    return { ok: false, message: 'Fehler beim Entfernen' }
  }
}

export async function addFixedCost(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const name = (formData.get('name') as string | null)?.trim()
    const betragRaw = (formData.get('betrag') as string | null) ?? ''
    const category = (formData.get('category') as string | null)?.trim()
    const gueltig_ab = (formData.get('gueltig_ab') as string | null)?.trim()

    if (!name) return { ok: false, message: 'Name fehlt' }
    const betrag_cent = parseBetragZuCent(betragRaw)
    if (betrag_cent === null) return { ok: false, message: 'Ungültiger Betrag — z.B. 20.50 oder 20,50' }
    const validCategories = ['infra', 'portal', 'legal', 'marketing', 'tools', 'sonstiges']
    if (!category || !validCategories.includes(category)) return { ok: false, message: 'Ungültige Kategorie' }
    if (!gueltig_ab) return { ok: false, message: 'Gültig-ab-Datum fehlt' }

    const service = createServiceClient()
    const { error } = await service
      .from('fixed_costs')
      .insert({ name, betrag_cent, category, gueltig_ab })
    if (error) throw error

    await logAudit(adminEmail, 'fixed_cost_added', 'fixed_cost', undefined, { name, betrag_cent })
    revalidatePath('/helios/einstellungen')
    revalidatePath('/helios/kosten')
    revalidatePath('/helios')
    return { ok: true, message: `Fixkosten "${name}" hinzugefügt` }
  } catch (err) {
    console.error('[helios/actions] addFixedCost error:', err)
    return { ok: false, message: 'Fehler beim Hinzufügen' }
  }
}

export async function removeFixedCost(id: string): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const service = createServiceClient()
    const today = new Date().toISOString().slice(0, 10)

    const { data: row } = await service.from('fixed_costs').select('name').eq('id', id).maybeSingle()
    const { error } = await service.from('fixed_costs').update({ gueltig_bis: today }).eq('id', id)
    if (error) throw error

    await logAudit(adminEmail, 'fixed_cost_ended', 'fixed_cost', id, { name: row?.name ?? id })
    revalidatePath('/helios/einstellungen')
    revalidatePath('/helios/kosten')
    revalidatePath('/helios')
    return { ok: true, message: `Fixkosten "${row?.name ?? id}" beendet` }
  } catch (err) {
    console.error('[helios/actions] removeFixedCost error:', err)
    return { ok: false, message: 'Fehler beim Beenden' }
  }
}

export async function addAffiliateRevenue(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const partner = (formData.get('partner') as string | null)?.trim()
    const betragRaw = (formData.get('betrag') as string | null) ?? ''
    const erstellt_am = (formData.get('erstellt_am') as string | null)?.trim()
    const kundenEmail = (formData.get('kunden_email') as string | null)?.toLowerCase().trim() || null

    if (!partner) return { ok: false, message: 'Partner fehlt' }
    const betrag_cent = parseBetragZuCent(betragRaw)
    if (betrag_cent === null) return { ok: false, message: 'Ungültiger Betrag — z.B. 20.50 oder 20,50' }
    if (!erstellt_am) return { ok: false, message: 'Datum fehlt' }

    const service = createServiceClient()
    let user_id: string | null = null
    if (kundenEmail) {
      const { data: profile } = await service
        .from('profiles')
        .select('id')
        .eq('email', kundenEmail)
        .maybeSingle()
      user_id = profile?.id ?? null
    }

    const { error } = await service
      .from('affiliate_revenue')
      .insert({ partner, betrag_cent, erstellt_am, ...(user_id ? { user_id } : {}) })
    if (error) throw error

    await logAudit(adminEmail, 'affiliate_revenue_added', 'affiliate', undefined, { partner, betrag_cent })
    revalidatePath('/helios/einstellungen')
    revalidatePath('/helios/kosten')
    revalidatePath('/helios')
    return { ok: true, message: `Affiliate-Einnahme von "${partner}" hinzugefügt` }
  } catch (err) {
    console.error('[helios/actions] addAffiliateRevenue error:', err)
    return { ok: false, message: 'Fehler beim Hinzufügen' }
  }
}

export async function removeAffiliateRevenue(id: string): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    const service = createServiceClient()

    const { data: row } = await service.from('affiliate_revenue').select('partner').eq('id', id).maybeSingle()
    const { error } = await service.from('affiliate_revenue').delete().eq('id', id)
    if (error) throw error

    await logAudit(adminEmail, 'affiliate_revenue_removed', 'affiliate', id, { partner: row?.partner ?? id })
    revalidatePath('/helios/einstellungen')
    revalidatePath('/helios/kosten')
    revalidatePath('/helios')
    return { ok: true, message: `Affiliate-Eintrag gelöscht` }
  } catch (err) {
    console.error('[helios/actions] removeAffiliateRevenue error:', err)
    return { ok: false, message: 'Fehler beim Löschen' }
  }
}

export async function revalidateHeliosCache(): Promise<ActionResult> {
  try {
    const adminEmail = await getAdminEmail()
    revalidatePath('/helios', 'layout')
    await logAudit(adminEmail, 'cache_cleared', undefined, undefined, {})
    return { ok: true, message: 'Cache geleert — alle Helios-Seiten werden neu geladen' }
  } catch (err) {
    console.error('[helios/actions] revalidateHeliosCache error:', err)
    return { ok: false, message: 'Fehler beim Leeren des Caches' }
  }
}
