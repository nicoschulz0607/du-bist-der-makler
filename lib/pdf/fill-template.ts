import fs from 'fs'
import path from 'path'

interface FillTemplateOptions {
  listing: {
    objekttyp: string | null
    adresse_strasse: string | null
    adresse_plz: string | null
    adresse_ort: string | null
    wohnflaeche_qm: number | null
    zimmer: number | null
    baujahr: number | null
    preis: number | null
    energieausweis_klasse: string | null
    grundriss_url?: string | null
    fotos: string[]
    badezimmer?: number | null
    schlafzimmer?: number | null
    etage?: string | null
    nutzflaeche_qm?: number | null
    grundstueck_qm?: number | null
    renovierungsjahr?: number | null
    heizungsart?: string | null
    energieausweis_typ?: string | null
    energieverbrauch?: number | null
    energietraeger?: string | null
    ausstattung_items?: string[] | null
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
  userName?: string
  userEmail?: string
}

function cyclePhoto(fotos: string[], index: number): string {
  if (fotos.length === 0) return ''
  return fotos[index % fotos.length]
}

function formatPreis(preis: number | null): string {
  if (!preis) return '—'
  return preis.toLocaleString('de-DE')
}

function splitBeschreibung(text: string): string[] {
  const paras = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  return Array.from({ length: 5 }, (_, i) => paras[i] ?? '')
}

const ENERGIE_COLORS: Record<string, string> = {
  'A+': '#00a550', 'A': '#50b848', 'B': '#c8d400', 'C': '#ffd200',
  'D': '#f7941d', 'E': '#f15a29', 'F': '#ed1c24', 'G': '#c1272d', 'H': '#6d1f26',
}

function setAktiveEnergieKlasse(html: string, klasse: string | null): string {
  if (!klasse) return html
  const color = ENERGIE_COLORS[klasse]
  if (!color) return html
  let result = html.replace(/class="energie-row active"/g, 'class="energie-row"')
  result = result.replace(
    new RegExp(`(class="energie-row" style="background:${color.replace(/[+()]/g, '\\$&')};")`),
    `class="energie-row active" style="background:${color};"`
  )
  return result
}

async function geocodeAddress(
  strasse: string | null,
  plz: string | null,
  ort: string | null
): Promise<{ lat: string; lon: string } | null> {
  const query = [strasse, plz, ort].filter(Boolean).join(', ')
  if (!query) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'du-bist-der-makler.de/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    if (data[0]?.lat) return { lat: data[0].lat, lon: data[0].lon }
  } catch {
    // silently fall back to CSS placeholder
  }
  return null
}

