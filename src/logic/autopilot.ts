import { advanceGame } from './game';
import { key } from './grid';
import { PARSED_MAZE } from './maze';
import { stepWithWrap } from './movement';
import { pacCanMove } from './pacman';
import type { Direction, GameState, Ghost, Vec } from './types';

/**
 * Demo autopilot for the landing-page attract mode. Pure and deterministic: it
 * only reads the real game state and the real movement rules (walls, the
 * Pac-only blocked ghost-house door, tunnel wrap).
 *
 * At every tile it runs a BFS from Pac-Man:
 *   1. towards the nearest frightened ghost (while enough frightened time is
 *      left to catch it), otherwise
 *   2. towards the nearest pellet / power pellet,
 * never stepping through tiles close to a live (scatter/chase) ghost. When no
 * safe path exists it picks the legal move that keeps the most distance from
 * the nearest live ghost.
 */

const DIRS: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
/** Tiles within this Manhattan distance of a live ghost are avoided. */
export const DANGER_RADIUS = 2;
/** Only hunt frightened ghosts with at least this many ticks left. */
const HUNT_MIN_TICKS = 8;
/** …and only when they are this close (BFS steps). */
const HUNT_MAX_STEPS = 14;

const { walls, cols, rows, tunnelRow, doorTiles } = PARSED_MAZE;

function legalMoves(pos: Vec): { dir: Direction; next: Vec }[] {
  const out: { dir: Direction; next: Vec }[] = [];
  for (const dir of DIRS) {
    if (!pacCanMove(pos, dir, walls, cols, rows, tunnelRow, doorTiles)) continue;
    out.push({ dir, next: stepWithWrap(pos, dir, tunnelRow, cols) });
  }
  return out;
}

const isLive = (g: Ghost) => g.mode === 'scatter' || g.mode === 'chase';

function manhattan(a: Vec, b: Vec): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Tile keys too close to a live ghost to walk through. */
export function dangerTiles(state: GameState): Set<string> {
  const danger = new Set<string>();
  for (const g of state.ghosts) {
    if (!isLive(g)) continue;
    for (let dy = -DANGER_RADIUS; dy <= DANGER_RADIUS; dy++) {
      for (let dx = -DANGER_RADIUS; dx <= DANGER_RADIUS; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > DANGER_RADIUS) continue;
        danger.add(key({ x: g.pos.x + dx, y: g.pos.y + dy }));
      }
    }
  }
  return danger;
}

/**
 * First direction of the shortest safe path from Pac-Man to any tile for which
 * `isGoal` holds, or null when none is reachable within `maxSteps`.
 */
function bfsFirstStep(
  start: Vec,
  isGoal: (k: string) => boolean,
  danger: Set<string>,
  maxSteps = Infinity,
): Direction | null {
  const seen = new Set<string>([key(start)]);
  let frontier: { pos: Vec; first: Direction }[] = [];
  for (const { dir, next } of legalMoves(start)) {
    const k = key(next);
    if (danger.has(k) || seen.has(k)) continue;
    if (isGoal(k)) return dir;
    seen.add(k);
    frontier.push({ pos: next, first: dir });
  }
  for (let depth = 2; frontier.length > 0 && depth <= maxSteps; depth++) {
    const nextFrontier: { pos: Vec; first: Direction }[] = [];
    for (const { pos, first } of frontier) {
      for (const { next } of legalMoves(pos)) {
        const k = key(next);
        if (danger.has(k) || seen.has(k)) continue;
        if (isGoal(k)) return first;
        seen.add(k);
        nextFrontier.push({ pos: next, first });
      }
    }
    frontier = nextFrontier;
  }
  return null;
}

/** The legal move that maximises distance to the nearest live ghost. */
function escapeMove(state: GameState): Direction {
  const live = state.ghosts.filter(isLive);
  let best: Direction = state.pacman.dir;
  let bestScore = -Infinity;
  for (const { dir, next } of legalMoves(state.pacman.pos)) {
    const nearest = live.reduce((m, g) => Math.min(m, manhattan(next, g.pos)), Infinity);
    if (nearest > bestScore) {
      bestScore = nearest;
      best = dir;
    }
  }
  return best;
}

/** Direction the demo should request (as `nextDir`) on this tick. */
export function chooseDirection(state: GameState): Direction {
  const start = state.pacman.pos;
  const danger = dangerTiles(state);

  if (state.frightenedTimer >= HUNT_MIN_TICKS) {
    const prey = new Set(
      state.ghosts.filter((g) => g.mode === 'frightened' && !g.inHouse).map((g) => key(g.pos)),
    );
    if (prey.size > 0) {
      const hunt = bfsFirstStep(start, (k) => prey.has(k), danger, HUNT_MAX_STEPS);
      if (hunt) return hunt;
    }
  }

  const food = bfsFirstStep(
    start,
    (k) => state.pellets.has(k) || state.powerPellets.has(k),
    danger,
  );
  if (food) return food;

  return escapeMove(state);
}

/** One demo tick: steer with the autopilot while playing, then run the real engine. */
export function demoStep(prev: GameState): GameState {
  if (prev.status === 'running') {
    return advanceGame({ ...prev, pacman: { ...prev.pacman, nextDir: chooseDirection(prev) } });
  }
  return advanceGame(prev);
}
