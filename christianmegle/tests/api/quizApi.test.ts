import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchQuizQuestions, submitQuiz } from '../../src/features/priest-onboarding/api/quizApi';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchQuizQuestions', () => {
  it('calls GET /api/quiz', async () => {
    const questions = [{ id: 1, question: 'Q?', options: { a: 'A', b: 'B', c: 'C', d: 'D' } }];
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(questions) });

    const result = await fetchQuizQuestions('http://localhost:8787');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/quiz');
    expect(result).toEqual(questions);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchQuizQuestions('http://localhost:8787')).rejects.toThrow('HTTP 500');
  });

  it('throws when response is empty array', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    await expect(fetchQuizQuestions('http://localhost:8787')).rejects.toThrow('No questions returned');
  });

  it('throws when response is null', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(null) });

    await expect(fetchQuizQuestions('http://localhost:8787')).rejects.toThrow('No questions returned');
  });
});

describe('submitQuiz', () => {
  it('POSTs answers to /api/quiz/submit', async () => {
    const submission = { answers: { 1: 'a', 2: 'b' } as any, displayName: 'Father Test', heavenResponse: 'Grace' };
    const response = { passed: true, score: 8, total: 10, message: 'ok', priestId: 'p1' };
    mockFetch.mockResolvedValue({ json: () => Promise.resolve(response) });

    const result = await submitQuiz('http://localhost:8787', submission);

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    expect(result).toEqual(response);
  });
});
