import type { GhostName, Vec } from './types';
import { key } from './grid';

/**
 * Classic-inspired Pac-Man maze: 28 columns x 31 rows.
 *
 * Character legend (documented contract for the parser):
 *   '#'  wall
 *   '.'  pellet
 *   'o'  power pellet (exactly 4, one per corner region)
 *   ' '  empty path (walkable, no pellet)
 *   '-'  ghost-house door (walkable by ghosts; counts as a path tile for
 *        connectivity, but is rendered as a door bar)
 *   'P'  Pac-Man spawn (walkable path tile)
 *   'b'  Blinky ghost spawn  (walkable path tile, OUTSIDE the house, just above
 *        the door — Blinky leaves immediately in the classic game)
 *   'p'  Pinky  ghost spawn  (walkable path tile, inside the ghost-house chamber)
 *   'n'  Inky   ghost spawn  (walkable path tile, inside the ghost-house chamber)
 *   'c'  Clyde  ghost spawn  (walkable path tile, inside the ghost-house chamber)
 *
 * Lowercase b/p/n/c were chosen for the four ghost spawns so they never clash
 * with the pellet char '.' or the power-pellet char 'o' (uppercase B/I/N/C would
 * be readable but the lowercase set keeps the layout visually quiet).
 *
 * The layout is left-right symmetric, fully connected, has a central ghost
 * house with a door, a horizontal tunnel row (row 14, open at both edges), and
 * 4 power pellets in the corner regions. `validateMaze` is run at module load
 * as a safety net (flood-fill connectivity + power-pellet / ghost-spawn counts).
 */
export const MAZE: string[] = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '######.##### ## #####.######',
  '######.##    b     ##.######', // row 11 — Blinky spawn / HOUSE_EXIT (x=13,y=11)
  '######.## ###--### ##.######', // row 12 — ghost-house door ('-') / HOUSE_DOOR_ROW=12
  '######.## # p n c# ##.######', // row 13 — ghost-house interior spawns
  '          #      #          ',
  '######.## #      # ##.######',
  '######.## ######## ##.######',
  '######.##          ##.######',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......P .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '#..........................#',
  '############################',
];

export type ParsedMaze = {
  walls: Set<string>;
  pellets: Set<string>;
  powerPellets: Set<string>;
  pacSpawn: Vec;
  ghostSpawns: Record<GhostName, Vec>;
  // Refinement of the plan's parse contract: the ghost-house door tiles ('-')
  // and the house-chamber interior tiles are tracked separately. `doorTiles`
  // holds ONLY the door ('-') tiles (rendered as a door bar). `houseTiles`
  // holds the house-chamber interior — the in-house floor and the ghost-spawn
  // tiles that sit inside the chamber — which render as plain floor.
  doorTiles: Set<string>;
  houseTiles: Set<string>;
  tunnelRow: number;
  cols: number;
  rows: number;
};

const GHOST_SPAWN_CHARS: Record<string, GhostName> = {
  // Letters were picked to avoid clashing with pellet ('.') / power ('o') chars:
  //   b -> blinky, p -> pinky, c -> clyde all match the ghost initial.
  //   n -> inky is the odd one out: 'i' is too easy to confuse with the
  //   pellet/wall noise and reads poorly in a monospace grid, so the second
  //   letter of "inky" ('n') is used instead.
  b: 'blinky',
  p: 'pinky',
  n: 'inky',
  c: 'clyde',
};

