import type { GameStatus } from '../logic/types';
import styles from './ScoreBoard.module.css';

type Props = {
  score: number;
  highScore: number;
  level: number;
  status: GameStatus;
};

const STATUS_LABEL: Record<GameStatus, string> = {
  idle: 'Ready',
  running: 'Running',
  paused: 'Paused',
  dying: 'Dying…',
  levelClear: 'Level clear!',
  gameOver: 'Game over',
};

export function ScoreBoard({ score, highScore, level, status }: Props) {
  const isNewHigh = score > 0 && score > highScore;

  return (
    <div className={styles.scoreboard}>
      <div className={styles.metric}>
        <span className={styles.label}>Score</span>
        <span className={styles.value}>{score}</span>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Best</span>
        <span className={`${styles.value} ${isNewHigh ? styles.best : ''}`}>
          {highScore}
        </span>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Level</span>
        <span className={styles.value}>{level}</span>
      </div>
      <div className={`${styles.status} ${styles[status]}`}>
        {STATUS_LABEL[status]}
      </div>
    </div>
  );
}
