import { describe, it, expect, beforeEach } from 'vitest';
import { createMockEnv, createMockDB } from './setup';
import { getQuiz } from '../../worker/features/quiz/getQuiz';

describe('getQuiz', () => {
  it('returns formatted questions without correct answers', async () => {
    const db = createMockDB();
    db._setResults([
      { id: 1, question: 'Q1?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', category: 'scripture', difficulty: 1 },
      { id: 2, question: 'Q2?', option_a: 'W', option_b: 'X', option_c: 'Y', option_d: 'Z', category: 'weird', difficulty: 2 },
    ]);
    const env = createMockEnv({ DB: db as any });

    const res = await getQuiz(new Request('http://localhost/api/quiz'), env);
    const body = await res.json() as any[];

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({
      id: 1,
      question: 'Q1?',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      category: 'scripture',
      difficulty: 1,
    });
    expect(body[0]).not.toHaveProperty('correct_option');
    expect(body[0]).not.toHaveProperty('option_a');
  });

  it('includes CORS headers', async () => {
    const db = createMockDB();
    db._setResults([]);
    const env = createMockEnv({ DB: db as any });

    const res = await getQuiz(new Request('http://localhost/api/quiz'), env);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
