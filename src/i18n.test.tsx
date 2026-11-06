import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, LANGS } from './arcade';
import { MESSAGES } from './i18n';
import { TICK_MS } from './logic/constants';
import { PacmanGame } from './PacmanGame';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => applyLang('en'));
  vi.useRealTimers();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });

describe('Pac-Man translations', () => {
  it('has every key in every language with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en);
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual([...keys].sort());
      for (const k of keys) expect(MESSAGES[lang][k as keyof typeof MESSAGES.en].trim()).not.toBe('');
    }
  });

  it('shows the German start overlay and theme picker', () => {
    applyLang('de');
    render(<PacmanGame />);
    const dialog = screen.getByRole('dialog', { name: 'Pac-Man' });
    expect(dialog.textContent).toContain('Friss alle Punkte');
    expect(within(dialog).getByRole('button', { name: /Start/ })).toBeTruthy();
    expect(screen.getByText('Symbolstil')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nebel' })).toBeTruthy();
  });

  it('switching language mid-run keeps the score and the board', () => {
    const { container } = render(<PacmanGame />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(TICK_MS * 3 + 10));
    expect(screen.getByText('Score').nextElementSibling?.textContent).toBe('30');
    const board = container.querySelector('[role="grid"]')!.parentElement!;
    const before = board.innerHTML;

    act(() => applyLang('hu'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Pont').nextElementSibling?.textContent).toBe('30');
    expect(screen.getByText('Életek').nextElementSibling?.textContent).toBe('3');
    expect(board.innerHTML).toBe(before.replace('aria-label="Pac-Man maze"', 'aria-label="Pac-Man-labirintus"'));
    fireEvent.click(screen.getByRole('button', { name: 'Köd' }));
    expect(localStorage.getItem('pacman.iconTheme')).toBe('fog');
    expect(screen.getByText('Pont').nextElementSibling?.textContent).toBe('30');
  });
});
