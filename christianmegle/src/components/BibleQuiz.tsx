import { useState, useEffect } from 'react';
import { QuizQuestion } from '../lib/types';

interface BibleQuizProps {
  apiUrl: string;
  onComplete: (priestId: string, passed: boolean) => void;
}

export default function BibleQuiz({ apiUrl, onComplete }: BibleQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [phase, setPhase] = useState<'name' | 'quiz' | 'submitting' | 'result'>('name');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/quiz`);
      const data = await res.json();
      setQuestions(data);
    } catch (e) {
      console.error('Failed to fetch quiz:', e);
    }
  };

  const handleAnswer = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));

    // Auto-advance after a brief pause
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 400);
  };

  const handleSubmit = async () => {
    setPhase('submitting');

    try {
      const res = await fetch(`${apiUrl}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, displayName }),
      });
      const data = await res.json();
      setResult(data);
      setPhase('result');
    } catch (e) {
      console.error('Failed to submit quiz:', e);
      setPhase('quiz');
    }
  };

  // === Name entry phase ===
  if (phase === 'name') {
    return (
      <div style={styles.container} className="page-enter">
        <span style={styles.icon}>☦</span>
        <h2>Become a Priest</h2>
        <p style={styles.description}>
          To hear confessions, you must first demonstrate knowledge of scripture
          and the compassion required of a confessor.
        </p>

        <div className="divider" style={{ width: '300px' }}>
          <span className="cross">✦</span>
        </div>

        <div style={styles.nameForm}>
          <label style={styles.label}>By what name shall you be known?</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Father..."
            style={styles.input}
            autoFocus
          />
          <button
            onClick={() => setPhase('quiz')}
            disabled={!displayName.trim()}
            style={{ marginTop: '1.5rem' }}
          >
            Begin the Examination
          </button>
        </div>
      </div>
    );
  }

  // === Quiz phase ===
  if (phase === 'quiz' || phase === 'submitting') {
    const question = questions[currentIndex];
    if (!question) return null;

    const allAnswered = Object.keys(answers).length === questions.length;

    return (
      <div style={styles.container} className="page-enter">
        {/* Progress */}
        <div style={styles.progress}>
          <span style={styles.progressText}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Category tag */}
        <span style={styles.categoryTag}>{question.category}</span>

        {/* Question */}
        <h2 style={styles.question}>{question.question}</h2>

        {/* Options */}
        <div style={styles.options}>
          {(['a', 'b', 'c', 'd'] as const).map((key) => {
            const isSelected = answers[question.id] === key;
            return (
              <button
                key={key}
                onClick={() => handleAnswer(question.id, key)}
                style={{
                  ...styles.option,
                  ...(isSelected ? styles.optionSelected : {}),
                }}
              >
                <span style={styles.optionKey}>{key.toUpperCase()}</span>
                <span style={styles.optionText}>
                  {question.options[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={styles.nav}>
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              disabled={!answers[question.id]}
            >
              Next →
            </button>
          ) : (
            <button
              className="primary"
              onClick={handleSubmit}
              disabled={!allAnswered || phase === 'submitting'}
            >
              {phase === 'submitting' ? 'Submitting...' : 'Submit Examination'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // === Result phase ===
  if (phase === 'result' && result) {
    return (
      <div style={styles.container} className="page-enter">
        <span style={styles.icon}>{result.passed ? '☦' : '✝'}</span>
        <h2>{result.passed ? 'You Have Passed' : 'You Have Not Passed'}</h2>
        <p style={styles.score}>
          {result.score} of {result.total} correct
        </p>
        <p style={styles.description}>{result.message}</p>
        <button
          onClick={() => onComplete(result.priestId, result.passed)}
          style={{ marginTop: '2rem' }}
        >
          {result.passed ? 'Await Approval' : 'Return'}
        </button>
      </div>
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
    background: `
      radial-gradient(ellipse at 50% 30%, rgba(107, 28, 35, 0.1) 0%, transparent 50%),
      var(--bg-primary)
    `,
  },
  icon: {
    fontSize: '2.5rem',
    color: 'var(--gold-dim)',
    marginBottom: '1rem',
  },
  description: {
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    maxWidth: '450px',
    marginTop: '1rem',
    lineHeight: 1.8,
  },
  nameForm: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  label: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    letterSpacing: '0.1em',
    color: 'var(--gold-dim)',
    textTransform: 'uppercase',
  },
  input: {
    width: '300px',
    textAlign: 'center',
    fontSize: '1.1rem',
  },
  progress: {
    width: '100%',
    maxWidth: '500px',
    marginBottom: '2rem',
  },
  progressText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
  },
  progressBar: {
    width: '100%',
    height: '2px',
    background: 'var(--bg-secondary)',
    marginTop: '0.5rem',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--gold-dim)',
    transition: 'width 0.4s ease',
  },
  categoryTag: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--crimson)',
    marginBottom: '1rem',
  },
  question: {
    fontSize: '1.4rem',
    maxWidth: '600px',
    lineHeight: 1.5,
    textTransform: 'none',
    letterSpacing: 'normal',
    fontWeight: 400,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '2rem',
    width: '100%',
    maxWidth: '500px',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    textAlign: 'left',
    width: '100%',
    textTransform: 'none',
    letterSpacing: 'normal',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
  },
  optionSelected: {
    borderColor: 'var(--gold)',
    background: 'rgba(201, 168, 76, 0.05)',
  },
  optionKey: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    color: 'var(--gold-dim)',
    flexShrink: 0,
    width: '1.5rem',
  },
  optionText: {
    color: 'var(--text-primary)',
  },
  nav: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  score: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    letterSpacing: '0.1em',
    color: 'var(--gold)',
    marginTop: '0.5rem',
  },
};