function injectMapIframe(html: string, lat: string, lon: string): string {
  const delta = 0.008
  const latF = parseFloat(lat)
  const lonF = parseFloat(lon)
  const bbox = `${(lonF - delta).toFixed(5)},${(latF - delta).toFixed(5)},${(lonF + delta).toFixed(5)},${(latF + delta).toFixed(5)}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
  // Wrap in overflow:hidden container; push iframe up 35px (crops zoom controls at top)
  // and extend height by 70px total so attribution footer is hidden at bottom.
  // pointer-events:none + scrolling=no removes all scrollbars and interaction.
  const wrapper = `<div style="position:relative;overflow:hidden;height:60mm;border:0.3mm solid #cccccc;border-radius:2mm;">` +
    `<iframe src="${src}" scrolling="no" style="position:absolute;top:-35px;left:-1px;width:calc(100% + 2px);height:calc(100% + 70px);border:0;pointer-events:none;" loading="lazy" title="Standort"></iframe>` +
    `</div>`
  return html.replace(
    /<div class="map-placeholder">[\s\S]*?<\/div>/,
    wrapper
  )
}

function injectEnergieFix(html: string): string {
  const style = `
<style>
html, body { overflow-x: hidden; }
.energie-scale { overflow: visible !important; }
.energie-row.active {
  outline: 1.5px solid #111 !important;
  outline-offset: -1px;
  box-shadow: 0 1mm 5mm rgba(0,0,0,0.3);
  transform: scaleX(1.02);
  z-index: 2;
}
@media print { #expose-print-bar { display: none !important; } }
</style>`
  return html.replace('</head>', style + '\n</head>')
}

interface InfraItem { name: string; dist: string }
interface InfraData {
  schule1?: InfraItem; schule2?: InfraItem
  einkauf1?: InfraItem; einkauf2?: InfraItem
  arzt1?: InfraItem; krankenhaus?: InfraItem
  oepnv1?: InfraItem; autobahn?: InfraItem
  freizeit1?: InfraItem; freizeit2?: InfraItem
  stadtzentrum?: InfraItem
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m / 50) * 50} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`
}

async function fetchInfrastruktur(lat: number, lon: number): Promise<InfraData> {
  const q = `[out:json][timeout:12];
(
  node["amenity"~"school|kindergarten"](around:5000,${lat},${lon});
  node["shop"~"supermarket|convenience|bakery|grocery"](around:8000,${lat},${lon});
  node["amenity"~"doctors|hospital|clinic"](around:6000,${lat},${lon});
  node["railway"~"station|halt|tram_stop"](around:6000,${lat},${lon});
  node["highway"="bus_stop"](around:1500,${lat},${lon});
  node["leisure"~"park|sports_centre|swimming_pool"](around:4000,${lat},${lon});
  node["tourism"~"attraction|viewpoint"](around:5000,${lat},${lon});
  node["natural"="waterfall"](around:8000,${lat},${lon});
  node["highway"="motorway_junction"](around:30000,${lat},${lon});
  node["place"~"town|city"](around:40000,${lat},${lon});
);
out body 100;`

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: q,
      headers: { 'Content-Type': 'text/plain' },
      signal: AbortSignal.timeout(12000),
    })
    const data = await res.json()
    const els: Array<{ lat: number; lon: number; tags: Record<string, string> }> = data.elements ?? []

    const pick = (
      filter: (e: { tags: Record<string, string> }) => boolean,
      count = 2
    ): InfraItem[] =>
      els
        .filter(filter)
        .map(e => ({
          name: e.tags.name ?? e.tags.amenity ?? e.tags.shop ?? e.tags.leisure ?? e.tags.railway ?? '—',
          distM: haversineM(lat, lon, e.lat, e.lon),
        }))
        .sort((a, b) => a.distM - b.distM)
        .slice(0, count)
        .map(e => ({ name: e.name, dist: fmtDist(e.distM) }))

    const schools = pick(e => /school|kindergarten/.test(e.tags.amenity ?? ''))
    const shops = pick(e => /supermarket|convenience|bakery|grocery/.test(e.tags.shop ?? ''))
    const health = pick(e => /doctors|hospital|clinic/.test(e.tags.amenity ?? ''))
    const transit = pick(e => /station|halt|tram_stop/.test(e.tags.railway ?? '') || e.tags.highway === 'bus_stop')
    const leisure = pick(e =>
      /park|sports_centre|swimming_pool/.test(e.tags.leisure ?? '') ||
      /attraction|viewpoint/.test(e.tags.tourism ?? '') ||
      e.tags.natural === 'waterfall'
    )
    const motorway = pick(e => e.tags.highway === 'motorway_junction', 1)
    const cities = pick(e => /town|city/.test(e.tags.place ?? ''), 2)

    return {
      schule1: schools[0], schule2: schools[1],
      einkauf1: shops[0], einkauf2: shops[1],
      arzt1: health[0], krankenhaus: health[1],
      oepnv1: transit[0],
      freizeit1: leisure[0], freizeit2: leisure[1],
      autobahn: motorway[0],
      stadtzentrum: cities[0],
    }
  } catch {
    return {}
  }
}

function injectPrintBar(html: string): string {
  const bar = `
<div id="expose-print-bar" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#1a1a1a;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;font-family:sans-serif;">
  <span style="color:#aaa;font-size:13px;">Exposé-Vorschau</span>
  <button onclick="window.print()" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:8px 20px;font-size:14px;font-weight:600;cursor:pointer;">
    Als PDF herunterladen
  </button>
</div>
<div style="height:44px;"></div>`
  return html.replace('<body>', '<body>' + bar)
}

