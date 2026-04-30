import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const ACCENT = '#1B6B45'
const ACCENT_LIGHT = '#E8F5EE'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', paddingBottom: 40 },
  // Cover
  coverHeader: { backgroundColor: ACCENT, padding: 40, paddingBottom: 32 },
  coverLogo: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 40, letterSpacing: 1.5, textTransform: 'uppercase' },
  coverTitle: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 10, lineHeight: 1.25 },
  coverTagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 },
  coverPhoto: { width: '100%', height: 280, objectFit: 'cover' },
  coverPhotoPlaceholder: { width: '100%', height: 280, backgroundColor: '#E8F5EE' },
  coverStats: { flexDirection: 'row', padding: 24, gap: 0, borderBottom: '1px solid #EEEEEE' },
  coverStatItem: { flex: 1, paddingHorizontal: 8, borderRight: '1px solid #EEEEEE' },
  coverStatLast: { flex: 1, paddingHorizontal: 8 },
  coverStatLabel: { fontSize: 8, color: '#888888', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  coverStatValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1A1A1A' },
  coverAddress: { padding: 24, paddingTop: 16, borderBottom: '1px solid #EEEEEE' },
  coverAddressText: { fontSize: 13, color: '#444444' },
  coverPrice: { padding: 24, paddingTop: 16 },
  coverPriceLabel: { fontSize: 9, color: '#888888', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  coverPriceValue: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: ACCENT },
  // Content page
  contentPage: { fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', paddingBottom: 40 },
  pageHeader: { backgroundColor: ACCENT, paddingHorizontal: 40, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageHeaderTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', letterSpacing: 0.5 },
  pageHeaderSub: { fontSize: 9, color: 'rgba(255,255,255,0.7)' },
  content: { paddingHorizontal: 40, paddingTop: 28 },
  // Highlights
  highlightsBox: { backgroundColor: ACCENT_LIGHT, borderRadius: 8, padding: 20, marginBottom: 20 },
  highlightsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ACCENT, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  highlightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT, marginTop: 4, marginRight: 10, flexShrink: 0 },
  highlightText: { fontSize: 11, color: '#1A1A1A', flex: 1, lineHeight: 1.5 },
  // Sections
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#888888', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  sectionText: { fontSize: 11, color: '#333333', lineHeight: 1.7, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 20 },
  twoCol: { flexDirection: 'row', gap: 20 },
  col: { flex: 1 },
  // Photo grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 40, paddingTop: 24 },
  photoItem: { width: '48.5%', aspectRatio: '4/3', borderRadius: 4, objectFit: 'cover' },
  // Footer
  footer: { position: 'absolute', bottom: 16, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 8, color: '#BBBBBB' },
})

interface ExposePdfProps {
  listing: {
    objekttyp: string | null
    adresse_strasse: string | null
    adresse_plz: string | null
    adresse_ort: string | null
    wohnflaeche_qm: number | null
    zimmer: number | null
    baujahr: number | null
    preis: number | null
    fotos: string[]
  }
  expose: {
    titel: string
    tagline: string
    beschreibung_kurz: string
    beschreibung_lang: string
    ausstattung_text: string
    lage_text: string
    highlights: string[]
  }
}

function Footer({ page, total }: { page: number; total: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>du-bist-der-makler.de · Nicht zur gewerblichen Nutzung</Text>
      <Text style={s.footerText}>Seite {page} von {total}</Text>
    </View>
  )
}

function formatPreis(preis: number | null) {
  if (!preis) return '—'
  return preis.toLocaleString('de-DE') + ' €'
}

