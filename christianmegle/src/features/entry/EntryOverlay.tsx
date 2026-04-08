import { useEffect, useRef, useState, useCallback } from 'react';
import { TREE, TREE_REF_WIDTH } from './treeAscii';
import ChromeButton from '../../components/ChromeButton';
import './entry.css';

interface EntryOverlayProps {
  onExit: () => void;
}

type Phase = 'tree' | 'eating' | 'dissolving' | 'verse' | 'button' | 'exiting';

const CHAR_W = 7.2;
const CHAR_H = 14;
const SNAKE_MAX = 25;
const SNAKE_INITIAL = 8;

const VERSE_LINES = [
  'But of the tree of the knowledge of good and evil,',
  'thou shalt not eat of it:',
  'for in the day that thou eatest thereof',
  'thou shalt surely die.',
];
const CITATION = 'Genesis 2:17';

interface Cell {
  ch: string;
  alive: boolean;
  brightness: number; // precomputed once in init()
}

interface Point {
  r: number;
  c: number;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export default function EntryOverlay({ onExit }: EntryOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // All animation state lives in refs so the RAF loop reads/writes
  // without triggering re-renders.
  const gridRef = useRef<(Cell | null)[][]>([]);
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const aliveRef = useRef<Point[]>([]);
  const snakeHeadRef = useRef<Point>({ r: 0, c: 0 });
  const snakePathRef = useRef<Point[]>([]);
  const snakeLengthRef = useRef(SNAKE_INITIAL);
  const snakeTargetRef = useRef<Point | null>(null);
  const dissolveFrameRef = useRef(0);
  const phaseRef = useRef<Phase>('tree');
  const rafRef = useRef<number | null>(null);

  // React state for DOM-driven UI (verse, button, hint, exit)
  const [hintVisible, setHintVisible] = useState(false);
  const [verseLineIdx, setVerseLineIdx] = useState(-1); // -1 = no lines yet
  const [citationVisible, setCitationVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // ── Canvas drawing ──
  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'top';

    const grid = gridRef.current;
    const cols = colsRef.current;
    const rows = rowsRef.current;

    // Tree cells — use precomputed brightness (FIX #2)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]?.[c];
        if (cell && cell.alive) {
          const b = cell.brightness;
          ctx.fillStyle = `rgb(${b},${b},${b})`;
          ctx.fillText(cell.ch, c * CHAR_W, r * CHAR_H);
        }
      }
    }

