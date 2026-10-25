import { describe, expect, it } from 'vitest';
import { chooseDirection, demoStep } from './autopilot';
import {
  DYING_PAUSE_TICKS,
  HOUSE_EXIT,
  LEVELCLEAR_PAUSE_TICKS,
  SCATTER_CORNERS,
  START_LIVES,
  frightenedTicks,
} from './constants';
import { advanceGame, arcadeStatus, createInitialState, settleTransition } from './game';
import { chooseDir, targetTile } from './ghosts';
import { PARSED_MAZE } from './maze';
import { nextPacman } from './pacman';
import { fromSaved, isSavedPacman, toSaved } from './persist';
import type { Direction, GameState, Ghost, Vec } from './types';

const { walls, cols, rows, tunnelRow, doorTiles, pacSpawn, pellets: MAZE_PELLETS } = PARSED_MAZE;

const running = (over: Partial<GameState> = {}) => createInitialState({ status: 'running', ...over });
const pac = (pos: Vec, dir: Direction, nextDir: Direction = dir) => ({ pos, dir, nextDir });
const move = (pos: Vec, dir: Direction, nextDir: Direction = dir) =>
  nextPacman(pac(pos, dir, nextDir), walls, cols, rows, tunnelRow, doorTiles);

/** Replace the ghost at `index` (0 blinky, 1 pinky, 2 inky, 3 clyde). */
function withGhost(s: GameState, index: number, patch: Partial<Ghost>): GameState {
  return { ...s, ghosts: s.ghosts.map((g, i) => (i === index ? { ...g, ...patch } : g)) };
}

describe('Pac-Man movement', () => {
  it('steps one tile and stops dead at a wall', () => {
    expect(move({ x: 1, y: 5 }, 'RIGHT').pos).toEqual({ x: 2, y: 5 });
    const blocked = move({ x: 1, y: 1 }, 'UP');
    expect(blocked.pos).toEqual({ x: 1, y: 1 });
    expect(blocked.dir).toBe('UP');
  });

  it('buffers a turn until it becomes legal, keeping it sticky', () => {
    // (2,4) is a wall, so the UP request waits while Pac keeps going right.
    const waiting = move({ x: 2, y: 5 }, 'RIGHT', 'UP');
    expect(waiting.pos).toEqual({ x: 3, y: 5 });
    expect(waiting.nextDir).toBe('UP');
    // (1,4) is open: the buffered turn applies immediately.
    expect(move({ x: 1, y: 5 }, 'RIGHT', 'UP').pos).toEqual({ x: 1, y: 4 });
  });

  it('wraps through the tunnel and never enters the ghost-house door', () => {
    expect(move({ x: 0, y: tunnelRow }, 'LEFT').pos).toEqual({ x: cols - 1, y: tunnelRow });
    expect(move({ x: cols - 1, y: tunnelRow }, 'RIGHT').pos).toEqual({ x: 0, y: tunnelRow });
    expect(move(HOUSE_EXIT, 'DOWN').pos).toEqual(HOUSE_EXIT);
  });

  it('does nothing unless running', () => {
    const idle = createInitialState();
    expect(advanceGame(idle)).toBe(idle);
    const paused = { ...idle, status: 'paused' as const };
    expect(advanceGame(paused)).toBe(paused);
  });
});

describe('scoring', () => {
  it('scores 10 for a dot and removes it without mutating the old state', () => {
    const s = running({ pacman: pac({ x: 1, y: 5 }, 'RIGHT') });
    const next = advanceGame(s);
    expect(next.score).toBe(10);
    expect(next.pellets.has('2,5')).toBe(false);
    expect(s.pellets.has('2,5')).toBe(true);
    expect(next.pellets.size).toBe(s.pellets.size - 1);
  });

  it('scores 50 for a power pellet and frightens every ghost outside the house', () => {
    const s = running({ pacman: pac({ x: 1, y: 4 }, 'UP') });
    const next = advanceGame(s);
    expect(next.score).toBe(50);
    expect(next.powerPellets.has('1,3')).toBe(false);
    expect(next.frightenedTimer).toBe(frightenedTicks(1) - 1);
    expect(next.ghosts[0].mode).toBe('frightened'); // Blinky starts outside
    expect(next.ghosts.slice(1).every((g) => g.mode !== 'frightened')).toBe(true);
  });

  it('chains ghost points 200 → 400 → 800 → 1600 within one frightened window', () => {
    // Timer 20 → 19 this tick: odd, so the frightened ghosts hold still.
    let s = running({ pacman: pac({ x: 5, y: 5 }, 'RIGHT'), frightenedTimer: 20 });
    s = withGhost(s, 0, { pos: { x: 6, y: 5 }, mode: 'frightened', dir: 'UP' });
    s = withGhost(s, 1, { pos: { x: 6, y: 5 }, mode: 'frightened', dir: 'UP', inHouse: false });
    const next = advanceGame(s);
    expect(next.score).toBe(10 + 200 + 400);
    expect(next.ghostChain).toBe(2);
    expect(next.ghosts[0].mode).toBe('eaten');
    expect(next.ghosts[1].mode).toBe('eaten');
    expect(next.status).toBe('running');

    const capped = advanceGame({ ...withGhost(s, 1, { pos: { x: 20, y: 1 } }), ghostChain: 3 });
    expect(capped.score).toBe(10 + 1600);
  });

  it('a power pellet resets the chain', () => {
    const s = running({ pacman: pac({ x: 1, y: 4 }, 'UP'), ghostChain: 3 });
    expect(advanceGame(s).ghostChain).toBe(0);
  });
});

