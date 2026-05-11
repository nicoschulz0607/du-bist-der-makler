import Anthropic from '@anthropic-ai/sdk'
import { trackAiCall } from './track'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface AiCallContext {
  callSite: string
  userId?: string
  listingId?: string
}

export async function claudeCreate(
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
  ctx: AiCallContext,
  options?: Parameters<typeof anthropic.messages.create>[1]
): Promise<Anthropic.Message> {
  const response = await anthropic.messages.create(params, options)
  trackAiCall({
    provider:     'anthropic',
    model:        params.model,
    callSite:     ctx.callSite,
    inputTokens:  response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    userId:       ctx.userId,
    listingId:    ctx.listingId,
  })
  return response
}

// Synchronous — returns the stream immediately, tracking fires after stream ends.
export function claudeStream(
  params: Anthropic.Messages.MessageStreamParams,
  ctx: AiCallContext
): ReturnType<typeof anthropic.messages.stream> {
  const stream = anthropic.messages.stream(params)
  stream
    .finalMessage()
    .then((finalMsg) => {
      trackAiCall({
        provider:     'anthropic',
        model:        params.model,
        callSite:     ctx.callSite,
        inputTokens:  finalMsg.usage.input_tokens,
        outputTokens: finalMsg.usage.output_tokens,
        userId:       ctx.userId,
        listingId:    ctx.listingId,
      })
    })
    .catch(() => {})
  return stream
}
