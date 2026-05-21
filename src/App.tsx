import { useCallback, useState } from 'react';
import { Maze } from './components/Maze';
import { Entities } from './components/Entities';
import { TICK_MS } from './logic/constants';
import { advanceGame, createInitialState } from './logic/game';
import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboardDirection } from './hooks/useKeyboardDirection';
import type { Direction } from './logic/types';
import styles from './App.module.css';

export default function App() {
  const [state, setState] = useState(createInitialState);

  const tick = useCallback(() => {
    setState((prev) => advanceGame(prev));
  }, []);

  useGameLoop(state.status === 'running', TICK_MS, tick);

  // A direction key while idle starts the game and sets the first heading.
  const handleDirection = useCallback((direction: Direction) => {
    setState((prev) => {
      if (prev.status === 'idle') {
        return {
          ...prev,
          status: 'running',
          pacman: { ...prev.pacman, dir: direction, nextDir: direction },
        };
      }
      if (prev.status === 'running') {
        return { ...prev, pacman: { ...prev.pacman, nextDir: direction } };
      }
      return prev;
    });
  }, []);

  const handleStart = useCallback(() => {
    setState((prev) =>
      prev.status === 'idle' ? { ...prev, status: 'running' } : prev,
    );
  }, []);

  const handlePause = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'running') return { ...prev, status: 'paused' };
      if (prev.status === 'paused') return { ...prev, status: 'running' };
      return prev;
    });
  }, []);

  const handleRestart = useCallback(() => {
    setState((prev) => createInitialState({ theme: prev.theme }));
  }, []);

  useKeyboardDirection({
    onDirection: handleDirection,
    onPause: handlePause,
    onRestart: handleRestart,
  });

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Pac-Man</h1>
      <div className={styles.boardWrap}>
        <Maze theme={state.theme} />
        <Entities pacman={state.pacman} theme={state.theme} />
      </div>
      <div className={styles.controls}>
        {state.status === 'idle' ? (
          <button type="button" onClick={handleStart}>
            Start
          </button>
        ) : null}
        {state.status === 'running' || state.status === 'paused' ? (
          <button type="button" onClick={handlePause}>
            {state.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
        ) : null}
        <button type="button" onClick={handleRestart}>
          Restart
        </button>
        <span className={styles.status}>{state.status}</span>
      </div>
    </main>
  );
}
