export type Question = {
  id: string;
  prompt: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
};

export const QUESTION_BANK: Question[] = Array.from({ length: 100 }).map((_, i) => ({
  id: `q${i + 1}`,
  prompt: `Purity question #${i + 1}`,
  options: ["Option A", "Option B", "Option C"],
  correctIndex: (i % 3) as 0 | 1 | 2,
}));

export function pickRandomQuestions(count: number): Question[] {
  const copy = [...QUESTION_BANK];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
