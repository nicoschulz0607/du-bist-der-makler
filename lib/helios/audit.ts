import { createServiceClient } from '@/lib/supabase/service'

export async function logAudit(
  adminEmail: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const service = createServiceClient()
    await service.from('helios_audit_log').insert({
      admin_email: adminEmail,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      details: details ?? null,
    })
  } catch {
    // never throw — audit failure must not block the main action
  }
}
