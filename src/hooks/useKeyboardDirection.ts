import { useEffect, useRef } from 'react';
import { ARCADE_KEYS, isKey, shouldIgnoreKey } from '../arcade';
import type { Direction } from '../logic/types';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  W: 'UP',
  s: 'DOWN',
  S: 'DOWN',
  a: 'LEFT',
  A: 'LEFT',
  d: 'RIGHT',
  D: 'RIGHT',
};

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export type KeyboardDirectionHandlers = {
  onDirection: (direction: Direction) => void;
  /** Space / Enter: start when idle or over, otherwise pause/resume. */
  onPrimary?: () => void;
  /** P / Esc. */
  onTogglePause?: () => void;
  /** Esc only; when set it replaces `onTogglePause` for Escape (e.g. pause-only in full screen). */
  onEscape?: () => void;
  onRestart?: () => void;
};

/**
 * Arrows + WASD buffer the desired direction (the logic applies it at the next
 * legal tile). One window listener for the lifetime of the component; handlers are read
 * from a ref so re-renders never re-subscribe. Typing in form fields and
 * modifier shortcuts (Cmd+R, Ctrl+W, …) are left to the browser.
 */
export function useKeyboardDirection(handlers: KeyboardDirectionHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKey(event)) return;
      const h = ref.current;

      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        if (ARROW_KEYS.has(event.key)) event.preventDefault();
        h.onDirection(direction);
        return;
      }

      if ((event.key === ' ' || event.key === 'Enter') && h.onPrimary) {
        event.preventDefault();
        h.onPrimary();
        return;
      }

      if (event.key === 'Escape' && h.onEscape) {
        event.preventDefault();
        h.onEscape();
        return;
      }

      if (isKey(event, ARCADE_KEYS.pause) && h.onTogglePause) {
        event.preventDefault();
        h.onTogglePause();
        return;
      }

      if (isKey(event, ARCADE_KEYS.restart) && h.onRestart) {
        h.onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
