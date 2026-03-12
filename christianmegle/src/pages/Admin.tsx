import { useState, useEffect } from 'react';

interface AdminProps {
  apiUrl: string;
}

export default function Admin({ apiUrl }: AdminProps) {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [priests, setPriests] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  };

  const fetchPriests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/priests?status=${filter}`, { headers });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setPriests(data);
      setAuthenticated(true);
    } catch (e) {
      console.error('Failed to fetch:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authenticated) {
      fetchPriests();
    }
  }, [filter, authenticated]);

  const handleAction = async (priestId: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`${apiUrl}/api/admin/priests/${priestId}/${action}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      fetchPriests();
    } catch (e) {
      console.error(`Failed to ${action}:`, e);
    }
  };

  if (!authenticated) {
    return (
      <div style={styles.container} className="page-enter">
        <h2>Admin</h2>
        <div style={styles.loginForm}>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter admin secret"
            style={styles.input}
            onKeyDown={(e) => e.key === 'Enter' && fetchPriests()}
          />
          <button onClick={fetchPriests}>Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="page-enter">
      <h2>Priest Applications</h2>

      {/* Filter tabs */}
      <div style={styles.tabs}>
        {(['pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              ...styles.tab,
              ...(filter === status ? styles.tabActive : {}),
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Priest list */}
      <div style={styles.list}>
        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : priests.length === 0 ? (
          <p style={styles.empty}>No {filter} applications.</p>
        ) : (
          priests.map((priest) => (
            <div key={priest.id} className="gothic-border" style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.priestName}>{priest.display_name}</span>
                <span style={styles.priestScore}>
                  {priest.quiz_score}/{priest.quiz_total}
                </span>
              </div>
              {priest.email && (
                <p style={styles.priestEmail}>{priest.email}</p>
              )}
              <p style={styles.priestDate}>
                Applied: {new Date(priest.created_at).toLocaleString()}
              </p>
              {filter === 'pending' && (
                <div style={styles.actions}>
                  <button
                    onClick={() => handleAction(priest.id, 'approve')}
                    style={styles.approveBtn}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(priest.id, 'reject')}
                    style={styles.rejectBtn}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '3rem 2rem',
    maxWidth: '700px',
    margin: '0 auto',
  },
  loginForm: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
    alignItems: 'center',
  },
  input: {
    width: '300px',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '2rem',
    marginBottom: '2rem',
  },
  tab: {
    padding: '0.4rem 1rem',
    fontSize: '0.7rem',
    opacity: 0.5,
  },
  tabActive: {
    opacity: 1,
    borderColor: 'var(--gold)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    padding: '1.5rem',
    background: 'var(--bg-secondary)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priestName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    color: 'var(--gold)',
    letterSpacing: '0.05em',
  },
  priestScore: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
  },
  priestEmail: {
    color: 'var(--text-dim)',
    fontSize: '0.85rem',
    marginTop: '0.3rem',
  },
  priestDate: {
    color: 'var(--text-dim)',
    fontSize: '0.8rem',
    marginTop: '0.3rem',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  approveBtn: {
    fontSize: '0.7rem',
    padding: '0.4rem 1rem',
    borderColor: 'var(--gold-dim)',
  },
  rejectBtn: {
    fontSize: '0.7rem',
    padding: '0.4rem 1rem',
    borderColor: 'var(--crimson)',
    color: 'var(--crimson)',
  },
  empty: {
    color: 'var(--text-dim)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '2rem',
  },
};
