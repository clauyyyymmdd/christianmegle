import { describe, it, expect } from 'vitest';
import { createMockEnv, createMockDB } from './setup';
import { getPriestStatus } from '../../worker/features/priests/getPriestStatus';

describe('getPriestStatus', () => {
  it('returns 400 for invalid priest ID format', async () => {
    const env = createMockEnv();

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'INVALID!' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown priest', async () => {
    const db = createMockDB();
    db._setFirst(null);
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'aabbccdd11223344' });

    expect(res.status).toBe(404);
  });

  it('returns approved priest with displayName', async () => {
    const db = createMockDB();
    db._setFirst({ id: 'aabbccdd11223344', display_name: 'Father Bob', status: 'approved' });
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'aabbccdd11223344' });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body).toEqual({ id: 'aabbccdd11223344', displayName: 'Father Bob', status: 'approved' });
  });

  it('returns pending when within 30 seconds', async () => {
    const db = createMockDB();
    db._setFirst({
      id: 'aabbccdd22334455',
      display_name: 'Father New',
      status: 'pending',
      quiz_score: 8,
      quiz_total: 10,
      created_at: new Date().toISOString(),
    });
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'aabbccdd22334455' });
    const body = await res.json() as any;

    expect(body.status).toBe('pending');
  });

  it('auto-approves passing priest after 30 seconds', async () => {
    const db = createMockDB();
    db._setFirst({
      id: 'aabbccdd33445566',
      display_name: 'Father Old',
      status: 'pending',
      quiz_score: 8,
      quiz_total: 10,
      created_at: new Date(Date.now() - 60_000).toISOString(),
    });
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'aabbccdd33445566' });
    const body = await res.json() as any;

    expect(body.status).toBe('approved');
  });

  it('does NOT auto-approve failing priest after 30 seconds', async () => {
    const db = createMockDB();
    db._setFirst({
      id: 'aabbccdd44556677',
      display_name: 'Father Fail',
      status: 'pending',
      quiz_score: 2,
      quiz_total: 10,
      created_at: new Date(Date.now() - 60_000).toISOString(),
    });
    const env = createMockEnv({ DB: db as any });

    const res = await getPriestStatus(new Request('http://localhost'), env, { id: 'aabbccdd44556677' });
    const body = await res.json() as any;

    expect(body.status).toBe('pending');
  });
});
