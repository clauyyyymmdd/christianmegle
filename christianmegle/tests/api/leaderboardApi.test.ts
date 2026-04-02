import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLeaderboard } from '../../src/features/leaderboard/api/leaderboardApi';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchLeaderboard', () => {
  it('calls GET /api/leaderboard', async () => {
    const rows = [{ display_name: 'Father Bob', pardons: 12 }];
    mockFetch.mockResolvedValue({ json: () => Promise.resolve(rows) });

    const result = await fetchLeaderboard('http://localhost:8787');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/leaderboard');
    expect(result).toEqual(rows);
  });

  it('returns empty array when no priests', async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve([]) });

    const result = await fetchLeaderboard('http://localhost:8787');

    expect(result).toEqual([]);
  });
});
