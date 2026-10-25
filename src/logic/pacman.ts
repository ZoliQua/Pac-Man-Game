import type { Direction, Vec } from './types';
import { key } from './grid';
import { canMove, stepWithWrap } from './movement';

type PacmanState = { pos: Vec; dir: Direction; nextDir: Direction };

/**
 * Whether Pac-Man may move one tile in `dir`: the destination must be a legal
 * (non-wall, in-bounds) tile AND must not be a `blockedTiles` tile. The
 * `blockedTiles` set holds the ghost-house door tiles, which are NOT walls
 * (ghosts must pass through them) but Pac-Man must never enter — otherwise he
 * could walk into the sealed house and die on the parked ghosts.
 */
export function pacCanMove(
  pos: Vec,
  dir: Direction,
  walls: Set<string>,
  cols: number,
  rows: number,
  tunnelRow: number,
  blockedTiles: Set<string>,
): boolean {
  if (!canMove(pos, dir, walls, cols, rows, tunnelRow)) return false;
  const next = stepWithWrap(pos, dir, tunnelRow, cols);
  return !blockedTiles.has(key(next));
}

/**
 * Advance Pac-Man by at most one tile. Pure; no React.
 *
 * Turn buffering: every tile is a node. If a buffered `nextDir` is legal from
 * the current tile, it becomes the active `dir`. `nextDir` is sticky — it is
 * kept so a held direction re-applies at the next legal junction.
 *
 * Then: if the (possibly updated) `dir` is legal, step one tile with tunnel
 * wrap; otherwise stay put (wall stop) with `dir` unchanged.
 *
 * `blockedTiles` (default empty) holds tiles Pac-Man may not step onto even
 * though they are not walls — namely the ghost-house door tiles. This blocks
 * Pac-Man only; ghosts use `canMove`/`chooseDir` directly and can still pass
 * the door (house exit / eaten return).
 */
export function nextPacman(
  pacman: PacmanState,
  walls: Set<string>,
  cols: number,
  rows: number,
  tunnelRow: number,
  blockedTiles: Set<string> = new Set(),
): PacmanState {
  let dir = pacman.dir;
  const nextDir = pacman.nextDir;

  if (
    nextDir !== 'NONE' &&
    pacCanMove(pacman.pos, nextDir, walls, cols, rows, tunnelRow, blockedTiles)
  ) {
    dir = nextDir;
  }

  if (pacCanMove(pacman.pos, dir, walls, cols, rows, tunnelRow, blockedTiles)) {
    return {
      pos: stepWithWrap(pacman.pos, dir, tunnelRow, cols),
      dir,
      nextDir,
    };
  }

  // Wall stop: stay put, keep dir and the sticky nextDir.
  return { pos: pacman.pos, dir, nextDir };
}
