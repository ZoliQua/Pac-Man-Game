import { useMemo } from 'react';
import { CELL_PX, THEMES } from '../logic/constants';
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
};

type CellKind = 'wall' | 'pellet' | 'power' | 'door' | 'empty';

// walls, doorTiles, cols, and rows come from the module-level PARSED_MAZE
// constant and never change — hoist them so the useMemo dep array only
// contains the live pellet sets that actually drive re-renders.
const { walls, doorTiles, cols, rows } = PARSED_MAZE;

export function Maze({ pellets, powerPellets, theme = 'normal' }: Props) {
  const spec = THEMES[theme];

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
      role="grid"
      aria-label="Pac-Man maze"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
        gridTemplateRows: `repeat(${rows}, ${CELL_PX}px)`,
        background: spec.background,
        ['--wall-color' as string]: spec.wall,
        ['--wall-glow' as string]: spec.wallGlow,
        ['--pellet-color' as string]: spec.pellet,
        ['--power-color' as string]: spec.powerPellet,
        ['--power-glow' as string]: spec.powerGlow,
        ['--door-color' as string]: spec.door,
      }}
    >
      {cells.map((kind, i) => {
        const x = i % cols;
        const y = Math.floor(i / cols);
        return (
          <div
            key={`${x}-${y}`}
            className={`${styles.cell} ${styles[kind]}`}
            role="gridcell"
          >
            {kind === 'pellet' ? <span className={styles.dot} /> : null}
            {kind === 'power' ? <span className={styles.powerDot} /> : null}
          </div>
        );
      })}
    </div>
  );
}
