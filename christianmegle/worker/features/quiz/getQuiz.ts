import type { Env } from '../../lib/types';
import { json } from '../../lib/types';

export async function getQuiz(_request: Request, env: Env): Promise<Response> {
  const questions = await env.DB.prepare(
    `SELECT id, question, option_a, option_b, option_c, option_d, category, difficulty
     FROM quiz_questions ORDER BY RANDOM() LIMIT 10`
  ).all();

  const formatted = questions.results.map((q: any) => ({
    id: q.id,
    question: q.question,
    options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d },
    category: q.category,
    difficulty: q.difficulty,
  }));

  return json(formatted);
}
