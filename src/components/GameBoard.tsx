import type { GameState, IconTheme } from '../logic/types';
import { Entities } from './Entities';
import { Maze } from './Maze';
import styles from './GameBoard.module.css';

type Props = {
  state: Pick<GameState, 'pacman' | 'ghosts' | 'pellets' | 'powerPellets' | 'frightenedTimer'>;
  theme: IconTheme;
  /** `mini` renders the compact, decorative landing-page variant. */
  variant?: 'full' | 'mini';
};

/** Maze + entity overlay sharing one `--cell` size. */
export function GameBoard({ state, theme, variant = 'full' }: Props) {
  const mini = variant === 'mini';
  return (
    <div className={`${styles.board} ${mini ? styles.mini : ''}`} aria-hidden={mini ? true : undefined}>
      <Maze pellets={state.pellets} powerPellets={state.powerPellets} theme={theme} mini={mini} />
      <Entities
        pacman={state.pacman}
        ghosts={state.ghosts}
        frightenedTimer={state.frightenedTimer}
        theme={theme}
      />
    </div>
  );
}
