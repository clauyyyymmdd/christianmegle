export type ShapeName =
  | 'rect' | 'circle' | 'oval' | 'diamond'
  | 'arch' | 'cathedral' | 'trefoil' | 'ogee';

export type PatternName =
  | 'flower_chain' | 'seed_repeat' | 'diamond_lattice' | 'cross_chain'
  | 'dot_mesh' | 'metatron_tile' | 'hex_lattice'
  | 'vesica_weave' | 'checker' | 'wave' | 'braid' | 'thornvine';

export type CharsetName = 'liturgical' | 'sacred' | 'lace' | 'minimal';

export type CornerName = 'rosette' | 'cross' | 'fleur' | 'mandala' | 'eye' | 'none';
export type CenterOrnName = 'none' | 'cross' | 'eye' | 'flower' | 'metatron';
export type FillDensity = 'none' | 'sparse' | 'medium' | 'dense';

// ── Charsets ────────────────────────────────────────────────────────

const CHARSETS: Record<CharsetName, string> = {
  liturgical: '✝†✟✠◇✦✧✿❀❋✺❉❈',
  sacred:     '◇✦✧◊○×+⊹⋆※',
  lace:       '✿❀❋✺❉❈✾❃❁',
  minimal:    '·◦∘',
};

// ── Distance fields ─────────────────────────────────────────────────

type DistFn = (x: number, y: number, cx: number, cy: number, hw: number, hh: number) => number;

const DIST: Record<ShapeName, DistFn> = {
  rect: (x, y, cx, cy, hw, hh) =>
    Math.max(Math.abs(x - cx) / hw, Math.abs(y - cy) / hh),

  circle: (x, y, cx, cy, hw, hh) => {
    const dx = (x - cx) / hw;
    const dy = (y - cy) / hh;
    return Math.sqrt(dx * dx + dy * dy);
  },

  oval: (x, y, cx, cy, hw, hh) => {
    // aspect-corrected oval
    const ax = (x - cx) * (hh / hw);
    const ay = y - cy;
    return Math.sqrt((ax / hh) * (ax / hh) + (ay / hh) * (ay / hh));
  },

  diamond: (x, y, cx, cy, hw, hh) =>
    Math.abs(x - cx) / hw + Math.abs(y - cy) / hh,

  arch: (x, y, cx, cy, hw, hh) => {
    const ny = (y - cy) / hh;
    if (ny > 0) {
      // Bottom half: rect
      return Math.max(Math.abs(x - cx) / hw, ny);
    }
    // Top half: circle (with stretched ny for arch shape)
    const dx = (x - cx) / hw;
    const dy = ny * 1.2;
    return Math.sqrt(dx * dx + dy * dy);
  },

  cathedral: (x, y, cx, cy, hw, hh) => {
    const nx = (x - cx) / hw;
    const ny = (y - cy) / hh;
    if (ny > 0.3) {
      // Lower body: rect
      return Math.max(Math.abs(nx), Math.abs(ny));
    }
    // Upper: pointed arch
    return Math.sqrt(nx * nx + (ny * 1.5) * (ny * 1.5)) * 0.85 + Math.abs(nx) * 0.15;
  },

  trefoil: (x, y, cx, cy, hw, hh) => {
    const dx = (x - cx) / hw;
    const dy = (y - cy) / hh;
    const r = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const lobe = 0.5 + 0.3 * Math.cos(3 * angle);
    return r / lobe;
  },

  ogee: (x, y, cx, cy, hw, hh) => {
    const nx = (x - cx) / hw;
    const ny = (y - cy) / hh;
    if (ny > 0) return Math.max(Math.abs(nx), ny);
    // Upper ogee curve
    const t = -ny;
    const curve = Math.abs(nx) - 0.2 * Math.sin(t * Math.PI * 1.5);
    return Math.max(curve, t);
  },
};

// ── Pattern functions ───────────────────────────────────────────────

type PatternFn = (bandX: number, bandY: number, scale: number) => 0 | 1;

