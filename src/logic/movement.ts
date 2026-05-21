import type { Direction, Vec } from './types';
import { inBounds, isWall, neighbour, tunnelWrap } from './grid';

/**
 * Divergence from the plan (flagged per working rules): the plan named the
 * Phase 2 helpers `step`/`atNode`/`applyBufferedTurn`. We instead expose
 * `stepWithWrap`/`canMove` here and inline the buffered-turn logic in
 * `nextPacman` (pacman.ts). Because every tile is a node in this maze model,
 * a separate `atNode`/`applyBufferedTurn` is unnecessary — buffering can be
 * tried on every tile. Phase 4 ghost code reuses `stepWithWrap`/`canMove`.
 */

/**
 * The neighbouring tile one step in `dir`, wrapped through the horizontal
 * tunnel. `dir === 'NONE'` returns the same tile (identity, not a move); callers
 * that require actual movement should guard with `canMove` (which is false for
 * 'NONE'). Generic enough for both Pac-Man and the ghosts (Phase 4 reuse).
 */
export function stepWithWrap(
  pos: Vec,
  dir: Direction,
  tunnelRow: number,
  cols: number,
): Vec {
  if (dir === 'NONE') return pos;
  return tunnelWrap(neighbour(pos, dir), tunnelRow, cols);
}

/**
 * Whether moving one tile in `dir` (with tunnel wrap) lands on a non-wall
 * in-bounds tile. `dir === 'NONE'` is treated as "no movement" → false (there
 * is no move to make). Generic; ghosts reuse this in Phase 4.
 */
export function canMove(
  pos: Vec,
  dir: Direction,
  walls: Set<string>,
  cols: number,
  rows: number,
  tunnelRow: number,
): boolean {
  if (dir === 'NONE') return false;
  const next = stepWithWrap(pos, dir, tunnelRow, cols);
  return inBounds(next, cols, rows) && !isWall(next, walls);
}
