import type { Direction, Vec } from './types';
import { canMove, stepWithWrap } from './movement';

export type PacmanState = { pos: Vec; dir: Direction; nextDir: Direction };

/**
 * Advance Pac-Man by at most one tile. Pure; no React.
 *
 * Turn buffering: every tile is a node. If a buffered `nextDir` is legal from
 * the current tile, it becomes the active `dir`. `nextDir` is sticky — it is
 * kept so a held direction re-applies at the next legal junction.
 *
 * Then: if the (possibly updated) `dir` is legal, step one tile with tunnel
 * wrap; otherwise stay put (wall stop) with `dir` unchanged.
 */
export function nextPacman(
  pacman: PacmanState,
  walls: Set<string>,
  cols: number,
  rows: number,
  tunnelRow: number,
): PacmanState {
  let dir = pacman.dir;
  const nextDir = pacman.nextDir;

  if (
    nextDir !== 'NONE' &&
    canMove(pacman.pos, nextDir, walls, cols, rows, tunnelRow)
  ) {
    dir = nextDir;
  }

  if (canMove(pacman.pos, dir, walls, cols, rows, tunnelRow)) {
    return {
      pos: stepWithWrap(pacman.pos, dir, tunnelRow, cols),
      dir,
      nextDir,
    };
  }

  // Wall stop: stay put, keep dir and the sticky nextDir.
  return { pos: pacman.pos, dir, nextDir };
}
