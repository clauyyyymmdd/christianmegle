import { useRef, useEffect, useState, useCallback } from 'react';
import ChromeButton from '../../components/ChromeButton';

// ═══════════════════════════════════════
// ASCII Tree of Knowledge — Snake Loading Screen
// ═══════════════════════════════════════
// Phases: tree → eating → dissolving → verse → done
// The serpent eats the tree. The verse is revealed.

const CHAR_W = 7.2;
const CHAR_H = 14;

const TREE = [
  '                              ✿                              ',
  '                          ·  ˚ ° ˚  ·                        ',
  '                      · ˚  ✧  ❋  ✧  ˚ ·                    ',
  '                   · ˚ ✧ · ˚ ✿ ˚ · ✧ ˚ ·                  ',
  '                · ˚ ✧ ❋ · ˚ ° ˚ · ❋ ✧ ˚ ·                ',
  '             · ˚  · ✧ ˚ ✿ ˚ · ˚ ✿ ˚ ✧ ·  ˚ ·            ',
  '           · ✧ ˚ ❋ · ✧ ˚ · ° · ˚ ✧ · ❋ ˚ ✧ ·            ',
  '          · ˚ ✧ · ˚ ❋ ✧ ˚ 🍎 ˚ ✧ ❋ ˚ · ✧ ˚ ·            ',
  '           · ˚ ✧ · ❋ ˚ · ✧ ° ✧ · ˚ ❋ · ✧ ˚ ·            ',
  '             · ˚  · ✧ ˚ ✿ ˚ · ˚ ✿ ˚ ✧ ·  ˚ ·            ',
  '                ·  ✧ ˚ · ˚  °  ˚ · ˚ ✧  ·                  ',
  '                   · ˚  ✧ ·  °  · ✧  ˚ ·                    ',
  '                      · ˚  · ˚ ·  ˚ ·                        ',
  '                          · ˚°˚ ·                            ',
  '                            · ˚ ·                            ',
  '                             )|(                              ',
  '                            )||(                              ',
  '                           )| |(                              ',
  '                          )| ~|(                              ',
  '                         )|~ ~|(                              ',
  '                         )| ~ |(                              ',
  '                         )|  ~|(                              ',
  '                         )| ~ |(                              ',
  '                          )| |(                              ',
  '                           )||(                              ',
  '                            )(                                ',
  '                      · .  ˚  . ·  . ·                        ',
  '                   ˚    · . ·    · .    ˚                    ',
  '                ✧    ˚    · . · .·    ˚    ✧                ',
  '             .    ✧    ˚    ·.·    ˚    ✧    .              ',
  '          ˚ . · ˚ . ✧ . ˚ . · . ˚ . ✧ . ˚ · . ˚          ',
];

const VERSE =
  'But of the tree of the knowledge of good and evil, thou shalt not eat of it: for in the day that thou eatest thereof thou shalt surely die. — Genesis 2:17';

interface Cell {
  ch: string;
  alive: boolean;
  opacity: number;
}

interface Pos {
  r: number;
  c: number;
}

interface VerseChar {
  r: number;
  c: number;
  ch: string;
  revealed: boolean;
  opacity: number;
}

