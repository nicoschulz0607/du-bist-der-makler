import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/helios/auth'
import { PageWrapper } from '@/lib/helios/components/layout/PageWrapper'
import {
  fetchAdminUsers,
  fetchFixkosten,
  fetchAffiliateRevenue,
  fetchAuditLog,
} from '@/lib/helios/sources/supabase'
import { AdminUsersIsland } from './AdminUsersIsland'
import { FixkostenIsland } from './FixkostenIsland'
import { AffiliateIsland } from './AffiliateIsland'
import { AuditLogIsland } from './AuditLogIsland'
import { SystemToolsIsland } from './SystemToolsIsland'

const TABS = [
  { key: 'admin-users', label: 'Admin-Benutzer' },
  { key: 'fixkosten',   label: 'Fixkosten' },
  { key: 'affiliate',   label: 'Affiliate' },
  { key: 'audit-log',   label: 'Audit-Log' },
  { key: 'system',      label: 'System' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default async function EinstellungenPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const { tab: rawTab = 'admin-users', page: pageStr = '1' } = await searchParams
  const tab: TabKey = (TABS.some((t) => t.key === rawTab) ? rawTab : 'admin-users') as TabKey
  const page = Math.max(1, parseInt(pageStr, 10) || 1)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  await requireAdmin(user?.email)
  const currentAdmin = user?.email ?? 'system'

  const tabNav = (
    <nav className="flex gap-1 mb-6 flex-wrap">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`/helios/einstellungen?tab=${t.key}`}
          className={[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === t.key
              ? 'bg-helios-accent text-white'
              : 'bg-helios-surface text-helios-text-muted hover:text-helios-text hover:bg-helios-surface-muted',
          ].join(' ')}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )

  let content: React.ReactNode

  if (tab === 'admin-users') {
    const users = await fetchAdminUsers()
    content = <AdminUsersIsland users={users} currentAdminEmail={currentAdmin} />
  } else if (tab === 'fixkosten') {
    const kosten = await fetchFixkosten()
    content = <FixkostenIsland kosten={kosten} />
  } else if (tab === 'affiliate') {
    const revenue = await fetchAffiliateRevenue()
    content = <AffiliateIsland revenue={revenue} />
  } else if (tab === 'audit-log') {
    const { rows, total } = await fetchAuditLog(page, 20)
    content = <AuditLogIsland rows={rows} total={total} page={page} perPage={20} />
  } else {
    // system tab — fetch last cache_clear from audit log
    const service = createServiceClient()
    const { data } = await service
      .from('helios_audit_log')
      .select('created_at, admin_email')
      .eq('action', 'cache_cleared')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const letzterCacheClear = data
      ? { created_at: (data as Record<string, unknown>).created_at as string, admin_email: (data as Record<string, unknown>).admin_email as string }
      : null
    content = <SystemToolsIsland letzterCacheClear={letzterCacheClear} />
  }

  return (
    <PageWrapper title="Einstellungen" subtitle="Admin-Konfiguration & System">
      {tabNav}
      {content}
    </PageWrapper>
  )
}
