# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.2.1] — 2026-11-14

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the three new arcade games, Minesweeper, Solitaire and Ulti, with their accent colours.
- README: the Zoltan's Arcade family table lists all fourteen games.

## [1.2.0] — 2026-11-09

### Added

- Three languages: English, Hungarian and German, switchable in the top bar / settings and by `?lang=en|hu|de`; the choice is shared across the arcade (`arcade.lang`).
- Dental mode (off by default, shared `arcade.dental`, `?dental=1`): a third icon theme: Pac-Man is a smiling tooth, the dots are toothpaste, the power pellet a toothbrush and the ghosts bacteria. Presentation only: rules, scores, stats and saves are unchanged.

### Changed

- Numbers use the locale's digit grouping.
- Links now point to https://dulzoltan.hu/arcade/ (the arcade moved to its new domain).

## [1.1.2] — 2026-11-04

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the eleventh arcade game, Texas Hold'em, with its accent colour.
- README: the Zoltan's Arcade family table lists all eleven games.

## [1.1.1] — 2026-11-01

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the tenth arcade game, Nut Sort, with its accent colour.
- README: the Zoltan's Arcade family table lists all ten games.

## [1.1.0] — 2026-10-29

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the three new arcade games — Breakout, Space Invaders and
  Connect Four — with their accent colours; the duel round-score docs mention Connect Four.
- README: the Zoltan's Arcade family table lists all nine games.

## [1.0.0] — 2026-10-25

### Added
- Shared Zoltan's Arcade kit (`src/arcade/`): unified stats, theme, standalone shell and UI.
- Embeddable `PacmanGame` component (shared `ArcadeGameProps`: `embedded`, `onGameOver`, `onRunEnd`, `onStatusChange`).
- Autosave & resume of the full run in progress (`arcade.session.pacman`): remaining dots, Pac-Man, all ghosts
  with modes and timers, lives, level, score — with a strict runtime validator (`src/logic/persist.ts`).
  A save taken during the death / level-clear pause is resolved on restore.
- `PacmanDemo` attract mode driven by a ghost-aware BFS autopilot (`src/logic/autopilot.ts`), used on the portal landing page.
- Space / Enter start and pause, Esc pauses (shared arcade keys); a direction key still starts a new game.
- Vitest + Testing Library test suite (movement, scoring, frightened chain, lives, levels, ghost targets,
  autopilot, persistence, component flows), `npm run check`, GitHub Actions CI.
- Code of Conduct, Contributing, Contributors and Security docs, issue/PR templates, favicon.

### Changed
- Score panel (Score · Best · Lives · Level · Time), overlays, buttons and settings use the shared arcade
  design system (dark & light theme); the icon-theme switch is now a Normal / Fog segmented control.
- High score now lives in `arcade.stats.pacman`; the legacy `pacman.highScore` is migrated and kept in sync.
- Board geometry is driven by one `--cell` CSS custom property (responsive sizes and the compact demo variant)
  instead of a fixed `CELL_PX` and a `transform: scale()` hack that left empty layout space.
- The icon theme is a UI preference held by `useIconTheme`, no longer a field of `GameState`.
- Base path is relative (`base: './'`), so builds work from any sub-folder.
- Toolchain aligned with the other arcade games (Vitest 2.1, jsdom 25, Testing Library 16).

### Fixed
- `npm run typecheck` checked nothing (`tsc --noEmit` on the empty solution tsconfig); it now runs `tsc -b`.
- Game hotkeys fired while typing in form fields or with Cmd/Ctrl/Alt held (Cmd+R restarted the game
  instead of only reloading); arrow keys were `preventDefault`-ed even inside inputs.
- `useHighScore` / `useIconTheme` wrote to `localStorage` on every mount, even when nothing changed.
- Global page CSS (`:root`, `*`, `body`) leaked into any host page; all styles are now scoped CSS Modules.
- Ghost eyes could collapse to zero height (percentage heights inside an auto-height flex row).
- The icon-theme checkbox and overlay used hard-coded colours that ignored the light theme.

## [0.1.0] — 2026-05-25

- First playable release, built in phases (2026-05-19 → 05-25): maze parsing and rendering, tile movement with
  buffered turns, pellets / power pellets and scoring, four ghosts with scatter/chase AI, frightened and eaten
  modes, lives, levels and transition states, normal / fog icon themes and a `localStorage` high score.
