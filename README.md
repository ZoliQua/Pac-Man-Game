# 🟡 Pac-Man

A minimal, type-safe Pac-Man built with **React 18**, **Vite**, and **TypeScript**. Keyboard-first, grid-based DOM, no canvas, no external game engine — in the same spirit as its siblings [Snake-Game](https://github.com/ZoliQua/Snake-Game) and [Tetris-Game](https://github.com/ZoliQua/Tetris-Game).

![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [Features](#-features)
- [How it works](#-how-it-works)
- [Icon themes](#-icon-themes)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [Controls](#-controls)
- [Scoring](#-scoring)
- [Scripts](#-scripts)
- [Architecture](#-architecture)
- [Integration](#-integration)
- [License](#-license)

## ✨ Features

- 🟡 **Classic Pac-Man** on the full 28×31 maze with pellets, power pellets, and a tunnel.
- 👻 **Four ghosts with real AI** — Blinky, Pinky, Inky, and Clyde, each with their own target tile and scatter/chase alternation.
- 😱 **Frightened & eaten modes** — power pellets flip ghosts to frightened (eatable, with a 200→400→800→1600 chain); eaten ghosts become eyes that path home and respawn.
- ❤️ **Lives & levels** — start with 3 lives; clearing every pellet advances the level (score and lives carry over).
- 🎨 **Two icon themes** — switch between **normal** (classic arcade) and **fog** (a muted, spooky reskin) at any time, even mid-game. Cosmetic only — no rule changes.
- 🏆 **Persistent high score** kept in `localStorage` across refreshes.
- ⌨️ **Keyboard-first** — arrows + WASD to steer, P to pause, R to restart.
- 🧼 **Pure game logic** separated from UI; presentation is dumb on purpose.
- 🎨 **CSS Modules** — no runtime CSS-in-JS, no layout jitter.
- 🔒 **Type-safe** — strict TypeScript with no `any` escape hatches in game code.

## 🧠 How it works

The game is a state machine:

```
idle → running ↔ paused
running → dying → running          (life lost, lives > 0 → respawn)
running → dying → gameOver         (life lost, lives === 0)
running → levelClear → running     (all pellets eaten → next level)
gameOver → (restart) → running
```

A single pure function, `advanceGame(state): GameState`, owns one tick of progression:

1. Resolve Pac-Man's buffered turn (`nextDir`) when it is legal at the current tile node; otherwise continue in `dir` and stop dead at a wall.
2. Move Pac-Man one tile, applying tunnel wrap.
3. Eat any pellet / power pellet under him (award points; a power pellet flips eligible ghosts to frightened and resets the eat chain).
4. Advance each ghost by its mode: scatter/chase target tiles, deterministic frightened wander (slower), or eyes pathing home when eaten.
5. Resolve Pac-Man ↔ ghost collisions: eat a frightened ghost, or lose a life against a live one.
6. Drive the brief `dying` / `levelClear` transitions and the scatter/chase phase schedule.

Movement is **tile-stepped** and the `logic/` layer is fully pure and deterministic (no `Math.random` — the frightened wander is derived from state). The render loop is a React hook (`useGameLoop`) that runs a fresh `setInterval` only while the game is live, using a latest-state ref to avoid stale closures. Input is captured by a single `keydown` listener (`useKeyboardDirection`) that calls `preventDefault()` on arrows so the page never scrolls mid-play.

## 🎨 Icon themes

Two selectable icon sets restyle Pac-Man, the four ghosts, frightened/eaten ghosts, pellets, power pellets, and the maze walls. The toggle works at any time — including mid-game — and **never** resets the board or changes any rule, hitbox, speed, or visibility. It is an icon set, **not** a fog-of-war mode.

- **normal** — classic arcade: yellow Pac-Man with an animated mouth; Blinky red / Pinky pink / Inky cyan / Clyde orange; cream pellets; pulsing power pellets; blue rounded walls; frightened = blue (flashing white near expiry); eaten = white eyes.
- **fog** — a muted, foggy reskin of the same entities: pale ghostly Pac-Man; desaturated grey/blue wisp ghosts (still distinct); faint glowing-orb pellets; misty-halo power pellets; dark slate walls with a soft glow; frightened = dim mist; eaten = faint eyes.

The choice is persisted to `localStorage` under `pacman.iconTheme` (default `normal`).

## 📦 Requirements

- 🟢 **Node ≥ 20**
- 📦 **npm** (the lockfile is committed as `package-lock.json`)

## 🚀 Installation

```bash
git clone https://github.com/ZoliQua/Pac-Man-Game.git
cd Pac-Man-Game
npm install
```

## 🕹️ Usage

Start the dev server:

```bash
npm run dev
```

Then open `http://localhost:5173` in a modern desktop browser.

For a production build:

```bash
npm run build
npm run preview
```

## ⌨️ Controls

| Key                           | Action                |
| ----------------------------- | --------------------- |
| ⬆️ / ⬇️ / ⬅️ / ➡️             | Set desired direction |
| **W** / **A** / **S** / **D** | Set desired direction |
| **P**                         | Pause / Resume        |
| **R**                         | Restart               |

Input only buffers a *desired* direction; the actual turn is applied by the logic when the current tile node makes it legal.

## 🎯 Scoring

| Event                | Points                      |
| -------------------- | --------------------------- |
| Pellet               | 10                          |
| Power pellet         | 50                          |
| Ghost (frightened)   | 200 → 400 → 800 → 1600      |

The ghost chain resets on each power pellet, not per level. The **best score** is persisted to `localStorage` under the key `pacman.highScore`, written only when strictly higher. Clear your site data to reset it.

## 🧪 Scripts

| Script                | Purpose                              |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Start the local dev server (Vite)    |
| `npm run build`       | Type-check and produce a prod bundle |
| `npm run preview`     | Preview the production build         |
| `npm run typecheck`   | Run `tsc --noEmit`                   |
| `npm run lint`        | Run ESLint across the project        |

## 🏗️ Architecture

Logic lives outside presentation. Game rules never leak into JSX, and `src/logic/*` imports nothing from `react` or `src/components/*`.

```
src/
  logic/         pure game rules
    types.ts       shared types (Vec, Direction, Ghost, GameState, IconTheme, ...)
    constants.ts   tick, point values, scatter/chase table, frightened timing, THEMES
    maze.ts        MAZE: string[] + parseMaze() → walls / pellets / spawns / tunnel
    grid.ts        key, parseKey, inBounds, isWall, neighbour, legalDirs, tunnelWrap
    movement.ts    step, atNode, buffered-turn helpers
    pacman.ts      nextPacman(state) — buffered/desired direction + wall stop
    ghosts.ts      target tiles, chooseDir, frightened wander, advanceGhost
    scoring.ts     pellet / power / ghost-chain point helpers
    game.ts        advanceGame(state) tick + createInitialState(overrides)
  hooks/
    useGameLoop.ts          interval bound to live states; no stale closures
    useKeyboardDirection.ts arrows + WASD + P + R
    useHighScore.ts         localStorage-backed best score (pacman.highScore)
    useIconTheme.ts         normal/fog preference (pacman.iconTheme)
  components/
    Maze.tsx            grid: walls + pellets + power pellets (theme-aware)
    Entities.tsx        Pac-Man + 4 ghosts overlay (theme-aware, animated)
    ScoreBoard.tsx      score + lives + level + best + status
    GameControls.tsx    start / pause / restart
    IconThemeToggle.tsx normal ↔ fog
    Overlay.tsx         idle / paused / levelClear / gameOver
  styles/
  App.tsx             state machine + wiring
  main.tsx            React entry
```

## 🔌 Integration

Ships as a standalone repo with a `default export App`, so the Arcade portal can later pull it in as a component package (`PacManGame.tsx`), exactly like `SnakeGame.tsx` / `TetrisGame.tsx`. No leaderboard / score-posting code lives inside this repo — that is the portal's responsibility.

## ⚖️ License

Released under the [MIT License](./LICENSE). © 2026 Zoltan Dul.

---

<p align="center">Made with ❤️ by Zoltan Dul</p>
