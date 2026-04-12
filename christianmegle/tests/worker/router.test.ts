import { describe, it, expect, vi } from 'vitest'

// URLPattern is available in Cloudflare Workers but not in Node.
// Provide a minimal shim so the Router can be tested without adding deps.
if (typeof globalThis.URLPattern === 'undefined') {
  ;(globalThis as any).URLPattern = class URLPattern {
    private re: RegExp
    private paramNames: string[]

    constructor(init: { pathname: string }) {
      const names: string[] = []
      const re = init.pathname.replace(/:([^/]+)/g, (_m, name) => {
        names.push(name)
        return '([^/]+)'
      })
      this.re = new RegExp(`^${re}$`)
      this.paramNames = names
    }

    exec(input: URL | string): { pathname: { groups: Record<string, string> } } | null {
      const url = typeof input === 'string' ? new URL(input) : input
      const match = this.re.exec(url.pathname)
      if (!match) return null
      const groups: Record<string, string> = {}
      this.paramNames.forEach((name, i) => {
        groups[name] = match[i + 1]
      })
      return { pathname: { groups } }
    }
  }
}

import { Router } from '../../worker/lib/router'

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    ALLOWED_ORIGIN: '*',
    ...overrides,
  } as any
}

describe('Router', () => {
  it('dispatches GET routes and passes pathname params', async () => {
    const router = new Router()

    router.get('/api/priest/:id', (_request, _env, params) => {
      return Response.json({ id: params.id })
    })

    const response = await router.handle(
      new Request('https://example.com/api/priest/abc123', { method: 'GET' }),
      makeEnv()
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: 'abc123' })
  })

  it('matches all() routes regardless of method', async () => {
    const router = new Router()

    router.all('/ws', (request) => new Response(request.method))

    const response = await router.handle(
      new Request('https://example.com/ws', { method: 'POST' }),
      makeEnv()
    )

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('POST')
  })

  it('returns preflight OPTIONS responses with CORS headers', async () => {
    const router = new Router()

    const request = new Request('https://example.com/api/quiz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://app.example.com',
      },
    })

    const response = await router.handle(request, makeEnv())

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://app.example.com'
    )
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain(
      'Content-Type'
    )
    expect(response.headers.get('Vary')).toBe('Origin')
  })

  it('returns 404 with CORS headers when no route matches', async () => {
    const router = new Router()

    const request = new Request('https://example.com/missing', {
      method: 'GET',
      headers: {
        Origin: 'https://app.example.com',
      },
    })

    const response = await router.handle(
      request,
      makeEnv({ ALLOWED_ORIGIN: 'https://christianmegle.com' })
    )

    expect(response.status).toBe(404)
    await expect(response.text()).resolves.toBe('Not found')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://christianmegle.com'
    )
  })
})
