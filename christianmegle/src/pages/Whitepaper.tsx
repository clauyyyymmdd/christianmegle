import { useNavigate } from 'react-router-dom';

export default function Whitepaper() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header bar */}
        <div style={styles.header}>
          <span style={styles.headerLeft} onClick={() => navigate('/')}>
            ChristianMegle
          </span>
          <span style={styles.headerRight}>Preprint — Not Peer Reviewed</span>
        </div>

        <div style={styles.separator} />

        {/* Title block */}
        <h1 style={styles.title}>
          ChristianMegle: Toward a Scalable Framework for Anonymous
          Peer-to-Peer Confession via WebRTC
        </h1>

        <div style={styles.authors}>
          <span style={styles.author}>Anonymous Author(s)</span>
        </div>

        <div style={styles.dates}>
          <span>Submitted: April 2026</span>
        </div>

        <div style={styles.separator} />

        {/* Abstract */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Abstract</h2>
          <p style={styles.abstract}>
            We present ChristianMegle, a novel real-time confessional system that pairs
            anonymous penitents with ordained (or self-proclaimed) priests via browser-based
            video chat. The system employs a custom matchmaking protocol built on Cloudflare
            Durable Objects, WebRTC peer connections with TURN relay fallback, and a
            quiz-based priest credentialing pipeline that evaluates scriptural knowledge
            across multiple difficulty tiers. We introduce the concept of "spiritual
            bandwidth" — the theoretical maximum rate at which grace can be dispensed over
            a WebSocket connection — and demonstrate that our architecture achieves
            O(1) confession latency under standard ecclesiastical load. Preliminary results
            suggest that 94% of users report feeling "somewhat absolved" after a single
            session, though we note significant variance correlated with priest quiz scores.
            We discuss ethical implications, the auto-approval problem, and future work
            including support for confessional booths in VR.
          </p>
        </div>

        <div style={styles.separator} />

        {/* Metadata */}
        <div style={styles.metaRow}>
          <div style={styles.metaBlock}>
            <span style={styles.metaLabel}>Subjects:</span>
            <span style={styles.metaValue}>
              Human-Computer Interaction (cs.HC); Computers and Society (cs.CY);
              Theology (theo.CONF)
            </span>
          </div>
          <div style={styles.metaBlock}>
            <span style={styles.metaLabel}>Cite as:</span>
            <span style={styles.metaValue}>christianmegle:2026.04</span>
          </div>
        </div>

        <div style={styles.separator} />

        {/* Download */}
        <div style={styles.downloadSection}>
          <span style={styles.downloadLabel}>Download:</span>
          <a
            href="/assets/whitepaper.pdf"
            download="christianmegle-whitepaper.pdf"
            style={styles.downloadLink}
          >
            PDF
          </a>
          <span style={styles.downloadNote}>
            (full paper — replace this placeholder with your actual PDF at{' '}
            <code style={styles.code}>public/assets/whitepaper.pdf</code>)
          </span>
        </div>

        <div style={styles.separator} />

        {/* Placeholder body sections */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1&ensp;Introduction</h2>
          <p style={styles.body}>
            The sacrament of confession has remained remarkably resistant to digital
            transformation. While nearly every other form of human interaction — dating,
            therapy, grocery shopping — has migrated to the browser, the confessional
            booth has stubbornly remained a physical artifact. This paper introduces
            ChristianMegle, a system that bridges this gap by combining the anonymity
            of Omegle-style random pairing with the spiritual gravitas of the Catholic
            confessional tradition.
          </p>
          <p style={styles.body}>
            [Your content here]
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2&ensp;System Architecture</h2>
          <p style={styles.body}>[Your content here]</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3&ensp;Priest Credentialing Pipeline</h2>
          <p style={styles.body}>[Your content here]</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4&ensp;Matchmaking &amp; Spiritual Bandwidth</h2>
          <p style={styles.body}>[Your content here]</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5&ensp;Evaluation</h2>
          <p style={styles.body}>[Your content here]</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6&ensp;Ethics &amp; Limitations</h2>
          <p style={styles.body}>[Your content here]</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>7&ensp;Conclusion</h2>
          <p style={styles.body}>[Your content here]</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>References</h2>
          <p style={styles.body}>[Your references here]</p>
        </div>

        <div style={styles.separator} />

        <div style={styles.backLink} onClick={() => navigate('/')}>
          {'>'} Return Home _
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--wp-bg)',
    color: 'var(--wp-text)',
    fontFamily: 'var(--font-body)',
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '1.5rem 1rem 4rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '0.5rem 0',
  },
  headerLeft: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--wp-accent)',
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  headerRight: {
    fontSize: '0.75rem',
    color: 'var(--wp-text-dim)',
    fontStyle: 'italic',
  },
  separator: {
    borderTop: '1px solid var(--wp-border)',
    margin: '1rem 0',
  },
  title: {
    fontSize: '1.45rem',
    fontWeight: 700,
    lineHeight: 1.35,
    color: 'var(--wp-text)',
    margin: '0.75rem 0 0.5rem',
    fontFamily: 'var(--font-body)',
    textTransform: 'none',
    letterSpacing: 'normal',
  },
  authors: {
    margin: '0.25rem 0',
  },
  author: {
    fontSize: '0.95rem',
    color: 'var(--wp-text-secondary)',
    fontStyle: 'italic',
  },
  dates: {
    fontSize: '0.8rem',
    color: 'var(--wp-text-dim)',
    margin: '0.25rem 0 0.75rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--wp-text)',
    margin: '0 0 0.5rem',
    fontFamily: 'var(--font-body)',
    textTransform: 'none',
    letterSpacing: 'normal',
  },
  section: {
    margin: '1.25rem 0',
  },
  abstract: {
    fontSize: '0.9rem',
    lineHeight: 1.65,
    color: 'var(--wp-text)',
    fontStyle: 'normal',
    maxWidth: 'none',
    textAlign: 'justify' as const,
  },
  body: {
    fontSize: '0.9rem',
    lineHeight: 1.65,
    color: 'var(--wp-text-secondary)',
    fontStyle: 'normal',
    maxWidth: 'none',
    margin: '0.5rem 0',
    textAlign: 'justify' as const,
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  metaBlock: {
    fontSize: '0.8rem',
    lineHeight: 1.5,
  },
  metaLabel: {
    fontWeight: 700,
    marginRight: '0.4rem',
  },
  metaValue: {
    color: 'var(--wp-text-dim)',
  },
  downloadSection: {
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  downloadLabel: {
    fontWeight: 700,
  },
  downloadLink: {
    color: 'var(--wp-accent)',
    textDecoration: 'none',
    fontWeight: 700,
  },
  downloadNote: {
    color: 'var(--wp-text-muted)',
    fontSize: '0.75rem',
  },
  code: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.75rem',
    background: 'var(--wp-code-bg)',
    padding: '0.1rem 0.3rem',
    borderRadius: '2px',
  },
  backLink: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    color: 'var(--wp-text-dim)',
    cursor: 'pointer',
    marginTop: '1rem',
  },
};
