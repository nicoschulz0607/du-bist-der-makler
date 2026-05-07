import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdmin } from '@/lib/auth/isAdmin'
import { resend, FROM_SUPPORT } from '@/lib/resend'
import { anfrageAblehnung } from '@/lib/emails/makler-support'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { admin_notiz } = body

  const service = createServiceClient()

  const { data: anfrage } = await service
    .from('makler_anfragen')
    .select('user_id, status')
    .eq('id', id)
    .single()

  if (!anfrage) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (anfrage.status !== 'neu') {
    return NextResponse.json({ error: 'Anfrage ist nicht mehr offen' }, { status: 409 })
  }

  await service
    .from('makler_anfragen')
    .update({ status: 'abgelehnt', admin_notiz: admin_notiz ?? null })
    .eq('id', id)

  const { data: profile } = await service
    .from('profiles')
    .select('vorname')
    .eq('id', anfrage.user_id)
    .single()

  const { data: authUser } = await service.auth.admin.getUserById(anfrage.user_id as string)
  const kundeEmail = authUser?.user?.email ?? ''

  const mail = anfrageAblehnung({
    vorname: (profile?.vorname as string | null) ?? 'Kunde',
    adminNotiz: admin_notiz ?? null,
  })

  await resend.emails.send({
    from: FROM_SUPPORT,
    to: kundeEmail,
    subject: mail.subject,
    html: mail.html,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
