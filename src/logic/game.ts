import {
  DEFAULT_THEME,
  DYING_PAUSE_TICKS,
  LEVELCLEAR_PAUSE_TICKS,
  SCATTER_CHASE,
  START_LIVES,
  frightenedTicks,
} from './constants';
import { advanceGhost, globalMode, reverse } from './ghosts';
import { key } from './grid';
import { PARSED_MAZE } from './maze';
import { nextPacman } from './pacman';
import {
  ghostChainPoints,
  pelletPoints,
  powerPelletPoints,
} from './scoring';
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
    transitionTimer: 0,
    theme: DEFAULT_THEME,
    ...overrides,
  };
}

/**
 * Reset Pac-Man and the ghosts to their spawns (fresh `createGhosts`) while
 * preserving everything else (score, lives, level, pellets, theme). Used by
 * both the death-respawn and the level-advance transitions. Also clears the
 * scatter/chase scheduler back to phase 0 and the frightened/chain counters —
 * callers set those fields explicitly too, but doing it here keeps the helper
 * self-contained and the resulting state consistent.
 */
function resetEntities(state: GameState): GameState {
  const { pacSpawn } = PARSED_MAZE;
  return {
    ...state,
    pacman: { pos: pacSpawn, dir: 'NONE', nextDir: 'NONE' },
    ghosts: createGhosts(),
    phaseIndex: 0,
    phaseTimer: SCATTER_CHASE[0].ticks,
    frightenedTimer: 0,
    ghostChain: 0,
  };
}

