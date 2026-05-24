import {
  HOUSE_DOT_LIMITS,
  HOUSE_DOOR_ROW,
  HOUSE_EXIT,
  SCATTER_CORNERS,
  SCATTER_CHASE,
} from './constants';
import { neighbour } from './grid';
import { INITIAL_PELLET_TOTAL, PARSED_MAZE } from './maze';
import { canMove, stepWithWrap } from './movement';
import type { Direction, Ghost, GhostName, GameState, Vec } from './types';

/**
 * Phase 4 ghost AI. Pure (no React). Ghosts decide direction only at tile
 * nodes (every tile is a node in this maze model), never reverse except on a
 * forced mode change (handled by the scheduler in game.ts), and at each node
 * pick the legal non-reverse neighbour minimising squared distance to their
 * target. Tie-break order: up > left > down > right.
 *
 * Phase 4 deliberately implements ONLY scatter/chase + house exit + collision
 * flagging. Frightened/eaten behaviour, ghost-eating, lives, respawn and level
 * advance are Phase 5.
 */

/** The global scatter/chase mode for the current phase index. */
export function globalMode(phaseIndex: number): 'scatter' | 'chase' {
  const i = Math.min(phaseIndex, SCATTER_CHASE.length - 1);
  return SCATTER_CHASE[i].mode;
}

/** Opposite direction; NONE → NONE. */
export function reverse(dir: Direction): Direction {
  switch (dir) {
    case 'UP':
      return 'DOWN';
    case 'DOWN':
      return 'UP';
    case 'LEFT':
      return 'RIGHT';
    case 'RIGHT':
      return 'LEFT';
    case 'NONE':
      return 'NONE';
  }
}

/** Squared Euclidean distance between two tiles (no sqrt; only used to order). */
function dist2(a: Vec, b: Vec): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** `pos` shifted `n` tiles in `dir` (no wrap; used for target tiles only). */
function ahead(pos: Vec, dir: Direction, n: number): Vec {
  let v = pos;
  for (let i = 0; i < n; i++) v = neighbour(v, dir);
  return v;
}

/**
 * The target tile a ghost steers toward. In scatter mode every ghost targets
 * its own corner. In chase mode the classic per-ghost targeting applies.
 *
 * Phase 5: frightened/eaten ghosts must be handled by checking `ghost.mode`
 * BEFORE consulting the global scatter/chase mode (via `globalMode`), to avoid
 * a regression where a frightened or eaten ghost suddenly targets a corner or
 * Pac-Man instead of fleeing/returning to the house.
 */
export function targetTile(ghost: Ghost, state: GameState): Vec {
  // Per-ghost mode is checked BEFORE the global scatter/chase mode.
  // - eaten: head back to the house door so the eyes return home.
  // - frightened: movement is pseudo-random (see advanceGhost); the returned
  //   target is unused, but we return the ghost's own position so any caller
  //   that does consult it gets a harmless no-op target.
  if (ghost.mode === 'eaten') {
    return HOUSE_EXIT;
  }
  if (ghost.mode === 'frightened') {
    return ghost.pos;
  }

  if (globalMode(state.phaseIndex) === 'scatter') {
    return SCATTER_CORNERS[ghost.name];
  }

  const pac = state.pacman;
  switch (ghost.name) {
    case 'blinky':
      return pac.pos;
    case 'pinky':
      // 4 tiles ahead of Pac-Man in his facing direction (his tile if NONE).
      return pac.dir === 'NONE' ? pac.pos : ahead(pac.pos, pac.dir, 4);
    case 'inky': {
      // Vector from Blinky to the pivot (2 tiles ahead of Pac), doubled.
      const pivot = pac.dir === 'NONE' ? pac.pos : ahead(pac.pos, pac.dir, 2);
      const blinky = state.ghosts.find((g) => g.name === 'blinky');
      const bp = blinky ? blinky.pos : pac.pos;
      return { x: 2 * pivot.x - bp.x, y: 2 * pivot.y - bp.y };
    }
    case 'clyde': {
      // Chase Pac directly when >= 8 tiles away (squared 64), else flee home.
      return dist2(ghost.pos, pac.pos) >= 8 * 8
        ? pac.pos
        : SCATTER_CORNERS.clyde;
    }
  }
}

