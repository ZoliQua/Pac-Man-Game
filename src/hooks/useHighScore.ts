import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'pacman.highScore';

function readStoredHighScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function useHighScore(): {
  highScore: number;
  recordScore: (score: number) => void;
} {
  const [highScore, setHighScore] = useState<number>(readStoredHighScore);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(highScore));
    } catch {
      // localStorage may be unavailable (private mode, quota); ignore.
    }
  }, [highScore]);

  const recordScore = useCallback((score: number) => {
    setHighScore((prev) => (score > prev ? score : prev));
  }, []);

  return { highScore, recordScore };
}
