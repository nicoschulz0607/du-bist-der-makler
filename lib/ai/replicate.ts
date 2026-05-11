import Replicate from 'replicate'
import { trackAiCall } from './track'
import type { AiCallContext } from './anthropic'
import { calcReplicateCost } from './pricing'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

// TODO Sprint 3a-Followup: genaue Versions-ID aus replicate.com/nightmareai/real-esrgan/versions bestätigen
const MODEL_REALESRGAN = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b'  // PLACEHOLDER version hash

// Ready but dormant — no active call site yet.
// Activate in the sprint that wires up the upscaling use case.
export async function upscaleImage(
  imageUrl: string,
  options: {
    scale?: 2 | 4 | 8
    faceEnhance?: boolean
  },
  ctx: AiCallContext
): Promise<string> {
  const prediction = await replicate.predictions.create({
    version: MODEL_REALESRGAN.split(':')[1],
    input: {
      image:        imageUrl,
      scale:        options.scale ?? 4,
      face_enhance: options.faceEnhance ?? false,
    },
  })

  // Poll until done
  const completed = await replicate.wait(prediction)

  const predictTimeSec = (completed.metrics as { predict_time?: number } | undefined)?.predict_time ?? 0
  const hardware = 't4'  // Real-ESRGAN typically runs on T4; update if Replicate reports otherwise
  trackAiCall({
    provider:  'replicate',
    model:     MODEL_REALESRGAN.split(':')[0],
    callSite:  ctx.callSite,
    costUsd:   calcReplicateCost(hardware, predictTimeSec),
    userId:    ctx.userId,
    listingId: ctx.listingId,
  })

  const output = completed.output
  if (typeof output === 'string') return output
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0]
  throw new Error('[replicate] Unexpected output format from Real-ESRGAN')
}
