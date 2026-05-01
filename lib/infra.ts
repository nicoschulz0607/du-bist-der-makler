export interface InfraItem { name: string; dist: string }

export interface InfraData {
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

export async function geocodeAddress(
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
  } catch {}
  return null
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function runOverpassQuery(q: string): Promise<Array<{ lat: number; lon: number; tags: Record<string, string> }>> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams({ data: q }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) {
        console.error(`Overpass ${endpoint} returned ${res.status}`)
        continue
      }
      const data = await res.json()
      if (Array.isArray(data.elements)) return data.elements
      console.error(`Overpass ${endpoint} returned no elements array`, JSON.stringify(data).slice(0, 200))
    } catch (err) {
      console.error(`Overpass ${endpoint} failed:`, err)
    }
  }
  return []
}

export async function fetchInfrastruktur(lat: number, lon: number): Promise<InfraData> {
  const q = `[out:json][timeout:20];
(
  node["amenity"~"school|kindergarten"](around:5000,${lat},${lon});
  node["shop"~"supermarket|convenience|bakery"](around:8000,${lat},${lon});
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
    const els = await runOverpassQuery(q)

    const pick = (
      filter: (e: { lat: number; lon: number; tags: Record<string, string> }) => boolean,
      count = 2
    ): InfraItem[] =>
      els
        .filter(filter)
        .map(e => ({
          name: e.tags.name ?? e.tags.amenity ?? e.tags.shop ?? e.tags.leisure ?? e.tags.railway ?? e.tags.tourism ?? '—',
          distM: haversineM(lat, lon, e.lat, e.lon),
        }))
        .sort((a, b) => a.distM - b.distM)
        .slice(0, count)
        .map(e => ({ name: e.name, dist: fmtDist(e.distM) }))

    return {
      schule1: pick(e => /school|kindergarten/.test(e.tags.amenity ?? ''))[0],
      schule2: pick(e => /school|kindergarten/.test(e.tags.amenity ?? ''))[1],
      einkauf1: pick(e => /supermarket|convenience|bakery/.test(e.tags.shop ?? ''))[0],
      einkauf2: pick(e => /supermarket|convenience|bakery/.test(e.tags.shop ?? ''))[1],
      arzt1: pick(e => /doctors|hospital|clinic/.test(e.tags.amenity ?? ''))[0],
      krankenhaus: pick(e => /doctors|hospital|clinic/.test(e.tags.amenity ?? ''))[1],
      oepnv1: pick(e => /station|halt|tram_stop/.test(e.tags.railway ?? '') || e.tags.highway === 'bus_stop')[0],
      autobahn: pick(e => e.tags.highway === 'motorway_junction', 1)[0],
      freizeit1: pick(e =>
        /park|sports_centre|swimming_pool/.test(e.tags.leisure ?? '') ||
        /attraction|viewpoint/.test(e.tags.tourism ?? '') ||
        e.tags.natural === 'waterfall'
      )[0],
      freizeit2: pick(e =>
        /park|sports_centre|swimming_pool/.test(e.tags.leisure ?? '') ||
        /attraction|viewpoint/.test(e.tags.tourism ?? '') ||
        e.tags.natural === 'waterfall'
      )[1],
      stadtzentrum: pick(e => /town|city/.test(e.tags.place ?? ''), 1)[0],
    }
  } catch {
    return {}
  }
}
