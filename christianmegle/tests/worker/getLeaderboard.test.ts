import { describe, it, expect } from 'vitest';
import { createMockEnv, createMockDB } from './setup';
import { getLeaderboard } from '../../worker/features/leaderboard/getLeaderboard';

describe('getLeaderboard', () => {
  it('returns leaderboard rows', async () => {
    const db = createMockDB();
    db._setResults([
      { display_name: 'Father Many', pardons: 12 },
      { display_name: 'Father Few', pardons: 3 },
    ]);
    const env = createMockEnv({ DB: db as any });

    const res = await getLeaderboard(new Request('http://localhost/api/leaderboard'), env);
    const body = await res.json() as any[];

    expect(res.status).toBe(200);
    expect(body).toEqual([
      { display_name: 'Father Many', pardons: 12 },
      { display_name: 'Father Few', pardons: 3 },
    ]);
  });

  it('returns empty array when no data', async () => {
    const db = createMockDB();
    db._setResults([]);
    const env = createMockEnv({ DB: db as any });

    const res = await getLeaderboard(new Request('http://localhost/api/leaderboard'), env);
    const body = await res.json() as any[];

    expect(body).toEqual([]);
  });

  it('includes CORS headers', async () => {
    const db = createMockDB();
    db._setResults([]);
    const env = createMockEnv({ DB: db as any });

    const res = await getLeaderboard(new Request('http://localhost/api/leaderboard'), env);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
