import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'

export async function requireAdmin(userEmail: string | undefined): Promise<void> {
  if (!userEmail) notFound()

  const service = createServiceClient()
  const { data } = await service
    .from('admin_users')
    .select('id')
    .eq('email', userEmail)
    .maybeSingle()

  // 404 (not redirect) — leakt keine Existenz der Route an Nicht-Admins
  if (!data) notFound()
}
