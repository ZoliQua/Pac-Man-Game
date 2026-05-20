import type { Direction, Vec } from './types';

/** Encode a tile coordinate as a "x,y" string key. */
export function key(v: Vec): string {
  return `${v.x},${v.y}`;
}

/** Decode a "x,y" string key back into a Vec. */
export function parseKey(s: string): Vec {
  const comma = s.indexOf(',');
  return {
    x: Number(s.slice(0, comma)),
    y: Number(s.slice(comma + 1)),
  };
}

/** True if the tile lies within the grid bounds. */
export function inBounds(v: Vec, cols: number, rows: number): boolean {
  return v.x >= 0 && v.x < cols && v.y >= 0 && v.y < rows;
}

/** True if the tile is a wall. */
export function isWall(v: Vec, walls: Set<string>): boolean {
  return walls.has(key(v));
}

/** The neighbouring tile one step in the given direction. */
export function neighbour(pos: Vec, dir: Direction): Vec {
  switch (dir) {
    case 'UP':
      return { x: pos.x, y: pos.y - 1 };
    case 'DOWN':
      return { x: pos.x, y: pos.y + 1 };
    case 'LEFT':
      return { x: pos.x - 1, y: pos.y };
    case 'RIGHT':
      return { x: pos.x + 1, y: pos.y };
    case 'NONE':
      return { x: pos.x, y: pos.y };
  }
}

const MOVE_DIRS: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];

/**
 * The legal (non-wall, in-bounds) directions from a tile. Tunnel edges are not
 * special-cased here; tunnel wrap is handled separately by `tunnelWrap`.
 * Ordered up > left > down > right to match the classic ghost tie-break.
 */
export function legalDirs(
  pos: Vec,
  walls: Set<string>,
  cols: number,
  rows: number,
): Direction[] {
  return MOVE_DIRS.filter((dir) => {
    const next = neighbour(pos, dir);
    return inBounds(next, cols, rows) && !isWall(next, walls);
  });
}

/**
 * Wrap a tile around the horizontal tunnel. Stepping off the left edge of the
 * tunnel row reappears on the right edge and vice versa. Tiles on other rows or
 * within bounds are returned unchanged.
 */
export function tunnelWrap(v: Vec, tunnelRow: number, cols: number): Vec {
  if (v.y !== tunnelRow) return v;
  if (v.x < 0) return { x: cols - 1, y: v.y };
  if (v.x >= cols) return { x: 0, y: v.y };
  return v;
}
