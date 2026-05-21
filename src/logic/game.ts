import { DEFAULT_THEME, START_LIVES } from './constants';
import { PARSED_MAZE } from './maze';
import { nextPacman } from './pacman';
import type { GameState, Ghost } from './types';

/**
 * Build the four ghosts as DATA only. They do NOT move this phase (Phase 4).
 * Blinky spawns outside the house (`inHouse: false`); the others start parked.
 */
function createGhosts(): Ghost[] {
  const { ghostSpawns } = PARSED_MAZE;
  return [
    {
      name: 'blinky',
      pos: ghostSpawns.blinky,
      dir: 'NONE',
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
    phaseTimer: 0,
    frightenedTimer: 0,
    ghostChain: 0,
    theme: DEFAULT_THEME,
    ...overrides,
  };
}

/**
 * The single pure tick. THIS PHASE MOVES ONLY PAC-MAN — no ghost movement, no
 * pellet eating, no scoring (those arrive in later phases). When not running,
 * the state is returned unchanged.
 */
export function advanceGame(state: GameState): GameState {
  if (state.status !== 'running') {
    return state;
  }

  const { walls, cols, rows, tunnelRow } = PARSED_MAZE;
  const pacman = nextPacman(state.pacman, walls, cols, rows, tunnelRow);

  return { ...state, pacman };
}
