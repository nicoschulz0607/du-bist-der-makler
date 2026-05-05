import { readFileSync } from 'fs'
import { join } from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchUserContext } from './fetch-user-context'

const IDENTITY = readFileSync(join(process.cwd(), 'lib/klara/identity.md'), 'utf-8')
const KNOWLEDGE = readFileSync(join(process.cwd(), 'lib/klara/knowledge.md'), 'utf-8')

export async function buildSystemPrompt(
  userId: string,
  contextOrigin: string,
  supabase: SupabaseClient
): Promise<string> {
  const userContext = await fetchUserContext(userId, contextOrigin, supabase)

  return `${IDENTITY}

---

# PLATTFORM-KNOWLEDGE

${KNOWLEDGE}

---

# USER-KONTEXT (Stand: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })})

${userContext}`
}
