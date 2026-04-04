import { useState, useEffect } from 'react';
import { QuizQuestion } from '../lib/types';
import { fetchQuizQuestions, submitQuiz } from '../features/priest-onboarding/api/quizApi';

interface BibleQuizProps {
  apiUrl: string;
  onComplete: (priestId: string, passed: boolean) => void;
  onNotSaved: () => void;
}

export default function BibleQuiz({ apiUrl, onComplete, onNotSaved }: BibleQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [phase, setPhase] = useState<'name' | 'saved' | 'heaven' | 'quiz' | 'submitting' | 'result'>('name');
  const [result, setResult] = useState<any>(null);
  const [heavenResponse, setHeavenResponse] = useState('');
  const [showCheatingModal, setShowCheatingModal] = useState(false);
  const [cheatingCount, setCheatingCount] = useState(0);
  const [showShortResponseModal, setShowShortResponseModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Detect tab switching / clicking away during quiz
  useEffect(() => {
    if (phase !== 'quiz') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowCheatingModal(true);
        setCheatingCount((prev) => prev + 1);
      }
    };

    const handleBlur = () => {
      setShowCheatingModal(true);
      setCheatingCount((prev) => prev + 1);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [phase]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuizQuestions(apiUrl);
      setQuestions(data);
    } catch (e) {
      console.error('Failed to fetch quiz:', e);
      setError(e instanceof Error ? e.message : 'Failed to load questions');
    } finally {
      setLoading(false);
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
      const data = await submitQuiz(apiUrl, { answers, displayName, heavenResponse });
      setResult(data);
      setPhase('result');
    } catch (e) {
      console.error('Failed to submit quiz:', e);
      setPhase('quiz');
    }
  };

  // === "Are you saved?" phase ===
  if (phase === 'saved') {
    return (
      <div style={styles.container} className="page-enter">
        <span style={styles.icon}>✝</span>
        <h2>Are You Saved?</h2>
        <p style={styles.description}>
          Before you may shepherd others, you must know your own salvation.
        </p>

        <div style={styles.savedOptions}>
          <button
            onClick={() => setPhase('heaven')}
            style={styles.savedButton}
          >
            Yes
          </button>
          <button
            onClick={onNotSaved}
            style={styles.savedButton}
          >
            No
          </button>
        </div>
      </div>
    );
  }

  // === "Will you go to heaven?" phase ===
  if (phase === 'heaven') {
    const hasEnoughText = heavenResponse.trim().length >= 10;
    const needsRetry = !loading && (error || questions.length === 0);

    const handleHeavenSubmit = () => {
      // Check text length first, before anything else
      if (!hasEnoughText) {
        setShowShortResponseModal(true);
        return;
      }
      if (loading) return;
      if (needsRetry) {
        fetchQuestions();
      } else {
        setPhase('quiz');
      }
    };

    return (
      <div style={styles.container} className="page-enter">
        {/* Short Response Modal */}
        {showShortResponseModal && (
          <div style={styles.cheatingOverlay}>
            <div style={styles.cheatingModal}>
              <span style={styles.cheatingIcon}>✍</span>
              <h2 style={styles.shortResponseTitle}>Say How You REALLY Feel</h2>
              <p style={styles.cheatingText}>
                Your eternal soul deserves more than {heavenResponse.trim().length} characters.
              </p>
              <button
                onClick={() => setShowShortResponseModal(false)}
                style={{ marginTop: '1.5rem' }}
              >
                I'll Elaborate
              </button>
            </div>
          </div>
        )}

        <span style={styles.icon}>☁</span>
        <h2>Will You Go to Heaven?</h2>
        <p style={styles.description}>
          Explain why you believe you will enter the Kingdom of Heaven.
        </p>

        <div style={styles.heavenForm}>
          <textarea
            value={heavenResponse}
            onChange={(e) => setHeavenResponse(e.target.value.slice(0, 500))}
            placeholder="I will go to heaven because..."
            style={styles.textarea}
            autoFocus
          />
          <div style={styles.charCount}>
            {heavenResponse.length}/500 characters
          </div>
          {needsRetry && (
            <p style={{ color: 'var(--crimson)', marginTop: '1rem', fontSize: '0.9rem' }}>
              {error || 'Failed to load questions'}
            </p>
          )}
          <button
            onClick={handleHeavenSubmit}
            disabled={loading}
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Loading Questions...' : needsRetry ? 'Retry Loading' : 'Begin the Examination'}
          </button>
        </div>
      </div>
    );
  }

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
            onClick={() => setPhase('saved')}
            disabled={!displayName.trim()}
            style={{ marginTop: '1.5rem' }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // === Quiz phase ===
  if (phase === 'quiz' || phase === 'submitting') {
    // Show loading state
    if (loading) {
      return (
        <div style={styles.container} className="page-enter">
          <div className="flicker" style={{ fontSize: '3rem' }}>📖</div>
          <p style={styles.description}>Loading the examination...</p>
        </div>
      );
    }

    // Show error state
    if (error || questions.length === 0) {
      return (
        <div style={styles.container} className="page-enter">
          <span style={styles.icon}>⚠</span>
          <h2>Failed to Load Questions</h2>
          <p style={styles.description}>
            {error || 'No questions available. Please try again.'}
          </p>
          <button onClick={fetchQuestions} style={{ marginTop: '1.5rem' }}>
            Retry
          </button>
        </div>
      );
    }

    const question = questions[currentIndex];
    if (!question) return null;

    const allAnswered = Object.keys(answers).length === questions.length;

    return (
      <div style={styles.container} className="page-enter">
        {/* Cheating Modal */}
        {showCheatingModal && (
          <div style={styles.cheatingOverlay}>
            <div style={styles.cheatingModal}>
              <span style={styles.cheatingIcon}>👁</span>
              <h2 style={styles.cheatingTitle}>No Cheating</h2>
              <p style={styles.cheatingText}>God is watching.</p>
              {cheatingCount > 1 && (
                <p style={styles.cheatingWarning}>
                  You have looked away {cheatingCount} times.
                </p>
              )}
              <button
                onClick={() => setShowCheatingModal(false)}
                style={{ marginTop: '1.5rem' }}
              >
                I Repent
              </button>
            </div>
          </div>
        )}

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

        {/* Question */}
        <h2 style={styles.question}>{question.question}</h2>

        {/* Options */}
        <div style={styles.options}>
          {(['a', 'b', 'c', 'd'] as const).map((key) => {
            const isSelected = answers[question.id] === key;
            return (
              <div
                key={key}
                onClick={() => handleAnswer(question.id, key)}
                style={{
                  ...styles.option,
                  ...(isSelected ? styles.optionSelected : {}),
                }}
              >
                <span style={styles.optionKey}>[{key.toUpperCase()}]</span>
                <span style={styles.optionText}>
                  {question.options[key]}
                </span>
              </div>
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

  // Auto-advance to pending approval when quiz is passed
  useEffect(() => {
    if (phase === 'result' && result?.passed) {
      const timer = setTimeout(() => onComplete(result.priestId, true), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, result]);

  // === Result phase ===
  if (phase === 'result' && result) {
    if (result.passed) {
      return (
        <div style={styles.container} className="page-enter">
          <span style={styles.icon}>☦</span>
          <h2>You Have Passed</h2>
          <p style={styles.score}>
            {result.score} of {result.total} correct
          </p>
          <p style={styles.description}>{result.message}</p>
          <div className="flicker" style={{ marginTop: '1.5rem', color: 'var(--gold)' }}>
            ▓▓▓░░░
          </div>
        </div>
      );
    }

    return (
      <div style={styles.container} className="page-enter">
        <span style={styles.icon}>✝</span>
        <h2>You Have Not Passed</h2>
        <p style={styles.score}>
          {result.score} of {result.total} correct
        </p>
        <p style={styles.description}>{result.message}</p>
        <button
          onClick={() => onComplete(result.priestId, result.passed)}
          style={{ marginTop: '2rem' }}
        >
          Return
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
  question: {
    fontFamily: 'var(--font-body)',
    fontSize: '1.2rem',
    maxWidth: '600px',
    lineHeight: 1.6,
    textTransform: 'none',
    letterSpacing: 'normal',
    fontWeight: 400,
    fontStyle: 'italic',
    color: 'var(--ivory)',
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
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    width: '100%',
    textTransform: 'none',
    letterSpacing: 'normal',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    border: '1px solid var(--ivory-dim)',
    background: 'rgba(0, 0, 0, 0.5)',
    color: 'var(--ivory)',
  },
  optionSelected: {
    borderColor: 'var(--ivory)',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  optionKey: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
    color: 'var(--ivory-dim)',
    flexShrink: 0,
  },
  optionText: {
    color: 'var(--ivory)',
    fontStyle: 'italic',
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
  savedOptions: {
    display: 'flex',
    gap: '2rem',
    marginTop: '2rem',
  },
  savedButton: {
    minWidth: '120px',
    padding: '1rem 2rem',
  },
  heavenForm: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1.5rem',
    width: '100%',
    maxWidth: '500px',
  },
  textarea: {
    width: '100%',
    minHeight: '150px',
    padding: '1rem',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    lineHeight: 1.6,
    resize: 'vertical',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--text-dim)',
    color: 'var(--text-primary)',
  },
  charCount: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    alignSelf: 'flex-end',
  },
  cheatingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 9, 8, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  cheatingModal: {
    background: 'var(--bg-elevated)',
    border: '2px solid var(--crimson)',
    padding: '3rem',
    textAlign: 'center',
    maxWidth: '400px',
  },
  cheatingIcon: {
    fontSize: '4rem',
    display: 'block',
    marginBottom: '1rem',
  },
  cheatingTitle: {
    color: 'var(--crimson)',
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  cheatingText: {
    fontFamily: 'var(--font-body)',
    fontSize: '1.2rem',
    fontStyle: 'italic',
    color: 'var(--gold)',
  },
  cheatingWarning: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    marginTop: '1rem',
  },
  shortResponseTitle: {
    color: 'var(--gold)',
    fontSize: '1.8rem',
    marginBottom: '0.5rem',
  },
};
