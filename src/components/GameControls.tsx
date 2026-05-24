import type { GameStatus } from '../logic/types';
import styles from './GameControls.module.css';

type Props = {
  status: GameStatus;
  onStart: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
};

/**
 * Start / Pause / Restart buttons, mirroring Snake-Game's GameControls. Pause is
 * only offered while playing (`running`/`paused`); Restart is always available
 * once out of `idle`.
 */
export function GameControls({
  status,
  onStart,
  onTogglePause,
  onRestart,
}: Props) {
  return (
    <div className={styles.controls}>
      {status === 'idle' && (
        <button type="button" className={styles.primary} onClick={onStart}>
          Start
        </button>
      )}
      {(status === 'running' || status === 'paused') && (
        <button
          type="button"
          className={styles.primary}
          onClick={onTogglePause}
        >
          {status === 'running' ? 'Pause' : 'Resume'}
        </button>
      )}
      {status === 'gameOver' && (
        <button type="button" className={styles.primary} onClick={onRestart}>
          Play again
        </button>
      )}
      {status !== 'idle' && status !== 'gameOver' && (
        <button type="button" className={styles.secondary} onClick={onRestart}>
          Restart
        </button>
      )}
    </div>
  );
}