export async function fillTemplate(options: FillTemplateOptions): Promise<string> {
  const { listing, expose, userName, userEmail } = options

  const templatePath = path.join(process.cwd(), 'expose-template.html')
  let html = fs.readFileSync(templatePath, 'utf-8')

  // Energy class highlighting + CSS fix
  html = setAktiveEnergieKlasse(html, listing.energieausweis_klasse ?? null)
  html = injectEnergieFix(html)

  // OSM map + infrastructure
  const coords = await geocodeAddress(listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort)
  let infra: InfraData = {}
  if (coords) {
    html = injectMapIframe(html, coords.lat, coords.lon)
    infra = await fetchInfrastruktur(parseFloat(coords.lat), parseFloat(coords.lon))
  }

  const fotos = listing.fotos
  const fotoSlots = Array.from({ length: 22 }, (_, i) => cyclePhoto(fotos, i))
  const absätze = splitBeschreibung(expose.beschreibung_lang)

  // Ausstattung items: use structured array if available, else fallback
  const rawItems: string[] = listing.ausstattung_items && listing.ausstattung_items.length > 0
    ? listing.ausstattung_items
    : []
  const ausstattungSlots = Array.from({ length: 9 }, (_, i) => rawItems[i] ?? '—')

  const preisPmqm =
    listing.wohnflaeche_qm && listing.preis && listing.wohnflaeche_qm > 0
      ? Math.round(listing.preis / listing.wohnflaeche_qm)
      : null

  const initialen = (userName ?? '?')
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const v = (val: string | number | null | undefined, suffix = ''): string =>
    val != null && val !== '' ? `${val}${suffix}` : '—'

  const replacements: Array<[string, string]> = [
    ['TITEL', expose.titel],
    ['TAGLINE', expose.tagline],
    ['TITEL_KURZ', expose.titel.length > 50 ? expose.titel.slice(0, 47) + '...' : expose.titel],
    ['OBJEKTTYP', v(listing.objekttyp)],
    ['ORT', v(listing.adresse_ort)],
    ['STRASSE', v(listing.adresse_strasse)],
    ['PLZ', v(listing.adresse_plz)],
    ['WOHNFLAECHE', v(listing.wohnflaeche_qm)],
    ['ZIMMER', v(listing.zimmer)],
    ['BAUJAHR', v(listing.baujahr)],
    ['KAUFPREIS', formatPreis(listing.preis)],
    ['ENERGIEKLASSE', v(listing.energieausweis_klasse)],
    ['BESCHREIBUNG_KURZ', expose.beschreibung_kurz],
    ['BESCHREIBUNG_ABSATZ_1', absätze[0]],
    ['BESCHREIBUNG_ABSATZ_2', absätze[1]],
    ['BESCHREIBUNG_ABSATZ_3', absätze[2]],
    ['BESCHREIBUNG_ABSATZ_4', absätze[3]],
    ['BESCHREIBUNG_ABSATZ_5', absätze[4]],
    ['AUSSTATTUNG_TEXT', expose.ausstattung_text],
    ['LAGE_TEXT', expose.lage_text],
    ['HIGHLIGHT_1', expose.highlights[0] ?? '—'],
    ['HIGHLIGHT_2', expose.highlights[1] ?? '—'],
    ['HIGHLIGHT_3', expose.highlights[2] ?? '—'],
    ['AUSSTATTUNG_1', ausstattungSlots[0]],
    ['AUSSTATTUNG_2', ausstattungSlots[1]],
    ['AUSSTATTUNG_3', ausstattungSlots[2]],
    ['AUSSTATTUNG_4', ausstattungSlots[3]],
    ['AUSSTATTUNG_5', ausstattungSlots[4]],
    ['AUSSTATTUNG_6', ausstattungSlots[5]],
    ['AUSSTATTUNG_7', ausstattungSlots[6]],
    ['AUSSTATTUNG_8', ausstattungSlots[7]],
    ['AUSSTATTUNG_9', ausstattungSlots[8]],
    ['FOTO_HAUPTBILD_URL', fotoSlots[0]],
    ['FOTO_2_URL', fotoSlots[1]],
    ['FOTO_3_URL', fotoSlots[2]],
    ['FOTO_4_URL', fotoSlots[3]],
    ['FOTO_5_URL', fotoSlots[4]],
    ['FOTO_6_URL', fotoSlots[5]],
    ['FOTO_7_URL', fotoSlots[6]],
    ['FOTO_8_URL', fotoSlots[7]],
    ['FOTO_9_URL', fotoSlots[8]],
    ['FOTO_10_URL', fotoSlots[9]],
    ['FOTO_11_URL', fotoSlots[10]],
    ['FOTO_12_URL', fotoSlots[11]],
    ['FOTO_13_URL', fotoSlots[12]],
    ['FOTO_14_URL', fotoSlots[13]],
    ['FOTO_15_URL', fotoSlots[14]],
    ['FOTO_16_URL', fotoSlots[15]],
    ['FOTO_17_URL', fotoSlots[16]],
    ['FOTO_18_URL', fotoSlots[17]],
    ['FOTO_19_URL', fotoSlots[18]],
    ['FOTO_20_URL', fotoSlots[19]],
    ['FOTO_21_URL', fotoSlots[20]],
    ['FOTO_22_URL', fotoSlots[21]],
    ['GRUNDRISS_URL', listing.grundriss_url ?? ''],
    ['BADEZIMMER', v(listing.badezimmer)],
    ['SCHLAFZIMMER', v(listing.schlafzimmer)],
    ['ZUSTAND', v((listing as { zustand?: string | null }).zustand)],
    ['ETAGE', v(listing.etage)],
    ['NUTZFLAECHE', v(listing.nutzflaeche_qm)],
    ['GRUNDSTUECK', v(listing.grundstueck_qm)],
    ['HEIZUNGSART', v(listing.heizungsart)],
    ['ENERGIEAUSWEIS_TYP', v(listing.energieausweis_typ)],
    ['ENERGIEVERBRAUCH', v(listing.energieverbrauch)],
    ['ENERGIETRAEGER', v(listing.energietraeger)],
    ['RENOVIERUNGSJAHR', v(listing.renovierungsjahr)],
    ['GRUNDSTEUER', '—'],
    ['PREIS_PRO_QM', preisPmqm?.toLocaleString('de-DE') ?? '—'],
    ['SCHULE_1', infra.schule1?.name ?? '—'], ['SCHULE_1_DIST', infra.schule1?.dist ?? ''],
    ['SCHULE_2', infra.schule2?.name ?? '—'], ['SCHULE_2_DIST', infra.schule2?.dist ?? ''],
    ['EINKAUF_1', infra.einkauf1?.name ?? '—'], ['EINKAUF_1_DIST', infra.einkauf1?.dist ?? ''],
    ['EINKAUF_2', infra.einkauf2?.name ?? '—'], ['EINKAUF_2_DIST', infra.einkauf2?.dist ?? ''],
    ['ARZT_1', infra.arzt1?.name ?? '—'], ['ARZT_1_DIST', infra.arzt1?.dist ?? ''],
    ['KRANKENHAUS', infra.krankenhaus?.name ?? '—'], ['KRANKENHAUS_DIST', infra.krankenhaus?.dist ?? ''],
    ['OEPNV_1', infra.oepnv1?.name ?? '—'], ['OEPNV_1_DIST', infra.oepnv1?.dist ?? ''],
    ['AUTOBAHN', infra.autobahn?.name ?? '—'], ['AUTOBAHN_DIST', infra.autobahn?.dist ?? ''],
    ['FREIZEIT_1', infra.freizeit1?.name ?? '—'], ['FREIZEIT_1_DIST', infra.freizeit1?.dist ?? ''],
    ['FREIZEIT_2', infra.freizeit2?.name ?? '—'], ['FREIZEIT_2_DIST', infra.freizeit2?.dist ?? ''],
    ['STADTZENTRUM', infra.stadtzentrum?.name ?? '—'], ['STADTZENTRUM_DIST', infra.stadtzentrum?.dist ?? ''],
    ['GROSSSTADT', '—'], ['GROSSSTADT_DIST', ''],
    ['VERKAEUFER_NAME', userName ?? '—'],
    ['VERKAEUFER_EMAIL', userEmail ?? '—'],
    ['VERKAEUFER_TELEFON', '—'],
    ['VERKAEUFER_FOTO_URL', ''],
    ['VERKAEUFER_INITIALEN', initialen],
    ['JAHR', new Date().getFullYear().toString()],
  ]

  for (const [key, value] of replacements) {
    html = html.replaceAll(`{{${key}}}`, value)
  }

  html = injectPrintBar(html)

  return html
}