// Candidate directions in the classic up > left > down > right tie-break order.
const CANDIDATE_DIRS: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];

/**
 * Pick the ghost's next direction at its current tile. Considers UP, LEFT,
 * DOWN, RIGHT in that order; excludes the reverse of the current `dir` (no 180°
 * turns); keeps only directions the ghost can actually move into. Among legal
 * candidates picks the one minimising squared distance to `target`, breaking
 * ties by the candidate order. If no non-reverse candidate exists (dead end),
 * the reverse is allowed.
 *
 * Note on doors: `canMove` blocks only `walls`. The ghost-house door tiles ('-')
 * are NOT walls, so both ghosts and Pac-Man can step through them. That is
 * acceptable for Phase 4 because Pac-Man never reaches the sealed house in
 * normal play; proper door-blocking for Pac is deferred (Phase 5+).
 *
 * `allowReverse` lets the house-exit logic maneuver freely inside the chamber.
 */
export function chooseDir(
  ghost: Ghost,
  target: Vec,
  allowReverse = false,
): Direction {
  const { walls, cols, rows, tunnelRow } = PARSED_MAZE;
  const banned = allowReverse ? 'NONE' : reverse(ghost.dir);

  let best: Direction = 'NONE';
  let bestD2 = Infinity;
  for (const dir of CANDIDATE_DIRS) {
    if (dir === banned) continue;
    if (!canMove(ghost.pos, dir, walls, cols, rows, tunnelRow)) continue;
    const next = stepWithWrap(ghost.pos, dir, tunnelRow, cols);
    const d2 = dist2(next, target);
    if (d2 < bestD2) {
      bestD2 = d2;
      best = dir;
    }
  }

  if (best !== 'NONE') return best;

  // Dead end: only the reverse remains legal — allow it.
  const rev = reverse(ghost.dir);
  if (rev !== 'NONE' && canMove(ghost.pos, rev, walls, cols, rows, tunnelRow)) {
    return rev;
  }
  return 'NONE';
}

/** Stable index per ghost name, used as a hash ingredient. */
const GHOST_INDEX: Record<GhostName, number> = {
  blinky: 0,
  pinky: 1,
  inky: 2,
  clyde: 3,
};

/**
 * Pick a frightened ghost's next direction PSEUDO-RANDOMLY among the legal
 * non-reverse directions, using a DETERMINISTIC state-derived hash (no
 * `Math.random`, so a given state always yields the same choice and ticks are
 * reproducible).
 *
 * Hash inputs: the ghost's name-index, its tile x/y, and the remaining
 * `frightenedTimer`. They are combined with a small mixing function (xorshift-
 * style multiply/shift) and reduced modulo the candidate count. The candidate
 * list is built in the same up>left>down>right order as `chooseDir`, with the
 * reverse direction excluded (frightened ghosts still never 180° on their own).
 * If only the reverse remains (dead end), it is allowed.
 */
export function frightenedDir(ghost: Ghost, frightenedTimer: number): Direction {
  const { walls, cols, rows, tunnelRow } = PARSED_MAZE;
  const banned = reverse(ghost.dir);

  const legal: Direction[] = [];
  for (const dir of CANDIDATE_DIRS) {
    if (dir === banned) continue;
    if (canMove(ghost.pos, dir, walls, cols, rows, tunnelRow)) legal.push(dir);
  }

  if (legal.length === 0) {
    // Dead end: only the reverse remains legal — allow it.
    const rev = reverse(ghost.dir);
    if (rev !== 'NONE' && canMove(ghost.pos, rev, walls, cols, rows, tunnelRow)) {
      return rev;
    }
    return 'NONE';
  }

  // Deterministic hash → index into the legal list.
  let h = (GHOST_INDEX[ghost.name] + 1) * 374761393;
  h = (h ^ (ghost.pos.x * 668265263)) >>> 0;
  h = (h ^ (ghost.pos.y * 2246822519)) >>> 0;
  h = (h ^ (frightenedTimer * 3266489917)) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  const idx = h % legal.length;
  return legal[idx];
}

/**
 * "Pellets eaten so far" derived from the live state (immutable read).
 *
 * Callers must pass the **post-eat** state (pellets already removed this tick)
 * so the house-exit gate reflects the current tick, not the previous one.
 */
