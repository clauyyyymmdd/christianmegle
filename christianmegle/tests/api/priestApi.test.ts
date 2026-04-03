import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPriestStatus } from '../../src/features/priest-onboarding/api/priestApi';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('checkPriestStatus', () => {
  it('calls the correct endpoint', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: 'approved', displayName: 'Father Bob' }),
    });

    await checkPriestStatus('http://localhost:8787', 'abc123');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/priest/abc123');
  });

  it('returns approved status with displayName', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: 'approved', displayName: 'Father Bob' }),
    });

    const result = await checkPriestStatus('http://localhost:8787', 'abc123');

    expect(result).toEqual({ status: 'approved', displayName: 'Father Bob' });
  });

  it('returns pending status', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: 'pending' }),
    });

    const result = await checkPriestStatus('http://localhost:8787', 'xyz');

    expect(result.status).toBe('pending');
  });
});
