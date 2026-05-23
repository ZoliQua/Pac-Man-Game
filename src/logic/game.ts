import { DEFAULT_THEME, SCATTER_CHASE, START_LIVES } from './constants';
import { advanceGhost, globalMode, reverse } from './ghosts';
import { key } from './grid';
import { PARSED_MAZE } from './maze';
import { nextPacman } from './pacman';
import { pelletPoints, powerPelletPoints } from './scoring';
import type { GameState, GameStatus, Ghost, Vec } from './types';

/**
 * Build the four ghosts at their spawns. Blinky starts OUTSIDE the house
 * (`inHouse: false`, just above the door) and immediately heads left; the
 * others start parked in the chamber (`dir: 'NONE'`) until their dot gate opens.
 */
function createGhosts(): Ghost[] {
  const { ghostSpawns } = PARSED_MAZE;
  return [
    {
      name: 'blinky',
      pos: ghostSpawns.blinky,
      dir: 'LEFT',
      mode: 'scatter',
      inHouse: false,
      dotCounter: 0,
    },
    {
      name: 'pinky',
      pos: ghostSpawns.pinky,
      dir: 'NONE',
      mode: 'scatter',
      inHouse: true,
      dotCounter: 0,
    },
    {
      name: 'inky',
      pos: ghostSpawns.inky,
      dir: 'NONE',
      mode: 'scatter',
      inHouse: true,
      dotCounter: 0,
    },
    {
      name: 'clyde',
      pos: ghostSpawns.clyde,
      dir: 'NONE',
      mode: 'scatter',
      inHouse: true,
      dotCounter: 0,
    },
  ];
}

/**
 * The pristine starting state, derived from the parsed maze. `overrides` lets a
 * restart preserve user preferences (e.g. `theme`).
 */
export function createInitialState(
  overrides: Partial<GameState> = {},
): GameState {
  const { pacSpawn, pellets, powerPellets } = PARSED_MAZE;
  return {
    pacman: { pos: pacSpawn, dir: 'NONE', nextDir: 'NONE' },
    ghosts: createGhosts(),
    pellets: new Set(pellets),
    powerPellets: new Set(powerPellets),
    score: 0,
    lives: START_LIVES,
    level: 1,
    status: 'idle',
    phaseIndex: 0,
    phaseTimer: SCATTER_CHASE[0].ticks,
    frightenedTimer: 0,
    ghostChain: 0,
    theme: DEFAULT_THEME,
    ...overrides,
  };
}

/** Same tile? */
function sameTile(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * The single pure tick. Order: move Pac-Man (+eat), run the scatter/chase
 * scheduler, move all ghosts, check collision, then the level-clear check.
 * When not running the state is returned unchanged.
 *
 * Immutability contract: the incoming `state` object and its `pellets` /
 * `powerPellets` Sets and `ghosts` array are NEVER mutated; new copies are
 * created for anything that changed.
 *
 * Phase 4 scope: collision with a (non-frightened) ghost only sets `status =
 * 'dying'`. Lives, respawn, frightened/eaten and level advance are Phase 5.
 */
export function advanceGame(state: GameState): GameState {
  if (state.status !== 'running') {
    return state;
  }

  const { walls, cols, rows, tunnelRow } = PARSED_MAZE;

  // --- 1. Move Pac-Man ---
  const pacPrev = state.pacman.pos;
  const pacman = nextPacman(state.pacman, walls, cols, rows, tunnelRow);

  // --- Pellet / power-pellet consumption ---
  const tileKey = key(pacman.pos);
  let { pellets, powerPellets, score } = state;

  if (pellets.has(tileKey)) {
    pellets = new Set(pellets);
    pellets.delete(tileKey);
    score = score + pelletPoints();
  } else if (powerPellets.has(tileKey)) {
    powerPellets = new Set(powerPellets);
    powerPellets.delete(tileKey);
    score = score + powerPelletPoints();
  }

  // --- 2. Scatter/chase scheduler ---
  // Decrement the phase timer; on expiry advance the phase (clamped at the
  // last) and FORCE every out-of-house ghost to reverse exactly once.
  let phaseIndex = state.phaseIndex;
  let phaseTimer = state.phaseTimer - 1;
  let forceReverse = false;
  if (phaseTimer <= 0) {
    if (phaseIndex < SCATTER_CHASE.length - 1) {
      phaseIndex = phaseIndex + 1;
      forceReverse = true;
    }
    phaseTimer = SCATTER_CHASE[phaseIndex].ticks;
  }

  const mode = globalMode(phaseIndex);
  // State the ghost AI reads (phaseIndex drives scatter/chase targeting).
  // NOTE: pellets/powerPellets must be the post-eat sets from this tick so
  // that pelletsEaten(stateForGhosts) in advanceGhost reflects pellets consumed
  // this tick and the house-exit gate fires on the correct tick.
  const stateForGhosts: GameState = {
    ...state,
    pacman,
    pellets,
    powerPellets,
    phaseIndex,
  };

  // --- 3. Move all ghosts (immutably) ---
  const ghosts: Ghost[] = state.ghosts.map((g) => {
    // On a phase change, out-of-house ghosts reverse once before deciding.
    const base =
      forceReverse && !g.inHouse ? { ...g, dir: reverse(g.dir) } : g;
    const moved = advanceGhost(base, stateForGhosts);
    // Keep per-ghost mode in sync with the global mode for ghosts that are out
    // (no frightened/eaten this phase). Parked ghosts keep 'scatter'.
    return moved.inHouse ? moved : { ...moved, mode };
  });

  // --- 4. Collision: same tile, or a swap (passed through each other) ---
  let collided = false;
  for (let i = 0; i < ghosts.length; i++) {
    const ghostPrev = state.ghosts[i].pos;
    const ghostNew = ghosts[i].pos;
    if (sameTile(ghostNew, pacman.pos)) {
      collided = true;
      break;
    }
    if (sameTile(ghostPrev, pacman.pos) && sameTile(ghostNew, pacPrev)) {
      collided = true;
      break;
    }
  }

  // --- 5. Resolve status. `dying` (collision) takes precedence. ---
  let status: GameStatus = state.status;
  if (collided) {
    status = 'dying';
  } else if (pellets.size === 0 && powerPellets.size === 0) {
    status = 'levelClear';
  }

  return {
    ...state,
    pacman,
    ghosts,
    pellets,
    powerPellets,
    score,
    phaseIndex,
    phaseTimer,
    status,
  };
}