describe('lives, levels and game over', () => {
  const deadly = () =>
    withGhost(running({ pacman: pac({ x: 5, y: 5 }, 'RIGHT') }), 0, {
      // (7,4) and (7,6) are walls: LEFT is Blinky's only forward move.
      pos: { x: 7, y: 5 },
      dir: 'LEFT',
      mode: 'scatter',
    });

  it('touching a live ghost costs a life after the dying pause and respawns everyone', () => {
    let s = advanceGame(deadly());
    expect(s.status).toBe('dying');
    expect(s.transitionTimer).toBe(DYING_PAUSE_TICKS);
    const frozen = s.pacman.pos;
    for (let i = 0; i < DYING_PAUSE_TICKS - 1; i++) s = advanceGame(s);
    expect(s.status).toBe('dying');
    expect(s.pacman.pos).toEqual(frozen);
    s = advanceGame(s);
    expect(s.status).toBe('running');
    expect(s.lives).toBe(START_LIVES - 1);
    expect(s.pacman.pos).toEqual(pacSpawn);
    expect(s.score).toBe(10);
  });

  it('ends the game when the last life is lost', () => {
    let s = advanceGame({ ...deadly(), lives: 1 });
    s = settleTransition(s);
    expect(s.status).toBe('gameOver');
    expect(s.lives).toBe(0);
    expect(advanceGame(s)).toBe(s);
  });

  it('clears the level on the last dot, refills the maze and keeps score and lives', () => {
    let s = running({ pacman: pac({ x: 1, y: 5 }, 'RIGHT'), pellets: new Set(['2,5']), powerPellets: new Set() });
    s = advanceGame(s);
    expect(s.status).toBe('levelClear');
    expect(s.transitionTimer).toBe(LEVELCLEAR_PAUSE_TICKS);
    for (let i = 0; i < LEVELCLEAR_PAUSE_TICKS; i++) s = advanceGame(s);
    expect(s.status).toBe('running');
    expect(s.level).toBe(2);
    expect(s.score).toBe(10);
    expect(s.lives).toBe(START_LIVES);
    expect(s.pellets.size).toBe(MAZE_PELLETS.size);
    expect(s.powerPellets.size).toBe(4);
  });

  it('eating the last dot wins over a simultaneous ghost hit', () => {
    const s = { ...deadly(), pellets: new Set(['6,5']), powerPellets: new Set<string>() };
    expect(advanceGame(s).status).toBe('levelClear');
  });

  it('maps its own states onto the arcade lifecycle', () => {
    expect(arcadeStatus('idle')).toBe('idle');
    expect(arcadeStatus('running')).toBe('running');
    expect(arcadeStatus('dying')).toBe('running');
    expect(arcadeStatus('levelClear')).toBe('running');
    expect(arcadeStatus('paused')).toBe('paused');
    expect(arcadeStatus('gameOver')).toBe('gameOver');
  });
});

describe('ghost AI', () => {
  const chase = (over: Partial<GameState> = {}) => running({ phaseIndex: 1, ...over });

  it('targets its scatter corner in scatter mode', () => {
    const s = running();
    for (const g of s.ghosts) expect(targetTile(g, s)).toEqual(SCATTER_CORNERS[g.name]);
  });

  it('uses the classic per-ghost chase targets', () => {
    const s = chase({ pacman: pac({ x: 6, y: 5 }, 'RIGHT') });
    const [blinky, pinky, , clyde] = s.ghosts;
    expect(targetTile(blinky, s)).toEqual({ x: 6, y: 5 });
    expect(targetTile(pinky, s)).toEqual({ x: 10, y: 5 });
    // Clyde: far away → chase Pac, close → retreat to his corner.
    expect(targetTile({ ...clyde, pos: { x: 26, y: 29 } }, s)).toEqual({ x: 6, y: 5 });
    expect(targetTile({ ...clyde, pos: { x: 7, y: 5 } }, s)).toEqual(SCATTER_CORNERS.clyde);
  });

  it('Inky doubles the vector from Blinky to two tiles ahead of Pac-Man', () => {
    let s = chase({ pacman: pac({ x: 6, y: 5 }, 'RIGHT') });
    s = withGhost(s, 0, { pos: { x: 4, y: 1 } });
    // Pivot (8,5); 2·(8,5) − (4,1) = (12,9).
    expect(targetTile(s.ghosts[2], s)).toEqual({ x: 12, y: 9 });
  });

  it('frightened and eaten ghosts ignore the scatter/chase targets', () => {
    const s = chase();
    const g = s.ghosts[0];
    expect(targetTile({ ...g, mode: 'eaten' }, s)).toEqual(HOUSE_EXIT);
    expect(targetTile({ ...g, mode: 'frightened' }, s)).toEqual(g.pos);
  });

  it('never reverses on its own while a forward option exists', () => {
    const g = createInitialState().ghosts[0];
    // Moving RIGHT along row 5 towards a target behind it: must not turn back LEFT.
    expect(chooseDir({ ...g, pos: { x: 10, y: 5 }, dir: 'RIGHT' }, { x: 1, y: 5 })).not.toBe('LEFT');
  });
});

