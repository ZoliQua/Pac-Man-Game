import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang } from './arcade';
import { MESSAGES } from './i18n';
import { TICK_MS } from './logic/constants';
import { PacmanGame } from './PacmanGame';
import { finger, mockPointer, resetPointer } from './test/pointer';

// Pac-Man spawns at (13, 22) heading nowhere: up is open one tile to the left (x 12),
// down four tiles to the left (x 9); right and left are open corridors.
const SPAWN = { x: '13', y: '22' };

beforeEach(() => {
  localStorage.clear();
  act(() => applyLang('en'));
  mockPointer(true);
  // jsdom has no scrollTo; leaving the CSS full-screen mode restores the scroll position with it.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.useFakeTimers();
});
afterEach(() => {
  resetPointer();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.arcadeImmersive;
  vi.useRealTimers();
});

const pac = (c: HTMLElement) => {
  const el = c.querySelector('[data-testid="pacman-player"]') as HTMLElement;
  return { x: el.style.getPropertyValue('--x'), y: el.style.getPropertyValue('--y') };
};
const board = (c: HTMLElement) => c.querySelector('.arc-board-touch') as HTMLElement;
const swipe = (el: HTMLElement, dx: number, dy: number) => {
  fireEvent.pointerDown(el, finger(150, 150));
  fireEvent.pointerUp(el, finger(150 + dx, 150 + dy));
};
const ticks = (n: number) => act(() => vi.advanceTimersByTime(TICK_MS * n + 5));
const pad = (name: string) => {
  const el = within(screen.getByRole('group', { name: 'Touch controls' })).getByRole('button', { name });
  act(() => {
    fireEvent.pointerDown(el, finger(0, 0));
    fireEvent.pointerUp(el, finger(0, 0));
  });
};

describe('Pac-Man touch controls', () => {
  it('the maze is a gesture board and the touch help replaces the key list', () => {
    const { container } = render(<PacmanGame />);
    expect(board(container)).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Touch controls' }).textContent).toContain(MESSAGES.en.touchSwipe);
    expect(screen.getByRole('group', { name: 'Touch controls' })).toBeTruthy();
  });

  it('a swipe while idle starts the run in that direction', () => {
    const { container } = render(<PacmanGame />);
    act(() => swipe(board(container), -60, 4));
    expect(screen.queryByRole('dialog')).toBeNull();
    ticks(3);
    expect(pac(container)).toEqual({ x: '10', y: SPAWN.y });
  });

  it('a swipe toward a wall is queued until the turn is possible', () => {
    const { container } = render(<PacmanGame />);
    act(() => swipe(board(container), -60, 0));
    act(() => swipe(board(container), 2, -60)); // up is a wall at the spawn tile
    ticks(1);
    expect(pac(container)).toEqual({ x: '12', y: SPAWN.y });
    ticks(1);
    expect(pac(container)).toEqual({ x: '12', y: '21' });
  });

  it('a short tap on the maze does not steer or start', () => {
    const { container } = render(<PacmanGame />);
    act(() => swipe(board(container), 3, 2));
    expect(screen.getByRole('dialog', { name: 'Pac-Man' })).toBeTruthy();
  });

  it('pad Left starts the run heading left', () => {
    const { container } = render(<PacmanGame />);
    pad('Left');
    ticks(2);
    expect(pac(container)).toEqual({ x: '11', y: SPAWN.y });
  });

  it('pad Right starts the run heading right', () => {
    const { container } = render(<PacmanGame />);
    pad('Right');
    ticks(2);
    expect(pac(container)).toEqual({ x: '15', y: SPAWN.y });
  });

  it('pad Up is queued and taken at the first opening', () => {
    const { container } = render(<PacmanGame />);
    pad('Left');
    pad('Up');
    ticks(2);
    expect(pac(container)).toEqual({ x: '12', y: '21' });
  });

  it('pad Down is queued and taken at the first opening', () => {
    const { container } = render(<PacmanGame />);
    pad('Left');
    pad('Down');
    ticks(5);
    expect(pac(container)).toEqual({ x: '9', y: '23' });
  });

  it('the middle pad button starts, pauses and resumes', () => {
    const onStatusChange = vi.fn();
    render(<PacmanGame onStatusChange={onStatusChange} />);
    pad('Start');
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    pad('Pause');
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    pad('Resume');
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
  });

  it('the full-screen button toggles html[data-arcade-immersive]', () => {
    render(<PacmanGame />);
    fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Exit full screen' }));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });

  it('Escape in full screen pauses but never resumes', () => {
    const onStatusChange = vi.fn();
    render(<PacmanGame onStatusChange={onStatusChange} />);
    pad('Start');
    fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
  });
});
