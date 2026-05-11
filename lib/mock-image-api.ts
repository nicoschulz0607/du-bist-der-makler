// Phase 2: Real fal.ai calls — callers (FotoAufwertung, VirtualStaging, Aussenaufnahmen) unchanged.
//
// IMPORTANT: Watermarks ("Visualisierung — leerer Raum gestaged") must be rendered onto
// the actual image pixels via Canvas API or sharp on the server before displaying to clients.
// The current implementation returns raw fal.ai URLs; watermarking is a Sprint 3a-Followup task.

import { enhancePhoto, stageRoom, enhanceOutdoor } from '@/lib/ai/fal'

const ANONYMOUS_CTX = { callSite: 'ki-bilder-anon' }

export async function mockEnhancePhoto(file: File): Promise<string> {
  return enhancePhoto(file, ANONYMOUS_CTX)
}

export async function mockStageRoom(
  file: File,
  style: string
): Promise<string[]> {
  return stageRoom(file, style as 'modern' | 'skandinavisch' | 'klassisch' | 'familie', ANONYMOUS_CTX)
}

export async function mockOutdoorEnhance(
  file: File,
  options: { himmel: boolean; twilight: boolean }
): Promise<string> {
  return enhanceOutdoor(file, options, ANONYMOUS_CTX)
}
