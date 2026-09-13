import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { SessionEvent, SessionHeader, SessionId } from '@deepseek-ai/dsh-session'

export interface InspectedSession {
  meta: SessionHeader
  events: readonly SessionEvent[]
}

/** Read the durable event log across DSH rc7 and Session V3 runtimes. */
export function sessionEvents(agent: Agent): readonly SessionEvent[] {
  const session = agent.session as unknown as {
    snapshotEvents?: () => readonly SessionEvent[]
    events?: readonly SessionEvent[]
  }
  return session.snapshotEvents?.() ?? session.events ?? []
}

/** Read one persisted session across the pre-V3 inspect API and Session V3 handles. */
export async function inspectSession(ctx: Context, id: SessionId): Promise<InspectedSession> {
  const persistence = ctx.sessionPersistence as unknown as {
    inspect?: (sessionId: SessionId) => Promise<{ meta: SessionHeader; events: readonly SessionEvent[] }>
    open?: (sessionId: SessionId, access: 'read') => Promise<{
      header: SessionHeader
      read(): Promise<{ events: readonly SessionEvent[] }>
      close(): Promise<void>
    }>
  }
  if (persistence.inspect !== undefined) return persistence.inspect(id)
  if (persistence.open === undefined) throw new Error('DSH session persistence does not support inspection')
  const handle = await persistence.open(id, 'read')
  try {
    const result = await handle.read()
    return { meta: handle.header, events: result.events }
  } finally {
    await handle.close()
  }
}
