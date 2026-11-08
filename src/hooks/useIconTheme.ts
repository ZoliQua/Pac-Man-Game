import { useCallback, useState } from 'react';
import { readString, writeString } from '../arcade';
import { DEFAULT_THEME } from '../logic/constants';
import type { BaseIconTheme } from '../logic/types';

export const ICON_THEME_KEY = 'pacman.iconTheme';

function isIconTheme(value: string | null): value is BaseIconTheme {
  return value === 'normal' || value === 'fog';
}

/** Stored icon-theme preference; falls back to the default on bad data. */
export function readIconTheme(): BaseIconTheme {
  const raw = readString(ICON_THEME_KEY);
  return isIconTheme(raw) ? raw : DEFAULT_THEME;
}

/**
 * Persisted icon-theme preference (`'normal' | 'fog'`) under
 * `pacman.iconTheme`. The Dental option is not stored here: it is the shared
 * arcade dental mode, so old saves and prefs keep their meaning. Cosmetic only. Writes happen only when the user changes
 * the theme (never on mount), best-effort via the kit's safe storage helpers.
 */
export function useIconTheme(): { theme: BaseIconTheme; setTheme: (theme: BaseIconTheme) => void } {
  const [theme, setThemeState] = useState<BaseIconTheme>(readIconTheme);

  const setTheme = useCallback((next: BaseIconTheme) => {
    setThemeState(next);
    writeString(ICON_THEME_KEY, next);
  }, []);

  return { theme, setTheme };
}
