import { AsciiLace } from '../../../lace';

export default function LoadingScreen() {
  return (
    <div style={styles.container}>
      {/* Lace frame from /lace/loading.json sits behind the verse
          at fixed position, matching the LaceFrame fullscreen spec. */}
      <AsciiLace profile="loading" target="LaceFrame" />

      <p style={styles.verse}>
        But of the tree of the knowledge of good
        <br />
        and evil, thou shalt not eat of it:
        <br />
        for in the day that thou eatest thereof
        <br />
        thou shalt surely die.
      </p>
      <p style={styles.reference}>Genesis 2:17</p>
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
    background: 'var(--bg-primary)',
    padding: '2rem',
    position: 'relative',
  },
  verse: {
    fontFamily: 'var(--font-body)',
    fontSize: '1.1rem',
    lineHeight: 1.8,
    color: 'var(--ivory)',
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: '400px',
    position: 'relative',
    zIndex: 200,
  },
  reference: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.75rem',
    color: 'var(--ivory-dim)',
    letterSpacing: '0.1em',
    marginTop: '1.5rem',
    fontStyle: 'normal',
    position: 'relative',
    zIndex: 200,
  },
};