const PATTERNS: Record<PatternName, PatternFn> = {
  flower_chain: (bx, by, scale) => {
    const tx = ((bx % scale) + scale) % scale - scale / 2;
    const ty = ((by % scale) + scale) % scale - scale / 2;
    const r = Math.sqrt(tx * tx + ty * ty) / (scale / 2);
    return Math.abs(r - 0.8) < 0.25 ? 1 : 0;
  },

  seed_repeat: (bx, by, scale) => {
    const tx = ((bx % scale) + scale) % scale - scale / 2;
    const ty = ((by % scale) + scale) % scale - scale / 2;
    const r = Math.sqrt(tx * tx + ty * ty);
    if (r < scale * 0.18) return 1;
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      const ox = Math.cos(ang) * scale * 0.35;
      const oy = Math.sin(ang) * scale * 0.35;
      const d = Math.sqrt((tx - ox) ** 2 + (ty - oy) ** 2);
      if (d < scale * 0.15) return 1;
    }
    return 0;
  },

  diamond_lattice: (bx, by, scale) => {
    const ax = ((bx % scale) + scale) % scale - scale / 2;
    const ay = ((by % scale) + scale) % scale - scale / 2;
    return Math.abs(Math.abs(ax) + Math.abs(ay * 2) - scale / 2) < 0.6 ? 1 : 0;
  },

  cross_chain: (bx, by, scale) => {
    const tx = ((bx % scale) + scale) % scale - scale / 2;
    const ty = ((by % scale) + scale) % scale - scale / 2;
    const inH = Math.abs(tx) < scale * 0.4 && Math.abs(ty) < scale * 0.15;
    const inV = Math.abs(tx) < scale * 0.15 && Math.abs(ty) < scale * 0.4;
    return inH || inV ? 1 : 0;
  },

  dot_mesh: (bx, by) => {
    return (Math.round(bx) + Math.round(by)) % 2 === 0 ? 1 : 0;
  },

  metatron_tile: (bx, by, scale) => {
    const tx = ((bx % scale) + scale) % scale - scale / 2;
    const ty = ((by % scale) + scale) % scale - scale / 2;
    const r = Math.sqrt(tx * tx + ty * ty);
    if (Math.abs(r - scale * 0.4) < 0.6) return 1;
    // 6 radial lines
    const ang = Math.atan2(ty, tx);
    for (let i = 0; i < 6; i++) {
      const lineAng = (i * Math.PI) / 3;
      if (Math.abs(((ang - lineAng + Math.PI * 3) % Math.PI) - Math.PI / 2) < 0.15 && r < scale * 0.45) return 1;
    }
    return 0;
  },

  hex_lattice: (bx, by, scale) => {
    // Hexagonal grid of small circles
    const row = Math.round(by / (scale * 0.866));
    const colOffset = row % 2 === 0 ? 0 : scale / 2;
    const col = Math.round((bx - colOffset) / scale);
    const cx = col * scale + colOffset;
    const cy = row * scale * 0.866;
    const d = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2);
    return d < scale * 0.35 ? 1 : 0;
  },

  vesica_weave: (bx, by, scale) => {
    const tx = ((bx % scale) + scale) % scale - scale / 2;
    const ty = ((by % scale) + scale) % scale - scale / 2;
    const d1 = Math.sqrt((tx + scale * 0.2) ** 2 + ty * ty);
    const d2 = Math.sqrt((tx - scale * 0.2) ** 2 + ty * ty);
    return Math.abs(d1 - scale * 0.4) < 0.5 || Math.abs(d2 - scale * 0.4) < 0.5 ? 1 : 0;
  },

  checker: (bx, by, scale) => {
    const cx = Math.floor(bx / (scale / 2));
    const cy = Math.floor(by / (scale / 2));
    return (cx + cy) % 2 === 0 ? 1 : 0;
  },

  wave: (bx, by, scale) => {
    return Math.abs(by - Math.sin(bx / scale * Math.PI * 2) * scale * 0.3) < 0.8 ? 1 : 0;
  },

  braid: (bx, by, scale) => {
    const a = Math.sin(bx / scale * Math.PI * 2) * scale * 0.3;
    const b = -Math.sin(bx / scale * Math.PI * 2) * scale * 0.3;
    return Math.abs(by - a) < 0.7 || Math.abs(by - b) < 0.7 ? 1 : 0;
  },

  thornvine: (bx, by, scale) => {
    const main = Math.abs(by - Math.sin(bx / scale * Math.PI * 2) * scale * 0.3) < 0.6;
    const thorn = (Math.round(bx) % Math.max(1, Math.round(scale / 2))) === 0 && Math.abs(by) < scale * 0.4;
    return main || thorn ? 1 : 0;
  },
};

// ── Corner ornaments ────────────────────────────────────────────────

const CORNERS: Record<CornerName, string[]> = {
  rosette: ['✧·◇·✧', '◇ ✿ ◇', '✧·◇·✧'],
  cross:   ['  ✦  ', '  ✝  ', '✦·✝·✦', '  ✝  ', '  ✦  '],
  fleur:   [' ·✦· ', '◇·✿·◇', ' ·◊· ', '  ·  '],
  mandala: [' ·✧·✧· ', '✧·◇·◇·✧', '·◇·✝·◇·', '✧·◇·◇·✧', ' ·✧·✧· '],
  eye:     ['  ◠  ', '·( ◉ )·', '  ◡  '],
  none:    [],
};

// ── Center ornaments ────────────────────────────────────────────────

