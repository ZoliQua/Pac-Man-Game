# 🟡 Pac-Man — PLAN.md

Development plan for a minimal, type-safe Pac-Man built in the same spirit as
[ZoliQua/Snake-Game](https://github.com/ZoliQua/Snake-Game) and
[ZoliQua/Tetris-Game](https://github.com/ZoliQua/Tetris-Game): **React 18 + Vite +
TypeScript**, keyboard-first, grid-based DOM (no canvas), pure game logic separated from
presentation, strict types with no `any` escape hatches in game code.

> **Repository**: <https://github.com/ZoliQua/Pac-Man-Game>
> **Mirror architecture**: Snake-Game / Tetris-Game. Same folder layout, same hook
> patterns, same CSS-modules approach, same "logic outside JSX" rule.
> **Design spec**: [`docs/superpowers/specs/2026-05-31-pac-man-game-design.md`](docs/superpowers/specs/2026-05-31-pac-man-game-design.md)

---

## 📑 Table of contents

- [Goals](#-goals)
- [Non-goals (v1)](#-non-goals-v1)
- [Tech stack](#-tech-stack)
- [Game specification](#-game-specification)
- [Type model](#-type-model)
- [Architecture](#-architecture)
- [State machine](#-state-machine)
- [Ghost AI](#-ghost-ai)
- [Scoring](#-scoring)
- [Icon themes](#-icon-themes-normal--fog)
- [Controls](#-controls)
- [Phased roadmap](#-phased-roadmap)
- [Commit schedule](#-commit-schedule)
- [Pac-Man-specific bug checklist](#-pac-man-specific-bug-checklist)
- [Working rules](#-working-rules)
- [Open questions](#-open-questions)

---

## 🎯 Goals

- A correct, minimal, type-safe Pac-Man that is easy to review, debug, and extend.
- Follow Snake/Tetris conventions exactly: `logic/` + `hooks/` + `components/`,
  `advanceGame(state)` as the single pure tick function, keyboard-first input,
  `localStorage`-backed high score.
- Classic Pac-Man semantics where they exist (per-ghost targeting, scatter/chase
  alternation, frightened mode, ghost-eat chain), but only the subset listed below for v1.
- Ships as a standalone repo with a `default export App` so the Arcade portal can later
  import it as a component package (`PacManGame.tsx`), like its siblings.
- Desktop browser only in v1. Mobile/touch is explicitly out of scope.

**Priority order**: correctness → truthfulness → verification → small diffs →
maintainability → polish.

---

## 🚫 Non-goals (v1)

- No fog-of-war / limited-visibility mode. The **"fog" theme is cosmetic only** — an icon
  set, not a visibility rule.
- No fruit bonus items, no cut-scenes, no extra-life award at a score threshold.
- No per-level speed/timing curve beyond the simple constants below.
- No sound, no skins beyond the two icon themes, no mobile/touch controls.
- No networking, no server, no accounts, no leaderboard inside this repo (portal's job).
- No canvas renderer, no WebGL, no external game engine.
- No smooth sub-cell interpolation in v1 (movement is tile-stepped; interpolation is a
  future presentation-only enhancement).

---

## 🧰 Tech stack

| Area        | Choice                   | Reason                          |
| ----------- | ------------------------ | ------------------------------- |
| Framework   | React 18                 | Same as Snake/Tetris            |
| Bundler     | Vite 5                   | Same as Snake/Tetris            |
| Language    | TypeScript (strict)      | No `any` in game logic          |
| Styling     | CSS Modules / plain CSS  | No runtime CSS-in-JS            |
| State       | Local React state + hooks| No Zustand, no Redux            |
| Persistence | `localStorage`           | High score + icon theme only    |
| Renderer    | DOM grid (CSS grid)      | Matches siblings, no canvas     |
| Package mgr | npm                      | `package-lock.json` committed   |
| Node        | ≥ 20                     | Same as siblings                |

**Scripts** (mirror siblings): `npm run dev`, `npm run build`, `npm run preview`,
`npm run typecheck`, `npm run lint`.

---

## 🎮 Game specification

- **Maze**: a single classic-inspired layout, 28 columns × 31 rows (the classic Pac-Man
  dimensions), encoded as a `string[]` and parsed at load. Walls, pellets, power pellets,
  Pac-Man spawn, the ghost house, and the tunnel row are all derived from the chars.
- **Tiles / chars**: `#` wall · `.` pellet · `o` power pellet · ` ` empty path ·
  `-` ghost-house door · `P` Pac-Man spawn · `B`/`I`/`N`/`C` ghost spawns
  (Blinky/Pinky/Inky/Clyde). Exact char set is finalised in Phase 1 and documented in
  `maze.ts`.
- **Movement**: tile-stepped. One tick = each entity advances by at most one tile.
  Pac-Man turns only when the buffered desired direction is legal at the current tile node;
  otherwise he continues straight until a wall stops him.
- **Tunnel**: stepping off the left/right edge of the tunnel row reappears on the opposite
  edge. Ghosts move at half speed inside the tunnel.
- **Pellets**: eating the last pellet + power pellet clears the level → next level.
- **Power pellet**: flips eligible ghosts to frightened for a fixed duration; eating
  ghosts during this window scores a doubling chain.
- **Lives**: start with 3. Colliding with a non-frightened ghost costs a life and respawns
  Pac-Man + ghosts at their spawns. Zero lives → game over.
- **Levels**: clearing all pellets advances the level; the maze and pellet set reset, the
  scatter/chase table and a slightly shorter frightened duration apply (simple table, see
  constants). Score and lives carry over.

---

## 🧱 Type model

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
  inHouse: boolean;     // still parked in the ghost house
  dotCounter: number;   // pellet gate for leaving the house
};

type GameState = {
  pacman: { pos: Vec; dir: Direction; nextDir: Direction };
  ghosts: Ghost[];               // length 4: blinky, pinky, inky, clyde (fixed order)
  pellets: Set<string>;          // "x,y" keys still uneaten
  powerPellets: Set<string>;     // "x,y" keys still uneaten
  score: number;
  lives: number;                 // starts at 3
  level: number;                 // starts at 1
  status: GameStatus;
  phaseIndex: number;            // index into SCATTER_CHASE table
  phaseTimer: number;            // ticks left in current scatter/chase phase
  frightenedTimer: number;       // ticks left of frightened mode (0 = inactive)
  ghostChain: number;            // ghosts eaten since last power pellet (0..3)
  theme: IconTheme;
};
```

`advanceGame(state: GameState): GameState` owns every tick transition. The only external
intent is the buffered desired direction (set by the keyboard hook) plus start / pause /
restart. Deviate only if a cleaner model emerges; flag the divergence.

---

## 🏗️ Architecture

Logic lives outside presentation. `src/logic/*` must not import from `react` or
`src/components/*`.

```
src/
  logic/
    constants.ts   # TICK_MS, entity speeds, point values, SCATTER_CHASE table, FRIGHTENED_MS, THEMES
    maze.ts        # MAZE: string[]; parseMaze() → { walls, pellets, powerPellets, pacSpawn, ghostSpawns, houseTiles, tunnelRow, cols, rows }
    types.ts       # shared types (above)
    grid.ts        # key(v), parseKey(s), inBounds, isWall, tunnelWrap, neighbour(pos, dir), legalDirs(pos)
    movement.ts    # step(pos, dir), atNode(pos), applyBufferedTurn(pacman, walls)
    pacman.ts      # nextPacman(state) — buffered/desired direction + wall stop
    ghosts.ts      # targetTile(ghost, state), chooseDir(ghost, target, walls), advanceGhost(ghost, state)
    scoring.ts     # pellet/power/ghost-chain point values + chain progression
    game.ts        # advanceGame(state): GameState — the single pure tick + state machine
  hooks/
    useGameLoop.ts          # interval, runs only while status === 'running'; latest-state ref (no stale closures)
    useKeyboardDirection.ts # arrows + WASD → buffered desired direction; P pause; R restart; preventDefault on arrows
    useHighScore.ts         # localStorage 'pacman.highScore'; writes only on new best
    useIconTheme.ts         # 'normal' | 'fog'; localStorage 'pacman.iconTheme'
  components/
    Maze.tsx            # CSS-grid of walls + pellets + power pellets (theme-aware)
    Entities.tsx        # Pac-Man + 4 ghosts overlaid on the grid (theme-aware)
    ScoreBoard.tsx      # score + lives + level + best + status
    GameControls.tsx    # start / pause / restart buttons
    IconThemeToggle.tsx # 'normal' ↔ 'fog' toggle (UX shape of Snake's WrapToggle)
    Overlay.tsx         # idle / paused / levelClear / gameOver
  styles/
    index.css
  App.tsx               # state machine wiring + hooks
  main.tsx              # React entry
```

A central pure function — `advanceGame(state): GameState` — is the preferred shape for
tick progression. Hooks dispatch intent and read state; they never mutate the maze.

---

## 🔄 State machine

```
idle → running ↔ paused
running → dying → running          (life lost, lives > 0 → respawn entities)
running → dying → gameOver         (life lost, lives === 0)
running → levelClear → running     (all pellets eaten → next level)
gameOver → (restart) → running
```

- `idle → running`: Start button or any direction key.
- `running ↔ paused`: `P`.
- `dying` / `levelClear` are brief transition states the loop resolves after a short
  pause (a fixed number of ticks). No input mutates the maze during them except `P` / `R`.
- The game loop runs **only** while `status === 'running'`. No ticks in `idle`, `paused`,
  or `gameOver`.

---

## 👻 Ghost AI

Classic semantics, evaluated on the tile grid. Ghosts decide direction **only at tile
nodes**, never reverse except on a forced mode change, and at each node pick the legal
neighbour (excluding reverse) that minimises straight-line distance to their target tile.
Tie-break order: **up > left > down > right**.

| Ghost  | Chase target                                                        | Scatter corner |
| ------ | ------------------------------------------------------------------- | -------------- |
| Blinky | Pac-Man's tile                                                      | top-right      |
| Pinky  | 4 tiles ahead of Pac-Man's facing direction                         | top-left       |
| Inky   | (2 tiles ahead of Pac-Man) reflected through Blinky's tile (×2)     | bottom-right   |
| Clyde  | Pac-Man's tile if ≥ 8 tiles away, else his own scatter corner       | bottom-left    |

- **scatter ↔ chase** alternate on a fixed phase table (`SCATTER_CHASE` in `constants.ts`,
  decremented via `phaseTimer`/`phaseIndex`).
- **frightened**: triggered by a power pellet for `frightenedTimer` ticks. Ghosts turn
  pseudo-randomly at nodes (deterministic — see bug checklist), move at reduced speed, and
  are eatable. Eating one → `eaten`.
- **eaten**: ghost becomes "eyes" that path back to the ghost house at increased speed,
  then respawns into the scheduled scatter/chase mode.
- **house exit**: ghosts leave the house based on a pellet/`dotCounter` gate (Blinky out
  immediately; the others after their gates).

---

## 🎯 Scoring

```
Pellet        = 10
Power pellet  = 50
Ghost chain   = 200 → 400 → 800 → 1600   (resets on each power pellet)
```

`ghostChain` indexes the chain; it resets to 0 when a power pellet is eaten and increments
per ghost eaten during the frightened window. High score persisted to `localStorage` under
key `pacman.highScore`, written only when strictly higher.

---

## 🎨 Icon themes (normal / fog)

A theme registry (`THEMES: Record<IconTheme, ThemeSpec>` in `constants.ts`) maps each
entity to CSS class names / glyphs. Switching the theme changes only appearance — never
layout, visibility, difficulty, or any rule.

- **normal** — classic: yellow Pac-Man with an animated mouth; ghosts Blinky=red,
  Pinky=pink, Inky=cyan, Clyde=orange; cream pellets; pulsing power pellets; blue rounded
  walls.
- **fog** — a muted, foggy reskin of the same entities: pale/ghostly Pac-Man;
  semi-transparent wisp ghosts in greys/blues; faint glowing-orb pellets; misty-halo power
  pellets; dark slate walls with a soft glow.

Both themes also define the frightened-ghost look and the eaten "eyes" look. The toggle
(`IconThemeToggle`) writes `theme` into state and `localStorage`; `Maze.tsx` and
`Entities.tsx` read `theme` to choose classes. Default `'normal'`.

---

## ⌨️ Controls

| Key             | Action                |
| --------------- | --------------------- |
| ⬅️ ➡️ ⬆️ ⬇️     | Set desired direction |
| **W A S D**     | Set desired direction |
| **P**           | Pause / Resume        |
| **R**           | Restart               |

Arrow keys call `event.preventDefault()` so the page never scrolls. Single `keydown`
listener attached once per mount. Input only buffers a *desired* direction
(`pacman.nextDir`); the actual turn is applied by `advanceGame` when the current tile node
makes it legal.

---

## 🗺️ Phased roadmap

Six phases, one commit each. Each phase ends with a concrete **Done when** criterion and a
**Verify** step. Do not start the next phase until the previous one is verified
(`npm run typecheck` + `npm run build` pass).

### Phase 1 — Scaffold + maze rendering
**Files:** `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`,
`tsconfig*.json`, `eslint.config.js`, `.gitignore`, `LICENSE`, `src/main.tsx`,
`src/App.tsx`, `src/styles/index.css`, `src/logic/types.ts`, `src/logic/constants.ts`,
`src/logic/maze.ts`, `src/logic/grid.ts`, `src/components/Maze.tsx`,
`src/components/Maze.module.css`.

- [ ] Scaffold Vite + React + TS mirroring Snake/Tetris (copy ESLint config, `tsconfig*`,
      script names, `.gitignore`, `LICENSE`).
- [ ] Define the maze as `MAZE: string[]` (28×31, classic-inspired) and write
      `parseMaze()` → walls / pellets / powerPellets / pacSpawn / ghostSpawns / houseTiles
      / tunnelRow / cols / rows.
- [ ] Write `grid.ts` helpers: `key`, `parseKey`, `inBounds`, `isWall`, `neighbour`,
      `legalDirs`, `tunnelWrap`.
- [ ] Render the maze as a CSS grid in `Maze.tsx`: walls, pellets, power pellets. No
      entities, no movement yet.
- [ ] Theme-table stub in `constants.ts` (`THEMES`), default `'normal'` colours wired into
      `Maze`.

**Done when:** `npm run dev` shows the full maze with all pellets and power pellets in the
correct cells; `npm run typecheck` and `npm run build` pass.

### Phase 2 — Pac-Man tile movement
**Files:** `src/logic/movement.ts`, `src/logic/pacman.ts`, `src/logic/game.ts`,
`src/hooks/useGameLoop.ts`, `src/hooks/useKeyboardDirection.ts`,
`src/components/Entities.tsx`, `src/components/Entities.module.css`, `src/App.tsx`.

- [ ] `movement.ts`: `step(pos, dir)`, `atNode(pos)`, `applyBufferedTurn(pacman, walls)`.
- [ ] `pacman.ts`: `nextPacman(state)` — apply buffered `nextDir` when legal at a node,
      else continue in `dir`, else stop at a wall.
- [ ] `game.ts`: first `advanceGame(state)` moving only Pac-Man; tunnel wrap applied.
- [ ] `useGameLoop` (latest-state ref, runs only while `running`) + `useKeyboardDirection`
      (arrows + WASD buffer `nextDir`; `preventDefault` on arrows).
- [ ] Render Pac-Man in `Entities.tsx`; wire start via App state machine
      (`idle → running`).

**Done when:** Pac-Man moves continuously, turns only at legal nodes, stops at walls, wraps
through the tunnel, and does not capture stale state across ticks. Typecheck + build pass.

### Phase 3 — Pellets, power pellets, scoring
**Files:** `src/logic/scoring.ts`, `src/logic/game.ts`, `src/components/ScoreBoard.tsx`,
`src/components/ScoreBoard.module.css`, `src/hooks/useHighScore.ts`, `src/App.tsx`,
`src/components/Maze.tsx`.

- [ ] `scoring.ts`: point constants (pellet 10, power 50, ghost chain table) + helpers.
- [ ] `advanceGame`: when Pac-Man enters a pellet/power-pellet tile, remove the key and add
      points; clearing all pellets sets `status = 'levelClear'`.
- [ ] `Maze.tsx` re-renders from the live `pellets`/`powerPellets` sets (eaten cells
      disappear).
- [ ] `ScoreBoard.tsx` shows score + best; `useHighScore` persists the best.

**Done when:** eating pellets and power pellets updates the score and clears the cell;
eating the last pellet transitions to `levelClear`; the high score survives a refresh.
Typecheck + build pass.

### Phase 4 — Four ghosts with scatter/chase AI
**Files:** `src/logic/ghosts.ts`, `src/logic/constants.ts`, `src/logic/game.ts`,
`src/components/Entities.tsx`, `src/components/Entities.module.css`.

- [ ] `constants.ts`: `SCATTER_CHASE` phase table, scatter corners, ghost spawns, house
      gates.
- [ ] `ghosts.ts`: `targetTile(ghost, state)` for all four ghosts, `chooseDir` (exclude
      reverse, minimise distance, up>left>down>right tie-break), `advanceGhost`.
- [ ] `advanceGame`: move ghosts each tick; alternate scatter/chase via
      `phaseIndex`/`phaseTimer`; force-reverse on mode change; house-exit via `dotCounter`.
- [ ] Pac-Man ↔ ghost collision (non-frightened) → `status = 'dying'` (resolved in Phase
      5; for now just flag + stop).
- [ ] Render the four ghosts with their classic colours in `Entities.tsx`.

**Done when:** all four ghosts leave the house, alternate scatter/chase, pursue their
correct target tiles, never reverse mid-corridor, and touching one flags `dying`.
Typecheck + build pass.

### Phase 5 — Frightened mode, lives, levels, states
**Files:** `src/logic/game.ts`, `src/logic/ghosts.ts`, `src/logic/scoring.ts`,
`src/logic/constants.ts`, `src/components/Overlay.tsx`,
`src/components/Overlay.module.css`, `src/components/GameControls.tsx`, `src/App.tsx`.

- [ ] Power pellet → set `frightenedTimer`, flip eligible ghosts to `frightened`, reset
      `ghostChain`, force-reverse them.
- [ ] Frightened ghosts: pseudo-random node turns (deterministic from state), reduced
      speed, eatable → `eaten` (eyes) → path home → respawn. Chain scoring
      200→400→800→1600.
- [ ] `dying`: decrement `lives`; if `> 0` respawn Pac-Man + ghosts after a short pause and
      resume; else `gameOver`.
- [ ] `levelClear`: increment `level`, reset pellets + entities, apply level table; resume.
- [ ] `Overlay.tsx` (idle / paused / levelClear / gameOver), `GameControls` (start / pause
      / restart), `R`/`P` wired; restart fully resets `GameState`.

**Done when:** power pellets make ghosts frightened and eatable with correct chain scoring;
losing all lives ends the game; clearing a level advances and resets correctly; pause and
restart are clean (no stale closures). Typecheck + build pass.

### Phase 6 — Icon themes (normal/fog) + polish
**Files:** `src/hooks/useIconTheme.ts`, `src/components/IconThemeToggle.tsx`,
`src/components/IconThemeToggle.module.css`, `src/components/Maze.tsx`,
`src/components/Entities.tsx`, `src/logic/constants.ts` (`THEMES`), `src/styles/index.css`,
`README.md`, `CLAUDE.md`.

- [ ] Finalise both `THEMES` entries (`normal`, `fog`) covering walls, pellets, power
      pellets, Pac-Man, the four ghosts, frightened ghosts, and eaten eyes.
- [ ] `useIconTheme` (localStorage `pacman.iconTheme`) + `IconThemeToggle`; `Maze` and
      `Entities` read `theme` for class selection.
- [ ] CSS polish: animated Pac-Man mouth, ghost shapes, frightened flash near timer end,
      responsive board sizing.
- [ ] `README.md` mirroring Snake/Tetris structure; `CLAUDE.md` with project facts.

**Done when:** toggling `normal ↔ fog` restyles every entity and the maze with no rule
change; the choice survives a refresh; `README` mirrors the siblings; `npm run build`
produces a clean prod bundle.

---

## 📅 Commit schedule

Each phase is committed once, with the author **and** committer date set to the value
below. Use the env-var form so both dates match:

```bash
# Phase 1 — 2026-05-20 20:00
GIT_AUTHOR_DATE="2026-05-20T20:00:00" GIT_COMMITTER_DATE="2026-05-20T20:00:00" \
  git commit -m "feat: scaffold + maze rendering"

# Phase 2 — 2026-05-21 20:00
GIT_AUTHOR_DATE="2026-05-21T20:00:00" GIT_COMMITTER_DATE="2026-05-21T20:00:00" \
  git commit -m "feat: pac-man tile movement"

# Phase 3 — 2026-05-22 20:00
GIT_AUTHOR_DATE="2026-05-22T20:00:00" GIT_COMMITTER_DATE="2026-05-22T20:00:00" \
  git commit -m "feat: pellets, power pellets, scoring"

# Phase 4 — 2026-05-23 20:00
GIT_AUTHOR_DATE="2026-05-23T20:00:00" GIT_COMMITTER_DATE="2026-05-23T20:00:00" \
  git commit -m "feat: four ghosts with scatter/chase AI"

# Phase 5 — 2026-05-24 20:00
GIT_AUTHOR_DATE="2026-05-24T20:00:00" GIT_COMMITTER_DATE="2026-05-24T20:00:00" \
  git commit -m "feat: frightened mode, lives, levels, states"

# Phase 6 — 2026-05-25 20:00
GIT_AUTHOR_DATE="2026-05-25T20:00:00" GIT_COMMITTER_DATE="2026-05-25T20:00:00" \
  git commit -m "feat: icon themes (normal/fog) + polish"
```

> Note: the design-spec commit (this planning step) uses the real current date and is not
> part of the six dated phase commits above.

---

## 🧪 Pac-Man-specific bug checklist

Confirm each item was checked before closing any non-trivial task, or explicitly state it
was not:

- **Turn buffering**: `nextDir` is applied only when legal at the current tile node;
  Pac-Man otherwise continues in `dir` and stops dead at a wall (no clipping into walls).
- **Tunnel wrap**: stepping off the tunnel-row edge reappears on the opposite edge at the
  same row; no off-by-one; ghosts move at half speed in the tunnel.
- **Ghost direction choice**: decided only at nodes, reverse excluded except on forced mode
  change, target-distance minimised, tie-break up > left > down > right.
- **Ghost targets**: Blinky = Pac tile; Pinky = 4 ahead; Inky = (2 ahead) reflected through
  Blinky ×2; Clyde = Pac tile if ≥ 8 tiles away else scatter corner.
- **Scatter/chase**: alternates on the table; a mode change forces every non-eaten ghost to
  reverse exactly once.
- **Frightened**: power pellet resets `ghostChain`, flips eligible ghosts, forces reverse;
  frightened turns are deterministic given state (no `Math.random` in `logic/` — use a
  state-derived pseudo-random so ticks are reproducible); frightened ghosts are slower.
- **Ghost eat chain**: 200 → 400 → 800 → 1600, resetting on each power pellet, not per
  level.
- **Eaten ghosts**: become eyes, path back to the house, respawn into the scheduled
  scatter/chase mode (not stuck frightened).
- **Collision**: Pac vs non-frightened ghost → lose a life; Pac vs frightened ghost → eat
  it. Same-tile detection also catches the "pass-through swap" case (entities swapping
  tiles in one tick).
- **Lives / game over**: life lost respawns Pac + ghosts when `lives > 0`; `gameOver` only
  at zero lives.
- **Level clear**: triggered only when both `pellets` and `powerPellets` are empty; resets
  the maze, pellets, and entities; score + lives carry over.
- **Game loop**: `setInterval` does not capture stale state (latest-state ref, like
  Snake/Tetris `useGameLoop`); no ticks fire in `idle` / `paused` / `gameOver`.
- **Keyboard**: arrows `preventDefault`; single listener per mount; no input mutates the
  maze in `paused` / `gameOver` except `P` / `R` / start.
- **Restart**: fully resets `pacman`, `ghosts`, `pellets`, `powerPellets`, `score`,
  `lives`, `level`, `status`, `phaseIndex`, `phaseTimer`, `frightenedTimer`, `ghostChain`
  (theme is preserved — it's a user preference).
- **Theme switch**: changes only classes/glyphs; no change to walls/pellets data, hitboxes,
  speeds, or any rule.
- **Pure logic**: `src/logic/*` imports nothing from `react` or `src/components/*`.

---

## 📏 Working rules

- **Verify before and after every non-trivial change.** Read the target file and its
  neighbours. After the edit, re-check imports, signatures, call sites, and state
  transitions.
- **No hallucination.** Do not invent files, hooks, or scripts. If something is not
  verified, say so explicitly. Never claim a build/lint/test passed without running it.
- **Small, local, reversible changes.** One phase at a time; do not bundle refactor +
  feature + style.
- **Preserve architecture.** No changes to Vite config, `tsconfig`, folder layout, styling
  approach, or rendering strategy without a stated reason and approval.
- **Explicitness over cleverness.** Small pure functions, explicit types, direct state
  transitions.
- **No new dependencies** without justification. Default is React + Vite + TS only.
- **Pure logic, dumb UI.** `src/logic/*` must not import from `react` or
  `src/components/*`. Components read state and dispatch intent; they never mutate the maze.
- **End-of-task report**: changed files, verified checks, unverified gaps, real risks only.

**Communication**: respond to the user in **Hungarian** in chat, even though this file and
the codebase are in English (same convention as the sibling repos).

---

## ❓ Open questions

- Maze size: keep the full classic 28×31, or use a slightly smaller custom maze for DOM
  perf and simpler walls in v1?
- Starting lives: fixed at 3, or selectable (1–5) on the menu like Snake's speed slider?
- Frightened duration: fixed ms, or a short per-level decay table?
- Pac-Man vs ghost speed: equal tile speed in v1, or model the classic "Pac slightly
  faster, ghosts slower in tunnel/frightened" via a per-entity step accumulator?
- "fog" theme direction: muted/monochrome spooky reskin (current plan), or a different
  motif (neon, retro-green CRT)?
- Should `dying` / `levelClear` pauses be a fixed tick count, or skipped entirely in v1 for
  simplicity?

---

**Guiding principle**: correctness over speed, verification over confidence, truth over
fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less,
change less, state uncertainty clearly.
