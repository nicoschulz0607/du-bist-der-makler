import { fal } from '@fal-ai/client'
import { trackAiCall } from './track'
import type { AiCallContext } from './anthropic'
import { calcFalCost } from './pricing'

// TODO Sprint 3a-Followup: konkrete fal.ai-Modell-ID nach Live-Test setzen
// Kandidaten: fal-ai/clarity-upscaler | fal-ai/creative-upscaler | fal-ai/aura-sr
const MODEL_ENHANCE = 'fal-ai/clarity-upscaler'  // PLACEHOLDER

// TODO Sprint 3a-Followup: konkrete fal.ai-Modell-ID nach Live-Test setzen
// Kandidaten: fal-ai/interior-ai | flux-based staging LoRA
const MODEL_STAGING = 'fal-ai/interior-ai'  // PLACEHOLDER

// TODO Sprint 3a-Followup: konkrete fal.ai-Modell-ID nach Live-Test setzen
// Kandidaten: fal-ai/sky-replacement | fal-ai/stable-diffusion-xl-inpainting
const MODEL_OUTDOOR = 'fal-ai/sky-replacement'  // PLACEHOLDER

async function falRun(
  model: string,
  input: Record<string, unknown>,
  ctx: AiCallContext
): Promise<unknown> {
  const result = await fal.subscribe(model, { input })
  trackAiCall({
    provider:  'fal',
    model,
    callSite:  ctx.callSite,
    costUsd:   calcFalCost(model),
    userId:    ctx.userId,
    listingId: ctx.listingId,
  })
  return result
}

async function fileToDataUri(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:${file.type};base64,${base64}`
}

export async function enhancePhoto(
  file: File,
  ctx: AiCallContext
): Promise<string> {
  const imageUri = await fileToDataUri(file)
  const result = await falRun(MODEL_ENHANCE, { image_url: imageUri }, ctx) as { image: { url: string } }
  return result.image.url
}

export async function stageRoom(
  file: File,
  style: 'modern' | 'skandinavisch' | 'klassisch' | 'familie',
  ctx: AiCallContext
): Promise<string[]> {
  const imageUri = await fileToDataUri(file)
  // Generate 3 variants by running 3 parallel requests
  const styleMap: Record<string, string> = {
    modern:         'modern',
    skandinavisch:  'scandinavian',
    klassisch:      'classical',
    familie:        'family',
  }
  const results = await Promise.all([
    falRun(MODEL_STAGING, { image_url: imageUri, style: styleMap[style], seed: 1 }, ctx),
    falRun(MODEL_STAGING, { image_url: imageUri, style: styleMap[style], seed: 2 }, ctx),
    falRun(MODEL_STAGING, { image_url: imageUri, style: styleMap[style], seed: 3 }, ctx),
  ]) as Array<{ image: { url: string } }>
  return results.map((r) => r.image.url)
}

export async function enhanceOutdoor(
  file: File,
  options: { himmel: boolean; twilight: boolean },
  ctx: AiCallContext
): Promise<string> {
  const imageUri = await fileToDataUri(file)
  const result = await falRun(
    MODEL_OUTDOOR,
    { image_url: imageUri, replace_sky: options.himmel, twilight: options.twilight },
    ctx
  ) as { image: { url: string } }
  return result.image.url
}
