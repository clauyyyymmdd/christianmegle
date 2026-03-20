import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SignalingClient } from '../lib/signaling';
import { UserRole } from '../lib/types';
import VideoChat from '../components/VideoChat';
import BibleQuiz from '../components/BibleQuiz';
import LoadingScreen from '../components/LoadingScreen';

interface ConfessionalProps {
  apiUrl: string;
}

type Phase =
  | 'loading'
  | 'welcome-back'   // Returning priest recognized
  | 'quiz'           // Priest taking quiz
  | 'not-saved'      // Priest answered "No" to "Are you saved?"
  | 'applied'        // Priest passed quiz, awaiting approval
  | 'still-a-sinner' // Priest failed quiz, transitioning to sinner
  | 'waiting'        // In matchmaking queue
  | 'connected'      // In video session
  | 'ended';         // Session ended, option to rejoin

export default function Confessional({ apiUrl }: ConfessionalProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = (searchParams.get('role') as UserRole) || 'sinner';
  const [role, setRole] = useState<UserRole>(initialRole);
  const [phase, setPhase] = useState<Phase>('loading');
  const [priestId, setPriestId] = useState<string | null>(
    localStorage.getItem('christianmegle_priest_id')
  );
  const [priestName, setPriestName] = useState<string | null>(
    localStorage.getItem('christianmegle_priest_name')
  );
  const [waitingPosition, setWaitingPosition] = useState<number>(0);
  const signalingRef = useRef<SignalingClient | null>(null);

  useEffect(() => {
    if (initialRole === 'priest') {
      // Check if already approved
      if (priestId) {
        checkPriestStatus(priestId);
      } else {
        setPhase('quiz');
      }
    } else {
      // Sinners go straight to waiting
      connectToMatchmaker();
    }

    return () => {
      signalingRef.current?.disconnect();
    };
  }, []);

  const checkPriestStatus = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/priest/${id}`);
      const data = await res.json();

      if (data.status === 'approved') {
        // Save the display name
        if (data.displayName) {
          setPriestName(data.displayName);
          localStorage.setItem('christianmegle_priest_name', data.displayName);
        }
        // Show welcome back screen for returning priests
        setPhase('welcome-back');
      } else if (data.status === 'pending') {
        if (data.displayName) {
          setPriestName(data.displayName);
          localStorage.setItem('christianmegle_priest_name', data.displayName);
        }
        setPhase('applied');
        // Poll every 10 seconds
        const interval = setInterval(async () => {
          const check = await fetch(`${apiUrl}/api/priest/${id}`);
          const checkData = await check.json();
          if (checkData.status === 'approved') {
            clearInterval(interval);
            setPhase('welcome-back');
          } else if (checkData.status === 'rejected') {
            clearInterval(interval);
            localStorage.removeItem('christianmegle_priest_id');
            localStorage.removeItem('christianmegle_priest_name');
            setPriestId(null);
            setPriestName(null);
            setPhase('still-a-sinner');
          }
        }, 10000);
        return () => clearInterval(interval);
      } else {
        localStorage.removeItem('christianmegle_priest_id');
        localStorage.removeItem('christianmegle_priest_name');
        setPriestId(null);
        setPriestName(null);
        setPhase('quiz');
      }
    } catch {
      setPhase('quiz');
    }
  };

  const connectToMatchmaker = async (pId?: string) => {
    setPhase('waiting');
    const signaling = new SignalingClient(apiUrl);
    signalingRef.current = signaling;

    try {
      await signaling.connect(role, pId);

      signaling.onMessage((msg) => {
        if (msg.type === 'waiting') {
          setWaitingPosition(msg.position);
        }
        if (msg.type === 'matched') {
          setPhase('connected');
        }
      });
    } catch (e) {
      console.error('Failed to connect:', e);
    }
  };

  const handleQuizComplete = async (id: string, passed: boolean) => {
    if (passed) {
      setPriestId(id);
      localStorage.setItem('christianmegle_priest_id', id);
      setPhase('applied');
      checkPriestStatus(id);
    } else {
      // Failed quiz - show "still a sinner" screen then transition to sinner role
      setPhase('still-a-sinner');
    }
  };

  const handleBecomeSinner = () => {
    // Update role to sinner
    setRole('sinner');
    setSearchParams({ role: 'sinner' });
    // Connect to matchmaker as a sinner
    connectToMatchmaker();
  };

  const handleNotSaved = () => {
    setPhase('not-saved');
  };

  const handleStartOver = () => {
    // Clear priest status and retake quiz
    localStorage.removeItem('christianmegle_priest_id');
    localStorage.removeItem('christianmegle_priest_name');
    setPriestId(null);
    setPriestName(null);
    setPhase('quiz');
  };

  const handleSessionEnd = () => {
    setPhase('ended');
  };

  const handleRejoin = () => {
    connectToMatchmaker(priestId || undefined);
  };

  const handleEnterConfessional = () => {
    connectToMatchmaker(priestId || undefined);
  };

  // === Render based on phase ===

  if (phase === 'loading') {
    return <LoadingScreen />;
  }

  if (phase === 'welcome-back') {
    return (
      <div style={styles.centered} className="page-enter">
        <pre style={styles.asciiWelcome}>{`
╔══════════════════════════════════════╗
║                                      ║
║          CREDENTIALS VALID           ║
║                                      ║
╚══════════════════════════════════════╝
        `}</pre>
        <div style={styles.welcomePrompt}>
          <span style={styles.promptSymbol}>&gt; </span>
          <span>WELCOME BACK, </span>
          <span style={styles.priestNameHighlight}>{priestName || 'FATHER'}</span>
        </div>
        <p style={styles.statusText}>
          Your ordination remains valid. You may hear confessions.
        </p>
        <pre style={styles.statusBox}>{`
┌─────────────────────────────────┐
│ STATUS: APPROVED                │
│ ROLE: PRIEST                    │
│ GRACE: ACTIVE                   │
└─────────────────────────────────┘
        `}</pre>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={handleEnterConfessional}>
            Enter Confessional
          </button>
          <button onClick={handleStartOver} style={{ opacity: 0.6 }}>
            New Identity
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    return <BibleQuiz apiUrl={apiUrl} onComplete={handleQuizComplete} onNotSaved={handleNotSaved} />;
  }

  if (phase === 'not-saved') {
    return (
      <div style={styles.centered} className="page-enter">
        <pre style={styles.asciiError}>{`
╔══════════════════════════════════════╗
║            ⚠ ERROR ⚠                 ║
║      SALVATION NOT DETECTED          ║
╚══════════════════════════════════════╝
        `}</pre>
        <p style={styles.statusText}>
          To prevent going to the TRUE wrong place, repent for your sins.
        </p>
        <div style={styles.terminalDivider}>════════════════════════════</div>
        <p style={styles.transitionText}>
          &gt; REDIRECTING TO CONFESSION MODE...
        </p>
        <button
          onClick={handleBecomeSinner}
          style={{ marginTop: '1.5rem' }}
        >
          Repent as Sinner
        </button>
      </div>
    );
  }

  if (phase === 'applied') {
    return (
      <div style={styles.centered} className="page-enter">
        <pre style={styles.asciiPending}>{`
╔══════════════════════════════════════╗
║       APPLICATION SUBMITTED          ║
║                                      ║
║     ▓▓▓▓▓▓▓▓░░░░░░░░  50%           ║
╚══════════════════════════════════════╝
        `}</pre>
        <p style={styles.statusText}>
          Your application to serve as a priest is being reviewed.
          <br />
          Auto-approval in progress...
        </p>
        <div className="flicker" style={{ marginTop: '1.5rem', color: 'var(--amber)' }}>
          ▓▓▓░░░
        </div>
        <button
          onClick={handleStartOver}
          style={{ marginTop: '2rem', opacity: 0.5 }}
        >
          Start Over
        </button>
      </div>
    );
  }

  if (phase === 'still-a-sinner') {
    return (
      <div style={styles.centered} className="page-enter">
        <pre style={styles.asciiError}>{`
╔══════════════════════════════════════╗
║         ACCESS DENIED                ║
║   INSUFFICIENT SCRIPTURE KNOWLEDGE   ║
╚══════════════════════════════════════╝
        `}</pre>
        <p style={styles.statusText}>
          You have not demonstrated sufficient knowledge of scripture
          to serve as a priest.
        </p>
        <div style={styles.terminalDivider}>════════════════════════════</div>
        <p style={styles.transitionText}>
          &gt; REASSIGNING ROLE: SINNER
        </p>
        <button
          onClick={handleBecomeSinner}
          style={{ marginTop: '1.5rem' }}
        >
          Enter as Sinner
        </button>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div style={styles.centered} className="page-enter">
        <pre style={styles.asciiWaiting}>{`
     ║
     ║
 ════╬════
     ║
     ║
        `}</pre>
        <h2 style={{ marginTop: '1rem' }}>
          {role === 'priest' ? '> AWAITING PENITENT...' : '> AWAITING PRIEST...'}
        </h2>
        <p style={styles.statusText}>
          {role === 'priest'
            ? 'A soul in need of confession will be with you shortly.'
            : 'A priest will hear your confession shortly.'}
        </p>
        {waitingPosition > 0 && (
          <p style={styles.positionText}>
            QUEUE POSITION: {waitingPosition}
          </p>
        )}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/')}>
            Leave
          </button>
          {role === 'priest' && (
            <button onClick={handleStartOver} style={{ opacity: 0.7 }}>
              Retake Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'connected' && signalingRef.current) {
    return (
      <VideoChat
        signaling={signalingRef.current}
        role={role}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  if (phase === 'ended') {
    return (
      <div style={styles.centered} className="page-enter">
        <pre style={styles.asciiComplete}>{`
╔══════════════════════════════════════╗
║       SESSION TERMINATED             ║
║                                      ║
║       GRACE: DISPENSED               ║
╚══════════════════════════════════════╝
        `}</pre>
        <p style={styles.statusText}>
          {role === 'priest'
            ? 'May you continue to serve with grace.'
            : 'Go in peace. Your sins are heard.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={handleRejoin}>
            {role === 'priest' ? 'Hear Another' : 'Confess Again'}
          </button>
          <button onClick={() => navigate('/')}>Return Home</button>
        </div>
      </div>
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  centered: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
    background: 'var(--bg-primary)',
    fontFamily: 'var(--font-terminal)',
  },
  asciiWelcome: {
    color: 'var(--amber)',
    fontSize: '0.7rem',
    lineHeight: 1.3,
    margin: 0,
    textShadow: '0 0 15px rgba(255, 176, 0, 0.5)',
  },
  asciiPending: {
    color: 'var(--amber-dim)',
    fontSize: '0.7rem',
    lineHeight: 1.3,
    margin: 0,
  },
  asciiError: {
    color: 'var(--crimson)',
    fontSize: '0.7rem',
    lineHeight: 1.3,
    margin: 0,
    textShadow: '0 0 15px rgba(139, 30, 38, 0.5)',
  },
  asciiWaiting: {
    color: 'var(--amber)',
    fontSize: '0.9rem',
    lineHeight: 1.2,
    margin: 0,
    textShadow: '0 0 15px rgba(255, 176, 0, 0.5)',
  },
  asciiComplete: {
    color: 'var(--amber)',
    fontSize: '0.7rem',
    lineHeight: 1.3,
    margin: 0,
  },
  welcomePrompt: {
    marginTop: '1.5rem',
    fontSize: '1.1rem',
    color: 'var(--amber)',
  },
  promptSymbol: {
    color: 'var(--amber-dim)',
  },
  priestNameHighlight: {
    color: 'var(--amber-bright)',
    textShadow: '0 0 20px rgba(255, 176, 0, 0.8)',
  },
  statusBox: {
    color: 'var(--amber-dim)',
    fontSize: '0.65rem',
    lineHeight: 1.4,
    margin: '1.5rem 0 0 0',
  },
  terminalDivider: {
    color: 'var(--amber-dim)',
    fontSize: '0.7rem',
    margin: '1.5rem 0',
    letterSpacing: '-0.1em',
  },
  transitionText: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    color: 'var(--amber)',
  },
  statusText: {
    color: 'var(--text-secondary)',
    maxWidth: '400px',
    marginTop: '1rem',
    lineHeight: 1.8,
    fontSize: '0.9rem',
  },
  positionText: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    letterSpacing: '0.1em',
    color: 'var(--amber-dim)',
    marginTop: '1.5rem',
  },
};
