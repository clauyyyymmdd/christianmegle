import { afterEach, describe, expect, it, vi } from 'vitest'
import { clientIp, rateLimit } from '../../worker/lib/rateLimit'

afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('allows requests until the limit is reached', () => {
    const key = `limit-${crypto.randomUUID()}`

    expect(rateLimit(key, 2, 1_000)).toEqual({ allowed: true, remaining: 1 })
    expect(rateLimit(key, 2, 1_000)).toEqual({ allowed: true, remaining: 0 })
    expect(rateLimit(key, 2, 1_000)).toEqual({ allowed: false, remaining: 0 })
  })

  it('resets after the window elapses', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const key = `reset-${crypto.randomUUID()}`

    expect(rateLimit(key, 1, 1_000)).toEqual({ allowed: true, remaining: 0 })
    expect(rateLimit(key, 1, 1_000)).toEqual({ allowed: false, remaining: 0 })

    vi.setSystemTime(new Date('2026-01-01T00:00:01.001Z'))

    expect(rateLimit(key, 1, 1_000)).toEqual({ allowed: true, remaining: 0 })
  })
})

describe('clientIp', () => {
  it('returns CF-Connecting-IP when present', () => {
    const request = new Request('https://example.com', {
      headers: {
        'CF-Connecting-IP': '203.0.113.10',
      },
    })

    expect(clientIp(request)).toBe('203.0.113.10')
  })

  it('falls back to "unknown" when the header is missing', () => {
    const request = new Request('https://example.com')

    expect(clientIp(request)).toBe('unknown')
  })
})
