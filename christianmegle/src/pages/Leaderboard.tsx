import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  pardons: number;
  isJesus?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard`);
        const data = await res.json();

        // Jesus is always #1
        const jesus: LeaderboardEntry = {
          rank: 1,
          displayName: 'Jesus Christ',
          pardons: Infinity,
          isJesus: true,
        };

        // Shift other ranks down
        const priests = data.map((entry: any, i: number) => ({
          rank: i + 2,
          displayName: entry.display_name,
          pardons: entry.pardons,
        }));

        setEntries([jesus, ...priests]);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        // Still show Jesus even if API fails
        setEntries([{
          rank: 1,
          displayName: 'Jesus Christ',
          pardons: Infinity,
          isJesus: true,
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="page-enter" style={styles.container}>
      <h1 style={styles.title}>Book of Life</h1>
      <p style={styles.subtitle}>Those who have pardoned the most sinners</p>

      <div className="divider" style={{ width: '300px' }}>
        <span className="cross">✝</span>
      </div>

      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : (
        <div style={styles.leaderboard}>
          {entries.map((entry) => (
            <div
              key={entry.rank}
              style={{
                ...styles.row,
                ...(entry.isJesus ? styles.jesusRow : {}),
              }}
            >
              <span style={styles.rank}>
                {entry.isJesus ? '👑' : entry.rank}
              </span>
              <span style={{
                ...styles.name,
                ...(entry.isJesus ? styles.jesusName : {}),
              }}>
                {entry.displayName}
              </span>
              <span style={styles.pardons}>
                {entry.isJesus ? '∞' : entry.pardons}
              </span>
            </div>
          ))}

          {entries.length === 1 && (
            <p style={styles.empty}>No priests have pardoned sinners yet.</p>
          )}
        </div>
      )}

      <button style={styles.backButton} onClick={() => navigate('/')}>
        Return Home
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 2rem',
    background: `
      radial-gradient(ellipse at 50% 0%, rgba(139, 0, 0, 0.15) 0%, transparent 50%),
      var(--bg-primary)
    `,
  },
  title: {
    fontFamily: 'var(--font-gothic)',
    fontSize: '2rem',
    color: 'var(--ivory)',
    letterSpacing: '0.15em',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '1rem',
    color: 'var(--ivory-dim)',
  },
  loading: {
    fontFamily: 'var(--font-terminal)',
    color: 'var(--text-dim)',
    marginTop: '2rem',
  },
  leaderboard: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--blood-dim)',
  },
  jesusRow: {
    background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%)',
    border: '1px solid var(--gold-dim)',
    boxShadow: '0 0 20px rgba(201, 168, 76, 0.15)',
  },
  rank: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '1rem',
    color: 'var(--blood)',
    width: '3rem',
    textAlign: 'center',
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    color: 'var(--ivory)',
    flex: 1,
    letterSpacing: '0.05em',
  },
  jesusName: {
    color: 'var(--gold)',
    fontFamily: 'var(--font-gothic)',
  },
  pardons: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '1rem',
    color: 'var(--ivory-dim)',
    textAlign: 'right',
    minWidth: '3rem',
  },
  empty: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    color: 'var(--text-dim)',
    textAlign: 'center',
    padding: '2rem',
  },
  backButton: {
    marginTop: '2rem',
  },
};