type Phase = 'tree' | 'eating' | 'dissolving' | 'verse' | 'done';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const [exiting, setExiting] = useState(false);

  // all mutable state lives in a ref so the animation loop doesn't go stale
  const state = useRef({
    cols: 0,
    rows: 0,
    grid: [] as (Cell | null)[][],
    phase: 'tree' as Phase,
    snakeActive: false,
    snakePath: [] as Pos[],
    snakeHead: null as Pos | null,
    snakeTarget: null as Pos | null,
    snakeLength: 8,
    alivePositions: [] as Pos[],
    versePositions: [] as VerseChar[],
    verseRevealIdx: 0,
    dissolveFrame: 0,
    frameCount: 0,
    animId: 0,
  });

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const s = state.current;
    s.cols = Math.floor(rect.width / CHAR_W);
    s.rows = Math.floor(rect.height / CHAR_H);
    s.phase = 'tree';
    s.snakeActive = false;
    s.verseRevealIdx = 0;
    s.dissolveFrame = 0;

    // build grid — iterate TREE rows by code points so emojis (e.g. 🍎)
    // stay whole instead of splitting across their surrogate pair
    const treeRows = TREE.map((row) => Array.from(row));
    const offsetR = Math.floor((s.rows - TREE.length) / 2);
    const offsetC = Math.floor((s.cols - 60) / 2);
    s.grid = [];
    for (let r = 0; r < s.rows; r++) {
      s.grid[r] = [];
      for (let c = 0; c < s.cols; c++) {
        const tr = r - offsetR;
        const tc = c - offsetC;
        if (tr >= 0 && tr < treeRows.length && tc >= 0 && tc < treeRows[tr].length && treeRows[tr][tc] !== ' ') {
          s.grid[r][c] = { ch: treeRows[tr][tc], alive: true, opacity: 1 };
        } else {
          s.grid[r][c] = null;
        }
      }
    }

    // layout verse
    const verseLines: string[] = [];
    const lineW = Math.min(50, s.cols - 10);
    let cur = '';
    VERSE.split(' ').forEach((w) => {
      if ((cur + ' ' + w).trim().length > lineW) {
        verseLines.push(cur.trim());
        cur = w;
      } else {
        cur = cur ? cur + ' ' + w : w;
      }
    });
    if (cur) verseLines.push(cur.trim());

    s.versePositions = [];
    const vStartR = Math.floor((s.rows - verseLines.length) / 2);
    for (let l = 0; l < verseLines.length; l++) {
      const vStartC = Math.floor((s.cols - verseLines[l].length) / 2);
      for (let c = 0; c < verseLines[l].length; c++) {
        s.versePositions.push({
          r: vStartR + l,
          c: vStartC + c,
          ch: verseLines[l][c],
          revealed: false,
          opacity: 0,
        });
      }
    }

    draw(ctx, rect.width, rect.height);
    setShowHint(true);
  }, []);

  // ─── DRAWING ───
  function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const s = state.current;
    ctx.clearRect(0, 0, w, h);
    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'top';

    // tree characters
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const cell = s.grid[r]?.[c];
        if (cell && cell.alive) {
          const b = 180 + Math.floor(Math.random() * 40);
          ctx.fillStyle = `rgba(${b},${b},${b},${cell.opacity})`;
          ctx.fillText(cell.ch, c * CHAR_W, r * CHAR_H);
        }
      }
    }

    // snake
    if (s.phase === 'eating' || s.phase === 'dissolving') {
      for (let i = 0; i < s.snakePath.length; i++) {
        const p = s.snakePath[i];
        const age = s.snakePath.length - i;
        const tailOpacity = Math.max(0, 1 - age / 30);
        if (tailOpacity > 0) {
          ctx.fillStyle = `rgba(255,255,255,${tailOpacity})`;
          ctx.fillRect(p.c * CHAR_W, p.r * CHAR_H, CHAR_W, CHAR_H);
        }
      }
    }

    // verse
    if (s.phase === 'verse' || s.phase === 'dissolving' || s.phase === 'done') {
      for (const vp of s.versePositions) {
        if (vp.opacity > 0) {
          ctx.fillStyle = `rgba(220,220,220,${vp.opacity})`;
          ctx.fillText(vp.ch, vp.c * CHAR_W, vp.r * CHAR_H);
        }
      }
    }
  }

  // ─── SNAKE LOGIC ───
  function pickTarget() {
    const s = state.current;
    if (s.alivePositions.length === 0) {
      s.snakeTarget = null;
      return;
    }
    let best: Pos | null = null;
    let bestDist = Infinity;
    for (const p of s.alivePositions) {
      if (!s.grid[p.r]?.[p.c]?.alive) continue;
      const d = Math.abs(p.r - s.snakeHead!.r) + Math.abs(p.c - s.snakeHead!.c);
      if (d < bestDist && d > 0) {
        bestDist = d;
        best = p;
      }
    }
    s.snakeTarget = best;
  }

  function moveSnake() {
    const s = state.current;
    if (!s.snakeTarget || !s.snakeHead) return;

    let dr = 0;
    let dc = 0;
    if (Math.abs(s.snakeTarget.r - s.snakeHead.r) > Math.abs(s.snakeTarget.c - s.snakeHead.c)) {
      dr = s.snakeTarget.r > s.snakeHead.r ? 1 : -1;
    } else {
      dc = s.snakeTarget.c > s.snakeHead.c ? 1 : -1;
    }

    // random deviation
    if (Math.random() < 0.15) {
      if (dr !== 0) {
        dr = 0;
        dc = Math.random() < 0.5 ? 1 : -1;
      } else {
        dc = 0;
        dr = Math.random() < 0.5 ? 1 : -1;
      }
    }

    s.snakeHead = {
      r: Math.max(0, Math.min(s.rows - 1, s.snakeHead.r + dr)),
      c: Math.max(0, Math.min(s.cols - 1, s.snakeHead.c + dc)),
    };
    s.snakePath.push({ ...s.snakeHead });
    if (s.snakePath.length > s.snakeLength) s.snakePath.shift();

    const cell = s.grid[s.snakeHead.r]?.[s.snakeHead.c];
    if (cell && cell.alive) {
      cell.alive = false;
      cell.opacity = 0;
      s.alivePositions = s.alivePositions.filter(
        (p) => !(p.r === s.snakeHead!.r && p.c === s.snakeHead!.c)
      );
      s.snakeLength = Math.min(s.snakeLength + 1, 25);

      if (
        Math.random() < 0.3 ||
        !s.snakeTarget ||
        !s.grid[s.snakeTarget.r]?.[s.snakeTarget.c]?.alive
      ) {
        pickTarget();
      }
    }
  }

  // ─── START ───
  const handleClick = useCallback(() => {
    const s = state.current;
    if (s.snakeActive) return;
    s.snakeActive = true;
    setShowHint(false);
    s.phase = 'eating';

    s.alivePositions = [];
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        if (s.grid[r]?.[c]?.alive) s.alivePositions.push({ r, c });
      }
    }

    const topFruit = s.alivePositions.reduce(
      (best, p) => (p.r < best.r ? p : best),
      s.alivePositions[0]
    );
    s.snakeHead = { r: topFruit.r - 2, c: topFruit.c };
    s.snakePath = [{ ...s.snakeHead }];
    s.snakeLength = 8;

    pickTarget();

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawCtx: CanvasRenderingContext2D = ctx;
    const rect = container.getBoundingClientRect();

    const animate = () => {
      s.frameCount++;

      if (s.phase === 'eating') {
        for (let i = 0; i < 3; i++) moveSnake();
        if (s.alivePositions.length === 0) {
          s.phase = 'dissolving';
          s.dissolveFrame = 0;
        }
      }

      if (s.phase === 'dissolving') {
        s.dissolveFrame++;
        if (s.dissolveFrame > 30) {
          s.snakePath.shift();
          if (s.snakePath.length === 0) s.phase = 'verse';
        }
        if (s.dissolveFrame > 60) {
          const rp = Math.max(1, Math.floor(s.versePositions.length / 120));
          for (let i = 0; i < rp; i++) {
            if (s.verseRevealIdx < s.versePositions.length) {
              s.versePositions[s.verseRevealIdx].revealed = true;
              s.verseRevealIdx++;
            }
          }
        }
      }

      if (s.phase === 'verse') {
        const rp = Math.max(1, Math.floor(s.versePositions.length / 90));
        for (let i = 0; i < rp; i++) {
          if (s.verseRevealIdx < s.versePositions.length) {
            s.versePositions[s.verseRevealIdx].revealed = true;
            s.verseRevealIdx++;
          }
        }
      }

      for (const vp of s.versePositions) {
        if (vp.revealed && vp.opacity < 1) {
          vp.opacity = Math.min(1, vp.opacity + 0.03);
        }
      }

      draw(drawCtx, rect.width, rect.height);

      const allRevealed = s.versePositions.every((vp) => vp.opacity >= 0.95);
      if (!allRevealed) {
        s.animId = requestAnimationFrame(animate);
      } else {
        s.phase = 'done';
        setShowButton(true);
      }
    };

    s.animId = requestAnimationFrame(animate);
  }, []);

  // ─── ENTER SITE ───
  const handleEnter = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 800);
  }, [onComplete]);

  // ─── LIFECYCLE ───
  useEffect(() => {
    init();
    const onResize = () => {
      cancelAnimationFrame(state.current.animId);
      state.current.snakeActive = false;
      state.current.phase = 'tree';
      setShowButton(false);
      setShowHint(false);
      init();
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(state.current.animId);
      window.removeEventListener('resize', onResize);
    };
  }, [init]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.8s cubic-bezier(0.4,0,0.2,1)',
        transform: exiting ? 'translateY(-100%)' : 'none',
        opacity: exiting ? 0 : 1,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />

      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: '0.4em',
          color: '#ffffff',
          textShadow:
            '0 0 14px rgba(255,255,255,0.95), 0 0 28px rgba(255,255,255,0.6), 0 0 48px rgba(255,255,255,0.35)',
          opacity: showHint ? 1 : 0,
          transition: 'opacity 1s ease',
          textTransform: 'lowercase' as const,
          animation: showHint ? 'hintPulse 2.4s ease-in-out infinite' : 'none',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        eat the apple
      </div>

      {showButton && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 420,
            padding: '0 1.5rem',
            opacity: 0,
            animation: 'entryBtnFadeIn 0.8s ease forwards',
            zIndex: 10,
          }}
        >
          <ChromeButton
            onClick={handleEnter}
            ariaLabel="I know I am a sinner"
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
              }}
            >
              I know I am a sinner
            </span>
          </ChromeButton>
        </div>
      )}

      <style>{`
        @keyframes hintPulse {
          0%, 100% {
            opacity: 0.55;
            text-shadow:
              0 0 8px rgba(255,255,255,0.6),
              0 0 16px rgba(255,255,255,0.3);
          }
          50% {
            opacity: 1;
            text-shadow:
              0 0 16px rgba(255,255,255,1),
              0 0 32px rgba(255,255,255,0.7),
              0 0 56px rgba(255,255,255,0.4);
          }
        }
        @keyframes entryBtnFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
