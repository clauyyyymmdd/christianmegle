import { describe, it, expect } from 'vitest';
import { createMockEnv, createMockDB } from './setup';
import { getPriestStatus } from '../../worker/features/priests/getPriestStatus';

describe('getPriestStatus', () => {
  it('returns 404 for unknown priest', async () => {
    const db = createMockDB();
    db._setFirst(null);
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'nope' });

    expect(res.status).toBe(404);
  });

  it('returns approved priest with displayName', async () => {
    const db = createMockDB();
    db._setFirst({ id: 'p1', display_name: 'Father Bob', status: 'approved' });
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'p1' });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body).toEqual({ id: 'p1', displayName: 'Father Bob', status: 'approved' });
  });

  it('returns pending when within 30 seconds', async () => {
    const db = createMockDB();
    db._setFirst({
      id: 'p2',
      display_name: 'Father New',
      status: 'pending',
      quiz_score: 8,
      quiz_total: 10,
      created_at: new Date().toISOString(),
    });
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'p2' });
    const body = await res.json() as any;

    expect(body.status).toBe('pending');
  });

  it('auto-approves passing priest after 30 seconds', async () => {
    const db = createMockDB();
    db._setFirst({
      id: 'p3',
      display_name: 'Father Old',
      status: 'pending',
      quiz_score: 8,
      quiz_total: 10,
      created_at: new Date(Date.now() - 60_000).toISOString(),
    });
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'p3' });
    const body = await res.json() as any;

    expect(body.status).toBe('approved');
  });

  it('does NOT auto-approve failing priest after 30 seconds', async () => {
    const db = createMockDB();
    db._setFirst({
      id: 'p4',
      display_name: 'Father Fail',
      status: 'pending',
      quiz_score: 2,
      quiz_total: 10,
      created_at: new Date(Date.now() - 60_000).toISOString(),
    });
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'p4' });
    const body = await res.json() as any;

    expect(body.status).toBe('pending');
  });
});
