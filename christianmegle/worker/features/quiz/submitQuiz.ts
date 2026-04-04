import type { Env } from '../../lib/types';
import { json } from '../../lib/types';
import { sendNotification } from '../email/send';
import { rateLimit, clientIp } from '../../lib/rateLimit';
import { sanitizeString } from '../../lib/validate';

interface SubmitBody {
  answers: Record<string, string>;
  displayName: string;
  email?: string;
  heavenResponse?: string;
}

export async function submitQuiz(request: Request, env: Env): Promise<Response> {
  // Rate limit: 3 submissions per IP per hour
  const ip = clientIp(request);
  const rl = rateLimit(`quiz:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
  }

  const body: SubmitBody = await request.json();

  // Validate displayName
  const displayName = sanitizeString(body.displayName, 100);
  if (!displayName) {
    return json({ error: 'Display name is required (max 100 chars)' }, { status: 400 });
  }

  // Validate answers
  const questionIds = Object.keys(body.answers);
  if (questionIds.length === 0 || questionIds.length > 50) {
    return json({ error: 'Invalid answers' }, { status: 400 });
  }

  // Validate each answer is a single letter
  const validOptions = new Set(['a', 'b', 'c', 'd']);
  for (const answer of Object.values(body.answers)) {
    if (!validOptions.has(answer)) {
      return json({ error: 'Invalid answer option' }, { status: 400 });
    }
  }

  // Validate heavenResponse length
  const heavenResponse = body.heavenResponse ? sanitizeString(body.heavenResponse, 2000) : null;

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
    .bind(priestId, displayName, body.email?.slice(0, 254) || null, score, total, heavenResponse)
    .run();

  try {
    await sendNotification(env, {
      type: 'priest-application',
      displayName,
      quizScore: score,
      quizTotal: total,
      passed,
      heavenResponse: heavenResponse || undefined,
    });
  } catch (e) {
    console.error('Failed to send priest application email');
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