export default function ExposePdf({ listing, expose }: ExposePdfProps) {
  const coverPhoto = listing.fotos[0] ?? null
  const galleryPhotos = listing.fotos.slice(1, 9) // max 8 weitere
  const hasGallery = galleryPhotos.length > 0
  const totalPages = 2 + (hasGallery ? 1 : 0)

  const address = [listing.adresse_strasse, listing.adresse_plz && listing.adresse_ort ? `${listing.adresse_plz} ${listing.adresse_ort}` : listing.adresse_ort]
    .filter(Boolean)
    .join(', ')

  return (
    <Document title={expose.titel} author="du-bist-der-makler.de" creator="du-bist-der-makler.de">
      {/* Seite 1: Cover */}
      <Page size="A4" style={s.page}>
        <View style={s.coverHeader}>
          <Text style={s.coverLogo}>du-bist-der-makler.de</Text>
          <Text style={s.coverTitle}>{expose.titel}</Text>
          <Text style={s.coverTagline}>{expose.tagline}</Text>
        </View>

        {coverPhoto ? (
          <Image src={coverPhoto} style={s.coverPhoto} />
        ) : (
          <View style={s.coverPhotoPlaceholder} />
        )}

        <View style={s.coverStats}>
          {listing.wohnflaeche_qm && (
            <View style={s.coverStatItem}>
              <Text style={s.coverStatLabel}>Wohnfläche</Text>
              <Text style={s.coverStatValue}>{listing.wohnflaeche_qm} m²</Text>
            </View>
          )}
          {listing.zimmer && (
            <View style={s.coverStatItem}>
              <Text style={s.coverStatLabel}>Zimmer</Text>
              <Text style={s.coverStatValue}>{listing.zimmer}</Text>
            </View>
          )}
          {listing.baujahr && (
            <View style={s.coverStatItem}>
              <Text style={s.coverStatLabel}>Baujahr</Text>
              <Text style={s.coverStatValue}>{listing.baujahr}</Text>
            </View>
          )}
          <View style={s.coverStatLast}>
            <Text style={s.coverStatLabel}>Objekttyp</Text>
            <Text style={s.coverStatValue}>{listing.objekttyp ?? '—'}</Text>
          </View>
        </View>

        {address && (
          <View style={s.coverAddress}>
            <Text style={s.coverAddressText}>{address}</Text>
          </View>
        )}

        <View style={s.coverPrice}>
          <Text style={s.coverPriceLabel}>Kaufpreis</Text>
          <Text style={s.coverPriceValue}>{formatPreis(listing.preis)}</Text>
        </View>

        <Footer page={1} total={totalPages} />
      </Page>

      {/* Seite 2: Beschreibung */}
      <Page size="A4" style={s.contentPage}>
        <View style={s.pageHeader}>
          <Text style={s.pageHeaderTitle}>{expose.titel}</Text>
          <Text style={s.pageHeaderSub}>{address || listing.objekttyp || ''}</Text>
        </View>

        <View style={s.content}>
          {/* Highlights */}
          <View style={s.highlightsBox}>
            <Text style={s.highlightsTitle}>Highlights</Text>
            {expose.highlights.map((h, i) => (
              <View key={i} style={s.highlightRow}>
                <View style={s.highlightDot} />
                <Text style={s.highlightText}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Kurzbeschreibung */}
          <Text style={s.sectionTitle}>Kurzbeschreibung</Text>
          <Text style={s.sectionText}>{expose.beschreibung_kurz}</Text>

          <View style={s.divider} />

          {/* Vollständige Beschreibung */}
          <Text style={s.sectionTitle}>Objektbeschreibung</Text>
          <Text style={s.sectionText}>{expose.beschreibung_lang.replace(/\n\n/g, '\n')}</Text>

          <View style={s.divider} />

          {/* Ausstattung + Lage */}
          <View style={s.twoCol}>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Ausstattung</Text>
              <Text style={s.sectionText}>{expose.ausstattung_text}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Lage</Text>
              <Text style={s.sectionText}>{expose.lage_text}</Text>
            </View>
          </View>
        </View>

        <Footer page={2} total={totalPages} />
      </Page>

      {/* Seite 3: Foto-Galerie (optional) */}
      {hasGallery && (
        <Page size="A4" style={s.contentPage}>
          <View style={s.pageHeader}>
            <Text style={s.pageHeaderTitle}>Foto-Galerie</Text>
            <Text style={s.pageHeaderSub}>{expose.titel}</Text>
          </View>

          <View style={s.photoGrid}>
            {galleryPhotos.map((url, i) => (
              <Image key={i} src={url} style={s.photoItem} />
            ))}
          </View>

          <Footer page={3} total={totalPages} />
        </Page>
      )}
    </Document>
  )
}
