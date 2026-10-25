import type { GhostName, IconTheme, Vec } from './types';

/** Milliseconds per game tick (one tile step per entity). */
export const TICK_MS = 150;

/** Starting number of lives. */
export const START_LIVES = 3;

/** Point values used by the scoring layer (wired up in Phase 3+). */
export const POINTS = {
  pellet: 10,
  power: 50,
  ghostChain: [200, 400, 800, 1600] as const,
} as const;

/**
 * Visual descriptor for a single icon theme. A theme is COSMETIC ONLY: it maps
 * each maze tile and entity to colour tokens (and a CSS class key) that the
 * components consume. Switching themes never changes layout, hitboxes, speed,
 * visibility, or any rule — only how things are drawn.
 *
 * The `key` is applied as a CSS class on the board roots (e.g. `theme-fog`) so
 * stylesheets can add theme-specific glows / filters beyond the colour tokens.
 */
export type ThemeSpec = {
  /** Stable identifier, used as a CSS class hook (`theme-normal` / `theme-fog`). */
  key: IconTheme;
  /** CSS colour for wall tiles. */
  wall: string;
  /** Soft glow / outline colour applied to walls (foggy halo in `fog`). */
  wallGlow: string;
  /** CSS colour for pellet dots. */
  pellet: string;
  /** CSS colour for power-pellet dots. */
  powerPellet: string;
  /** Halo colour for the pulsing power pellet. */
  powerGlow: string;
  /** CSS colour for the board background. */
  background: string;
  /** CSS colour for the ghost-house door. */
  door: string;
  /** Pac-Man body colour. */
  pacman: string;
  /** Per-ghost body colours (kept distinguishable in both themes). */
  ghosts: {
    blinky: string;
    pinky: string;
    inky: string;
    clyde: string;
  };
  /** Frightened-ghost body colour. */
  frightened: string;
  /** Alternate colour shown during the end-of-frightened flash. */
  frightenedFlash: string;
  /** Eye / pupil colours for normal ghosts and the eaten "eyes" state. */
  eye: string;
  pupil: string;
  /** Per-entity opacity multiplier (1 = solid; `fog` uses < 1 for wisps). */
  entityOpacity: number;
};

export const THEMES: Record<IconTheme, ThemeSpec> = {
  normal: {
    key: 'normal',
    wall: '#2121de',
    wallGlow: 'transparent',
    pellet: '#ffd9a8',
    powerPellet: '#ffb8ff',
    powerGlow: '#ffb8ff',
    background: '#000000',
    door: '#ffb8ff',
    pacman: '#ffff00',
    ghosts: {
      blinky: '#ff0000',
      pinky: '#ffb8ff',
      inky: '#00ffff',
      clyde: '#ffb852',
    },
    frightened: '#2121de',
    frightenedFlash: '#ffffff',
    eye: '#ffffff',
    pupil: '#2121de',
    entityOpacity: 1,
  },
  fog: {
    key: 'fog',
    wall: '#27323f',
    wallGlow: '#5a7a9a',
    pellet: '#8fb0c8',
    powerPellet: '#bfe0ff',
    powerGlow: '#7fb8e6',
    background: '#070b10',
    door: '#9fc0d8',
    pacman: '#dfe6d2',
    ghosts: {
      blinky: '#a98a8a',
      pinky: '#b8a0c0',
      inky: '#8aa8c0',
      clyde: '#bca888',
    },
    frightened: '#3a5066',
    frightenedFlash: '#cfe3ff',
    eye: '#e8f0f8',
    pupil: '#1a2530',
    entityOpacity: 0.82,
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
