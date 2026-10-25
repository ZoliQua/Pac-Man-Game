import { useCallback, useEffect, useState } from 'react';
import type { ArcadeDemoProps } from '../arcade';
import { GameBoard } from '../components/GameBoard';
import { useGameLoop } from '../hooks/useGameLoop';
import { demoStep } from '../logic/autopilot';
import { createInitialState } from '../logic/game';
import type { GameState } from '../logic/types';

const DEMO_TICK_MS = 140;
const RESTART_MS = 1200;

const freshDemo = (): GameState => createInitialState({ status: 'running' });

/**
 * Attract mode for the portal landing page: the real Pac-Man engine steered by
 * a BFS autopilot, on a compact maze. No keyboard, no stats, no saves.
 */
export function PacmanDemo({ active = true }: ArcadeDemoProps) {
  const [state, setState] = useState(freshDemo);

  const tick = useCallback(() => setState(demoStep), []);
  useGameLoop(active && state.status !== 'gameOver', DEMO_TICK_MS, tick);

  useEffect(() => {
    if (!active || state.status !== 'gameOver') return;
    const id = window.setTimeout(() => setState(freshDemo), RESTART_MS);
    return () => window.clearTimeout(id);
  }, [active, state.status]);

  return (
    <div className="arc-demo">
      <GameBoard state={state} theme="normal" variant="mini" />
    </div>
  );
}

export default PacmanDemo;
