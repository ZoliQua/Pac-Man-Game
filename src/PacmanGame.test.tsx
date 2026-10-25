import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSession, readStats, saveSession } from './arcade';
import { PacmanDemo } from './demo/PacmanDemo';
import { DYING_PAUSE_TICKS, TICK_MS } from './logic/constants';
import { createInitialState } from './logic/game';
import { toSaved } from './logic/persist';
import { PacmanGame } from './PacmanGame';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const key = (k: string) => fireEvent.keyDown(window, { key: k });

describe('<PacmanGame />', () => {
  it('starts with Space, pauses with P and reports status to the host', () => {
    const onStatusChange = vi.fn();
    render(<PacmanGame onStatusChange={onStatusChange} />);
    expect(screen.getByRole('dialog', { name: 'Pac-Man' })).toBeTruthy();
    act(() => key(' '));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    act(() => key('p'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
  });

  it('starts the run with an arrow key and eats dots', () => {
    render(<PacmanGame />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(TICK_MS * 3 + 10));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Score').nextElementSibling?.textContent).toBe('30');
  });

  it('autosaves a run in progress and restores it paused', () => {
    const { unmount } = render(<PacmanGame />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(1200));
    unmount();
    const saved = loadSession('pacman', 1);
    expect(saved?.data).toMatchObject({ status: 'running' });
    expect(Array.isArray((saved?.data as { pellets: unknown }).pellets)).toBe(true);

    render(<PacmanGame embedded />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('records the finished run once and clears the save', () => {
    const onGameOver = vi.fn();
    // Last life; Blinky is boxed into a corridor and walks straight into Pac.
    const base = createInitialState({
      status: 'running',
      lives: 1,
      score: 120,
      pacman: { pos: { x: 5, y: 5 }, dir: 'RIGHT', nextDir: 'RIGHT' },
    });
    const doomed = {
      ...base,
      ghosts: base.ghosts.map((g, i) => (i === 0 ? { ...g, pos: { x: 7, y: 5 }, dir: 'LEFT' as const } : g)),
    };
    saveSession('pacman', { schema: 1, data: toSaved(doomed), seconds: 30, score: 120 });
    render(<PacmanGame onGameOver={onGameOver} />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    act(() => key('p'));
    act(() => vi.advanceTimersByTime(TICK_MS * (DYING_PAUSE_TICKS + 2)));
    expect(screen.getByRole('dialog', { name: 'Game over' })).toBeTruthy();
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(130);
    expect(readStats('pacman')).toMatchObject({ best: 130, plays: 1 });
    expect(loadSession('pacman', 1)).toBeNull();
  });

  it('discards a corrupt save', () => {
    saveSession('pacman', { schema: 1, data: { pellets: 'nope' }, seconds: 5, score: 0 });
    render(<PacmanGame />);
    expect(screen.getByRole('dialog', { name: 'Pac-Man' })).toBeTruthy();
    expect(loadSession('pacman', 1)).toBeNull();
  });

  it('ignores hotkeys while typing in a field', () => {
    render(
      <>
        <input aria-label="nick" />
        <PacmanGame />
      </>,
    );
    const input = screen.getByLabelText('nick');
    act(() => {
      fireEvent.keyDown(input, { key: ' ' });
      fireEvent.keyDown(input, { key: 'ArrowLeft' });
    });
    expect(screen.getByRole('dialog', { name: 'Pac-Man' })).toBeTruthy();
  });

  it('switches the icon theme without touching the run and remembers it', () => {
    render(<PacmanGame />);
    act(() => key(' '));
    fireEvent.click(screen.getByRole('button', { name: 'Fog' }));
    expect(screen.getByRole('button', { name: 'Fog' }).getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('pacman.iconTheme')).toBe('fog');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('<PacmanDemo />', () => {
  it('plays by itself without touching stats or saves', () => {
    const { container } = render(<PacmanDemo />);
    const pacman = () => container.querySelector<HTMLElement>('[class*="pacman"]')?.style.getPropertyValue('--x');
    const startX = pacman();
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector('.arc-demo')).toBeTruthy();
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    expect(pacman()).not.toBe(startX);
    expect(readStats('pacman').plays).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('freezes when inactive', () => {
    const { container } = render(<PacmanDemo active={false} />);
    const before = container.innerHTML;
    act(() => vi.advanceTimersByTime(3000));
    expect(container.innerHTML).toBe(before);
  });
});