export function parseMaze(maze: string[] = MAZE): ParsedMaze {
  const rows = maze.length;
  const cols = maze[0]?.length ?? 0;

  // Guard: every row must be exactly `cols` wide. A short row would otherwise
  // be silently parsed as trailing empty tiles, corrupting walls/connectivity.
  for (let y = 0; y < rows; y++) {
    if (maze[y].length !== cols) {
      throw new Error(
        `parseMaze: row ${y} has length ${maze[y].length}, expected ${cols}`,
      );
    }
  }

  const walls = new Set<string>();
  const pellets = new Set<string>();
  const powerPellets = new Set<string>();
  const doorTiles = new Set<string>();
  const houseTiles = new Set<string>();
  let pacSpawn: Vec | null = null;
  const ghostSpawns: Partial<Record<GhostName, Vec>> = {};
  let tunnelRow = -1;

  for (let y = 0; y < rows; y++) {
    const line = maze[y];
    for (let x = 0; x < cols; x++) {
      const ch = line[x];
      const v: Vec = { x, y };
      switch (ch) {
        case '#':
          walls.add(key(v));
          break;
        case '.':
          pellets.add(key(v));
          break;
        case 'o':
          powerPellets.add(key(v));
          break;
        case '-':
          doorTiles.add(key(v));
          break;
        case 'P':
          pacSpawn = v;
          break;
        case ' ':
          break;
        default: {
          const ghost = GHOST_SPAWN_CHARS[ch];
          if (ghost) {
            ghostSpawns[ghost] = v;
            // Spawns that sit inside the chamber count as house-interior tiles.
            // Blinky spawns outside the house (above the door); exclude it.
            if (ghost !== 'blinky') {
              houseTiles.add(key(v));
            }
          }
          break;
        }
      }
    }
  }

  // Tunnel row: a row whose left and right edge tiles are both non-wall.
  for (let y = 0; y < rows; y++) {
    const line = maze[y];
    if (line[0] !== '#' && line[cols - 1] !== '#') {
      tunnelRow = y;
      break;
    }
  }

  if (!pacSpawn) {
    throw new Error('parseMaze: no Pac-Man spawn (P) found in MAZE');
  }

  const completeGhostSpawns: Record<GhostName, Vec> = {
    blinky: ghostSpawns.blinky ?? { x: -1, y: -1 },
    pinky: ghostSpawns.pinky ?? { x: -1, y: -1 },
    inky: ghostSpawns.inky ?? { x: -1, y: -1 },
    clyde: ghostSpawns.clyde ?? { x: -1, y: -1 },
  };

  return {
    walls,
    pellets,
    powerPellets,
    pacSpawn,
    ghostSpawns: completeGhostSpawns,
    doorTiles,
    houseTiles,
    tunnelRow,
    cols,
    rows,
  };
}

/**
 * Flood-fill from the Pac-Man spawn across every non-wall tile and assert that
 * every pellet, power pellet, ghost spawn, door tile, and house-interior tile
 * is reachable. Also asserts there are exactly 4 power pellets, exactly 4 ghost
 * spawns, and that a tunnel row was found. Throws on any violation so a
 * malformed maze fails fast at module load.
 */
export function validateMaze(parsed: ParsedMaze): void {
  const {
    walls,
    pellets,
    powerPellets,
    pacSpawn,
    ghostSpawns,
    doorTiles,
    houseTiles,
    tunnelRow,
    cols,
    rows,
  } = parsed;

  if (powerPellets.size !== 4) {
    throw new Error(
      `validateMaze: expected exactly 4 power pellets, found ${powerPellets.size}`,
    );
  }

  const ghostSpawnVecs = Object.values(ghostSpawns).filter(
    (v) => v.x >= 0 && v.y >= 0,
  );
  if (ghostSpawnVecs.length !== 4) {
    throw new Error(
      `validateMaze: expected exactly 4 ghost spawns, found ${ghostSpawnVecs.length}`,
    );
  }

  if (tunnelRow === -1) {
    throw new Error(
      'validateMaze: no tunnel row found (no row with both edge tiles walkable)',
    );
  }

  // Flood-fill over all non-wall tiles starting from the spawn.
  const reachable = new Set<string>();
  const stack: Vec[] = [pacSpawn];
  reachable.add(key(pacSpawn));
  const steps = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const s of steps) {
      const nx = cur.x + s.x;
      const ny = cur.y + s.y;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const nk = `${nx},${ny}`;
      if (walls.has(nk) || reachable.has(nk)) continue;
      reachable.add(nk);
      stack.push({ x: nx, y: ny });
    }
  }

  const unreachable: string[] = [];
  for (const k of pellets) {
    if (!reachable.has(k)) unreachable.push(`pellet@${k}`);
  }
  for (const k of powerPellets) {
    if (!reachable.has(k)) unreachable.push(`power@${k}`);
  }
  for (const v of ghostSpawnVecs) {
    if (!reachable.has(key(v))) unreachable.push(`ghost@${key(v)}`);
  }
  for (const k of doorTiles) {
    if (!reachable.has(k)) unreachable.push(`door@${k}`);
  }
  for (const k of houseTiles) {
    if (!reachable.has(k)) unreachable.push(`house@${k}`);
  }

  if (unreachable.length > 0) {
    throw new Error(
      `validateMaze: ${unreachable.length} tile(s) unreachable from Pac-Man spawn: ${unreachable.join(', ')}`,
    );
  }
}

// Validate once at module load so a malformed maze fails fast.
export const PARSED_MAZE: ParsedMaze = parseMaze();
validateMaze(PARSED_MAZE);

/**
 * Total edible dots at level start (regular pellets + power pellets). Used to
 * derive "pellets eaten" from the live state for ghost house-exit gates.
 */
export const INITIAL_PELLET_TOTAL: number =
  PARSED_MAZE.pellets.size + PARSED_MAZE.powerPellets.size;