    // Snake tail + bright head
    const phase = phaseRef.current;
    if (phase === 'eating' || phase === 'dissolving') {
      const path = snakePathRef.current;
      const len = Math.max(path.length, 1);
      for (let i = 0; i < path.length; i++) {
        const p = path[i];
        // i = 0 is oldest tail segment, i = len-1 is newest (head)
        const t = i / len; // 0 = old, 1 = head
        const tailOpacity = 0.25 + t * 0.75;
        ctx.fillStyle = `rgba(255,255,255,${tailOpacity})`;
        ctx.fillRect(
          p.c * CHAR_W - 1,
          p.r * CHAR_H - 1,
          CHAR_W + 2,
          CHAR_H + 2,
        );
      }

      // Bright head with glow
      const head = snakeHeadRef.current;
      ctx.shadowColor = 'rgba(200, 255, 200, 0.9)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(220, 255, 220, 1)';
      ctx.fillRect(
        head.c * CHAR_W - 2,
        head.r * CHAR_H - 2,
        CHAR_W + 4,
        CHAR_H + 4,
      );
      ctx.shadowBlur = 0;
    }
  }, []);

  // ── Snake logic ──
  const pickTarget = useCallback(() => {
    const head = snakeHeadRef.current;
    const alive = aliveRef.current;
    const grid = gridRef.current;
    if (alive.length === 0) {
      snakeTargetRef.current = null;
      return;
    }
    let best: Point | null = null;
    let bestDist = Infinity;
    for (const p of alive) {
      const cell = grid[p.r]?.[p.c];
      if (!cell || !cell.alive) continue;
      const d = Math.abs(p.r - head.r) + Math.abs(p.c - head.c);
      if (d < bestDist && d > 0) {
        bestDist = d;
        best = p;
      }
    }
    snakeTargetRef.current = best;
  }, []);

  const moveSnake = useCallback(() => {
    const target = snakeTargetRef.current;
    if (!target) return;
    const head = snakeHeadRef.current;
    const cols = colsRef.current;
    const rows = rowsRef.current;

    let dr = 0;
    let dc = 0;
    if (Math.abs(target.r - head.r) > Math.abs(target.c - head.c)) {
      dr = target.r > head.r ? 1 : -1;
    } else {
      dc = target.c > head.c ? 1 : -1;
    }

    // 15% jitter
    if (Math.random() < 0.15) {
      if (dr !== 0) {
        dr = 0;
        dc = Math.random() < 0.5 ? 1 : -1;
      } else {
        dc = 0;
        dr = Math.random() < 0.5 ? 1 : -1;
      }
    }

    const next: Point = {
      r: Math.max(0, Math.min(rows - 1, head.r + dr)),
      c: Math.max(0, Math.min(cols - 1, head.c + dc)),
    };
    snakeHeadRef.current = next;
    snakePathRef.current.push({ ...next });
    if (snakePathRef.current.length > snakeLengthRef.current) {
      snakePathRef.current.shift();
    }

    // Eat
    const grid = gridRef.current;
    const cell = grid[next.r]?.[next.c];
    if (cell && cell.alive) {
      cell.alive = false;
      aliveRef.current = aliveRef.current.filter(
        (p) => !(p.r === next.r && p.c === next.c),
      );
      snakeLengthRef.current = Math.min(snakeLengthRef.current + 1, SNAKE_MAX);

      const tgt = snakeTargetRef.current;
      const tgtCell = tgt && grid[tgt.r]?.[tgt.c];
      if (Math.random() < 0.3 || !tgt || !tgtCell || !tgtCell.alive) {
        pickTarget();
      }
    }
  }, [pickTarget]);

  // ── Verse reveal scheduler ──
  const scheduleVerseReveal = useCallback(() => {
    let i = 0;
    const tickLine = () => {
      if (i >= VERSE_LINES.length) {
        // After last line, fade in citation, then button
        window.setTimeout(() => setCitationVisible(true), 600);
        window.setTimeout(() => {
          setButtonVisible(true);
          phaseRef.current = 'button';
        }, 1800);
        return;
      }
      setVerseLineIdx(i);
      i++;
      window.setTimeout(tickLine, 700);
    };
    tickLine();
  }, []);

  // ── Animation loop ──
  const animate = useCallback(() => {
    const phase = phaseRef.current;

    if (phase === 'eating') {
      for (let i = 0; i < 3; i++) moveSnake();

      if (aliveRef.current.length === 0) {
        phaseRef.current = 'dissolving';
        dissolveFrameRef.current = 0;
      }
    }

    if (phaseRef.current === 'dissolving') {
      dissolveFrameRef.current++;
      if (dissolveFrameRef.current > 20) {
        snakePathRef.current.shift();
        if (snakePathRef.current.length === 0) {
          phaseRef.current = 'verse';
          // Trigger verse reveal — DOM driven
          scheduleVerseReveal();
        }
      }
    }

    drawTree();

    // Stop the loop once we leave the canvas-driven phases
    if (phaseRef.current === 'eating' || phaseRef.current === 'dissolving') {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      // One last clear so the verse appears on a clean background
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [moveSnake, drawTree, scheduleVerseReveal]);

  // ── init() — canvas setup, grid build, full state reset (FIXES #1, #3, #4) ──
  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // FIX #4: full state reset so replay/resize is stable
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    phaseRef.current = 'tree';
    snakePathRef.current = [];
    snakeLengthRef.current = SNAKE_INITIAL;
    snakeTargetRef.current = null;
    dissolveFrameRef.current = 0;
    setVerseLineIdx(-1);
    setCitationVisible(false);
    setButtonVisible(false);

    // FIX #3: reset transform before re-applying scale (avoids compounding on resize)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const cols = Math.floor(rect.width / CHAR_W);
    const rows = Math.floor(rect.height / CHAR_H);
    colsRef.current = cols;
    rowsRef.current = rows;

    const grid: (Cell | null)[][] = [];
    const offsetR = Math.floor((rows - TREE.length) / 2);
    const offsetC = Math.floor((cols - TREE_REF_WIDTH) / 2);

    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const tr = r - offsetR;
        const tc = c - offsetC;
        if (tr >= 0 && tr < TREE.length && tc >= 0 && tc < TREE[tr].length && TREE[tr][tc] !== ' ') {
          grid[r][c] = {
            ch: TREE[tr][tc],
            alive: true,
            // FIX #2: precompute brightness once, not per frame
            brightness: 180 + Math.floor(Math.random() * 40),
          };
        } else {
          grid[r][c] = null;
        }
      }
    }
    gridRef.current = grid;

    drawTree();

    // Show hint after a beat
    window.setTimeout(() => setHintVisible(true), 1800);
  }, [drawTree]);

  // ── Mount + resize ──
  useEffect(() => {
    init();
    const onResize = () => init();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [init]);

  // ── Click to start snake ──
  const handleClick = () => {
    if (phaseRef.current !== 'tree') return;

    if (prefersReducedMotion()) {
      // Reduced motion: skip snake, jump to verse
      const grid = gridRef.current;
      const rows = rowsRef.current;
      const cols = colsRef.current;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r]?.[c]) grid[r][c]!.alive = false;
        }
      }
      aliveRef.current = [];
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHintVisible(false);
      phaseRef.current = 'verse';
      setVerseLineIdx(VERSE_LINES.length - 1);
      setCitationVisible(true);
      setButtonVisible(true);
      return;
    }

    setHintVisible(false);
    phaseRef.current = 'eating';

    // Build alive list
    const alive: Point[] = [];
    const grid = gridRef.current;
    const rows = rowsRef.current;
    const cols = colsRef.current;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]?.[c]?.alive) alive.push({ r, c });
      }
    }
    aliveRef.current = alive;

    // Start snake just above the topmost fruit
    const top = alive.reduce((best, p) => (p.r < best.r ? p : best), alive[0]);
    snakeHeadRef.current = { r: Math.max(0, top.r - 2), c: top.c };
    snakePathRef.current = [{ ...snakeHeadRef.current }];
    snakeLengthRef.current = SNAKE_INITIAL;
    pickTarget();

    rafRef.current = requestAnimationFrame(animate);
  };

  // ── Exit ──
  const handleExitClick = () => {
    setExiting(true);
    window.setTimeout(() => onExit(), 800);
  };

  return (
    <div
      ref={containerRef}
      className={`entry-overlay${exiting ? ' exiting' : ''}`}
      onClick={handleClick}
      role="dialog"
      aria-label="Site entry"
    >
      <canvas ref={canvasRef} className="entry-canvas" />

      <div className={`entry-hint${hintVisible ? ' visible' : ''}`}>eat the apple</div>

      {/* Verse + button — DOM-based, fades in after dissolve */}
      <div className="entry-verse-wrap">
        <div className={`entry-verse${verseLineIdx >= 0 ? ' visible' : ''}`}>
          {VERSE_LINES.map((line, i) => (
            <span
              key={i}
              className={`entry-verse-line${verseLineIdx >= i ? ' visible' : ''}`}
            >
              {line}
            </span>
          ))}
          <span className={`entry-verse-citation${citationVisible ? ' visible' : ''}`}>
            {CITATION}
          </span>
        </div>

        <div className={`entry-button-wrap${buttonVisible ? ' visible' : ''}`}>
          <ChromeButton onClick={handleExitClick}>I know I am a sinner</ChromeButton>
        </div>
      </div>
    </div>
  );
}
