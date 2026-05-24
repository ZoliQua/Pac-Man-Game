import { useCallback, useEffect, useRef, useState } from 'react';
import { Maze } from './components/Maze';
import { Entities } from './components/Entities';
import { ScoreBoard } from './components/ScoreBoard';
import { GameControls } from './components/GameControls';
import { Overlay } from './components/Overlay';
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

  // The loop must also tick during the brief `dying` / `levelClear` transition
  // states so their `transitionTimer` resolves. It stays OFF in idle / paused /
  // gameOver.
  const loopActive =
    state.status === 'running' ||
    state.status === 'dying' ||
    state.status === 'levelClear';
  useGameLoop(loopActive, TICK_MS, tick);

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

  // Pause only toggles between running and paused — never during the `dying` /
  // `levelClear` transition states (where freezing would wedge the timer).
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
        lives={state.lives}
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
        <Overlay
          status={state.status}
          score={state.score}
          level={state.level}
          onStart={handleStart}
          onResume={handlePause}
          onRestart={handleRestart}
        />
      </div>
      <GameControls
        status={state.status}
        onStart={handleStart}
        onTogglePause={handlePause}
        onRestart={handleRestart}
      />
    </main>
  );
}
