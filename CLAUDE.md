# Pac-Man Game — CLAUDE.md

## Project Facts

- **Repository**: https://github.com/ZoliQua/Pac-Man-Game
- **Family**: one of the six Zoltan's Arcade games; the portal is [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center). [Snake-Game](https://github.com/ZoliQua/Snake-Game) is the reference implementation of the shared patterns.
- **Stack**: React 18.3, Vite 5.4, TypeScript 5.6 (strict), CSS Modules, Vitest 2.1 + jsdom + Testing Library
- **Package manager**: npm (lockfile `package-lock.json` committed)
- **Node**: >=20
- **Scripts**:
  - `npm run dev` — local dev server (Vite)
  - `npm run build` — `tsc -b && vite build` (type-check + prod bundle)
  - `npm run preview` — preview the production build
  - `npm run typecheck` — `tsc -b`
  - `npm run lint` — `eslint .`
  - `npm test` — Vitest (logic + component tests, jsdom)
  - `npm run check` — lint → typecheck → test → build (same as CI)
- **Maze**: fixed 28 columns × 31 rows, encoded as `MAZE: string[]` in `src/logic/maze.ts` and parsed at load.
- **Movement**: tile-stepped — one tick = each entity advances by at most one tile. `TICK_MS = 150`.
- **Rendering**: grid-based DOM (CSS grid). Tile size is the `--cell` CSS custom property set in `GameBoard.module.css` (20px default, smaller on short/narrow screens, 5.5px in the demo). No canvas.
- **Controls**: arrow keys + WASD to steer (a direction starts a new game), **Space/Enter** start/pause, **P/Esc** pause/resume, **R** restart. **T** is reserved for the arcade theme toggle. Keyboard only; every handler starts with `shouldIgnoreKey`.
- **Icon themes**: the picker offers Normal / Fog / Dental. `normal` (classic arcade) and `fog` (muted/spooky reskin) are the stored `IconTheme` values; **Dental** is derived from the shared `arcade.dental` preference (choosing it turns dental mode on, choosing Normal or Fog turns it off, turning it on elsewhere selects it here). Cosmetic only — switchable any time, including mid-game, with no rule change.
- **localStorage keys**: `arcade.stats.pacman` (kit stats; legacy `pacman.highScore` migrated/kept in sync by the kit), `arcade.session.pacman` (autosave, schema 1), `pacman.iconTheme` (`normal` | `fog`, default `normal`; Dental is never stored there, it comes from `arcade.dental`).
- **Arcade status mapping**: `idle`→idle, `running`/`dying`/`levelClear`→running, `paused`→paused, `gameOver`→gameOver (only this ends a run; outcome always `over`, levels repeat forever).
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
  arcade/          VENDORED shared kit from Arcade-Game-Center/packages/kit — never edit here
  logic/
    types.ts       Vec, Direction, GhostName, GhostMode, GameStatus, IconTheme, Ghost, GameState
    constants.ts   TICK_MS, START_LIVES, POINTS, ThemeSpec + THEMES, DEFAULT_THEME, SCATTER_CHASE,
                   SCATTER_CORNERS, HOUSE_DOT_LIMITS, HOUSE_DOOR_ROW, HOUSE_EXIT, frightenedTicks(),
                   FRIGHTENED_FLASH_TICKS, DYING_PAUSE_TICKS, LEVELCLEAR_PAUSE_TICKS
    maze.ts        MAZE: string[] + parseMaze() / validateMaze() → PARSED_MAZE
    grid.ts        key, inBounds, isWall, neighbour, tunnelWrap
    movement.ts    stepWithWrap, canMove
    pacman.ts      nextPacman, pacCanMove (door tiles blocked for Pac only)
    ghosts.ts      targetTile / chooseDir / frightenedDir / globalMode / reverse / advanceGhost
    scoring.ts     pelletPoints / powerPelletPoints / ghostChainPoints
    game.ts        advanceGame, createInitialState, settleTransition, arcadeStatus
    autopilot.ts   chooseDirection (ghost-aware BFS) + demoStep — demo driver
    persist.ts     SavedGame (Sets → arrays), toSaved / fromSaved, isSavedPacman validator
    game.test.ts   logic tests
  hooks/           useGameLoop, useKeyboardDirection, useIconTheme
  components/      GameBoard (full + mini; owns --cell) = Maze + Entities; IconThemeToggle (arc-segmented)
  demo/            PacmanDemo — landing-page attract mode
  PacmanGame.tsx   embeddable game, ArcadeGameProps (+ PacmanGame.test.tsx)
  App.tsx          standalone page: <ArcadeShell gameId="pacman"><PacmanGame/></ArcadeShell>
  main.tsx         entry, imports arcade/arcade.css once
  index.ts         package entry for Arcade-Game-Center
```

Stats, best score, session autosave, theme, score panel and overlays come from `src/arcade/`
(`useArcadeRun`, `useSessionAutosave`, `useRestoredSession`, `StatPanel`, `GameOverlay`, …).
Change the kit only in Arcade-Game-Center and sync it (`node scripts/sync-games.mjs kit`).
The same `src/` is mirrored into `Arcade-Game-Center/apps/pacman/` — keep them identical
(`node scripts/sync-games.mjs check` there).

Confirm what is on disk before relying on this layout. If the repo diverges, follow the existing convention and flag the divergence — do not silently restructure.

The central pure function `advanceGame(state): GameState` owns every tick transition. `createInitialState(overrides)` builds the pristine state. The icon theme is not part of `GameState`; it lives in `useIconTheme`. Saved sessions use the JSON-safe `SavedGame` shape (pellet Sets stored as arrays).

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
- **Tunnel wrap**: stepping off a tunnel-row edge reappears on the opposite edge at the same row; no off-by-one. (Classic tunnel slow-down for ghosts is **not** implemented.)
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
- **Restart**: fully resets every game field (the icon theme is a separate preference).
- **Theme switch**: changes only classes / colour tokens / glyphs; no change to wall/pellet data, hitboxes, speeds, visibility, or any rule; works mid-game without resetting state.
- **Session**: `isSavedPacman` stays strict when `GameState` changes (bump `SESSION_SCHEMA` in `PacmanGame.tsx` on shape changes); restored runs are always paused.
- **Demo**: no keyboard, stats, sessions or storage writes; freezes when `active === false`.
- **Pure logic**: `src/logic/*` imports nothing from `react` or `src/components/*`.

---

## End-of-Task Report

End every meaningful change with:

- **Changed files** — each file with a one-line reason.
- **Verified** — which checks actually ran (typecheck, build, lint, tests, manual inspection).
- **Not verified** — explicit gaps.
- **Risks / follow-ups** — only real concerns, no filler.

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
