# 🟡 Pac-Man

A minimal, type-safe Pac-Man built with **React 18**, **Vite** and **TypeScript** — keyboard-first, grid-based DOM, no canvas, no game engine.
Runs on its own **and** as one of the eleven games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**.

[![CI](https://github.com/ZoliQua/Pac-Man-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Pac-Man-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [Controls](#%EF%B8%8F-controls)
- [Scoring & stats](#-scoring--stats)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [How it works](#-how-it-works)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. They share one design system, one scoring model and one save format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 **Pac-Man** (this repo) | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sorting |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Cards |

## ✨ Features

- 🟡 **Classic Pac-Man** on a 28×31 maze with pellets, four power pellets, a ghost house and a wrap-around tunnel
- 👻 **Four ghosts with real AI** — Blinky, Pinky, Inky and Clyde, each with their own chase target and a classic scatter/chase schedule
- 😱 **Frightened & eaten modes** — power pellets turn the ghosts blue (eat them for 200 → 400 → 800 → 1600); eaten ghosts become eyes that race home and respawn
- ❤️ **Lives & levels** — 3 lives; clearing the maze starts the next level (score and lives carry over, the frightened window shrinks)
- 🎨 **Icon themes** — **normal** (classic arcade), **fog** (a muted, spooky reskin) or **dental** (see below), switchable any time, even mid-game; cosmetic only
- 💾 **Autosave & resume** — close the tab mid-run and pick up where you left off, ghosts and all
- 🏆 **Unified arcade stats** — best score, plays, total time, shared with the portal
- ⏱️ **Pause-aware run timer**
- 🌗 **Dark / light theme** shared with every arcade game (press **T**)
- 🌍 **Three languages** — English, Hungarian and German; switch in the top bar or in the settings (also `?lang=en|hu|de` for link hand-off); numbers follow the locale's grouping
- 🦷 **Dental mode** — a „Fogas mód” / "Dental mode" / „Zahnmodus” toggle in the settings, off by default (or `?dental=1`), shared across the whole arcade: a third icon theme: Pac-Man is a smiling tooth, the dots are toothpaste, the power pellet a toothbrush and the ghosts bacteria; presentation only
- 🤖 **Attract-mode demo** (`<PacmanDemo />`) — the real engine driven by a ghost-aware BFS autopilot, shown on the portal's landing page
- ⌨️ **Keyboard-first**; hotkeys are ignored while you type in a form field
- 🧪 **Tested** — pure-logic unit tests plus component tests with Vitest + Testing Library

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/Pac-Man-Game.git
cd Pac-Man-Game
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## ⌨️ Controls

| Key | Action |
| --- | --- |
| ⬆️ ⬇️ ⬅️ ➡️ / **W A S D** | Steer (a direction key also starts a new game) |
| **Space** / **Enter** | Start · pause · resume |
| **P** / **Esc** | Pause / resume |
| **R** | Restart |
| **T** | Toggle dark / light theme (standalone page) |

Input only buffers a *desired* direction; the logic applies the turn at the first tile where it is legal, and Pac-Man stops dead at walls.

## 🎯 Scoring & stats

| Event | Points |
| --- | --- |
| Pellet | 10 |
| Power pellet | 50 |
| Ghost (frightened) | 200 → 400 → 800 → 1600 |

The ghost chain resets on each power pellet, not per level. The frightened window lasts 6 s on level 1 and
shrinks by about 0.5 s per level (minimum 1 s). Levels repeat forever, so every run ends when the last life is lost
(outcome `over`).

When a run ends the kit records it once in `localStorage` under `arcade.stats.pacman`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
The legacy `pacman.highScore` key is migrated and kept in sync, so older builds keep their record.

### 🎨 Icon themes

Two icon sets restyle Pac-Man, the ghosts, pellets and walls. Switching **never** resets the board or changes any
rule, hitbox, speed or visibility — it is an icon set, not a fog-of-war mode.

- **normal** — yellow Pac-Man with an animated mouth; Blinky red / Pinky pink / Inky cyan / Clyde orange; cream pellets; pulsing power pellets; blue walls; frightened = blue (flashing white near expiry); eaten = eyes.
- **fog** — pale ghostly Pac-Man; desaturated wisp ghosts (still distinct); faint glowing-orb pellets; misty power pellets; dark slate walls with a soft glow.

The choice is stored under `pacman.iconTheme` (default `normal`).

## 💾 Autosave & resume

While a run is in progress it is saved about once a second and whenever the page is hidden or the game is unmounted
(key `arcade.session.pacman`, schema-versioned). The save holds the full game: remaining dots, Pac-Man, all four
ghosts with their modes and positions, the scatter/chase and frightened timers, lives, level and score. It is
validated strictly on load (`src/logic/persist.ts`) and dropped if anything is off. Reloading shows **Welcome back**
with the restored run paused. **Discard** next to the *Autosaved* badge throws the save away. Finished runs clear
their save automatically.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { PacmanGame, PacmanDemo } from '@arcade/pacman';

<PacmanGame
  embedded                                   // hide the page title; the portal shows it
  onGameOver={(score) => submitScore('pacman', score)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<PacmanDemo active={cardIsVisible} />         // landing-page attract mode
```

Both components follow the shared `ArcadeGameProps` / `ArcadeDemoProps` contract from `src/arcade/types.ts`.

## 🧠 How it works

The game's own state machine and how it maps onto the shared arcade lifecycle:

```
idle → running ↔ paused
running → dying → running          (life lost, lives > 0 → respawn)
running → dying → gameOver         (life lost, last life)
running → levelClear → running     (all pellets eaten → next level)
gameOver → (restart) → running
```

| Game status | Arcade status |
| --- | --- |
| `idle` | `idle` |
| `running`, `dying`, `levelClear` | `running` (the clock keeps ticking through the short pauses) |
| `paused` | `paused` |
| `gameOver` | `gameOver` — the only state that ends a run |

A single pure function, `advanceGame(state): GameState`, owns one 150 ms tick:

1. Resolve Pac-Man's buffered turn (`nextDir`) when legal; otherwise continue in `dir` and stop dead at a wall. The ghost-house door blocks Pac-Man only.
2. Move Pac-Man one tile (tunnel wrap) and eat the pellet / power pellet under him. A power pellet frightens every ghost outside the house, forces a reversal and resets the eat chain.
3. Run the scatter/chase schedule (7 s / 20 s / 7 s / 20 s / 5 s / 20 s / 5 s / chase forever); each phase change forces one reversal.
4. Move each ghost by its mode. At every tile it picks the non-reversing neighbour closest to its target (tie-break up > left > down > right):
   - **Blinky** targets Pac-Man; **Pinky** 4 tiles ahead of him; **Inky** doubles the vector from Blinky to 2 tiles ahead of Pac-Man; **Clyde** chases when ≥ 8 tiles away, otherwise retreats to his corner.
   - **Frightened** ghosts move at half speed with deterministic pseudo-random turns (no `Math.random` — derived from state).
   - **Eaten** ghosts (eyes) path back to the house and re-enter play in the scheduled mode.
   - Pinky leaves the house immediately, Inky after 30 dots, Clyde after 60.
5. Resolve collisions (same tile or a pass-through swap): eat a frightened ghost, ignore eyes, or start `dying`.
6. Eating the last dot starts `levelClear` (it wins over a simultaneous ghost hit).

The demo autopilot (`src/logic/autopilot.ts`) runs a BFS from Pac-Man at every tile — towards a nearby frightened
ghost while enough frightened time remains, otherwise the nearest dot — never stepping within two tiles of a live
ghost, and falls back to the move that keeps the most distance. It typically clears several levels before losing.

`useGameLoop` runs an interval only while playing, reading the latest callback from a ref (no stale closures).
`useKeyboardDirection` attaches one window listener for the component's lifetime.

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logic + component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |

## 🏗️ Architecture

```
src/
  arcade/              vendored Zoltan's Arcade kit — do not edit here (see its README)
  logic/               pure game rules (no React)
    types.ts constants.ts grid.ts movement.ts scoring.ts
    maze.ts            MAZE: string[] + parseMaze() / validateMaze() → PARSED_MAZE
    pacman.ts          nextPacman — buffered turns, wall stop, door blocking
    ghosts.ts          targetTile, chooseDir, frightenedDir, advanceGhost
    game.ts            advanceGame + createInitialState + settleTransition + arcadeStatus
    autopilot.ts       ghost-aware BFS steering + demoStep for the demo
    persist.ts         JSON-safe save shape + strict runtime validation
  hooks/               useGameLoop, useKeyboardDirection, useIconTheme
  components/          GameBoard (full + mini) = Maze + Entities, IconThemeToggle
  demo/PacmanDemo.tsx  landing-page attract mode
  PacmanGame.tsx       the embeddable game (ArcadeGameProps)
  App.tsx              standalone page: <ArcadeShell><PacmanGame/></ArcadeShell>
  main.tsx             entry; loads the shared arcade.css once
  index.ts             package entry used by Arcade-Game-Center
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md); changes in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
