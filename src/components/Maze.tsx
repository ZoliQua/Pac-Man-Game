import { memo, useMemo } from 'react';
import { Toothbrush } from '../arcade';
import { THEMES } from '../logic/constants';
import { key } from '../logic/grid';
import { PARSED_MAZE } from '../logic/maze';
import type { IconTheme } from '../logic/types';
import styles from './Maze.module.css';

type Props = {
  /** Live (uneaten) pellet keys from game state — eaten cells disappear. */
  pellets: Set<string>;
  /** Live (uneaten) power-pellet keys from game state. */
  powerPellets: Set<string>;
  theme?: IconTheme;
  /** `mini` drops the ARIA grid roles (the demo is decorative). */
  mini?: boolean;
  /** Accessible name of the maze grid. */
  label?: string;
};

type CellKind = 'wall' | 'pellet' | 'power' | 'door' | 'empty';

// walls, doorTiles, cols, and rows come from the module-level PARSED_MAZE
// constant and never change — hoist them so the useMemo dep array only
// contains the live pellet sets that actually drive re-renders.
const { walls, doorTiles, cols, rows } = PARSED_MAZE;

/**
 * The static maze plus the live pellets. Memoised: the pellet Sets only change
 * identity when something is eaten, so most ticks skip re-rendering 868 cells.
 * Cell size comes from the `--cell` custom property set by GameBoard.
 */
export const Maze = memo(function Maze({ pellets, powerPellets, theme = 'normal', mini = false, label = 'Pac-Man maze' }: Props) {
  const spec = THEMES[theme];
  const dental = theme === 'dental';

  const cells = useMemo(() => {
    const out: CellKind[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const k = key({ x, y });
        // Only the door ('-') tiles render as a door bar. Ghost-spawn and
        // house-interior tiles render as plain floor ('empty').
        let kind: CellKind = 'empty';
        if (walls.has(k)) kind = 'wall';
        else if (powerPellets.has(k)) kind = 'power';
        else if (pellets.has(k)) kind = 'pellet';
        else if (doorTiles.has(k)) kind = 'door';
        out.push(kind);
      }
    }
    return out;
  }, [pellets, powerPellets]);

  return (
    <div
      className={`${styles.maze} ${styles[`theme-${theme}`]}`}
      role={mini ? undefined : 'grid'}
      aria-label={mini ? undefined : label}
      style={{
        gridTemplateColumns: `repeat(${cols}, var(--cell))`,
        gridTemplateRows: `repeat(${rows}, var(--cell))`,
        background: spec.background,
        ['--wall-color' as string]: spec.wall,
        ['--wall-glow' as string]: spec.wallGlow,
        ['--pellet-color' as string]: spec.pellet,
        ['--power-color' as string]: spec.powerPellet,
        ['--power-glow' as string]: spec.powerGlow,
        ['--door-color' as string]: spec.door,
      }}
    >
      {cells.map((kind, i) => (
        <div key={i} className={`${styles.cell} ${styles[kind]}`} role={mini ? undefined : 'gridcell'}>
          {kind === 'pellet' && dental ? <span className={styles.pasteDot} data-testid="pacman-dot-paste" /> : null}
          {kind === 'power' && dental ? (
            <span className={styles.brush} data-testid="pacman-power-brush">
              <Toothbrush size="100%" />
            </span>
          ) : null}
          {kind === 'pellet' && !dental ? <span className={styles.dot} /> : null}
          {kind === 'power' && !dental ? <span className={styles.powerDot} /> : null}
        </div>
      ))}
    </div>
  );
});
