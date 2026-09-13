import type { SessionEvent, SessionHeader } from '@deepseek-ai/dsh-session'

export interface PresetApi {
  resolveSessionPreset?: (session: { header: SessionHeader; events: readonly SessionEvent[] }) => string | undefined
  agentPresetProjectionDefinition?: {
    init(header: SessionHeader): string | null
    apply(state: string | null, event: SessionEvent): string | null
  }
}

export function resolvePresetFromApi(session: { header: SessionHeader; events: readonly SessionEvent[] }, api: PresetApi): string | undefined {
  if (typeof api.resolveSessionPreset === 'function') return api.resolveSessionPreset(session)
  const projection = api.agentPresetProjectionDefinition
  if (projection === undefined) throw new Error('deepseek-harness-weixin: no compatible agent preset resolver found')
  let state = projection.init(session.header)
  for (const event of session.events) state = projection.apply(state, event)
  return state ?? undefined
}

export async function resolveSessionPresetCompat(session: { header: SessionHeader; events: readonly SessionEvent[] }): Promise<string | undefined> {
  const api = await import('@deepseek-ai/dsh-agent-presets') as unknown as PresetApi
  return resolvePresetFromApi(session, api)
}