describe('autopilot', () => {
  it('heads for the nearest dot', () => {
    const s = running({ pacman: pac({ x: 3, y: 5 }, 'NONE'), pellets: new Set(['1,5']), powerPellets: new Set() });
    expect(chooseDirection(s)).toBe('LEFT');
  });

  it('avoids a live ghost guarding the nearest dot', () => {
    let s = running({ pacman: pac({ x: 3, y: 5 }, 'NONE'), pellets: new Set(['1,5', '8,5']), powerPellets: new Set() });
    s = withGhost(s, 0, { pos: { x: 1, y: 5 }, mode: 'chase' });
    expect(chooseDirection(s)).toBe('RIGHT');
  });

  it('hunts a nearby frightened ghost', () => {
    let s = running({
      pacman: pac({ x: 6, y: 5 }, 'NONE'),
      pellets: new Set(['7,5']),
      powerPellets: new Set(),
      frightenedTimer: 30,
    });
    s = withGhost(s, 0, { pos: { x: 3, y: 5 }, mode: 'frightened' });
    expect(chooseDirection(s)).toBe('LEFT');
  });

  it('eats a large share of the maze in a deterministic demo run', () => {
    let s = createInitialState({ status: 'running' });
    let eaten = 0;
    for (let i = 0; i < 600 && s.status !== 'gameOver'; i++) {
      const before = s.pellets.size + s.powerPellets.size;
      const level = s.level;
      s = demoStep(s);
      if (s.level === level) eaten += before - (s.pellets.size + s.powerPellets.size);
    }
    expect(eaten).toBeGreaterThanOrEqual(150);
  });
});

describe('saved sessions', () => {
  const midRun = () => {
    let s = createInitialState({ status: 'running' });
    for (let i = 0; i < 60; i++) s = demoStep(s);
    return s;
  };

  it('round-trips a real state through JSON', () => {
    const s = midRun();
    const json: unknown = JSON.parse(JSON.stringify(toSaved(s)));
    expect(isSavedPacman(json)).toBe(true);
    const back = fromSaved(json as ReturnType<typeof toSaved>);
    expect(back.pellets).toEqual(s.pellets);
    expect(back.powerPellets).toEqual(s.powerPellets);
    expect(back.ghosts).toEqual(s.ghosts);
    expect(back.score).toBe(s.score);
  });

  it('rejects tampered or foreign data', () => {
    const ok = toSaved(midRun());
    const bad: unknown[] = [
      null,
      42,
      { ...ok, pellets: [...ok.pellets, '0,0'] }, // wall tile
      { ...ok, pellets: [ok.pellets[0], ok.pellets[0]] }, // duplicate
      { ...ok, powerPellets: ['1,5'] }, // not a power pellet
      { ...ok, pacman: { ...ok.pacman, pos: { x: 0, y: 0 } } }, // inside a wall
      { ...ok, pacman: { ...ok.pacman, pos: { x: 13, y: 12 } } }, // on the door
      { ...ok, pacman: { ...ok.pacman, dir: 'SIDEWAYS' } },
      { ...ok, ghosts: [...ok.ghosts].reverse() },
      { ...ok, ghosts: ok.ghosts.slice(1) },
      { ...ok, ghosts: ok.ghosts.map((g) => ({ ...g, mode: 'angry' })) },
      { ...ok, status: 'gameOver' },
      { ...ok, status: 'idle' },
      { ...ok, lives: 0 },
      { ...ok, score: -10 },
      { ...ok, score: 15 },
      { ...ok, level: 0 },
      { ...ok, phaseIndex: 99 },
      { ...ok, ghostChain: 4 },
      { ...ok, frightenedTimer: 10_000 },
      { ...ok, transitionTimer: 1.5 },
    ];
    for (const b of bad) expect(isSavedPacman(b)).toBe(false);
  });

  it('settles a save taken mid-transition', () => {
    const dying = { ...midRun(), status: 'dying' as const, transitionTimer: 3, lives: 2 };
    const settled = settleTransition(dying);
    expect(settled.status).toBe('running');
    expect(settled.lives).toBe(1);
  });
});
