import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportBug } from '../../src/features/email/api/reportBugApi';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('reportBug', () => {
  it('POSTs description to /api/report-bug', async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ success: true }) });

    const result = await reportBug('http://localhost:8787', 'Button is broken');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/report-bug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Button is broken', url: undefined }),
    });
    expect(result).toEqual({ success: true });
  });

  it('includes url when provided', async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ success: true }) });

    await reportBug('http://localhost:8787', 'Page broken', 'https://example.com/page');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/report-bug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Page broken', url: 'https://example.com/page' }),
    });
  });

  it('returns server response', async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ success: false }) });

    const result = await reportBug('http://localhost:8787', 'test');

    expect(result).toEqual({ success: false });
  });
});
