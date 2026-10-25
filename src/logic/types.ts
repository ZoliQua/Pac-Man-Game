export type Vec = { x: number; y: number };

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';

export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten';

export type GameStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'dying'
  | 'levelClear'
  | 'gameOver';

export type IconTheme = 'normal' | 'fog';

export type Ghost = {
  name: GhostName;
  pos: Vec;
  dir: Direction;
  mode: GhostMode;
  inHouse: boolean; // still parked in the ghost house
  dotCounter: number; // Currently unused — the house-exit gate uses the global pellets-eaten
  // count vs HOUSE_DOT_LIMITS (see ghosts.ts). Kept to match the documented
  // type model in PLAN-PAC-MAN-GAME.md.
};

export type GameState = {
  pacman: { pos: Vec; dir: Direction; nextDir: Direction };
  ghosts: Ghost[]; // length 4: blinky, pinky, inky, clyde (fixed order)
  pellets: Set<string>; // "x,y" keys still uneaten
  powerPellets: Set<string>; // "x,y" keys still uneaten
  score: number;
  lives: number; // starts at 3
  level: number; // starts at 1
  status: GameStatus;
  phaseIndex: number; // index into SCATTER_CHASE table
  phaseTimer: number; // ticks left in current scatter/chase phase
  frightenedTimer: number; // ticks left of frightened mode (0 = inactive)
  ghostChain: number; // ghosts eaten since last power pellet (0..3)
  // Refinement of the plan's type model (Phase 5): a single `transitionTimer`
  // counts down the brief `dying` and `levelClear` pause states. It is reused
  // for both (only one transition state is active at a time), avoiding two
  // separate timer fields. 0 outside those states.
  transitionTimer: number;
};
