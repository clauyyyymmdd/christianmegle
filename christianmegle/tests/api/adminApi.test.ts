import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPriests, updatePriestStatus } from '../../src/features/admin/api/adminApi';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchPriests', () => {
  it('sends auth header and filter', async () => {
    const priests = [{ id: '1', display_name: 'Father A' }];
    mockFetch.mockResolvedValue({ status: 200, json: () => Promise.resolve(priests) });

    const result = await fetchPriests('http://localhost:8787', 'pending', 'secret123');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/admin/priests?status=pending', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret123',
      },
    });
    expect(result).toEqual({ priests, authenticated: true });
  });

  it('returns unauthenticated on 401', async () => {
    mockFetch.mockResolvedValue({ status: 401 });

    const result = await fetchPriests('http://localhost:8787', 'pending', 'wrong');

    expect(result).toEqual({ priests: [], authenticated: false });
  });
});

describe('updatePriestStatus', () => {
  it('POSTs approve action with auth', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await updatePriestStatus('http://localhost:8787', 'p1', 'approve', 'secret123');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/admin/priests/p1/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret123',
      },
      body: JSON.stringify({}),
    });
  });

  it('POSTs reject action', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await updatePriestStatus('http://localhost:8787', 'p2', 'reject', 'secret123');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8787/api/admin/priests/p2/reject',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
