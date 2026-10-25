import { useCallback, useState } from 'react';
import { readString, writeString } from '../arcade';
import { DEFAULT_THEME } from '../logic/constants';
import type { IconTheme } from '../logic/types';

export const ICON_THEME_KEY = 'pacman.iconTheme';

function isIconTheme(value: string | null): value is IconTheme {
  return value === 'normal' || value === 'fog';
}

/** Stored icon-theme preference; falls back to the default on bad data. */
export function readIconTheme(): IconTheme {
  const raw = readString(ICON_THEME_KEY);
  return isIconTheme(raw) ? raw : DEFAULT_THEME;
}

/**
 * Persisted icon-theme preference (`'normal' | 'fog'`) under
 * `pacman.iconTheme`. Cosmetic only. Writes happen only when the user changes
 * the theme (never on mount), best-effort via the kit's safe storage helpers.
 */
export function useIconTheme(): { theme: IconTheme; setTheme: (theme: IconTheme) => void } {
  const [theme, setThemeState] = useState<IconTheme>(readIconTheme);

  const setTheme = useCallback((next: IconTheme) => {
    setThemeState(next);
    writeString(ICON_THEME_KEY, next);
  }, []);

  return { theme, setTheme };
}
