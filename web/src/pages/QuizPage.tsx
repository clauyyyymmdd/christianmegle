import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pickRandomQuestions, Question } from "../lib/questions";
import { setPriestOk } from "../lib/session";

type Answers = Record<string, 0 | 1 | 2>;

export default function QuizPage() {
  const navigate = useNavigate();
  const questions = useMemo(() => pickRandomQuestions(10), []);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  function setAnswer(q: Question, idx: 0 | 1 | 2) {
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
  }

  const canSubmit = Object.keys(answers).length === questions.length;

  function submit() {
    let s = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) s++;
    }
    setScore(s);
    setSubmitted(true);
    setPriestOk(s >= 7);
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Purity of Heart Quiz</h1>
      <p>10 questions. Pass = 7/10.</p>

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600 }}>
              {i + 1}. {q.prompt}
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {q.options.map((opt, idx) => {
                const j = idx as 0 | 1 | 2;
                return (
                  <label key={opt} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="radio"
                      name={q.id}
                      disabled={submitted}
                      checked={answers[q.id] === j}
                      onChange={() => setAnswer(q, j)}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        {!submitted ? (
          <button onClick={submit} disabled={!canSubmit} style={{ padding: "10px 14px" }}>
            Submit
          </button>
        ) : (
          <button onClick={() => navigate("/waiting")} style={{ padding: "10px 14px" }}>
            Continue
          </button>
        )}
      </div>

      {submitted && score !== null && (
        <div style={{ marginTop: 16 }}>
          Score: {score}/10 — {score >= 7 ? "Eligible." : "Not eligible."}
        </div>
      )}
    </div>
  );
}
