import { useCallback, useEffect, useRef, useState } from 'react';
import { Maze } from './components/Maze';
import { Entities } from './components/Entities';
import { ScoreBoard } from './components/ScoreBoard';
import { TICK_MS } from './logic/constants';
import { advanceGame, createInitialState } from './logic/game';
import { useGameLoop } from './hooks/useGameLoop';
import { useHighScore } from './hooks/useHighScore';
import { useKeyboardDirection } from './hooks/useKeyboardDirection';
import type { Direction } from './logic/types';
import styles from './App.module.css';

export default function App() {
  const [state, setState] = useState(createInitialState);
  const { highScore, recordScore } = useHighScore();
  const prevStatusRef = useRef(state.status);
  const scoreRef = useRef(state.score);

  const tick = useCallback(() => {
    setState((prev) => advanceGame(prev));
  }, []);

  useGameLoop(state.status === 'running', TICK_MS, tick);

  // Keep scoreRef current so the transition effect can read the final score
  // without adding state.score to the status-change effect's deps.
  scoreRef.current = state.score;

  // Record score only on the status TRANSITION into an end-state.
  useEffect(() => {
    const prev = prevStatusRef.current;
    const isEndState = state.status === 'levelClear' || state.status === 'gameOver';
    const wasEndState = prev === 'levelClear' || prev === 'gameOver';
    if (isEndState && !wasEndState) {
      recordScore(scoreRef.current);
    }
    prevStatusRef.current = state.status;
  }, [state.status, recordScore]);

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
      <ScoreBoard
        score={state.score}
        highScore={highScore}
        level={state.level}
        status={state.status}
      />
      <div className={styles.boardWrap}>
        <Maze
          pellets={state.pellets}
          powerPellets={state.powerPellets}
          theme={state.theme}
        />
        <Entities
          pacman={state.pacman}
          ghosts={state.ghosts}
          theme={state.theme}
        />
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
      </div>
    </main>
  );
}
