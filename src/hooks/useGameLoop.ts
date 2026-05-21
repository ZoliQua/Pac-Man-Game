import { useEffect, useRef } from 'react';

/**
 * Fixed-interval game loop. Runs only while `active` is true. Uses a latest-
 * callback ref so the interval never captures a stale closure, and cleans up on
 * unmount or whenever `active` / `tickMs` changes. Mirrors the Snake-Game hook.
 */
export function useGameLoop(
  active: boolean,
  tickMs: number,
  onTick: () => void,
): void {
  const callbackRef = useRef(onTick);

  useEffect(() => {
    callbackRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const id = window.setInterval(() => {
      callbackRef.current();
    }, tickMs);

    return () => {
      window.clearInterval(id);
    };
  }, [active, tickMs]);
}
