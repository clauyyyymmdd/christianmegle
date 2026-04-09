import { AsciiLace } from '../../../lace';

/**
 * Loading context determines which verse pool is drawn from.
 * Mapped explicitly — no chaotic randomization.
 *
 *   general    — bootstrap loading (default, sin/death themes)
 *   confession — waiting/loading into a confession session
 *   post-auth  — post-authentication, entering the waiting room
 */
export type LoadingContext = 'general' | 'confession' | 'post-auth';

interface Verse {
  text: string;
  reference: string;
}

const VERSES: Record<LoadingContext, Verse[]> = {
  general: [
    {
      text: 'But of the tree of the knowledge of good\nand evil, thou shalt not eat of it:\nfor in the day that thou eatest thereof\nthou shalt surely die.',
      reference: 'Genesis 2:17',
    },
    {
      text: 'For the wages of sin is death;\nbut the gift of God is eternal life\nthrough Jesus Christ our Lord.',
      reference: 'Romans 6:23',
    },
    {
      text: 'The soul that sinneth, it shall die.',
      reference: 'Ezekiel 18:4',
    },
  ],
  confession: [
    {
      text: 'Though your sins be as scarlet,\nthey shall be as white as snow;\nthough they be red like crimson,\nthey shall be as wool.',
      reference: 'Isaiah 1:18',
    },
    {
      text: 'If we say that we have no sin,\nwe deceive ourselves,\nand the truth is not in us.',
      reference: '1 John 1:8',
    },
    {
      text: 'Then when lust hath conceived,\nit bringeth forth sin:\nand sin, when it is finished,\nbringeth forth death.',
      reference: 'James 1:15',
    },
  ],
  'post-auth': [
    {
      text: 'Watch therefore,\nfor ye know neither the day nor the hour\nwherein the Son of man cometh.',
      reference: 'Matthew 25:13',
    },
    {
      text: 'And at midnight there was a cry made,\nBehold, the bridegroom cometh;\ngo ye out to meet him.',
      reference: 'Matthew 25:6',
    },
  ],
};

/**
 * Pick a verse deterministically from a pool. Uses the current minute
 * so the verse rotates across visits but stays stable within a single
 * page load (no flicker on re-renders).
 */
function pickVerse(context: LoadingContext): Verse {
  const pool = VERSES[context];
  const index = Math.floor(Date.now() / 60_000) % pool.length;
  return pool[index];
}

interface LoadingScreenProps {
  /** Which verse pool to draw from. Defaults to 'general'. */
  context?: LoadingContext;
}

export default function LoadingScreen({ context = 'general' }: LoadingScreenProps) {
  const verse = pickVerse(context);

  return (
    <div style={styles.container}>
      <AsciiLace profile="loading" target="LaceFrame" />

      <p style={styles.verse}>
        {verse.text.split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
      <p style={styles.reference}>{verse.reference}</p>
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
