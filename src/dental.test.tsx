import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, readDental, saveSession } from './arcade';
import { TICK_MS } from './logic/constants';
import { createInitialState } from './logic/game';
import { toSaved } from './logic/persist';
import type { GameState } from './logic/types';
import { PacmanGame } from './PacmanGame';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const boardRoot = (c: HTMLElement) => c.querySelector('[data-dental]') as HTMLElement;
const score = () => screen.getByText('Score').nextElementSibling?.textContent;
const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');
const pacmanX = (c: HTMLElement) =>
  (c.querySelector('[data-testid="pacman-player"]') as HTMLElement).style.getPropertyValue('--x');

describe('Pac-Man dental mode', () => {
  it('draws a smiling tooth, toothpaste dots, toothbrush power pellets and germ ghosts', () => {
    applyDental(true);
    const { container } = render(<PacmanGame />);
    expect(boardRoot(container).getAttribute('data-dental')).toBe('true');
    expect(container.querySelectorAll('[data-testid="pacman-player-tooth"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="pacman-ghost-germ"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-testid="pacman-power-brush"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-testid="pacman-dot-paste"]').length).toBeGreaterThan(200);
    expect(pressed('Dental')).toBe('true');
  });

  it('keeps the classic look with dental mode off', () => {
    const { container } = render(<PacmanGame />);
    expect(boardRoot(container).getAttribute('data-dental')).toBe('false');
    expect(container.querySelector('[data-testid="pacman-player-tooth"]')).toBeNull();
    expect(container.querySelector('[data-testid="pacman-ghost-germ"]')).toBeNull();
    expect(container.querySelector('[data-testid="pacman-dot-paste"]')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(pressed('Normal')).toBe('true');
  });

  it('toggling dental mode mid-run keeps the score, the position and the run', () => {
    const { container } = render(<PacmanGame />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(TICK_MS * 3 + 10));
    expect(score()).toBe('30');
    const x = pacmanX(container);

    act(() => applyDental(true));
    expect(boardRoot(container).getAttribute('data-dental')).toBe('true');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(score()).toBe('30');
    expect(pacmanX(container)).toBe(x);

    act(() => applyDental(false));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(score()).toBe('30');
    expect(pacmanX(container)).toBe(x);
  });

  it('binds the Dental option to the shared preference both ways', () => {
    render(<PacmanGame />);
    fireEvent.click(screen.getByRole('button', { name: 'Fog' }));
    expect(localStorage.getItem('pacman.iconTheme')).toBe('fog');

    fireEvent.click(screen.getByRole('button', { name: 'Dental' }));
    expect(readDental()).toBe(true);
    expect(pressed('Dental')).toBe('true');
    expect(pressed('Fog')).toBe('false');
    // Dental lives only in arcade.dental; the per-game value keeps the last non-dental choice.
    expect(localStorage.getItem('pacman.iconTheme')).toBe('fog');

    // Turned off elsewhere (portal / top bar): the picker returns to the last non-dental theme.
    act(() => applyDental(false));
    expect(pressed('Fog')).toBe('true');
    expect(pressed('Dental')).toBe('false');

    // Turned on elsewhere: the picker shows Dental.
    act(() => applyDental(true));
    expect(pressed('Dental')).toBe('true');

    // Choosing Normal switches dental mode off and remembers Normal.
    fireEvent.click(screen.getByRole('button', { name: 'Normal' }));
    expect(readDental()).toBe(false);
    expect(pressed('Normal')).toBe('true');
    expect(localStorage.getItem('pacman.iconTheme')).toBe('normal');
  });

  it('draws frightened ghosts as hollow germs', () => {
    applyDental(true);
    const base = createInitialState();
    const scared: GameState = {
      ...base,
      status: 'running',
      frightenedTimer: 40,
      ghosts: base.ghosts.map((g, i) => (i < 2 ? { ...g, mode: 'frightened' as const } : g)),
    };
    saveSession('pacman', { schema: 1, data: toSaved(scared), seconds: 10, score: 0 });
    const { container } = render(<PacmanGame />);
    expect(container.querySelectorAll('[data-testid="pacman-ghost-hollow"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="pacman-ghost-germ"]')).toHaveLength(2);
  });
});
