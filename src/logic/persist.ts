import { DYING_PAUSE_TICKS, LEVELCLEAR_PAUSE_TICKS, SCATTER_CHASE, frightenedTicks } from './constants';
import { key } from './grid';
import { PARSED_MAZE } from './maze';
import type { Direction, GameState, GameStatus, Ghost, GhostMode, GhostName, Vec } from './types';

/**
 * JSON-safe snapshot of a run in progress. `GameState` holds the uneaten
 * pellets in `Set`s, which `JSON.stringify` would flatten to `{}`, so the saved
 * shape stores them as sorted key arrays instead.
 */
export type SavedGame = Omit<GameState, 'pellets' | 'powerPellets'> & {
  pellets: string[];
  powerPellets: string[];
};

export function toSaved(state: GameState): SavedGame {
  return {
    ...state,
    pellets: [...state.pellets].sort(),
    powerPellets: [...state.powerPellets].sort(),
  };
}

export function fromSaved(saved: SavedGame): GameState {
  return {
    ...saved,
    pacman: { ...saved.pacman, pos: { ...saved.pacman.pos } },
    ghosts: saved.ghosts.map((g) => ({ ...g, pos: { ...g.pos } })),
    pellets: new Set(saved.pellets),
    powerPellets: new Set(saved.powerPellets),
  };
}

const DIRECTIONS: readonly Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'NONE'];
const GHOST_ORDER: readonly GhostName[] = ['blinky', 'pinky', 'inky', 'clyde'];
const GHOST_MODES: readonly GhostMode[] = ['scatter', 'chase', 'frightened', 'eaten'];
/** Only states of a run in progress are ever saved. */
const SAVED_STATUSES: readonly GameStatus[] = ['running', 'paused', 'dying', 'levelClear'];

const MAX_SCORE = 100_000_000;
const MAX_LEVEL = 10_000;
const MAX_LIVES = 9;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const intIn = (v: unknown, min: number, max: number): v is number =>
  isInt(v) && v >= min && v <= max;

const { walls, doorTiles, cols, rows, pellets: MAZE_PELLETS, powerPellets: MAZE_POWER } = PARSED_MAZE;

/** An in-bounds, non-wall tile. */
function isFloor(v: unknown): v is Vec {
  if (!isObj(v)) return false;
  if (!intIn(v.x, 0, cols - 1) || !intIn(v.y, 0, rows - 1)) return false;
  return !walls.has(key(v as Vec));
}

/** Unique keys, every one of which is in `allowed`. */
function isKeySubset(v: unknown, allowed: Set<string>): v is string[] {
  if (!Array.isArray(v) || v.length > allowed.size) return false;
  const seen = new Set<string>();
  for (const k of v) {
    if (typeof k !== 'string' || !allowed.has(k) || seen.has(k)) return false;
    seen.add(k);
  }
  return true;
}

function isGhost(v: unknown, name: GhostName): v is Ghost {
  return (
    isObj(v) &&
    v.name === name &&
    isFloor(v.pos) &&
    DIRECTIONS.includes(v.dir as Direction) &&
    GHOST_MODES.includes(v.mode as GhostMode) &&
    typeof v.inHouse === 'boolean' &&
    intIn(v.dotCounter, 0, 10_000)
  );
}

/** Guards a saved session before it is trusted as a Pac-Man run. */
export function isSavedPacman(v: unknown): v is SavedGame {
  if (!isObj(v)) return false;

  const pac = v.pacman;
  if (
    !isObj(pac) ||
    !isFloor(pac.pos) ||
    doorTiles.has(key(pac.pos)) ||
    !DIRECTIONS.includes(pac.dir as Direction) ||
    !DIRECTIONS.includes(pac.nextDir as Direction)
  ) {
    return false;
  }

  const ghosts = v.ghosts;
  if (!Array.isArray(ghosts) || ghosts.length !== GHOST_ORDER.length) return false;
  if (!ghosts.every((g, i) => isGhost(g, GHOST_ORDER[i]))) return false;

  const maxTransition = Math.max(DYING_PAUSE_TICKS, LEVELCLEAR_PAUSE_TICKS);
  const maxPhaseTicks = Math.max(...SCATTER_CHASE.map((p) => p.ticks));

  return (
    isKeySubset(v.pellets, MAZE_PELLETS) &&
    isKeySubset(v.powerPellets, MAZE_POWER) &&
    intIn(v.score, 0, MAX_SCORE) &&
    v.score % 10 === 0 &&
    intIn(v.lives, 1, MAX_LIVES) &&
    intIn(v.level, 1, MAX_LEVEL) &&
    SAVED_STATUSES.includes(v.status as GameStatus) &&
    intIn(v.phaseIndex, 0, SCATTER_CHASE.length - 1) &&
    intIn(v.phaseTimer, 0, maxPhaseTicks) &&
    intIn(v.frightenedTimer, 0, frightenedTicks(1)) &&
    intIn(v.ghostChain, 0, 3) &&
    intIn(v.transitionTimer, 0, maxTransition)
  );
}
