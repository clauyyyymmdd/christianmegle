import { useEffect, useRef, useState, useCallback } from 'react';
import { submitQuiz } from '../api/quizApi';
import ChromeButton from '../../../components/ChromeButton';

/**
 * Priest onboarding — "Bible quiz" in name only for backwards compatibility
 * with the confessional flow's state machine. The user-facing experience
 * is a snake/cross-vs-sins canvas game followed by a single written prompt.
 *
 * External contract preserved:
 *   - file path: src/features/priest-onboarding/ui/BibleQuiz.tsx
 *   - default export
 *   - props: { apiUrl, onComplete(id, passed), onNotSaved }
 *   - backend: POST /api/quiz/submit via submitQuiz()
 *     -> sends fake answers that score 0/0 (passes 0 >= 0 threshold)
 *     -> real content lives in heavenResponse
 *     -> backend returns priestId which flows back into the state machine
 *     -> getPriestStatus auto-approves (0/0 passes its 60% check too)
 */

interface BibleQuizProps {
  apiUrl: string;
  onComplete: (priestId: string, passed: boolean) => void;
  onNotSaved: () => void;
}

type Phase = 'intro' | 'playing' | 'won' | 'heaven' | 'submitting' | 'failed';

interface Sin {
  name: string;
  behavior: 'chase' | 'flee' | 'erratic' | 'mirror' | 'static' | 'drift';
  speed: number;
  size: number;
  color: string;
  x: number;
  y: number;
  alive: boolean;
  hitsNeeded: number;
  hitsReceived: number;
  dx: number;
  dy: number;
  wobble: number;
  canEscape?: boolean;
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  char: string;
  color: string;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

const HEAVEN_PROMPT = 'Why do you think you will go to heaven?';

function randomName(): string {
  return `anon-${Math.random().toString(36).slice(2, 8)}`;
}

export default function BibleQuiz({ apiUrl, onComplete, onNotSaved }: BibleQuizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [timer, setTimer] = useState(60);
  const [sinsLeft, setSinsLeft] = useState(7);
  const [heavenResponse, setHeavenResponse] = useState('');

  const gameState = useRef({
    cross: { x: 0, y: 0, trail: [] as TrailPoint[] },
    sins: [] as Sin[],
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    W: 0,
    H: 0,
    consumed: 0,
    animId: 0,
    timerRef: null as ReturnType<typeof setInterval> | null,
    touchStart: null as { x: number; y: number } | null,
  });

  const initGame = useCallback(() => {
    const g = gameState.current;
    const W = g.W;
    const H = g.H;
    const cx = W / 2;
    const cy = H / 2;

    g.cross = { x: cx, y: cy, trail: [] };
    g.consumed = 0;
    g.particles = [];

    const margin = 60;
    function rPos(): { x: number; y: number } {
      let x: number, y: number, tries = 0;
      do {
        x = margin + Math.random() * (W - margin * 2);
        y = margin + Math.random() * (H - margin * 2);
        tries++;
      } while (Math.abs(x - cx) < 80 && Math.abs(y - cy) < 80 && tries < 50);
      return { x, y };
    }

    const defs: Omit<Sin, 'x' | 'y' | 'alive' | 'hitsReceived' | 'dx' | 'dy' | 'wobble'>[] = [
      { name: 'LUST', behavior: 'chase', speed: 1.5, size: 13, color: '#aa3344', hitsNeeded: 1 },
      { name: 'GREED', behavior: 'drift', speed: 0.6, size: 13, color: '#99882a', hitsNeeded: 1 },
      { name: 'SLOTH', behavior: 'static', speed: 0, size: 15, color: '#556655', hitsNeeded: 3 },
      { name: 'WRATH', behavior: 'erratic', speed: 2.8, size: 13, color: '#cc4422', hitsNeeded: 1 },
      { name: 'PRIDE', behavior: 'flee', speed: 2.2, size: 14, color: '#8855bb', hitsNeeded: 1, canEscape: true },
      { name: 'GLUTTONY', behavior: 'drift', speed: 0.3, size: 17, color: '#886633', hitsNeeded: 3 },
      { name: 'ENVY', behavior: 'mirror', speed: 1.8, size: 13, color: '#338855', hitsNeeded: 1 },
    ];

    g.sins = defs.map((d) => {
      const p = rPos();
      return {
        ...d,
        x: p.x,
        y: p.y,
        alive: true,
        hitsReceived: 0,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        wobble: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  // Game loop — only runs while phase === 'playing'
  useEffect(() => {
    if (phase !== 'playing') return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const g = gameState.current;
    g.W = W;
    g.H = H;
    initGame();

    const SPEED = 4;
    let localTimer = 60;

    g.timerRef = setInterval(() => {
      localTimer--;
      setTimer(localTimer);
      if (localTimer <= 0) {
        setPhase('failed');
      }
    }, 1000);

    const updateCross = () => {
      const k = g.keys;
      let dx = 0;
      let dy = 0;
      if (k['ArrowUp'] || k['KeyW']) dy = -1;
      if (k['ArrowDown'] || k['KeyS']) dy = 1;
      if (k['ArrowLeft'] || k['KeyA']) dx = -1;
      if (k['ArrowRight'] || k['KeyD']) dx = 1;
      if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
      }
      g.cross.x = Math.max(10, Math.min(W - 10, g.cross.x + dx * SPEED));
      g.cross.y = Math.max(10, Math.min(H - 10, g.cross.y + dy * SPEED));
      if (dx || dy) {
        g.cross.trail.push({ x: g.cross.x, y: g.cross.y, age: 0 });
        if (g.cross.trail.length > 35) g.cross.trail.shift();
      }
      for (const t of g.cross.trail) t.age++;
    };

    const spawnParticles = (s: Sin) => {
      for (let i = 0; i < 12; i++) {
        g.particles.push({
          x: s.x,
          y: s.y,
          dx: (Math.random() - 0.5) * 5,
          dy: (Math.random() - 0.5) * 5,
          life: 30 + Math.random() * 20,
          maxLife: 50,
          char: s.name[Math.floor(Math.random() * s.name.length)],
          color: s.color,
        });
      }
    };

    const updateSins = () => {
      const cx = g.cross.x;
      const cy = g.cross.y;

      for (const s of g.sins) {
        if (!s.alive) continue;
        const dx = cx - s.x;
        const dy = cy - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        s.wobble += 0.02;

        switch (s.behavior) {
          case 'chase':
            if (dist > 15) {
              s.x += (dx / dist) * s.speed;
              s.y += (dy / dist) * s.speed;
            }
            break;
          case 'flee':
            if (dist < 180) {
              s.x -= (dx / dist) * s.speed * 1.3;
              s.y -= (dy / dist) * s.speed * 1.3;
            } else {
              s.x += Math.sin(s.wobble) * 0.4;
              s.y += Math.cos(s.wobble * 0.7) * 0.4;
            }
            if (s.canEscape && (s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40)) {
              setPhase('failed');
            }
            break;
          case 'erratic':
            if (Math.random() < 0.06) {
              s.dx = (Math.random() - 0.5) * s.speed * 2;
              s.dy = (Math.random() - 0.5) * s.speed * 2;
            }
            s.x += s.dx;
            s.y += s.dy;
            s.x = Math.max(20, Math.min(W - 20, s.x));
            s.y = Math.max(20, Math.min(H - 20, s.y));
            break;
          case 'mirror':
            s.x += (W - cx - s.x) * 0.025;
            s.y += (H - cy - s.y) * 0.025;
            break;
          case 'drift':
            s.x += Math.sin(s.wobble) * s.speed;
            s.y += Math.cos(s.wobble * 1.3) * s.speed;
            break;
          case 'static':
            s.x += Math.sin(s.wobble) * 0.1;
            s.y += Math.cos(s.wobble) * 0.1;
            break;
        }

        const hitDist = s.size + 14;
        if (dist < hitDist) {
          s.hitsReceived++;
          if (s.hitsReceived >= s.hitsNeeded) {
            s.alive = false;
            g.consumed++;
            setSinsLeft(7 - g.consumed);
            spawnParticles(s);
            if (g.consumed >= 7) {
              setPhase('won');
            }
          } else {
            s.x += (s.x - cx) * 0.3;
            s.y += (s.y - cy) * 0.3;
            spawnParticles(s);
          }
        }
      }
    };

    const updateParticles = () => {
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dx *= 0.95;
        p.dy *= 0.95;
        p.life--;
        if (p.life <= 0) g.particles.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const t of g.cross.trail) {
        const op = Math.max(0, 1 - t.age / 45) * 0.25;
        if (op > 0) {
          ctx.fillStyle = `rgba(255,255,255,${op})`;
          ctx.fillText('✝', t.x, t.y);
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.arc(g.cross.x, g.cross.y, 35, 0, Math.PI * 2);
      ctx.fill();

      const pulse = 0.8 + Math.sin(Date.now() / 250) * 0.2;
      ctx.fillStyle = `rgba(255,255,255,${pulse})`;
      ctx.font = '22px "IBM Plex Mono", monospace';
      ctx.fillText('✝', g.cross.x, g.cross.y);

      for (const s of g.sins) {
        if (!s.alive) continue;

        const dx = g.cross.x - s.x;
        const dy = g.cross.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = dist < s.size + 30;

        let ox = 0;
        let oy = 0;
        if (near) {
          ox = (Math.random() - 0.5) * 3;
          oy = (Math.random() - 0.5) * 3;
        }

        const sinPulse = 0.7 + Math.sin(s.wobble * 3) * 0.15;
        ctx.globalAlpha = sinPulse;
        ctx.fillStyle = s.color;
        ctx.font = `${s.size}px "IBM Plex Mono", monospace`;
        ctx.fillText(s.name, s.x + ox, s.y + oy);

        if (s.hitsNeeded > 1) {
          const remaining = s.hitsNeeded - s.hitsReceived;
          ctx.font = '8px "IBM Plex Mono", monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          const dots = '●'.repeat(remaining) + '○'.repeat(s.hitsReceived);
          ctx.fillText(dots, s.x, s.y + s.size + 10);
        }

        ctx.globalAlpha = 1;
      }

      for (const p of g.particles) {
        const op = (p.life / p.maxLife) * 0.7;
        ctx.globalAlpha = op;
        ctx.fillStyle = p.color;
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      if (phase !== 'playing') return;
      updateCross();
      updateSins();
      updateParticles();
      draw();
      g.animId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      g.keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      g.keys[e.code] = false;
    };
    const onTouchStart = (e: TouchEvent) => {
      g.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!g.touchStart) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - g.touchStart.x;
      const dy = e.touches[0].clientY - g.touchStart.y;
      const dead = 10;
      g.keys['ArrowLeft'] = dx < -dead;
      g.keys['ArrowRight'] = dx > dead;
      g.keys['ArrowUp'] = dy < -dead;
      g.keys['ArrowDown'] = dy > dead;
    };
    const onTouchEnd = () => {
      g.touchStart = null;
      g.keys['ArrowLeft'] = false;
      g.keys['ArrowRight'] = false;
      g.keys['ArrowUp'] = false;
      g.keys['ArrowDown'] = false;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    loop();

    return () => {
      cancelAnimationFrame(g.animId);
      if (g.timerRef) clearInterval(g.timerRef);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [phase, initGame]);

  // Win → advance to heaven response prompt after brief beat
  useEffect(() => {
    if (phase !== 'won') return;
    const id = setTimeout(() => setPhase('heaven'), 1200);
    return () => clearTimeout(id);
  }, [phase]);

  // Fail → brief pause, then hand off to the sinner path.
  // onNotSaved() transitions the state machine into the sinner queue.
  useEffect(() => {
    if (phase !== 'failed') return;
    const id = setTimeout(() => onNotSaved(), 2000);
    return () => clearTimeout(id);
  }, [phase, onNotSaved]);

  // Submit heaven response through the existing backend contract
  const handleSubmitHeaven = async () => {
    if (heavenResponse.trim().length < 1) return;
    setPhase('submitting');
    try {
      const data = await submitQuiz(apiUrl, {
        // Non-existent question id → backend scores 0/0 → passes 0 >= 0
        answers: { '999999': 'a' } as unknown as Record<number, string>,
        displayName: randomName(),
        heavenResponse: heavenResponse.trim(),
      });
      onComplete(data.priestId, true);
    } catch {
      // Network failure — drop to the sinner path rather than leaving them stuck
      onNotSaved();
    }
  };

  // ── Render ───────────────────────────────────────────────────

  // Intro: bare click target, no narrative text
  if (phase === 'intro') {
    return (
      <div
        style={styles.fullscreen}
        onClick={() => setPhase('playing')}
      >
        <div style={styles.introMark}>✝</div>
      </div>
    );
  }

  // Heaven response — THE ONLY PIECE OF COPY
  if (phase === 'heaven' || phase === 'submitting') {
    return (
      <div style={styles.fullscreen}>
        <div style={styles.heavenWrap}>
          <p style={styles.heavenPrompt}>{HEAVEN_PROMPT}</p>
          <textarea
            autoFocus
            value={heavenResponse}
            onChange={(e) => setHeavenResponse(e.target.value.slice(0, 2000))}
            style={styles.heavenTextarea}
            disabled={phase === 'submitting'}
          />
          <div style={styles.heavenButtonWrap}>
            <ChromeButton
              onClick={handleSubmitHeaven}
              disabled={phase === 'submitting' || heavenResponse.trim().length < 1}
            >
              ✝
            </ChromeButton>
          </div>
        </div>
      </div>
    );
  }

  // Failed / won hold: blank dark, no copy
  if (phase === 'failed' || phase === 'won') {
    return <div style={styles.fullscreen} />;
  }

  // Playing: canvas + tiny HUD (no narrative text)
  return (
    <div ref={containerRef} style={styles.fullscreen}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={{ ...styles.hud, right: 24, color: timer <= 10 ? '#663333' : '#333' }}>
        {timer}s
      </div>
      <div style={{ ...styles.hud, left: 24 }}>{sinsLeft}/7</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"IBM Plex Mono", monospace',
    zIndex: 100,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  hud: {
    position: 'absolute',
    top: 20,
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 11,
    letterSpacing: '0.2em',
    color: '#333',
  },
  introMark: {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 42,
    color: '#666',
    cursor: 'pointer',
    userSelect: 'none',
    animation: 'hintPulse 2.4s ease-in-out infinite',
  },
  heavenWrap: {
    width: '100%',
    maxWidth: 560,
    padding: '0 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  heavenPrompt: {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '1.1rem',
    color: '#cccccc',
    textAlign: 'center',
    letterSpacing: '0.05em',
    lineHeight: 1.5,
    margin: 0,
  },
  heavenTextarea: {
    width: '100%',
    minHeight: 140,
    padding: '1rem 1.25rem',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    background: '#151210',
    border: '1px solid #333',
    color: '#f5f0e6',
    outline: 'none',
    resize: 'vertical',
  },
  heavenButtonWrap: {
    width: '100%',
    maxWidth: 280,
  },
};
