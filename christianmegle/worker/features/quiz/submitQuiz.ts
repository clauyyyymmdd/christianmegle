import type { Env } from '../../lib/types';
import { json } from '../../lib/types';
import { sendNotification } from '../email/send';

interface SubmitBody {
  answers: Record<string, string>;
  displayName: string;
  email?: string;
  heavenResponse?: string;
}

export async function submitQuiz(request: Request, env: Env): Promise<Response> {
  const body: SubmitBody = await request.json();

  const questionIds = Object.keys(body.answers);
  if (questionIds.length === 0) {
    return json({ error: 'No answers provided' }, { status: 400 });
  }

  const placeholders = questionIds.map(() => '?').join(',');
  const questions = await env.DB.prepare(
    `SELECT id, correct_option FROM quiz_questions WHERE id IN (${placeholders})`
  )
    .bind(...questionIds.map(Number))
    .all();

  let score = 0;
  const corrections: Record<string, { yours: string; correct: string }> = {};

  questions.results.forEach((q: any) => {
    const userAnswer = body.answers[String(q.id)];
    if (userAnswer === q.correct_option) {
      score++;
    } else {
      corrections[String(q.id)] = { yours: userAnswer, correct: q.correct_option };
    }
  });

  const total = questions.results.length;
  const passed = score >= Math.ceil(total * 0.6);

  const priestId = crypto.randomUUID().slice(0, 16);
  await env.DB.prepare(
    `INSERT INTO priests (id, display_name, email, quiz_score, quiz_total, status, heaven_response)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  )
    .bind(priestId, body.displayName, body.email || null, score, total, body.heavenResponse || null)
    .run();

  try {
    await sendNotification(env, {
      type: 'priest-application',
      displayName: body.displayName,
      quizScore: score,
      quizTotal: total,
      passed,
      heavenResponse: body.heavenResponse,
    });
  } catch (e) {
    console.error('Failed to send priest application email:', e);
  }

  return json({
    priestId,
    score,
    total,
    passed,
    corrections,
    message: passed
      ? 'You have demonstrated sufficient knowledge. Your application is pending approval.'
      : 'You have not demonstrated sufficient knowledge of scripture. You may retake the quiz.',
  });
}
