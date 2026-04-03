import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboard as fetchLeaderboardApi } from '../features/leaderboard/api/leaderboardApi';

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  pardons: number;
  isJesus?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const JESUS: LeaderboardEntry = {
  rank: 1,
  displayName: 'Jesus Christ',
  pardons: Infinity,
  isJesus: true,
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardApi(API_URL)
      .then((data) => {
        const priests = data.map((entry, i) => ({
          rank: i + 2,
          displayName: entry.display_name,
          pardons: entry.pardons,
        }));
        setEntries([JESUS, ...priests]);
      })
      .catch((err) => {
        console.error('Failed to fetch leaderboard:', err);
        setEntries([JESUS]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter" style={styles.container}>
      <pre style={styles.asciiTitle}>{`
╔═══════════════════════════════════════════╗
║                                           ║
║          B O O K   O F   L I F E          ║
║                                           ║
║   Those who have pardoned the most sinners║
║                                           ║
╠═══════════════════════════════════════════╣`}</pre>

      {loading ? (
        <pre style={styles.loading}>{`║  Loading...                               ║`}</pre>
      ) : (
        <div style={styles.leaderboard}>
          {entries.map((entry) => (
            <pre
              key={entry.rank}
              style={{
                ...styles.row,
                ...(entry.isJesus ? styles.jesusRow : {}),
              }}
            >
{`║  ${entry.isJesus ? '★' : entry.rank.toString().padStart(2, ' ')}  │  ${entry.displayName.padEnd(25, ' ')}  │  ${entry.isJesus ? ' ∞' : entry.pardons.toString().padStart(3, ' ')}  ║`}
            </pre>
          ))}

          {entries.length === 1 && (
            <pre style={styles.empty}>{`║  No priests have pardoned sinners yet.    ║`}</pre>
          )}
        </div>
      )}

      <pre style={styles.asciiFooter}>{`╚═══════════════════════════════════════════╝`}</pre>

      <div style={styles.backButton} onClick={() => navigate('/')}>
        {'>'} Return Home _
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'var(--bg-primary)',
  },
  asciiTitle: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    lineHeight: 1.3,
    color: 'var(--ivory-dim)',
    margin: 0,
    textAlign: 'left',
  },
  asciiFooter: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    lineHeight: 1.3,
    color: 'var(--ivory-dim)',
    margin: 0,
  },
  loading: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    color: 'var(--ivory-dim)',
    margin: 0,
  },
  leaderboard: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    color: 'var(--ivory-dim)',
    margin: 0,
    lineHeight: 1.5,
  },
  jesusRow: {
    color: 'var(--ivory)',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
  },
  empty: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    color: 'var(--ivory-dim)',
    margin: 0,
  },
  backButton: {
    marginTop: '2rem',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    color: 'var(--ivory-dim)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
