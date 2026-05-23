import { CELL_PX, THEMES } from '../logic/constants';
import type { Direction, Ghost, IconTheme, Vec } from '../logic/types';
import styles from './Entities.module.css';

type Props = {
  pacman: { pos: Vec; dir: Direction };
  ghosts?: Ghost[];
  theme?: IconTheme;
};

// Mouth opening direction → rotation of the base (mouth-right) shape.
const DIR_ROTATION: Record<Direction, number> = {
  RIGHT: 0,
  DOWN: 90,
  LEFT: 180,
  UP: 270,
  NONE: 0,
};

/**
 * Entity overlay. Renders Pac-Man plus the four ghosts (Phase 4), absolutely
 * positioned over the maze grid by tile coordinate. Each ghost uses its classic
 * colour from the active theme. Richer ghost art is Phase 6.
 */
export function Entities({ pacman, ghosts = [], theme = 'normal' }: Props) {
  const spec = THEMES[theme];
  return (
    <div className={styles.layer} aria-hidden="true">
      <div
        className={styles.pacman}
        style={{
          width: CELL_PX,
          height: CELL_PX,
          transform: `translate(${pacman.pos.x * CELL_PX}px, ${pacman.pos.y * CELL_PX}px) rotate(${DIR_ROTATION[pacman.dir]}deg)`,
          ['--pacman-color' as string]: spec.pacman,
        }}
      />
      {ghosts.map((g) => (
        <div
          key={g.name}
          className={styles.ghost}
          style={{
            width: CELL_PX,
            height: CELL_PX,
            transform: `translate(${g.pos.x * CELL_PX}px, ${g.pos.y * CELL_PX}px)`,
            ['--ghost-color' as string]: spec.ghosts[g.name],
          }}
        />
      ))}
    </div>
  );
}
