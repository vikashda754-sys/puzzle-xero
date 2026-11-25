import type { Coord, DifficultyConfig, DifficultySize, PowerAnalysis, TileState } from '../types/circuit';

// Bitmasks: 1 = UP, 2 = RIGHT, 4 = DOWN, 8 = LEFT
export const DIR = [
  { dr: -1, dc: 0, bit: 1, opp: 4 }, // UP
  { dr: 0, dc: 1, bit: 2, opp: 8 },  // RIGHT
  { dr: 1, dc: 0, bit: 4, opp: 1 },  // DOWN
  { dr: 0, dc: -1, bit: 8, opp: 2 }, // LEFT
] as const;

export const DIFFICULTIES: DifficultyConfig[] = [
  { size: 4, label: '4×4', tier: 'Easy' },
  { size: 5, label: '5×5', tier: 'Normal' },
  { size: 6, label: '6×6', tier: 'Hard' },
  { size: 7, label: '7×7', tier: 'Expert' },
];

export function rotateMaskCW(mask: number, times = 1): number {
  let m = mask;
  const t = ((times % 4) + 4) % 4;
  for (let i = 0; i < t; i++) {
    m = ((m << 1) | (m >> 3)) & 15;
  }
  return m;
}

export function popCount(mask: number): number {
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (mask & (1 << i)) count++;
  }
  return count;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function generateSpanningTree(size: DifficultySize): {
  masks: number[][];
  source: Coord;
} {
  const masks = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const inTree = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const sr = Math.floor(size / 2);
  const sc = Math.floor(size / 2);

  inTree[sr][sc] = true;
  const treeCells: Coord[] = [{ r: sr, c: sc }];

  while (treeCells.length < size * size) {
    const candidates: Array<{ r: number; c: number; nr: number; nc: number; d: (typeof DIR)[number] }> = [];
    const fallback: Array<{ r: number; c: number; nr: number; nc: number; d: (typeof DIR)[number] }> = [];

    for (const cell of treeCells) {
      const deg = popCount(masks[cell.r][cell.c]);
      for (const d of DIR) {
        const nr = cell.r + d.dr;
        const nc = cell.c + d.dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !inTree[nr][nc]) {
          const edge = { r: cell.r, c: cell.c, nr, nc, d };
          if (deg < 3) {
            candidates.push(edge);
          } else {
            fallback.push(edge);
          }
        }
      }
    }

    const pool = candidates.length > 0 ? candidates : fallback;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    masks[chosen.r][chosen.c] |= chosen.d.bit;
    masks[chosen.nr][chosen.nc] |= chosen.d.opp;
    inTree[chosen.nr][chosen.nc] = true;
    treeCells.push({ r: chosen.nr, c: chosen.nc });
  }

  return { masks, source: { r: sr, c: sc } };
}

export function computePowerState(grid: TileState[][], source: Coord): PowerAnalysis {
  const size = grid.length;
  const powered = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const leakingTiles = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  if (size === 0) {
    return {
      powered,
      poweredCount: 0,
      leakCount: 0,
      leakingTiles,
      isComplete: false,
    };
  }

  const queue: Coord[] = [{ r: source.r, c: source.c }];
  powered[source.r][source.c] = true;
  let poweredCount = 1;

  while (queue.length > 0) {
    const curr = queue.shift();
    if (!curr) break;
    const { r, c } = curr;
    const currMask = rotateMaskCW(grid[r][c].baseMask, grid[r][c].rot);

    for (const d of DIR) {
      if (!(currMask & d.bit)) continue;
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      if (powered[nr][nc]) continue;

      const nextMask = rotateMaskCW(grid[nr][nc].baseMask, grid[nr][nc].rot);
      if (nextMask & d.opp) {
        powered[nr][nc] = true;
        poweredCount++;
        queue.push({ r: nr, c: nc });
      }
    }
  }

  let leakCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const m = rotateMaskCW(grid[r][c].baseMask, grid[r][c].rot);
      for (const d of DIR) {
        if (!(m & d.bit)) continue;
        const nr = r + d.dr;
        const nc = c + d.dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
          leakCount++;
          if (powered[r][c]) leakingTiles[r][c] = true;
        } else {
          const nm = rotateMaskCW(grid[nr][nc].baseMask, grid[nr][nc].rot);
          if (!(nm & d.opp)) {
            leakCount++;
            if (powered[r][c]) leakingTiles[r][c] = true;
          }
        }
      }
    }
  }

  return {
    powered,
    poweredCount,
    leakCount,
    leakingTiles,
    isComplete: poweredCount === size * size && leakCount === 0,
  };
}

export function createScrambledPuzzle(size: DifficultySize): {
  grid: TileState[][];
  source: Coord;
} {
  const { masks, source } = generateSpanningTree(size);

  const grid: TileState[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      baseMask: masks[r][c],
      initialRot: 0,
      rot: 0,
      visualRot: 0,
      pinned: false,
    }))
  );

  let attempts = 0;
  do {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const mask = grid[r][c].baseMask;
        let randRot = Math.floor(Math.random() * 4);
        if ((mask === 5 || mask === 10) && Math.random() < 0.7) {
          randRot = 1;
        }
        if (mask === 15) {
          randRot = 0;
        }
        grid[r][c].initialRot = randRot;
        grid[r][c].rot = randRot;
        grid[r][c].visualRot = randRot;
      }
    }
    attempts++;
  } while (computePowerState(grid, source).isComplete && attempts < 12);

  return { grid, source };
}

export function describeTileType(mask: number): string {
  const deg = popCount(mask);
  if (deg === 1) return 'terminal node';
  if (deg === 2) {
    return mask === 5 || mask === 10 ? 'straight trace' : 'elbow trace';
  }
  if (deg === 3) return 'T-junction';
  return '4-way cross';
}

export function getSolvedStepSequence(
  grid: TileState[][],
  source: Coord
): Array<{ r: number; c: number; delta: number }> {
  const size = grid.length;
  if (size === 0) return [];

  const visited = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const queue: Coord[] = [{ r: source.r, c: source.c }];
  visited[source.r][source.c] = true;

  const steps: Array<{ r: number; c: number; delta: number }> = [];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (!curr) break;
    const { r, c } = curr;
    const tile = grid[r][c];

    if (tile.baseMask !== 15) {
      if (tile.baseMask === 5 || tile.baseMask === 10) {
        if (tile.rot % 2 !== 0) {
          steps.push({ r, c, delta: 1 });
        }
      } else if (tile.rot !== 0) {
        const delta = tile.rot === 1 ? -1 : tile.rot === 2 ? 2 : 1;
        steps.push({ r, c, delta });
      }
    }

    for (const d of DIR) {
      if (!(tile.baseMask & d.bit)) continue;
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push({ r: nr, c: nc });
      }
    }
  }

  return steps;
}