/** Same tile? */
function sameTile(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * The single pure tick. When `running`: move Pac-Man (+eat), activate frightened
 * mode on a power pellet, run the scatter/chase scheduler, tick the frightened
 * timer, move all ghosts, resolve mode-aware collisions, then the level-clear
 * check. When in a transition state (`dying` / `levelClear`) the entities are
 * frozen and only `transitionTimer` counts down, resolving to respawn / next
 * level / game over. All other statuses return unchanged.
 *
 * Immutability contract: the incoming `state` object and its `pellets` /
 * `powerPellets` Sets and `ghosts` array are NEVER mutated; new copies are
 * created for anything that changed.
 */
export function advanceGame(state: GameState): GameState {
  if (state.status === 'dying') {
    return advanceDying(state);
  }
  if (state.status === 'levelClear') {
    return advanceLevelClear(state);
  }
  if (state.status !== 'running') {
    return state;
  }

  const { walls, cols, rows, tunnelRow, doorTiles } = PARSED_MAZE;

  // --- 1. Move Pac-Man ---
  // `doorTiles` are passed as Pac-only blocked tiles: they are not walls (ghosts
  // must pass them for house exit / eaten return), but Pac-Man must never enter
  // the ghost house through the door.
  const pacPrev = state.pacman.pos;
  const pacman = nextPacman(
    state.pacman,
    walls,
    cols,
    rows,
    tunnelRow,
    doorTiles,
  );

  // --- Pellet / power-pellet consumption ---
  const tileKey = key(pacman.pos);
  let { pellets, powerPellets, score, frightenedTimer, ghostChain } = state;
  let ghosts = state.ghosts;
  let atePower = false;

  if (pellets.has(tileKey)) {
    pellets = new Set(pellets);
    pellets.delete(tileKey);
    score = score + pelletPoints();
  } else if (powerPellets.has(tileKey)) {
    powerPellets = new Set(powerPellets);
    powerPellets.delete(tileKey);
    score = score + powerPelletPoints();
    atePower = true;
  }

  // --- Power-pellet → frightened activation ---
  // Set the timer, reset the eat chain, and flip every ghost that is OUT of the
  // house and NOT already eaten to frightened, forcing a one-time reversal.
  if (atePower) {
    frightenedTimer = frightenedTicks(state.level);
    ghostChain = 0;
    ghosts = ghosts.map((g) =>
      !g.inHouse && g.mode !== 'eaten'
        ? { ...g, mode: 'frightened', dir: reverse(g.dir) }
        : g,
    );
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

  // --- 3. Frightened timer: decrement; on expiry revert frightened → global. ---
  // Eaten ghosts are NOT affected by the timer (they ride home regardless).
  if (frightenedTimer > 0) {
    frightenedTimer = frightenedTimer - 1;
    if (frightenedTimer === 0) {
      ghosts = ghosts.map((g) =>
        g.mode === 'frightened' ? { ...g, mode } : g,
      );
    }
  }

  // State the ghost AI reads (phaseIndex drives scatter/chase targeting,
  // frightenedTimer drives the half-speed/pseudo-random frightened movement).
  // NOTE: pellets/powerPellets must be the post-eat sets from this tick so
  // that pelletsEaten(stateForGhosts) in advanceGhost reflects pellets consumed
  // this tick and the house-exit gate fires on the correct tick.
  //
  // WHY `ghosts` is deliberately the PRE-MOVE snapshot (i.e. `state.ghosts`
  // via the spread, NOT the post-frightened-activation `ghosts` local):
  //   • Each ghost is passed individually as the `base` arg to advanceGhost,
  //     which reads that ghost's mode/position from `base`, not from
  //     stateForGhosts.ghosts.  The snapshot value is therefore never used for
  //     the moving ghost itself.
  //   • Inky's targetTile computation needs Blinky's position from the
  //     *previous* tick (classic one-tick lag).  Using the pre-move snapshot
  //     here is the accepted faithful reproduction of that behaviour.
  // If you add logic that needs siblings' *current* (post-move) positions,
  // you must rebuild stateForGhosts.ghosts after the map below.
  const stateForGhosts: GameState = {
    ...state,
    pacman,
    pellets,
    powerPellets,
    phaseIndex,
    frightenedTimer,
  };

  // --- 4. Move all ghosts (immutably) ---
  // Snapshot positions only — modes may already be flipped this tick (e.g. via frightened activation above).
  const ghostPositionsBefore = ghosts;
  ghosts = ghosts.map((g) => {
    // On a phase change, out-of-house ghosts in scatter/chase reverse once.
    // Frightened/eaten ghosts are not affected by the scatter/chase reversal.
    const base =
      forceReverse && !g.inHouse && (g.mode === 'scatter' || g.mode === 'chase')
        ? { ...g, dir: reverse(g.dir) }
        : g;
    const moved = advanceGhost(base, stateForGhosts);
    // Keep a ghost that is out AND in a scatter/chase mode in sync with the
    // global mode. Frightened/eaten ghosts keep their own mode; parked ghosts
    // keep theirs too. (A just-revived eaten ghost becomes inHouse with the
    // global mode already set by advanceGhost.)
    return !moved.inHouse && (moved.mode === 'scatter' || moved.mode === 'chase')
      ? { ...moved, mode }
      : moved;
  });

  // --- 5. Collision: same tile, or a swap (passed through each other) ---
  // Mode-aware: frightened → eat (chain points, mark eaten); scatter/chase →
  // dying; eaten (eyes) → no effect.
  let collidedFatal = false;
  for (let i = 0; i < ghosts.length; i++) {
    const ghostPrev = ghostPositionsBefore[i].pos;
    const ghostNew = ghosts[i].pos;
    const hit =
      sameTile(ghostNew, pacman.pos) ||
      (sameTile(ghostPrev, pacman.pos) && sameTile(ghostNew, pacPrev));
    if (!hit) continue;

    const g = ghosts[i];
    if (g.mode === 'frightened') {
      // Eat it: award the current chain value, advance the chain (cap at 3),
      // and turn the ghost into eyes.
      score = score + ghostChainPoints(ghostChain);
      ghostChain = Math.min(ghostChain + 1, 3);
      ghosts = ghosts.map((gg, j) =>
        j === i ? { ...gg, mode: 'eaten' } : gg,
      );
    } else if (g.mode === 'eaten') {
      // Eyes — no effect.
    } else {
      // scatter/chase ghost → fatal.
      collidedFatal = true;
      break;
    }
  }

  // --- 6. Resolve status. `levelClear` takes precedence over `dying`. ---
  // If both pellet sets are empty at the end of this tick the level is cleared,
  // even if a fatal collision also happened this tick: eating the last pellet
  // clears the level and the player does NOT die (this avoids the phantom-clear
  // bug where dying-on-the-last-pellet respawns into an empty maze and the next
  // running tick flips to levelClear, costing a life AND clearing the level).
  // A fatal collision only resolves to `dying` when pellets still remain.
  let status: GameStatus = state.status;
  let transitionTimer = state.transitionTimer;
  if (pellets.size === 0 && powerPellets.size === 0) {
    status = 'levelClear';
    transitionTimer = LEVELCLEAR_PAUSE_TICKS;
  } else if (collidedFatal) {
    status = 'dying';
    transitionTimer = DYING_PAUSE_TICKS;
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
    frightenedTimer,
    ghostChain,
    transitionTimer,
    status,
  };
}

/**
 * `dying` transition: entities frozen, `transitionTimer` counts down. On expiry
 * either game over (lives reach 0) or respawn entities and resume running
 * (lives−1; score/level/pellets/theme preserved).
 */
function advanceDying(state: GameState): GameState {
  const transitionTimer = state.transitionTimer - 1;
  if (transitionTimer > 0) {
    return { ...state, transitionTimer };
  }

  const newLives = state.lives - 1;
  if (newLives <= 0) {
    return { ...state, lives: 0, transitionTimer: 0, status: 'gameOver' };
  }

  return {
    ...resetEntities(state),
    lives: newLives,
    transitionTimer: 0,
    status: 'running',
  };
}

/**
 * `levelClear` transition: entities frozen, `transitionTimer` counts down. On
 * expiry advance the level, refill the pellet/power sets from fresh copies of
 * the parsed maze, respawn entities, and resume. Score and lives carry over.
 */
function advanceLevelClear(state: GameState): GameState {
  const transitionTimer = state.transitionTimer - 1;
  if (transitionTimer > 0) {
    return { ...state, transitionTimer };
  }

  const { pellets, powerPellets } = PARSED_MAZE;
  return {
    ...resetEntities(state),
    level: state.level + 1,
    pellets: new Set(pellets),
    powerPellets: new Set(powerPellets),
    transitionTimer: 0,
    status: 'running',
  };
}
