import type { IconTheme } from './types';

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
