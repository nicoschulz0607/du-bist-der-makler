'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { SCORE_SYSTEM_PROMPT, buildScoreUserPrompt } from './prompts/scoreInteressent'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface ScoreResult {
  score: number
  ampel: 'gruen' | 'gelb' | 'rot'
  begruendung: string
  klaerungsfragen: string[]
  red_flags: string[]
  basis_felder: number
}

export async function scoreInteressent(interessentId: string): Promise<{ ok: true; result: ScoreResult } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Nicht eingeloggt' }

  const { data: int } = await supabase
    .from('interessenten')
    .select(`
      id, name, email, nachricht, beruf, haushalt, wohnsituation_aktuell,
      finanzierung_status, eigenkapital_range, zeithorizont, motivation,
      andere_objekte_besichtigt, eindruck_erstgespraech,
      listing_id,
      listings!inner(objekttyp, preis, wohnflaeche_qm, zimmer, adresse_plz, adresse_ort, zustand, user_id)
    `)
    .eq('id', interessentId)
    .single()

  if (!int) return { ok: false, error: 'Interessent nicht gefunden' }

  const listing = (int as any).listings
  if (!listing || listing.user_id !== user.id) return { ok: false, error: 'Kein Zugriff' }

  // Count filled relevant fields
  const relevantFields = [
    int.finanzierung_status, int.eigenkapital_range, int.zeithorizont,
    int.haushalt, int.beruf, int.wohnsituation_aktuell,
    int.motivation, int.andere_objekte_besichtigt, int.eindruck_erstgespraech,
  ]
  const basisFelder = relevantFields.filter(Boolean).length

  const userPrompt = buildScoreUserPrompt({
    objekttyp: listing.objekttyp,
    preis: listing.preis,
    wohnflaeche: listing.wohnflaeche_qm,
    zimmer: listing.zimmer,
    plz: listing.adresse_plz,
    ort: listing.adresse_ort,
    zustand: listing.zustand,
    finanzierung_status: int.finanzierung_status,
    eigenkapital_range: int.eigenkapital_range,
    zeithorizont: int.zeithorizont,
    haushalt: int.haushalt,
    beruf: int.beruf,
    wohnsituation_aktuell: int.wohnsituation_aktuell,
    motivation: int.motivation,
    andere_objekte_besichtigt: int.andere_objekte_besichtigt,
    eindruck_erstgespraech: int.eindruck_erstgespraech,
    nachricht: int.nachricht,
  })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SCORE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    // Strip potential markdown code fences Claude may add despite instructions
    const text = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    let parsed: { score: number; ampel: string; begruendung: string; klaerungsfragen: string[]; red_flags: string[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[scoreInteressent] JSON parse failed. Raw:', raw)
      return { ok: false, error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.' }
    }

    const result: ScoreResult = {
      score: parsed.score,
      ampel: parsed.ampel as 'gruen' | 'gelb' | 'rot',
      begruendung: parsed.begruendung,
      klaerungsfragen: parsed.klaerungsfragen ?? [],
      red_flags: parsed.red_flags ?? [],
      basis_felder: basisFelder,
    }

    const { error: updateError } = await supabase.from('interessenten').update({
      ki_score: result.score,
      ki_ampel: result.ampel,
      ki_begruendung: result.begruendung,
      ki_klaerungsfragen: result.klaerungsfragen,
      ki_red_flags: result.red_flags,
      ki_score_aktualisiert_am: new Date().toISOString(),
      ki_score_basis_felder: basisFelder,
    }).eq('id', interessentId)

    if (updateError) {
      console.error('[scoreInteressent] DB update failed:', updateError)
      return { ok: false, error: 'Score berechnet, aber Speichern fehlgeschlagen.' }
    }

    return { ok: true, result }
  } catch (err) {
    console.error('[scoreInteressent] Unexpected error:', err)
    return { ok: false, error: 'KI-Analyse fehlgeschlagen. Bitte versuche es erneut.' }
  }
}
