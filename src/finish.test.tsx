import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, KIT_MESSAGES, loadSession, readStats } from './arcade';
import { TICK_MS } from './logic/constants';
import { PacmanGame } from './PacmanGame';

beforeEach(() => {
  localStorage.clear();
  act(() => applyLang('hu'));
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => applyLang('en'));
  vi.useRealTimers();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const finishButton = () => screen.queryByRole('button', { name: 'Befejezés' });
const score = () => screen.getByText(KIT_MESSAGES.hu.score).nextElementSibling?.textContent;
const pacX = (c: HTMLElement) =>
  (c.querySelector('[data-testid="pacman-player"]') as HTMLElement).style.getPropertyValue('--x');

describe('Pac-Man finish early', () => {
  it('is hidden before the run starts and visible after the first move', () => {
    render(<PacmanGame />);
    expect(finishButton()).toBeNull();
    act(() => key('ArrowLeft'));
    expect(finishButton()).toBeTruthy();
  });

  it('confirm ranks the Score-panel value once, shows the finished card and drops the save', () => {
    const onGameOver = vi.fn();
    render(<PacmanGame onGameOver={onGameOver} />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(TICK_MS * 3 + 1200));
    const shown = score();
    expect(Number(shown)).toBeGreaterThan(0);
    expect(loadSession('pacman', 1)).not.toBeNull();

    fireEvent.click(finishButton()!);
    const confirm = screen.getByRole('alertdialog');
    expect(confirm.textContent).toContain(`Befejezed a játékot? ${shown} pont kerül a ranglistára.`);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));

    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(Number(shown), { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
    expect(loadSession('pacman', 1)).toBeNull();
    expect(readStats('pacman').plays).toBe(1);
    expect(finishButton()).toBeNull();
    act(() => vi.advanceTimersByTime(TICK_MS * 10));
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it('a finished run at 0 points still goes on the leaderboard', () => {
    const onGameOver = vi.fn();
    render(<PacmanGame onGameOver={onGameOver} />);
    act(() => key('ArrowLeft'));
    fireEvent.click(finishButton()!);
    expect(screen.getByRole('alertdialog').textContent).toContain('0 pont');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
  });

  it('holds the game while the confirm is open; Cancel changes nothing', () => {
    const onGameOver = vi.fn();
    const onStatusChange = vi.fn();
    const { container } = render(<PacmanGame onGameOver={onGameOver} onStatusChange={onStatusChange} />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(TICK_MS * 2 + 10));
    const shown = score();
    const x = pacX(container);
    const timeLabel = screen.getByText(KIT_MESSAGES.hu.time).nextElementSibling?.textContent;

    fireEvent.click(finishButton()!);
    act(() => vi.advanceTimersByTime(3000));
    expect(score()).toBe(shown);
    expect(pacX(container)).toBe(x);
    expect(screen.getByText(KIT_MESSAGES.hu.time).nextElementSibling?.textContent).toBe(timeLabel);

    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(score()).toBe(shown);
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    expect(loadSession('pacman', 1)).not.toBeNull();
    // The run goes on where it stopped.
    act(() => vi.advanceTimersByTime(TICK_MS + 10));
    expect(pacX(container)).not.toBe(x);
  });

  it('a new game after finishing ends normally again (no finished flag left over)', () => {
    render(<PacmanGame />);
    act(() => key('ArrowLeft'));
    fireEvent.click(finishButton()!);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    act(() => key('r'));
    expect(screen.queryByRole('dialog', { name: 'Idő előtt befejezve' })).toBeNull();
    expect(finishButton()).toBeTruthy();
  });
});
