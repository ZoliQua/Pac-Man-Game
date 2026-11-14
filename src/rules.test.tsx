import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber, interpolate, KIT_MESSAGES } from './arcade';
import { MESSAGES } from './i18n';
import { POINTS, START_LIVES, TICK_MS } from './logic/constants';
import { PacmanGame } from './PacmanGame';
import { mockPointer, resetPointer } from './test/pointer';

const UA = navigator.userAgent;

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  localStorage.clear();
  act(() => applyLang('hu'));
  mockPointer(false);
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => applyLang('en'));
  resetPointer();
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value: UA });
  vi.useRealTimers();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const rulesButton = () => screen.getByRole('button', { name: 'Szabályok' });
const rulesDialog = () => screen.getByRole('dialog', { name: 'Pac-Man — szabályok' });
const headings = () =>
  Array.from(rulesDialog().querySelectorAll('.arc-rules__heading')).map((h) => h.textContent);
const section = (id: string) => rulesDialog().querySelector(`.arc-rules__section--${id}`) as HTMLElement;
const score = (lang: 'hu' | 'de') => screen.getByText(KIT_MESSAGES[lang].score).nextElementSibling?.textContent;

describe('Pac-Man rules', () => {
  it('has a visible Rules button that opens the dialog (R stays restart)', () => {
    render(<PacmanGame />);
    expect(rulesButton()).toBeTruthy();
    // R is the restart key in Pac-Man, so the Rules button has no hotkey.
    expect(rulesButton().getAttribute('aria-keyshortcuts')).toBeNull();
    act(() => key('r'));
    expect(screen.queryByRole('dialog', { name: 'Pac-Man — szabályok' })).toBeNull();
    fireEvent.click(rulesButton());
    expect(rulesDialog()).toBeTruthy();
  });

  it('opening during a run pauses it and closing leaves it paused', () => {
    const onStatusChange = vi.fn();
    render(<PacmanGame onStatusChange={onStatusChange} />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(TICK_MS * 2 + 10));
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    fireEvent.click(rulesButton());
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    const before = score('hu');
    act(() => vi.advanceTimersByTime(TICK_MS * 5));
    expect(score('hu')).toBe(before);
    fireEvent.click(within(rulesDialog()).getByRole('button', { name: 'Bezárás' }));
    expect(screen.queryByRole('dialog', { name: 'Pac-Man — szabályok' })).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    expect(screen.getByRole('dialog', { name: 'Szünet' })).toBeTruthy();
  });

  it('lists goal, play, rules, scoring and dental in order; play shows the keys on a desktop', () => {
    render(<PacmanGame />);
    fireEvent.click(rulesButton());
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód']);
    expect(section('play').textContent).toContain(MESSAGES.hu.rulesPlayKeys);
    expect(section('play').textContent).not.toContain(MESSAGES.hu.rulesPlayTouch);
    expect(section('rules').textContent).toContain(formatNumber(START_LIVES, 'hu'));
  });

  it('shows the On mobile section with the touch rows only on a touch device', () => {
    mockPointer(true);
    render(<PacmanGame />);
    fireEvent.click(rulesButton());
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód', 'Mobilon']);
    expect(section('play').textContent).toContain(MESSAGES.hu.rulesPlayTouch);
    expect(section('play').textContent).not.toContain(MESSAGES.hu.rulesPlayKeys);
    const mobile = section('mobile').textContent ?? '';
    for (const k of ['touchSwipe', 'touchSwipeAction', 'touchPad', 'touchPadAction', 'touchCenter', 'touchCenterAction'] as const) {
      expect(mobile).toContain(MESSAGES.hu[k]);
    }
    expect(mobile).toContain(KIT_MESSAGES.hu.fullscreen);
    expect(mobile).not.toContain(KIT_MESSAGES.hu.iosHomeScreenTip);
  });

  it('adds the home-screen tip on an iPhone', () => {
    mockPointer(true);
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    render(<PacmanGame />);
    fireEvent.click(rulesButton());
    expect(section('mobile').textContent).toContain(KIT_MESSAGES.hu.iosHomeScreenTip);
  });

  it.each(['hu', 'de'] as const)('scoring lists the full sentences with the real point values (%s)', (lang) => {
    act(() => applyLang(lang));
    render(<PacmanGame />);
    fireEvent.click(screen.getByRole('button', { name: KIT_MESSAGES[lang].rulesButton }));
    const scoring = document.querySelector('.arc-rules__section--scoring') as HTMLElement;
    const items = Array.from(scoring.querySelectorAll('li')).map((li) => li.textContent);
    const num = (n: number) => formatNumber(n, lang);
    const m = MESSAGES[lang];
    expect(items).toEqual([
      interpolate(m.rulesScorePellet, { points: num(POINTS.pellet) }),
      interpolate(m.rulesScorePower, { points: num(POINTS.power) }),
      interpolate(m.rulesScoreChain, { chain: POINTS.ghostChain.map(num).join(' → ') }),
    ]);
  });

  it('draws the power-pellet diagram as a labelled picture, also in dental mode', () => {
    const { unmount } = render(<PacmanGame />);
    fireEvent.click(rulesButton());
    const img = within(rulesDialog()).getByRole('img', { name: MESSAGES.hu.rulesDiagramAria });
    expect(img.textContent).toContain(MESSAGES.hu.rulesDiagramPellet);
    expect(img.textContent).toContain(MESSAGES.hu.rulesDiagramFrightened);
    expect(img.getAttribute('data-dental')).toBe('false');
    unmount();

    applyDental(true, { silent: true });
    render(<PacmanGame />);
    fireEvent.click(rulesButton());
    const dentalImg = within(rulesDialog()).getByRole('img', { name: MESSAGES.hu.rulesDiagramAria });
    expect(dentalImg.getAttribute('data-dental')).toBe('true');
    expect(dentalImg.textContent).toContain(MESSAGES.hu.rulesDiagramPellet);
  });

  it('language switch inside the rules keeps the run', () => {
    const { container } = render(<PacmanGame />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(TICK_MS * 3 + 10));
    const before = score('hu');
    const pacX = (container.querySelector('[data-testid="pacman-player"]') as HTMLElement).style.getPropertyValue('--x');
    fireEvent.click(rulesButton());
    act(() => applyLang('de'));
    expect(screen.getByRole('dialog', { name: 'Pac-Man — Regeln' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pac-Man — Regeln' })).toBeTruthy();
    expect(score('de')).toBe(before);
    expect((container.querySelector('[data-testid="pacman-player"]') as HTMLElement).style.getPropertyValue('--x')).toBe(pacX);
  });
});
