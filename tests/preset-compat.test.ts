import { describe, expect, it } from 'vitest'
import { resolvePresetFromApi, type PresetApi } from '../src/preset-compat.js'
import type { SessionHeader } from '@deepseek-ai/dsh-session'

const header = { agentPreset: 'standard' } as unknown as SessionHeader & { agentPreset?: string }

describe('agent preset compatibility', () => {
  it('uses the legacy resolver when available', () => {
    expect(resolvePresetFromApi({ header, events: [] }, { resolveSessionPreset: () => 'legacy' })).toBe('legacy')
  })

  it('folds the current projection and selected event', () => {
    const api = { agentPresetProjectionDefinition: { init: (value: typeof header) => value.agentPreset ?? null, apply: (state: string | null, event: { type?: string; data?: { agentPreset?: string } }) => event.type === 'agent-preset/selected' ? event.data?.agentPreset ?? state : state } } as unknown as PresetApi
    expect(resolvePresetFromApi({ header, events: [{ type: 'agent-preset/selected', data: { agentPreset: 'minimal' } }] as never }, api)).toBe('minimal')
  })

  it('returns undefined when no preset is configured', () => {
    const api = { agentPresetProjectionDefinition: { init: () => null, apply: (state: string | null) => state } }
    expect(resolvePresetFromApi({ header: {} as never, events: [] }, api)).toBeUndefined()
  })
})
