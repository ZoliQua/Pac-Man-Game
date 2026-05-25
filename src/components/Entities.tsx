import { CELL_PX, FRIGHTENED_FLASH_TICKS, THEMES } from '../logic/constants';
import type { Direction, Ghost, IconTheme, Vec } from '../logic/types';
import styles from './Entities.module.css';

type Props = {
  pacman: { pos: Vec; dir: Direction };
  ghosts?: Ghost[];
  /** Ticks left of frightened mode; drives the end-of-window flash. */
  frightenedTimer?: number;
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

// Eyes look toward travel direction (offset of the pupils inside the eyes).
const PUPIL_SHIFT: Record<Direction, { x: number; y: number }> = {
  RIGHT: { x: 1, y: 0 },
  LEFT: { x: -1, y: 0 },
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  NONE: { x: 0, y: 0 },
};

/**
 * Entity overlay. Renders Pac-Man (animated mouth, oriented by direction) plus
 * the four ghosts, absolutely positioned over the maze grid by tile coordinate.
 * Ghost appearance is driven entirely by the active theme + ghost mode:
 *   - scatter/chase → themed body colour + eyes that track the heading
 *   - frightened    → themed "frightened" colour, flashing in the final
 *                     FRIGHTENED_FLASH_TICKS to warn the window is closing
 *   - eaten         → eyes only (no body)
 * No gameplay state is read here beyond what is needed to draw — themes are
 * cosmetic only.
 */
export function Entities({
  pacman,
  ghosts = [],
  frightenedTimer = 0,
  theme = 'normal',
}: Props) {
  const spec = THEMES[theme];
  const flashing =
    frightenedTimer > 0 && frightenedTimer <= FRIGHTENED_FLASH_TICKS;

  return (
    <div
      className={`${styles.layer} ${styles[`theme-${theme}`]}`}
      aria-hidden="true"
      style={{ ['--entity-opacity' as string]: String(spec.entityOpacity) }}
    >
      <div
        className={styles.pacman}
        style={{
          width: CELL_PX,
          height: CELL_PX,
          transform: `translate(${pacman.pos.x * CELL_PX}px, ${pacman.pos.y * CELL_PX}px) rotate(${DIR_ROTATION[pacman.dir]}deg)`,
          ['--pacman-color' as string]: spec.pacman,
        }}
      />
      {ghosts.map((g) => {
        const isFrightened = g.mode === 'frightened';
        const isEaten = g.mode === 'eaten';
        const body = isEaten
          ? 'transparent'
          : isFrightened
            ? (flashing ? spec.frightenedFlash : spec.frightened)
            : spec.ghosts[g.name];
        const shift = PUPIL_SHIFT[g.dir];
        return (
          <div
            key={g.name}
            className={[
              styles.ghost,
              isFrightened ? styles.frightened : '',
              isEaten ? styles.eaten : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              width: CELL_PX,
              height: CELL_PX,
              transform: `translate(${g.pos.x * CELL_PX}px, ${g.pos.y * CELL_PX}px)`,
              ['--ghost-color' as string]: body,
              ['--eye-color' as string]: spec.eye,
              ['--pupil-color' as string]: spec.pupil,
            }}
          >
            {!isFrightened && (
              <span className={styles.eyes}>
                <span className={styles.eye}>
                  <span
                    className={styles.pupil}
                    style={{
                      transform: `translate(${shift.x}px, ${shift.y}px)`,
                    }}
                  />
                </span>
                <span className={styles.eye}>
                  <span
                    className={styles.pupil}
                    style={{
                      transform: `translate(${shift.x}px, ${shift.y}px)`,
                    }}
                  />
                </span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
