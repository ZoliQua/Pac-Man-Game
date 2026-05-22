import { POINTS } from './constants';

/** Points awarded for eating a regular pellet. */
export function pelletPoints(): number {
  return POINTS.pellet;
}

/** Points awarded for eating a power pellet. */
export function powerPelletPoints(): number {
  return POINTS.power;
}

/**
 * Points awarded for eating the Nth ghost during a frightened window.
 * `chainIndex` is 0-based (first ghost eaten = index 0 → 200 pts).
 * Clamps to the last entry if chainIndex exceeds the table length.
 */
export function ghostChainPoints(chainIndex: number): number {
  const table = POINTS.ghostChain;
  const i = Math.min(chainIndex, table.length - 1);
  return table[i];
}
