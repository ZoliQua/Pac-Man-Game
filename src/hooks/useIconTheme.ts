import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_THEME } from '../logic/constants';
import type { IconTheme } from '../logic/types';

const STORAGE_KEY = 'pacman.iconTheme';

function isIconTheme(value: string | null): value is IconTheme {
  return value === 'normal' || value === 'fog';
}

function readStoredTheme(): IconTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isIconTheme(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Persisted icon-theme preference (`'normal' | 'fog'`), mirroring Snake's
 * localStorage hook pattern. The initial value is read lazily from
 * `localStorage` under `pacman.iconTheme`; writes are best-effort.
 */
export function useIconTheme(): {
  theme: IconTheme;
  setTheme: (theme: IconTheme) => void;
} {
  const [theme, setThemeState] = useState<IconTheme>(readStoredTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable (private mode, quota); ignore.
    }
  }, [theme]);

  // Narrows the public type to (theme: IconTheme) => void, hiding React's
  // Dispatch<SetStateAction<IconTheme>> from the hook's interface.
  const setTheme = useCallback((next: IconTheme) => {
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
