import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SignalingClient } from '../lib/signaling';
import { UserRole } from '../lib/types';
import VideoChat from '../components/VideoChat';
import BibleQuiz from '../components/BibleQuiz';

interface ConfessionalProps {
  apiUrl: string;
}

type Phase =
  | 'loading'
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
        connectToMatchmaker(id);
      } else if (data.status === 'pending') {
        setPhase('applied');
        // Poll every 10 seconds
        const interval = setInterval(async () => {
          const check = await fetch(`${apiUrl}/api/priest/${id}`);
          const checkData = await check.json();
          if (checkData.status === 'approved') {
            clearInterval(interval);
            connectToMatchmaker(id);
          } else if (checkData.status === 'rejected') {
            clearInterval(interval);
            localStorage.removeItem('christianmegle_priest_id');
            setPriestId(null);
            setPhase('still-a-sinner');
          }
        }, 10000);
        return () => clearInterval(interval);
      } else {
        localStorage.removeItem('christianmegle_priest_id');
        setPriestId(null);
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

  const handleSessionEnd = () => {
    setPhase('ended');
  };

  const handleRejoin = () => {
    connectToMatchmaker(priestId || undefined);
  };

  // === Render based on phase ===

  if (phase === 'loading') {
    return (
      <div style={styles.centered} className="page-enter">
        <div className="flicker" style={{ fontSize: '2rem' }}>🕯</div>
        <p style={styles.statusText}>Preparing the confessional...</p>
      </div>
    );
  }

  if (phase === 'quiz') {
    return <BibleQuiz apiUrl={apiUrl} onComplete={handleQuizComplete} onNotSaved={handleNotSaved} />;
  }

  if (phase === 'not-saved') {
    return (
      <div style={styles.centered} className="page-enter">
        <span style={styles.notSavedIcon}>⚠</span>
        <h2 style={styles.notSavedTitle}>You Are in the Wrong Place</h2>
        <p style={styles.statusText}>
          To prevent going to the TRUE wrong place, repent for your sins.
        </p>
        <div className="divider" style={{ width: '200px', margin: '2rem 0' }}>
          <span className="cross">✦</span>
        </div>
        <p style={styles.transitionText}>
          Enter the confessional and seek forgiveness.
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
        <span style={styles.icon}>☦</span>
        <h2>Application Submitted</h2>
        <p style={styles.statusText}>
          Your application to serve as a priest is being reviewed.
          Please wait for approval. This page will update automatically.
        </p>
        <div className="flicker" style={{ fontSize: '1.5rem', marginTop: '2rem' }}>🕯</div>
      </div>
    );
  }

  if (phase === 'still-a-sinner') {
    return (
      <div style={styles.centered} className="page-enter">
        <span style={styles.sinnerIcon}>🕯</span>
        <h2 style={styles.sinnerTitle}>You Are Still a Sinner</h2>
        <p style={styles.statusText}>
          You have not demonstrated sufficient knowledge of scripture
          to serve as a priest. Perhaps confession will help illuminate your path.
        </p>
        <div className="divider" style={{ width: '200px', margin: '2rem 0' }}>
          <span className="cross">✦</span>
        </div>
        <p style={styles.transitionText}>
          You shall enter the confessional as a penitent instead.
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
        <div className="flicker" style={{ fontSize: '3rem' }}>🕯</div>
        <h2 style={{ marginTop: '1.5rem' }}>
          {role === 'priest' ? 'Awaiting a Penitent' : 'Awaiting a Priest'}
        </h2>
        <p style={styles.statusText}>
          {role === 'priest'
            ? 'A soul in need of confession will be with you shortly.'
            : 'A priest will hear your confession shortly.'}
        </p>
        {waitingPosition > 0 && (
          <p style={styles.positionText}>
            Position in queue: {waitingPosition}
          </p>
        )}
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
        <span style={styles.icon}>✝</span>
        <h2>The Confession Has Ended</h2>
        <p style={styles.statusText}>
          {role === 'priest'
            ? 'May you continue to serve with grace.'
            : 'Go in peace. Your sins are heard.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={handleRejoin}>
            {role === 'priest' ? 'Hear Another Confession' : 'Confess Again'}
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
    background: `
      radial-gradient(ellipse at 50% 50%, rgba(201, 168, 76, 0.03) 0%, transparent 60%),
      var(--bg-primary)
    `,
  },
  icon: {
    fontSize: '2.5rem',
    color: 'var(--gold-dim)',
    marginBottom: '1.5rem',
  },
  sinnerIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    display: 'block',
  },
  sinnerTitle: {
    color: 'var(--crimson)',
    fontSize: '2rem',
  },
  notSavedIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    display: 'block',
  },
  notSavedTitle: {
    color: 'var(--crimson)',
    fontSize: '1.8rem',
  },
  transitionText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    letterSpacing: '0.1em',
    color: 'var(--gold-dim)',
    textTransform: 'uppercase',
  },
  statusText: {
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    maxWidth: '400px',
    marginTop: '1rem',
    lineHeight: 1.8,
  },
  positionText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    letterSpacing: '0.1em',
    color: 'var(--gold-dim)',
    marginTop: '1.5rem',
  },
};
