import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchListingDetails } from '@/lib/helios/sources/supabase'
import { PageWrapper } from '@/lib/helios/components/layout/PageWrapper'
import { Card } from '@/lib/helios/components/primitives/Card'
import { Badge } from '@/lib/helios/components/primitives/Badge'
import type { BadgeVariant } from '@/lib/helios/components/primitives/Badge'
import { ListingStatusIsland } from '@/app/helios/listings/ListingStatusIsland'
import { ImmoScoutIsland } from '@/app/helios/listings/ImmoScoutIsland'

function statusVariant(status: string): BadgeVariant {
  if (status === 'aktiv') return 'success'
  if (status === 'verkauft') return 'info'
  return 'neutral'
}

function statusLabel(status: string): string {
  if (status === 'aktiv') return 'Aktiv'
  if (status === 'verkauft') return 'Verkauft'
  return 'Entwurf'
}

function tierVariant(tier: string | null): BadgeVariant {
  if (tier === 'premium') return 'warning'
  if (tier === 'pro') return 'info'
  if (tier === 'basic') return 'success'
  return 'neutral'
}

function tageAktiv(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await fetchListingDetails(id)

  if (!listing) notFound()

  const titel = [listing.objekttyp, listing.adresseOrt].filter(Boolean).join(' · ') || 'Listing'

  return (
    <PageWrapper
      title={titel}
      subtitle={listing.userEmail ?? undefined}
      actions={
        <Link
          href="/helios/listings"
          className="text-sm text-helios-text-muted hover:text-helios-text flex items-center gap-1"
        >
          ← Alle Listings
        </Link>
      }
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 mb-6 -mt-2">
        <Badge variant={statusVariant(listing.status)}>{statusLabel(listing.status)}</Badge>
        {listing.paketTier && (
          <Badge variant={tierVariant(listing.paketTier)}>{listing.paketTier}</Badge>
        )}
        {listing.immoscoutStatus && (
          <Badge variant="info">ImmoScout: {listing.immoscoutStatus}</Badge>
        )}
      </div>

      {/* Details grid */}
      <Card className="mb-4">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-helios-text-muted">Preis</dt>
            <dd className="mt-0.5 text-sm text-helios-text">
              {listing.preis != null
                ? listing.preis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-helios-text-muted">Tage aktiv</dt>
            <dd className="mt-0.5 text-sm text-helios-text">{tageAktiv(listing.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-helios-text-muted">Verkäufer</dt>
            <dd className="mt-0.5 text-sm text-helios-text">
              <Link
                href={`/helios/kunden/${listing.userId}`}
                className="text-helios-accent hover:underline"
              >
                {[listing.userVorname, listing.userEmail].filter(Boolean).join(' · ') || listing.userId.slice(0, 8) + '…'}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-helios-text-muted">Erstellt</dt>
            <dd className="mt-0.5 text-sm text-helios-text">
              {new Date(listing.createdAt).toLocaleDateString('de-DE')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-helios-text-muted">Aktualisiert</dt>
            <dd className="mt-0.5 text-sm text-helios-text">
              {new Date(listing.updatedAt).toLocaleDateString('de-DE')}
            </dd>
          </div>
          {listing.verkaufAm && (
            <div>
              <dt className="text-xs font-medium text-helios-text-muted">Verkauft am</dt>
              <dd className="mt-0.5 text-sm text-helios-text">
                {new Date(listing.verkaufAm).toLocaleDateString('de-DE')}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Status ändern */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-helios-text mb-4">Status ändern</h2>
        <ListingStatusIsland listingId={listing.id} currentStatus={listing.status} />
      </Card>

      {/* ImmoScout-Status */}
      <Card>
        <h2 className="text-sm font-semibold text-helios-text mb-4">ImmoScout-Status</h2>
        <ImmoScoutIsland listingId={listing.id} currentStatus={listing.immoscoutStatus} />
      </Card>
    </PageWrapper>
  )
}