const CENTER_ORN: Record<CenterOrnName, string[]> = {
  none: [],
  cross: ['  ✦  ', '  ✝  ', '✦·✝·✦', '  ✝  ', '  ✦  '],
  eye: ['  ◠  ', '·( ◉ )·', '  ◡  '],
  flower: [' ·✿· ', '✿·❀·✿', ' ·✿· '],
  metatron: [
    '  ·✦·  ',
    ' ◇·✝·◇ ',
    '✦·✿·✦',
    ' ◇·✝·◇ ',
    '  ·✦·  ',
  ],
};

// ── Border config ───────────────────────────────────────────────────

export interface BorderConfig {
  name?: string;
  note?: string;
  shape: ShapeName;
  fw: number;          // frame width (chars)
  fh: number;          // frame height (chars)
  margin: number;      // empty padding from edge
  thick: number;       // border band thickness
  pscale: number;      // pattern scale
  edgePat: PatternName;
  corner: CornerName;
  charset: CharsetName;
  customChars?: string;
  centerOrn: CenterOrnName;
  centerText?: string;
  fillDensity: FillDensity;
}

// ── Generator ───────────────────────────────────────────────────────

const FILL_RATES: Record<FillDensity, number> = {
  none: 0,
  sparse: 0.08,
  medium: 0.18,
  dense: 0.35,
};

function stamp(grid: string[][], art: string[], originX: number, originY: number, flipX = false, flipY = false) {
  const h = art.length;
  for (let i = 0; i < h; i++) {
    const row = flipY ? art[h - 1 - i] : art[i];
    for (let j = 0; j < row.length; j++) {
      const ch = flipX ? row[row.length - 1 - j] : row[j];
      if (ch && ch !== ' ') {
        const gx = originX + j;
        const gy = originY + i;
        if (gy >= 0 && gy < grid.length && gx >= 0 && gx < grid[0].length) {
          grid[gy][gx] = ch;
        }
      }
    }
  }
}

export function generateBorder(cfg: BorderConfig): string {
  const w = cfg.fw;
  const h = cfg.fh;
  const grid: string[][] = Array.from({ length: h }, () => Array(w).fill(' '));

  const cx = w / 2;
  const cy = h / 2;
  const hw = (w - cfg.margin * 2) / 2;
  const hh = (h - cfg.margin * 2) / 2;

  const distFn = DIST[cfg.shape];
  const patFn = PATTERNS[cfg.edgePat];

  const chars = cfg.customChars && cfg.customChars.length > 0
    ? cfg.customChars.replace(/·/g, '')
    : CHARSETS[cfg.charset].replace(/·/g, '');
  const charPool = chars.length > 0 ? Array.from(chars) : ['·'];

  const fillRate = FILL_RATES[cfg.fillDensity];
  const minDim = Math.min(hw, hh);
  const bandThickNorm = cfg.thick / minDim;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = distFn(x, y, cx, cy, hw, hh);
      if (d >= 1.0 && d <= 1.0 + bandThickNorm) {
        // In the border band — compute band coordinates
        const bandX = Math.atan2(y - cy, x - cx) * Math.max(hw, hh);
        const bandY = (d - 1.0) * minDim;
        const hit = patFn(bandX, bandY, cfg.pscale);
        if (hit) {
          const idx = (Math.abs(Math.round(bandX) + Math.round(bandY))) % charPool.length;
          grid[y][x] = charPool[idx];
        } else if (fillRate > 0) {
          // Pseudo-random fill based on position
          const seed = ((x * 73856093) ^ (y * 19349663)) >>> 0;
          if ((seed % 1000) / 1000 < fillRate) {
            grid[y][x] = '·';
          }
        }
      }
    }
  }

  // Corner ornaments — at the 4 corners of the inner margin
  const cornerArt = CORNERS[cfg.corner];
  if (cornerArt.length > 0) {
    const cw = cornerArt[0].length;
    const ch = cornerArt.length;
    stamp(grid, cornerArt, cfg.margin, cfg.margin, false, false);
    stamp(grid, cornerArt, w - cfg.margin - cw, cfg.margin, true, false);
    stamp(grid, cornerArt, cfg.margin, h - cfg.margin - ch, false, true);
    stamp(grid, cornerArt, w - cfg.margin - cw, h - cfg.margin - ch, true, true);
  }

  // Center ornament
  const centerArt = CENTER_ORN[cfg.centerOrn];
  if (centerArt.length > 0) {
    const cw = centerArt[0].length;
    const ch = centerArt.length;
    stamp(grid, centerArt, Math.round(cx - cw / 2), Math.round(cy - ch / 2), false, false);
  }

  // Center text
  if (cfg.centerText) {
    const txt = cfg.centerText;
    const ox = Math.round(cx - txt.length / 2);
    const oy = Math.round(cy + (centerArt.length || 0) / 2 + 1);
    for (let i = 0; i < txt.length; i++) {
      const gx = ox + i;
      if (oy >= 0 && oy < h && gx >= 0 && gx < w) {
        grid[oy][gx] = txt[i];
      }
    }
  }

  return grid.map((row) => row.join('').trimEnd()).join('\n');
}
