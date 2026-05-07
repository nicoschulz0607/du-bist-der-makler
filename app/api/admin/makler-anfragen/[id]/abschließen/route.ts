import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdmin } from '@/lib/auth/isAdmin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: anfrage } = await service
    .from('makler_anfragen')
    .select('status')
    .eq('id', id)
    .single()

  if (!anfrage) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (anfrage.status !== 'bestätigt') {
    return NextResponse.json({ error: 'Nur bestätigte Anfragen können abgeschlossen werden' }, { status: 409 })
  }

  await service
    .from('makler_anfragen')
    .update({ status: 'abgeschlossen' })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
