import type { GhostName, IconTheme, Vec } from './types';

/** Milliseconds per game tick (one tile step per entity). */
export const TICK_MS = 150;

/** Rendered pixel size of a single maze cell. */
export const CELL_PX = 20;

/** Starting number of lives. */
export const START_LIVES = 3;

/** Point values used by the scoring layer (wired up in Phase 3+). */
export const POINTS = {
  pellet: 10,
  power: 50,
  ghostChain: [200, 400, 800, 1600] as const,
} as const;

/**
 * Visual descriptor for a single icon theme. Phase 1 only needs the maze tiles
 * (wall / pellet / power pellet); the entity fields are minimal stubs to be
 * fleshed out in Phase 6.
 */
export type ThemeSpec = {
  /** CSS colour for wall tiles. */
  wall: string;
  /** CSS colour for pellet dots. */
  pellet: string;
  /** CSS colour for power-pellet dots. */
  powerPellet: string;
  /** CSS colour for the board background. */
  background: string;
  /** CSS colour for the ghost-house door. */
  door: string;
  /** Entity colours (stub for Phase 1; expanded in Phase 6). */
  pacman: string;
  ghosts: {
    blinky: string;
    pinky: string;
    inky: string;
    clyde: string;
  };
};

export const THEMES: Record<IconTheme, ThemeSpec> = {
  normal: {
    wall: '#2121de',
    pellet: '#ffd9a8',
    powerPellet: '#ffb8ff',
    background: '#000000',
    door: '#ffb8ff',
    pacman: '#ffff00',
    ghosts: {
      blinky: '#ff0000',
      pinky: '#ffb8ff',
      inky: '#00ffff',
      clyde: '#ffb852',
    },
  },
  fog: {
    wall: '#3a4a5a',
    pellet: '#9fb3c8',
    powerPellet: '#cfe3ff',
    background: '#0b0f14',
    door: '#cfe3ff',
    pacman: '#e6e6c8',
    ghosts: {
      blinky: '#c87a7a',
      pinky: '#c8a8c8',
      inky: '#8fb8c8',
      clyde: '#c8a878',
    },
  },
};

export const DEFAULT_THEME: IconTheme = 'normal';

/** Seconds → ticks (rounded). 1 tick = TICK_MS. */
const secs = (s: number): number => Math.round((s * 1000) / TICK_MS);

/**
 * One scatter/chase phase: a global ghost mode held for `ticks` ticks. The
 * scheduler walks this table via `phaseIndex`/`phaseTimer`; the last phase uses
 * a very large tick count to mean "chase indefinitely". Classic-style schedule
 * (7s scatter, 20s chase, 7s, 20s, 5s, 20s, 5s, then chase forever).
 */
export type ScatterChasePhase = { mode: 'scatter' | 'chase'; ticks: number };

export const SCATTER_CHASE: readonly ScatterChasePhase[] = [
  { mode: 'scatter', ticks: secs(7) },
  { mode: 'chase', ticks: secs(20) },
  { mode: 'scatter', ticks: secs(7) },
  { mode: 'chase', ticks: secs(20) },
  { mode: 'scatter', ticks: secs(5) },
  { mode: 'chase', ticks: secs(20) },
  { mode: 'scatter', ticks: secs(5) },
  { mode: 'chase', ticks: 1_000_000_000 },
] as const;

/**
 * Scatter-mode home corners, one per ghost. Classic assignment: Blinky
 * top-right, Pinky top-left, Inky bottom-right, Clyde bottom-left. Coordinates
 * sit just outside the play area in each corner of the 28x31 maze so ghosts
 * loop tightly around that corner during scatter.
 */
export const SCATTER_CORNERS: Record<GhostName, Vec> = {
  blinky: { x: 25, y: -2 }, // top-right
  pinky: { x: 2, y: -2 }, // top-left
  inky: { x: 27, y: 31 }, // bottom-right
  clyde: { x: 0, y: 31 }, // bottom-left
};

/**
 * Pellets-eaten thresholds before each ghost may leave the house. Blinky starts
 * outside (0). Pinky leaves immediately (0); Inky after 30; Clyde after 60.
 */
export const HOUSE_DOT_LIMITS: Record<GhostName, number> = {
  blinky: 0,
  pinky: 0,
  inky: 30,
  clyde: 60,
};

/**
 * Maze-layout-derived ghost-house exit constants. These are coupled to the
 * physical tile positions in MAZE (maze.ts) and must be updated if the maze
 * layout changes.
 *
 * HOUSE_DOOR_ROW: the row of the ghost-house door tiles ('-'). Door tiles sit
 *   at columns 13–14, row 12.
 * HOUSE_EXIT: the tile just above the door — the aim point for a ghost
 *   leaving the house. Blinky spawns here (row 11, col 13) and it is the
 *   first open-corridor tile a ghost reaches after rising through the door.
 */
export const HOUSE_DOOR_ROW = 12;
export const HOUSE_EXIT: Vec = { x: 13, y: 11 };

/**
 * Frightened-mode duration in ticks for a given level.
 *
 * Classic Pac-Man shortens the frightened window as levels progress. We keep it
 * simple: base ~6 seconds (level 1) and subtract ~0.5s worth of ticks per level
 * above 1, with a floor of ~1 second so it never collapses to nothing.
 *
 *   level 1 → 6.0s, level 2 → 5.5s, level 3 → 5.0s, ... floor at 1.0s.
 *
 * Returned value is in TICKS (each tick = TICK_MS).
 */
export function frightenedTicks(level: number): number {
  const base = Math.round(6000 / TICK_MS); // ~6 seconds
  const perLevel = Math.round(500 / TICK_MS); // ~0.5 second shorter each level
  const floor = Math.round(1000 / TICK_MS); // ~1 second minimum
  const ticks = base - perLevel * Math.max(0, level - 1);
  return Math.max(floor, ticks);
}

/**
 * When `frightenedTimer` drops to this many ticks (or fewer), the UI should
 * flash the frightened ghosts to warn that the window is about to close
 * (consumed by the renderer in Phase 6; the remaining timer is exposed on
 * `GameState.frightenedTimer`). Pure constant — no behavioural effect here.
 */
export const FRIGHTENED_FLASH_TICKS = Math.round(2000 / TICK_MS); // ~2 seconds

/** Ticks the board freezes on a death before respawn / game over (~1s). */
export const DYING_PAUSE_TICKS = Math.round(1000 / TICK_MS);

/** Ticks the board freezes on a cleared level before the next one (~1s). */
export const LEVELCLEAR_PAUSE_TICKS = Math.round(1000 / TICK_MS);
