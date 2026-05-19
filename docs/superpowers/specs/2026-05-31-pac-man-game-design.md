# Pac-Man Game — Design Spec

> Status: approved skeleton (2026-05-31). This is the brainstorming design that the
> phased implementation plan (`PLAN-PAC-MAN-GAME.md`) is derived from.

## Purpose

A correct, minimal, type-safe **Pac-Man** built in the same spirit as the sibling arcade
games [ZoliQua/Snake-Game](https://github.com/ZoliQua/Snake-Game) and
[ZoliQua/Tetris-Game](https://github.com/ZoliQua/Tetris-Game): **React 18 + Vite +
TypeScript**, keyboard-first, **grid-based DOM** (no canvas), pure game logic separated
from presentation, strict types with no `any` escape hatches in game code.

- **Repository**: <https://github.com/ZoliQua/Pac-Man-Game>
- **Mirror architecture**: Snake-Game / Tetris-Game. Same folder layout, same hook
  patterns, same CSS-modules approach, same "logic outside JSX" rule.
- **Integration**: ships as a standalone repo with a `default export App`, so the
  Arcade portal can later pull it in as a component package (`PacManGame.tsx`), exactly
  like `SnakeGame.tsx` / `TetrisGame.tsx`. No leaderboard/score-posting code lives inside
  this repo — that is the portal's responsibility.

**Priority order**: correctness → truthfulness → verification → small diffs →
maintainability → polish.

## Confirmed decisions (from brainstorming)

1. **Scope — classic, full Pac-Man.** Maze, pellets + power pellets, four ghosts each
   with their own AI (scatter/chase/frightened/eaten), eating frightened ghosts, lives,
   and level progression.
2. **Rendering — grid-based DOM**, mirroring Snake/Tetris. No canvas.
3. **Movement — tile-stepped.** One tick = each entity advances by at most one tile. The
   `logic/` layer stays pure and deterministic, just like the sibling games. Smooth
   sub-cell interpolation is explicitly a future, presentation-only enhancement that must
   not require rewriting the logic.
4. **Icon themes — two selectable icon/sprite sets for the whole game**: `'normal'` and
   `'fog'`. The toggle changes how Pac-Man, the ghosts, the pellets, and the walls are
   drawn. It is purely cosmetic — it does **not** change visibility, difficulty, or any
   game rule (it is an icon set, not a fog-of-war mode). Default `'normal'`, persisted to
   `localStorage`.

## Non-goals (v1)

- No fog-of-war / limited-visibility mode (the "fog" theme is cosmetic only).
- No fruit bonus items, no cut-scenes, no extra-life-at-10000 award (deferred to v1.1).
- No per-level speed/ghost-timing tuning beyond the simple table below.
- No sound, no mobile/touch controls, no canvas/WebGL.
- No networking, no server, no accounts, no leaderboard inside this repo.

## Architecture

Logic lives outside presentation. `src/logic/*` must not import from `react` or
`src/components/*`.

```
src/
  logic/
    constants.ts   # tick ms, entity speeds, point values, scatter/chase phase table, theme table
    maze.ts        # the maze as a string[] + parser → walls / pellets / power pellets / nodes / houses
    types.ts       # shared types
    grid.ts        # tile helpers: in-bounds, isWall, tunnel wrap, neighbour tiles
    movement.ts    # tile-stepped movement, turn-at-node logic, direction buffering
    pacman.ts      # Pac-Man next position from buffered/desired direction
    ghosts.ts      # per-ghost target tile + scatter/chase/frightened/eaten behaviour
    scoring.ts     # pellet / power-pellet / ghost-chain scoring
    game.ts        # advanceGame(state): GameState — the single pure tick
  hooks/
    useGameLoop.ts          # interval runs only while status === 'running'; no stale closures
    useKeyboardDirection.ts # arrows + WASD; buffers desired direction; preventDefault on arrows
    useHighScore.ts         # localStorage-backed best score; writes only on new best
    useIconTheme.ts         # 'normal' | 'fog'; persisted to localStorage
  components/
    Maze.tsx            # grid: walls + pellets + power pellets
    Entities.tsx        # Pac-Man + 4 ghosts, rendered per active theme
    ScoreBoard.tsx      # score + lives + level + best + status
    GameControls.tsx    # start / pause / restart
    IconThemeToggle.tsx # 'normal' ↔ 'fog'
    Overlay.tsx         # idle / paused / levelClear / gameOver
  styles/
  App.tsx               # state machine + wiring
  main.tsx              # React entry
```

A central pure function — `advanceGame(state): GameState` — owns every tick transition.
Hooks dispatch intent (a buffered desired direction, start/pause/restart) and read state;
they never mutate the maze directly.

## Type model (draft)

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
  inHouse: boolean;        // still parked in the ghost house
  dotCounter: number;      // pellets eaten gate for leaving the house
};

type GameState = {
  pacman: { pos: Vec; dir: Direction; nextDir: Direction };
  ghosts: Ghost[];                 // length 4, order: blinky, pinky, inky, clyde
  pellets: Set<string>;            // "x,y" keys still uneaten
  powerPellets: Set<string>;       // "x,y" keys still uneaten
  score: number;
  lives: number;
  level: number;
  status: GameStatus;
  phaseIndex: number;              // index into the scatter/chase phase table
  phaseTimer: number;              // ticks remaining in the current scatter/chase phase
  frightenedTimer: number;         // ticks remaining of frightened mode (0 = inactive)
  ghostChain: number;              // ghosts eaten since the last power pellet (score multiplier)
  theme: IconTheme;
};
```

Deviate only if a cleaner model emerges during implementation; flag the divergence.

## State machine

```
idle → running ↔ paused → dying → running        (lives remain, respawn)
                         → dying → gameOver        (no lives left)
       running → levelClear → running              (next level)
       gameOver → (restart) → running
```

The game loop runs **only** while `status === 'running'`. `dying` and `levelClear` are
short transition states resolved by the loop after a brief pause; no input mutates the
maze during them except pause/restart.

## Ghost AI (classic semantics, tile-based)

- **Modes alternate** scatter ↔ chase on a fixed phase table (`phaseTimer`). A power
  pellet flips eligible ghosts to `frightened` for `frightenedTimer` ticks, then they
  return to the scheduled scatter/chase phase.
- **Target tiles** when chasing:
  - **Blinky**: Pac-Man's tile.
  - **Pinky**: 4 tiles ahead of Pac-Man's facing direction.
  - **Inky**: vector from Blinky to (2 tiles ahead of Pac-Man), doubled.
  - **Clyde**: Pac-Man's tile when ≥ 8 tiles away, else his own scatter corner.
- **Scatter**: each ghost heads to its own fixed home corner.
- **Frightened**: pseudo-random turn at each node (deterministic given state, see bug
  checklist); slower; eatable. Eaten → `eaten` mode, eyes return to the house, then
  respawn.
- **Movement rule**: ghosts choose a direction only at tile nodes, never reverse except
  on a mode change, and pick the legal neighbour that minimises straight-line distance to
  the target tile (classic up > left > down > right tie-break).

## Scoring

```
Pellet            = 10
Power pellet      = 50
Ghost chain       = 200 → 400 → 800 → 1600 (resets each power pellet)
```

High score persisted to `localStorage` under key `pacman.highScore`; written only when
strictly higher.

## Maze

A single classic-inspired maze, encoded as a `string[]` (one char per tile) and parsed at
load:

```
#  wall          .  pellet         o  power pellet
   empty/path    -  ghost-house door
P  pac-man spawn   123 4 ghost spawns (or a fixed ghost-house block)
```

The parser yields the wall set, the initial `pellets`/`powerPellets` sets, Pac-Man's
spawn, the ghost-house tiles, and the tunnel row(s) for wrap-around. Tunnel wrap: stepping
off the left/right edge of a tunnel row reappears on the opposite edge.

## Icon themes ("normal" vs "fog")

A theme registry maps each entity to render descriptors (CSS class names / glyphs):

- **normal** — classic look: yellow Pac-Man with an animated mouth, ghosts coloured
  Blinky=red / Pinky=pink / Inky=cyan / Clyde=orange, cream pellets, pulsing power
  pellets, blue rounded walls.
- **fog** — a muted, "foggy" reskin of the *same* entities: pale/ghostly Pac-Man,
  semi-transparent wisp ghosts in greys/blues, faint glowing-orb pellets, misty-halo power
  pellets, dark slate walls with a soft glow. Same layout, same rules — only the glyphs and
  palette change.

The toggle (`IconThemeToggle`, same UX shape as Snake's `WrapToggle`) writes `theme` into
state and `localStorage`; components read `theme` to pick classes. Frightened ghosts and
eaten "eyes" have a theme-specific look in both sets.

## Controls

| Key                | Action               |
| ------------------ | -------------------- |
| ⬅️ ➡️ ⬆️ ⬇️        | Set desired direction|
| **W A S D**        | Same (alt)           |
| **P**              | Pause / Resume       |
| **R**              | Restart              |

Arrow keys call `event.preventDefault()`. Single `keydown` listener per mount. Input only
buffers a *desired* direction; the turn is applied by the logic when the next tile node
allows it.

## Phased roadmap → commit schedule

Six phases, one commit each, with the commit dates requested by the user:

| Phase | Title                                   | Commit message                                  | Commit date         |
| ----- | --------------------------------------- | ----------------------------------------------- | ------------------- |
| 1     | Scaffold + maze rendering               | `feat: scaffold + maze rendering`               | 2026-05-20 20:00    |
| 2     | Pac-Man tile movement                   | `feat: pac-man tile movement`                   | 2026-05-21 20:00    |
| 3     | Pellets, power pellets, scoring         | `feat: pellets, power pellets, scoring`         | 2026-05-22 20:00    |
| 4     | Four ghosts with scatter/chase AI       | `feat: four ghosts with scatter/chase AI`       | 2026-05-23 20:00    |
| 5     | Frightened mode, lives, levels, states  | `feat: frightened mode, lives, levels, states`  | 2026-05-24 20:00    |
| 6     | Icon themes (normal/fog) + polish       | `feat: icon themes (normal/fog) + polish`       | 2026-05-25 20:00    |

Each phase is committed with its assigned author+committer date (set via
`GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE`). See `PLAN-PAC-MAN-GAME.md` for the per-phase
"Done when" criteria and bug checklist.

## Testing & verification

`npm run typecheck` and `npm run build` must pass at the end of every phase. The
`logic/*` modules are pure and can be exercised directly; if a Vitest setup is added, the
ghost target-tile math and the maze parser are the first candidates for unit tests.
