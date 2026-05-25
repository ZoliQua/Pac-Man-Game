# Pac-Man Game — CLAUDE.md

## Project Facts

- **Repository**: https://github.com/ZoliQua/Pac-Man-Game
- **Sibling projects**: [Snake-Game](https://github.com/ZoliQua/Snake-Game), [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) — same architecture, hook patterns, CSS-Modules approach, and "logic outside JSX" rule.
- **Stack**: React 18, Vite 5, TypeScript (strict), plain CSS + CSS Modules
- **Package manager**: npm (lockfile `package-lock.json` committed)
- **Node**: >=20
- **Scripts**:
  - `npm run dev` — local dev server (Vite)
  - `npm run build` — `tsc -b && vite build` (type-check + prod bundle)
  - `npm run preview` — preview the production build
  - `npm run typecheck` — `tsc --noEmit`
  - `npm run lint` — `eslint .`
  - (no test runner is configured — there is no `npm run test`)
- **Maze**: fixed 28 columns × 31 rows, encoded as `MAZE: string[]` in `src/logic/maze.ts` and parsed at load.
- **Movement**: tile-stepped — one tick = each entity advances by at most one tile. `TICK_MS = 150`.
- **Rendering**: grid-based DOM (CSS grid), `CELL_PX = 20`. No canvas.
- **Controls**: arrow keys + WASD to steer, **P** pause/resume, **R** restart. Keyboard only.
- **Icon themes**: `normal` (classic arcade) and `fog` (muted/spooky reskin). Cosmetic only — switchable any time, including mid-game, with no rule change.
- **localStorage keys**: `pacman.highScore` (best score, written only when strictly higher) and `pacman.iconTheme` (`normal` | `fog`, default `normal`).
- **Target platform**: desktop browser; mobile/touch is out of scope for v1.
- **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English.

If any fact above disagrees with the real repository, verify first and flag the divergence before editing code.

---

## Primary Goal

A correct, minimal, type-safe Pac-Man that is easy to review, debug, and extend. Treat this as a maintainable project, not a one-shot script.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## Architecture

Logic lives outside presentation. `src/logic/*` must not import from `react` or `src/components/*`.

```
src/
  logic/
    types.ts       shared types (Vec, Direction, GhostName, GhostMode, GameStatus, IconTheme, Ghost, GameState)
    constants.ts   TICK_MS, CELL_PX, START_LIVES, POINTS, ThemeSpec + THEMES, DEFAULT_THEME,
                   SCATTER_CHASE table, SCATTER_CORNERS, HOUSE_DOT_LIMITS, HOUSE_DOOR_ROW,
                   HOUSE_EXIT, frightenedTicks(), FRIGHTENED_FLASH_TICKS, DYING_PAUSE_TICKS,
                   LEVELCLEAR_PAUSE_TICKS
    maze.ts        MAZE: string[] + parseMaze() → PARSED_MAZE (walls / pellets / powerPellets /
                   pacSpawn / ghostSpawns / doorTiles / tunnel / cols / rows)
    grid.ts        key, parseKey, inBounds, isWall, neighbour, legalDirs, tunnelWrap
    movement.ts    step / atNode / buffered-turn helpers
    pacman.ts      nextPacman(state)
    ghosts.ts      targetTile / chooseDir / frightenedDir / globalMode / reverse / advanceGhost
    scoring.ts     pelletPoints / powerPelletPoints / ghostChainPoints
    game.ts        advanceGame(state): GameState + createInitialState(overrides)
  hooks/
    useGameLoop.ts          interval runs only while the game is live; latest-state ref (no stale closures)
    useKeyboardDirection.ts arrows + WASD buffer nextDir; P pause; R restart; preventDefault on arrows
    useHighScore.ts         localStorage 'pacman.highScore'; recordScore writes only when higher
    useIconTheme.ts         localStorage 'pacman.iconTheme'; { theme, setTheme, toggleTheme }
  components/
    Maze.tsx            grid: walls + pellets + power pellets (reads theme for classes/tokens)
    Entities.tsx        Pac-Man + 4 ghosts overlay (reads theme + ghost mode + frightenedTimer)
    ScoreBoard.tsx      score + lives + level + best + status
    GameControls.tsx    start / pause / restart
    IconThemeToggle.tsx normal ↔ fog (UX shape of Snake's WrapToggle)
    Overlay.tsx         idle / paused / levelClear / gameOver
  styles/
    index.css
  App.tsx               state machine + wiring (holds GameState; useIconTheme reflected into state.theme)
  main.tsx              React entry
```

Confirm what is on disk before relying on this layout. If the repo diverges, follow the existing convention and flag the divergence — do not silently restructure.

The central pure function `advanceGame(state): GameState` owns every tick transition. `createInitialState(overrides)` builds the pristine state; a restart passes `{ theme }` so the user's theme preference is preserved.

---

## Type Model

```ts
type Vec = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';
type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';
type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten';
type GameStatus = 'idle' | 'running' | 'paused' | 'dying' | 'levelClear' | 'gameOver';
type IconTheme = 'normal' | 'fog';

type Ghost = {
  name: GhostName;
  pos: Vec;
  dir: Direction;
  mode: GhostMode;
  inHouse: boolean;
  dotCounter: number;   // kept to match the plan; the house gate uses global pellets-eaten
};

type GameState = {
  pacman: { pos: Vec; dir: Direction; nextDir: Direction };
  ghosts: Ghost[];                 // length 4: blinky, pinky, inky, clyde (fixed order)
  pellets: Set<string>;            // "x,y" keys still uneaten
  powerPellets: Set<string>;       // "x,y" keys still uneaten
  score: number;
  lives: number;                   // starts at 3
  level: number;                   // starts at 1
  status: GameStatus;
  phaseIndex: number;              // index into SCATTER_CHASE table
  phaseTimer: number;              // ticks left in current scatter/chase phase
  frightenedTimer: number;         // ticks left of frightened mode (0 = inactive)
  ghostChain: number;              // ghosts eaten since last power pellet
  transitionTimer: number;         // counts down the brief dying / levelClear pause (one at a time)
  theme: IconTheme;
};
```

Note: the plan's model is refined with a single `transitionTimer` reused for both the `dying` and `levelClear` pauses (only one is active at a time). Deviate further only if a cleaner model emerges; flag the divergence.

---

## Working Rules

**Verify before and after every non-trivial change.** Before: read the target file and its neighbours, understand data flow and state shape. After: re-check imports, signatures, call sites, and state transitions; ensure no stale code remains.

**No hallucination.** Do not invent files, hooks, scripts, dependencies, or prior decisions. If something is not verified, say so. Never claim a build, lint, or test passed without running it.

**Small, local, reversible changes.** One fix or one feature at a time. Do not bundle refactor + feature + style.

**Preserve architecture.** Do not change Vite config, `tsconfig`, folder layout, styling approach, or rendering strategy without a stated reason and approval.

**Explicitness over cleverness.** Small pure functions, explicit types, direct state transitions.

**No new dependencies** without justification. Default: React + Vite + TS only.

**Pure logic, dumb UI.** `src/logic/*` must not import from `react` or `src/components/*`. Components read state and dispatch intent; they never mutate the maze.

---

## Pac-Man-Specific Bug Checklist

Before concluding any non-trivial task, confirm each item was checked — or explicitly state it was not:

- **Turn buffering**: `nextDir` is applied only when legal at the current tile node; otherwise Pac-Man continues in `dir` and stops dead at a wall (no clipping).
- **Tunnel wrap**: stepping off a tunnel-row edge reappears on the opposite edge at the same row; no off-by-one; ghosts move at half speed in the tunnel.
- **Ghost direction choice**: decided only at nodes, reverse excluded except on a forced mode change, target-distance minimised, tie-break up > left > down > right.
- **Ghost targets**: Blinky = Pac tile; Pinky = 4 ahead; Inky = (2 ahead) reflected through Blinky ×2; Clyde = Pac tile if ≥ 8 tiles away else his scatter corner.
- **Scatter/chase**: alternates on `SCATTER_CHASE`; a mode change forces every non-eaten ghost to reverse exactly once.
- **Frightened**: power pellet resets `ghostChain`, flips eligible ghosts, forces reverse; frightened turns are deterministic (no `Math.random` in `logic/` — derived from state); frightened ghosts are slower.
- **Ghost eat chain**: 200 → 400 → 800 → 1600, resetting on each power pellet, not per level.
- **Eaten ghosts**: become eyes, path back to the house, respawn into the scheduled mode (not stuck frightened).
- **Collision**: Pac vs non-frightened ghost → lose a life; Pac vs frightened ghost → eat it; same-tile detection also catches the pass-through swap.
- **Lives / game over**: life lost respawns Pac + ghosts when `lives > 0`; `gameOver` only at zero lives.
- **Level clear**: only when both pellet sets are empty; resets maze + entities; score + lives carry over.
- **Game loop**: no stale state (latest-state ref); no ticks in `idle` / `paused` / `gameOver`.
- **Keyboard**: arrows `preventDefault`; single listener per mount; no input mutates the maze in `paused` / `gameOver` except `P` / `R` / start.
- **Restart**: fully resets every field except `theme` (a preserved user preference).
- **Theme switch**: changes only classes / colour tokens / glyphs; no change to wall/pellet data, hitboxes, speeds, visibility, or any rule; works mid-game without resetting state.
- **Pure logic**: `src/logic/*` imports nothing from `react` or `src/components/*`.

---

## End-of-Task Report

End every meaningful change with:

- **Changed files** — each file with a one-line reason.
- **Verified** — which checks actually ran (typecheck, build, lint, manual inspection).
- **Not verified** — explicit gaps.
- **Risks / follow-ups** — only real concerns, no filler.

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.
