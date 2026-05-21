import { useEffect, useRef } from 'react';
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
  onPause?: () => void;
  onRestart?: () => void;
};

/**
 * Single `keydown` listener (attached once per mount, cleaned up on unmount):
 * arrow keys + WASD buffer the desired direction; `P` pauses/resumes; `R`
 * restarts. Arrow keys `preventDefault` so the page never scrolls. Mirrors the
 * Snake-Game listener hygiene.
 */
export function useKeyboardDirection(handlers: KeyboardDirectionHandlers): void {
  // App passes a fresh `handlers` object literal every render (every tick).
  // Mirror useGameLoop: keep the latest handlers in a ref so the listener body
  // reads current values, but attach the listener itself only once per mount.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Empty deps → single `keydown` listener added on mount, removed on unmount.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (ARROW_KEYS.has(event.key)) {
        event.preventDefault();
      }

      const current = handlersRef.current;
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        current.onDirection(direction);
        return;
      }

      if ((event.key === 'p' || event.key === 'P') && current.onPause) {
        current.onPause();
        return;
      }

      if ((event.key === 'r' || event.key === 'R') && current.onRestart) {
        current.onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
