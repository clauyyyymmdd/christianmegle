import { describe, it, expect } from 'vitest';
import { createMockEnv, createMockDB } from './setup';
import { submitQuiz } from '../../worker/features/quiz/submitQuiz';

function makeRequest(body: object) {
  return new Request('http://localhost/api/quiz/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('submitQuiz', () => {
  it('returns 400 when no answers provided', async () => {
    const env = createMockEnv();

    const res = await submitQuiz(makeRequest({ answers: {}, displayName: 'Test' }), env);

    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toBe('No answers provided');
  });

  it('grades correct answers and returns passing score', async () => {
    const db = createMockDB();
    db._setResults([
      { id: 1, correct_option: 'b' },
      { id: 2, correct_option: 'c' },
    ]);
    const env = createMockEnv({ DB: db as any });

    const res = await submitQuiz(
      makeRequest({ answers: { '1': 'b', '2': 'c' }, displayName: 'Father Perfect' }),
      env,
    );
    const body = await res.json() as any;

    expect(body.score).toBe(2);
    expect(body.total).toBe(2);
    expect(body.passed).toBe(true);
    expect(body.priestId).toBeTruthy();
    expect(body.corrections).toEqual({});
  });

  it('marks wrong answers in corrections and fails', async () => {
    const db = createMockDB();
    db._setResults([
      { id: 1, correct_option: 'b' },
      { id: 2, correct_option: 'c' },
    ]);
    const env = createMockEnv({ DB: db as any });

    const res = await submitQuiz(
      makeRequest({ answers: { '1': 'a', '2': 'a' }, displayName: 'Father Wrong' }),
      env,
    );
    const body = await res.json() as any;

    expect(body.score).toBe(0);
    expect(body.passed).toBe(false);
    expect(body.corrections['1']).toEqual({ yours: 'a', correct: 'b' });
    expect(body.corrections['2']).toEqual({ yours: 'a', correct: 'c' });
  });

  it('passes at exactly 60% threshold', async () => {
    const db = createMockDB();
    // 3 out of 5 = 60%
    db._setResults([
      { id: 1, correct_option: 'a' },
      { id: 2, correct_option: 'b' },
      { id: 3, correct_option: 'c' },
      { id: 4, correct_option: 'd' },
      { id: 5, correct_option: 'a' },
    ]);
    const env = createMockEnv({ DB: db as any });

    const res = await submitQuiz(
      makeRequest({
        answers: { '1': 'a', '2': 'b', '3': 'c', '4': 'x', '5': 'x' },
        displayName: 'Father Borderline',
      }),
      env,
    );
    const body = await res.json() as any;

    expect(body.score).toBe(3);
    expect(body.total).toBe(5);
    expect(body.passed).toBe(true);
  });
});
