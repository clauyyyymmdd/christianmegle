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
  | 'applied'        // Priest passed quiz, awaiting approval
  | 'rejected'       // Priest failed quiz
  | 'waiting'        // In matchmaking queue
  | 'connected'      // In video session
  | 'ended';         // Session ended, option to rejoin

export default function Confessional({ apiUrl }: ConfessionalProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = (searchParams.get('role') as UserRole) || 'sinner';
  const [phase, setPhase] = useState<Phase>('loading');
  const [priestId, setPriestId] = useState<string | null>(
    localStorage.getItem('christianmegle_priest_id')
  );
  const [waitingPosition, setWaitingPosition] = useState<number>(0);
  const signalingRef = useRef<SignalingClient | null>(null);

  useEffect(() => {
    if (role === 'priest') {
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
            setPhase('rejected');
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
      setPhase('rejected');
    }
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
    return <BibleQuiz apiUrl={apiUrl} onComplete={handleQuizComplete} />;
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

  if (phase === 'rejected') {
    return (
      <div style={styles.centered} className="page-enter">
        <h2>Insufficient Knowledge</h2>
        <p style={styles.statusText}>
          You have not demonstrated sufficient knowledge of scripture
          to serve as a priest at this time.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={() => setPhase('quiz')}>Retake Quiz</button>
          <button onClick={() => navigate('/')}>Return Home</button>
        </div>
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
