import fs from 'fs'
import path from 'path'
import { type InfraData, geocodeAddress } from '@/lib/infra'

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
    lat?: number | null
    lon?: number | null
    infra_json?: InfraData | null
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


function injectMapIframe(html: string, lat: string, lon: string): string {
  const delta = 0.008
  const latF = parseFloat(lat)
  const lonF = parseFloat(lon)
  const bbox = `${(lonF - delta).toFixed(5)},${(latF - delta).toFixed(5)},${(lonF + delta).toFixed(5)},${(latF + delta).toFixed(5)}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
  // -70px top: hides both Leaflet zoom buttons (+/-)
  // +140px height: 70px extra at top + 70px at bottom hides the attribution bar
  // pointer-events:none + scrolling=no: no scrollbars, no interaction
  const wrapper = `<div style="position:relative;overflow:hidden;height:60mm;border:0.3mm solid #cccccc;border-radius:2mm;">` +
    `<iframe src="${src}" scrolling="no" style="position:absolute;top:-70px;left:-1px;width:calc(100% + 2px);height:calc(100% + 140px);border:0;pointer-events:none;" loading="lazy" title="Standort"></iframe>` +
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

// Infrastructure data is loaded client-side (browser fetches Overpass after page load).
// This avoids server-side timeouts on Vercel and works with any plan tier.
function injectInfraScript(html: string, lat: string, lon: string): string {
  const js = `(function(){
var la=${lat},lo=${lon};
function hav(a,b){var R=6371000,x=(a-la)*Math.PI/180,y=(b-lo)*Math.PI/180,z=Math.sin(x/2)*Math.sin(x/2)+Math.cos(la*Math.PI/180)*Math.cos(a*Math.PI/180)*Math.sin(y/2)*Math.sin(y/2);return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
function fmt(m){return m<1000?Math.round(m/50)*50+' m':(m/1000).toFixed(1).replace('.',',')+' km'}
function pick(els,fn,n){return els.filter(fn).map(function(e){return{nm:e.tags.name||e.tags.amenity||e.tags.shop||e.tags.leisure||e.tags.railway||e.tags.tourism||'—',d:hav(e.lat,e.lon)}}).sort(function(a,b){return a.d-b.d}).slice(0,n||2).map(function(e){return[e.nm,fmt(e.d)]})}
function set(items,i,j,nm,dist){var it=items[i];if(!it)return;var li=it.querySelectorAll('li')[j];if(!li)return;li.querySelector('span:first-child').textContent=nm;var ds=li.querySelector('span.dist');if(ds)ds.textContent=dist}
var q='[out:json][timeout:15];(node["amenity"~"school|kindergarten"](around:5000,'+la+','+lo+');node["shop"~"supermarket|convenience|bakery"](around:8000,'+la+','+lo+');node["amenity"~"doctors|hospital|clinic"](around:6000,'+la+','+lo+');node["railway"~"station|halt|tram_stop"](around:6000,'+la+','+lo+');node["highway"="bus_stop"](around:1500,'+la+','+lo+');node["leisure"~"park|sports_centre|swimming_pool"](around:4000,'+la+','+lo+');node["tourism"~"attraction|viewpoint"](around:5000,'+la+','+lo+');node["natural"="waterfall"](around:8000,'+la+','+lo+');node["highway"="motorway_junction"](around:30000,'+la+','+lo+');node["place"~"town|city"](around:40000,'+la+','+lo+'););out body 100;';
fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:q}).then(function(r){return r.json()}).then(function(data){
var els=data.elements||[];
var sc=pick(els,function(e){return/school|kindergarten/.test(e.tags.amenity||'')});
var sh=pick(els,function(e){return/supermarket|convenience|bakery/.test(e.tags.shop||'')});
var hl=pick(els,function(e){return/doctors|hospital|clinic/.test(e.tags.amenity||'')});
var tr=pick(els,function(e){return/station|halt|tram_stop/.test(e.tags.railway||'')||e.tags.highway==='bus_stop'});
var fr=pick(els,function(e){return/park|sports_centre|swimming_pool/.test(e.tags.leisure||'')||/attraction|viewpoint/.test(e.tags.tourism||'')||e.tags.natural==='waterfall'});
var mv=pick(els,function(e){return e.tags.highway==='motorway_junction'},1);
var ct=pick(els,function(e){return/town|city/.test(e.tags.place||'')},1);
var items=document.querySelectorAll('.infra-item');
if(sc[0])set(items,0,0,sc[0][0],sc[0][1]);if(sc[1])set(items,0,1,sc[1][0],sc[1][1]);
if(sh[0])set(items,1,0,sh[0][0],sh[0][1]);if(sh[1])set(items,1,1,sh[1][0],sh[1][1]);
if(hl[0])set(items,2,0,hl[0][0],hl[0][1]);if(hl[1])set(items,2,1,hl[1][0],hl[1][1]);
if(tr[0])set(items,3,0,tr[0][0],tr[0][1]);if(mv[0])set(items,3,1,mv[0][0],mv[0][1]);
if(fr[0])set(items,4,0,fr[0][0],fr[0][1]);if(fr[1])set(items,4,1,fr[1][0],fr[1][1]);
if(ct[0])set(items,5,0,ct[0][0],ct[0][1]);
}).catch(function(){});
})();`
  return html.replace('</body>', `<script>${js}</script>\n</body>`)
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

  // Map: use cached coords from DB; fall back to live geocoding only if not yet stored
  let mapLat = listing.lat != null ? listing.lat.toString() : null
  let mapLon = listing.lon != null ? listing.lon.toString() : null
  if (!mapLat || !mapLon) {
    const coords = await geocodeAddress(listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort)
    if (coords) { mapLat = coords.lat; mapLon = coords.lon }
  }
  if (mapLat && mapLon) {
    html = injectMapIframe(html, mapLat, mapLon)
  }

  // Infrastructure: use cached DB data; fall back to client-side script if not yet stored
  const infra: InfraData = (listing.infra_json && Object.keys(listing.infra_json).length > 0)
    ? listing.infra_json
    : {}
  if (Object.keys(infra).length === 0 && mapLat && mapLon) {
    html = injectInfraScript(html, mapLat, mapLon)
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
    ['GROSSSTADT', infra.stadtzentrum?.name ?? '—'], ['GROSSSTADT_DIST', ''],
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
