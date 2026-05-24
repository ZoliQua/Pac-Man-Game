import type { GameStatus } from '../logic/types';
import styles from './Overlay.module.css';

type Props = {
  status: GameStatus;
  score: number;
  level: number;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
};

/**
 * Modal-style overlay shown over the board for the non-playing statuses. Mirrors
 * Snake-Game's Overlay structure/classes. Renders nothing during `running` and
 * `dying` (the death pause is brief and the board stays visible).
 */
export function Overlay({
  status,
  score,
  level,
  onStart,
  onResume,
  onRestart,
}: Props) {
  if (status === 'running' || status === 'dying') return null;

  return (
    <div className={styles.overlay} role="dialog" aria-labelledby="overlay-title">
      <div className={styles.panel}>
        {status === 'idle' && (
          <>
            <h2 id="overlay-title">Pac-Man</h2>
            <p>Press an arrow key / Start to play.</p>
            <button type="button" onClick={onStart}>
              Start
            </button>
          </>
        )}
        {status === 'paused' && (
          <>
            <h2 id="overlay-title">Paused</h2>
            <button type="button" onClick={onResume}>
              Resume
            </button>
          </>
        )}
        {status === 'levelClear' && (
          <>
            <h2 id="overlay-title">Level {level} cleared!</h2>
            <p>Score: {score}</p>
          </>
        )}
        {status === 'gameOver' && (
          <>
            <h2 id="overlay-title">Game Over</h2>
            <p>Final score: {score} — press R to play again.</p>
            <button type="button" onClick={onRestart}>
              Play again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
