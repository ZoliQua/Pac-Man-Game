import { Germ, SmileTooth } from '../arcade';
import { FRIGHTENED_FLASH_TICKS, THEMES } from '../logic/constants';
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

const SPIKES = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);

/**
 * Frightened germ in dental mode: the same spiky silhouette as `Germ`, but an
 * empty outlined body with a wobbly worried mouth — told apart by shape, not
 * only by colour.
 */
function HollowGerm({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" focusable="false">
      {SPIKES.map((a) => (
        <line
          key={a}
          x1={(50 + Math.cos(a) * 30).toFixed(1)}
          y1={(50 + Math.sin(a) * 30).toFixed(1)}
          x2={(50 + Math.cos(a) * 44).toFixed(1)}
          y2={(50 + Math.sin(a) * 44).toFixed(1)}
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
      ))}
      <circle cx="50" cy="50" r="26" fill="none" stroke={color} strokeWidth="7" strokeDasharray="10 6" />
      <circle cx="41" cy="44" r="4" fill={color} />
      <circle cx="59" cy="44" r="4" fill={color} />
      <path d="M37 62l6-5 7 5 7-5 6 5" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Entity overlay (positions via the `--cell` custom property from GameBoard). Renders Pac-Man (animated mouth, oriented by direction) plus
 * the four ghosts, absolutely positioned over the maze grid by tile coordinate.
 * Ghost appearance is driven entirely by the active theme + ghost mode:
 *   - scatter/chase → themed body colour + eyes that track the heading
 *   - frightened    → themed "frightened" colour, flashing in the final
 *                     FRIGHTENED_FLASH_TICKS to warn the window is closing
 *   - eaten         → eyes only (no body)
 * Dental theme: Pac-Man is a smiling tooth (mirrored when heading left), ghosts
 * are germs (frightened: hollow dashed germs), eaten ghosts keep the eyes.
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
  const dental = theme === 'dental';

  return (
    <div
      className={`${styles.layer} ${styles[`theme-${theme}`]}`}
      aria-hidden="true"
      style={{ ['--entity-opacity' as string]: String(spec.entityOpacity) }}
    >
      <div
        className={dental ? `${styles.pacman} ${styles.pacmanTooth}` : styles.pacman}
        data-testid="pacman-player"
        style={{
          ['--x' as string]: pacman.pos.x,
          ['--y' as string]: pacman.pos.y,
          ['--rot' as string]: dental ? '0deg' : `${DIR_ROTATION[pacman.dir]}deg`,
          ['--pacman-color' as string]: spec.pacman,
        }}
      >
        {dental && (
          <span
            className={`${styles.art} ${pacman.dir === 'LEFT' ? styles.mirrored : ''}`}
            data-testid="pacman-player-tooth"
          >
            <SmileTooth size="100%" />
          </span>
        )}
      </div>
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
              dental ? styles.ghostGerm : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              ['--x' as string]: g.pos.x,
              ['--y' as string]: g.pos.y,
              ['--ghost-color' as string]: body,
              ['--eye-color' as string]: spec.eye,
              ['--pupil-color' as string]: spec.pupil,
            }}
          >
            {dental && isFrightened && (
              <span className={styles.art} data-testid="pacman-ghost-hollow">
                <HollowGerm color={body} />
              </span>
            )}
            {dental && !isFrightened && !isEaten && (
              <span className={styles.art} data-testid="pacman-ghost-germ">
                <Germ size="100%" fill={body} />
              </span>
            )}
            {!isFrightened && !(dental && !isEaten) && (
              <span className={styles.eyes}>
                <span className={styles.eye}>
                  <span
                    className={styles.pupil}
                    style={{
                      transform: `translate(calc(var(--cell) * ${shift.x * 0.05}), calc(var(--cell) * ${shift.y * 0.05}))`,
                    }}
                  />
                </span>
                <span className={styles.eye}>
                  <span
                    className={styles.pupil}
                    style={{
                      transform: `translate(calc(var(--cell) * ${shift.x * 0.05}), calc(var(--cell) * ${shift.y * 0.05}))`,
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
