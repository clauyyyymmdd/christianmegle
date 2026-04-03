import { QuizQuestion } from '../../../lib/types';

export interface QuizSubmission {
  answers: Record<number, string>;
  displayName: string;
  heavenResponse: string;
}

export interface QuizResult {
  passed: boolean;
  score: number;
  total: number;
  message: string;
  priestId: string;
}

export async function fetchQuizQuestions(apiUrl: string): Promise<QuizQuestion[]> {
  const res = await fetch(`${apiUrl}/api/quiz`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data || data.length === 0) {
    throw new Error('No questions returned');
  }
  return data;
}

export async function submitQuiz(apiUrl: string, submission: QuizSubmission): Promise<QuizResult> {
  const res = await fetch(`${apiUrl}/api/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });
  return res.json();
}