export function pelletsEaten(state: GameState): number {
  return (
    INITIAL_PELLET_TOTAL - (state.pellets.size + state.powerPellets.size)
  );
}

/**
 * Advance one ghost by at most one tile. Pure; returns a NEW Ghost.
 *
 * Mode-specific behaviour (checked before the normal scatter/chase path):
 *
 * - frightened: moves at HALF speed. We gate movement on the parity of
 *   `state.frightenedTimer`: the ghost only steps when the timer is EVEN, so it
 *   visibly moves every other tick. (Parity of the timer is used rather than a
 *   per-ghost counter so the slow-down stays purely state-derived and resets
 *   cleanly when frightened ends.) When it does move, direction is chosen
 *   pseudo-randomly and deterministically via `frightenedDir`. Tunnel wrap
 *   applies. Never reverses on its own (only the power-pellet reversal in
 *   game.ts flips it).
 *
 * - eaten (eyes): moves at FULL speed back toward the house via `chooseDir`
 *   targeting HOUSE_EXIT, with reverses allowed so the eyes can backtrack and
 *   re-enter the door without wedging. On reaching HOUSE_EXIT the ghost is
 *   REVIVED: it is re-seated at its in-house spawn and re-flagged `inHouse`
 *   with the current global mode, so the existing house-exit logic walks it
 *   back out on subsequent ticks. (Reviving via the house rather than directly
 *   above the door reuses the proven exit path and avoids re-integration bugs.)
 *
 * House handling (only for non-eaten ghosts; eaten ghosts ignore the gate so
 * eyes are never parked):
 * - In-house ghost whose dot gate is NOT met: stays put.
 * - In-house ghost whose gate IS met: heads for the exit tile above the door
 *   (reverses allowed). Once risen above the door row it is considered out.
 * - Out-of-house ghost: targets `targetTile`, picks a direction with `chooseDir`
 *   (no 180°), and steps one tile (tunnel wrap applies).
 */
export function advanceGhost(ghost: Ghost, state: GameState): Ghost {
  const { tunnelRow, cols } = PARSED_MAZE;

  // --- eaten (eyes) returning home ---
  if (ghost.mode === 'eaten') {
    // Reached the door exit tile → revive into the chamber and re-exit.
    if (ghost.pos.x === HOUSE_EXIT.x && ghost.pos.y === HOUSE_EXIT.y) {
      const spawn = PARSED_MAZE.ghostSpawns[ghost.name];
      return {
        ...ghost,
        pos: spawn,
        dir: 'NONE',
        mode: globalMode(state.phaseIndex),
        inHouse: true,
      };
    }
    // Full speed toward the house; reverses allowed to avoid wedging.
    const dir = chooseDir(ghost, HOUSE_EXIT, true);
    const pos = stepWithWrap(ghost.pos, dir, tunnelRow, cols);
    return { ...ghost, pos, dir };
  }

  // --- frightened: half speed + pseudo-random turns ---
  if (ghost.mode === 'frightened' && !ghost.inHouse) {
    // Half speed: only move on even-timer ticks.
    if (state.frightenedTimer % 2 !== 0) {
      return ghost;
    }
    const dir = frightenedDir(ghost, state.frightenedTimer);
    const pos = stepWithWrap(ghost.pos, dir, tunnelRow, cols);
    return { ...ghost, pos, dir };
  }

  if (ghost.inHouse) {
    const gateMet = pelletsEaten(state) >= HOUSE_DOT_LIMITS[ghost.name];
    if (!gateMet) {
      // Park: stay put until the dot gate opens.
      return ghost;
    }
    // Maneuver toward the exit; reverses allowed inside the chamber.
    const dir = chooseDir(ghost, HOUSE_EXIT, true);
    const pos = stepWithWrap(ghost.pos, dir, tunnelRow, cols);
    // Considered "out" once risen above the door row.
    const inHouse = pos.y >= HOUSE_DOOR_ROW;
    return { ...ghost, pos, dir, inHouse };
  }

  const target = targetTile(ghost, state);
  const dir = chooseDir(ghost, target, false);
  const pos = stepWithWrap(ghost.pos, dir, tunnelRow, cols);
  return { ...ghost, pos, dir };
}
