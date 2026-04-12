import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Matchmaker } from '../../worker/matchmaker'

class MockWebSocket {
  readyState = 1
  private sentPayloads: unknown[] = []

  send(data: string) {
    this.sentPayloads.push(JSON.parse(data))
  }

  get messages() {
    return this.sentPayloads
  }
}

function createDbMock() {
  const statements: Array<{ sql: string; args: unknown[] }> = []

  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: (...args: unknown[]) => ({
        run: async () => {
          statements.push({ sql, args })
          return { success: true }
        },
      }),
    })),
  }

  return { db, statements }
}

function createMatchmaker() {
  const { db, statements } = createDbMock()

  const env = {
    DB: db,
    ADMIN_SECRET: 'secret',
    NOTIFICATION_EMAIL: 'test@example.com',
  } as any

  const matchmaker = new Matchmaker({} as any, env)
  return { matchmaker, statements }
}

async function flushAsyncWork() {
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeAll(() => {
  vi.stubGlobal('WebSocket', { OPEN: 1 } as any)
})

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('Matchmaker actual class', () => {
  it('matches a waiting priest with a sinner and records a DB session when priestId exists', async () => {
    const { matchmaker, statements } = createMatchmaker()
    const priestWs = new MockWebSocket()
    const sinnerWs = new MockWebSocket()

    ;(matchmaker as any).userConnections.set('priest-1', priestWs as any)
    ;(matchmaker as any).userConnections.set('sinner-1', sinnerWs as any)

    ;(matchmaker as any).handleJoin('priest-1', 'priest', priestWs as any, 'db-priest-1')

    expect(priestWs.messages).toEqual([{ type: 'waiting', position: 1 }])

    ;(matchmaker as any).handleJoin('sinner-1', 'sinner', sinnerWs as any)

    await flushAsyncWork()

    expect(priestWs.messages[priestWs.messages.length - 1]).toEqual({
      type: 'matched',
      partnerId: 'sinner-1',
      initiator: true,
    })

    expect(sinnerWs.messages[sinnerWs.messages.length - 1]).toEqual({
      type: 'matched',
      partnerId: 'priest-1',
      initiator: false,
    })

    expect(statements).toHaveLength(1)
    expect(statements[0].sql).toContain('INSERT INTO sessions')
    expect(statements[0].args[1]).toBe('db-priest-1')

    expect((matchmaker as any).waitingPriests.size).toBe(0)
    expect((matchmaker as any).waitingSinners.size).toBe(0)

    const priestSessionId = (matchmaker as any).userToSession.get('priest-1')
    const sinnerSessionId = (matchmaker as any).userToSession.get('sinner-1')

    expect(typeof priestSessionId).toBe('string')
    expect(sinnerSessionId).toBe(priestSessionId)
  })

  it('prunes dead sockets before selecting a live waiting partner', async () => {
    const { matchmaker } = createMatchmaker()
    const priestWs = new MockWebSocket()
    const deadSinnerWs = new MockWebSocket()
    const liveSinnerWs = new MockWebSocket()

    deadSinnerWs.readyState = 3

    ;(matchmaker as any).userConnections.set('priest-1', priestWs as any)
    ;(matchmaker as any).userConnections.set('dead-sinner', deadSinnerWs as any)
    ;(matchmaker as any).userConnections.set('live-sinner', liveSinnerWs as any)

    ;(matchmaker as any).userRoles.set('dead-sinner', 'sinner')
    ;(matchmaker as any).userRoles.set('live-sinner', 'sinner')

    ;(matchmaker as any).waitingSinners.set('dead-sinner', {
      ws: deadSinnerWs as any,
      role: 'sinner',
      joinedAt: 1,
    })

    ;(matchmaker as any).waitingSinners.set('live-sinner', {
      ws: liveSinnerWs as any,
      role: 'sinner',
      joinedAt: 2,
    })

    ;(matchmaker as any).handleJoin('priest-1', 'priest', priestWs as any)

    await flushAsyncWork()

    expect((matchmaker as any).waitingSinners.has('dead-sinner')).toBe(false)
    expect((matchmaker as any).userConnections.has('dead-sinner')).toBe(false)
    expect((matchmaker as any).userRoles.has('dead-sinner')).toBe(false)

    expect(priestWs.messages[priestWs.messages.length - 1]).toEqual({
      type: 'matched',
      partnerId: 'live-sinner',
      initiator: true,
    })

    expect(liveSinnerWs.messages[liveSinnerWs.messages.length - 1]).toEqual({
      type: 'matched',
      partnerId: 'priest-1',
      initiator: false,
    })
  })

  it('blocks priest-only actions from a sinner but relays them from a priest', () => {
    const { matchmaker } = createMatchmaker()
    const priestWs = new MockWebSocket()
    const sinnerWs = new MockWebSocket()

    ;(matchmaker as any).userConnections.set('priest-1', priestWs as any)
    ;(matchmaker as any).userConnections.set('sinner-1', sinnerWs as any)

    ;(matchmaker as any).userRoles.set('priest-1', 'priest')
    ;(matchmaker as any).userRoles.set('sinner-1', 'sinner')

    ;(matchmaker as any).sessions.set('session-1', {
      priest: 'priest-1',
      sinner: 'sinner-1',
      startedAt: Date.now(),
    })

    ;(matchmaker as any).userToSession.set('priest-1', 'session-1')
    ;(matchmaker as any).userToSession.set('sinner-1', 'session-1')

    ;(matchmaker as any).handleMessage(
      'sinner-1',
      { type: 'priest-bells' },
      sinnerWs as any
    )

    expect(priestWs.messages).toEqual([])

    ;(matchmaker as any).handleMessage(
      'priest-1',
      { type: 'priest-bells' },
      priestWs as any
    )

    expect(sinnerWs.messages[sinnerWs.messages.length - 1]).toEqual({
      type: 'priest-bells',
    })
  })

  it('ends a session, notifies the partner, and writes the ending to the DB', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:05.000Z'))

    const { matchmaker, statements } = createMatchmaker()
    const priestWs = new MockWebSocket()
    const sinnerWs = new MockWebSocket()

    ;(matchmaker as any).userConnections.set('priest-1', priestWs as any)
    ;(matchmaker as any).userConnections.set('sinner-1', sinnerWs as any)

    ;(matchmaker as any).sessions.set('session-1', {
      priest: 'priest-1',
      sinner: 'sinner-1',
      dbSessionId: 'db-session-1',
      startedAt: new Date('2026-01-01T00:00:00.000Z').getTime(),
    })

    ;(matchmaker as any).userToSession.set('priest-1', 'session-1')
    ;(matchmaker as any).userToSession.set('sinner-1', 'session-1')

    await (matchmaker as any).handleEndSession('priest-1')

    expect(sinnerWs.messages[sinnerWs.messages.length - 1]).toEqual({
      type: 'partner-left',
    })

    expect(statements).toHaveLength(1)
    expect(statements[0].sql).toContain('UPDATE sessions SET ended_at')
    expect(statements[0].args).toEqual(['priest', 5, 'db-session-1'])

    expect((matchmaker as any).sessions.size).toBe(0)
    expect((matchmaker as any).userToSession.has('priest-1')).toBe(false)
    expect((matchmaker as any).userToSession.has('sinner-1')).toBe(false)

    vi.useRealTimers()
  })

  it('rebroadcasts waiting positions after a disconnect', async () => {
    const { matchmaker } = createMatchmaker()
    const p1 = new MockWebSocket()
    const p2 = new MockWebSocket()
    const p3 = new MockWebSocket()

    ;(matchmaker as any).waitingPriests.set('p1', {
      ws: p1 as any,
      role: 'priest',
      joinedAt: 1,
    })
    ;(matchmaker as any).waitingPriests.set('p2', {
      ws: p2 as any,
      role: 'priest',
      joinedAt: 2,
    })
    ;(matchmaker as any).waitingPriests.set('p3', {
      ws: p3 as any,
      role: 'priest',
      joinedAt: 3,
    })

    ;(matchmaker as any).userConnections.set('p1', p1 as any)
    ;(matchmaker as any).userConnections.set('p2', p2 as any)
    ;(matchmaker as any).userConnections.set('p3', p3 as any)

    ;(matchmaker as any).userRoles.set('p1', 'priest')
    ;(matchmaker as any).userRoles.set('p2', 'priest')
    ;(matchmaker as any).userRoles.set('p3', 'priest')

    await (matchmaker as any).handleDisconnect('p2')

    expect((matchmaker as any).waitingPriests.has('p2')).toBe(false)
    expect((matchmaker as any).userConnections.has('p2')).toBe(false)
    expect((matchmaker as any).userRoles.has('p2')).toBe(false)

    expect(p1.messages[p1.messages.length - 1]).toEqual({
      type: 'waiting',
      position: 1,
    })

    expect(p3.messages[p3.messages.length - 1]).toEqual({
      type: 'waiting',
      position: 2,
    })
  })
})
