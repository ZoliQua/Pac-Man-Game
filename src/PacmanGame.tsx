import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  formatClock,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type OverlayAction,
  type SessionEnvelope,
} from './arcade';
import { GameBoard } from './components/GameBoard';
import { IconThemeToggle } from './components/IconThemeToggle';
import { useGameLoop } from './hooks/useGameLoop';
import { useIconTheme } from './hooks/useIconTheme';
import { useKeyboardDirection } from './hooks/useKeyboardDirection';
import { TICK_MS } from './logic/constants';
import { advanceGame, arcadeStatus, createInitialState, settleTransition } from './logic/game';
import { fromSaved, isSavedPacman, toSaved, type SavedGame } from './logic/persist';
import type { Direction, GameState } from './logic/types';
import styles from './App.module.css';

/** Bump when SavedGame changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

const KEYS: [string, string][] = [
  ['← ↑ → ↓', 'Steer (or WASD)'],
  ['Space', 'Start / pause'],
  ['P Esc', 'Pause / resume'],
  ['R', 'Restart'],
];

/**
 * Seed state from a saved session: always shown paused. A save taken during
 * the brief death / level-clear pause is first resolved, since that timer only
 * runs while playing (if it was the last life, the run simply ends).
 */
function bootState(restored: SessionEnvelope<SavedGame> | null): GameState {
  if (!restored) return createInitialState();
  const settled = settleTransition(fromSaved(restored.data));
  return settled.status === 'gameOver' ? settled : { ...settled, status: 'paused' };
}

function newRun(direction?: Direction): GameState {
  const s = createInitialState({ status: 'running' });
  return direction ? { ...s, pacman: { ...s.pacman, dir: direction, nextDir: direction } } : s;
}

export function PacmanGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const restored = useRestoredSession<SavedGame>('pacman', SESSION_SCHEMA, isSavedPacman);
  const [boot] = useState(() => bootState(restored));
  const [state, setState] = useState<GameState>(boot);
  const [runId, setRunId] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(boot.status === 'paused');
  const { theme, setTheme } = useIconTheme();

  const status = arcadeStatus(state.status);
  const seconds = useRunTimer(status === 'running', runId, runId === 0 ? (restored?.seconds ?? 0) : 0);

  // Levels repeat forever, so a run can only end by losing the last life.
  const stats = useArcadeRun({
    gameId: 'pacman',
    status,
    score: state.score,
    seconds,
    runKey: runId,
    outcome: 'over',
    props,
  });

  const inProgress = status === 'running' || status === 'paused';
  const saveData = useMemo(() => toSaved(state), [state]);
  const savedAt = useSessionAutosave({
    gameId: 'pacman',
    schema: SESSION_SCHEMA,
    enabled: inProgress,
    discard: status === 'gameOver',
    data: saveData,
    seconds,
    score: state.score,
  });

  // The loop also runs during the brief `dying` / `levelClear` pauses so their
  // transition timer resolves; it is off in idle / paused / gameOver.
  const tick = useCallback(() => setState((prev) => advanceGame(prev)), []);
  useGameLoop(status === 'running', TICK_MS, tick);

  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  const startNewRun = useCallback((direction?: Direction) => {
    setWelcomeBack(false);
    setRunId((id) => id + 1);
    setState(newRun(direction));
  }, []);

  // Pause toggles only between running and paused — never during the `dying` /
  // `levelClear` pauses (freezing them would wedge the transition timer).
  const togglePause = useCallback(() => {
    setWelcomeBack(false);
    setState((prev) => {
      if (prev.status === 'running') return { ...prev, status: 'paused' };
      if (prev.status === 'paused') return { ...prev, status: 'running' };
      return prev;
    });
  }, []);

  const primary = useCallback(() => {
    const s = statusRef.current;
    if (s === 'idle' || s === 'gameOver') startNewRun();
    else togglePause();
  }, [startNewRun, togglePause]);

  const restart = useCallback(() => startNewRun(), [startNewRun]);

  const discardSave = useCallback(() => {
    clearSession('pacman');
    setWelcomeBack(false);
    setState(createInitialState());
    setRunId((id) => id + 1);
  }, []);

  // A direction key while idle starts the run with that heading; while running
  // it buffers the turn (applied by the logic at the next legal tile).
  const handleDirection = useCallback(
    (direction: Direction) => {
      if (statusRef.current === 'idle') {
        startNewRun(direction);
        return;
      }
      setState((prev) =>
        prev.status === 'running' ? { ...prev, pacman: { ...prev.pacman, nextDir: direction } } : prev,
      );
    },
    [startNewRun],
  );

  useKeyboardDirection({
    onDirection: handleDirection,
    onPrimary: primary,
    onTogglePause: togglePause,
    onRestart: restart,
  });

  const best = Math.max(stats.best, state.score);
  const newBest = state.score > 0 && state.score > stats.bestBeforeRun;
  const transition = state.status === 'dying' || state.status === 'levelClear';

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (state.status === 'idle') {
    overlay = {
      title: 'Pac-Man',
      message:
        'Eat every dot and dodge the ghosts. Power pellets turn the tables — ghosts eaten in a row score 200, 400, 800, 1600.',
      actions: [{ label: 'Start', onClick: restart, primary: true, kbd: 'Space' }],
    };
  } else if (state.status === 'paused') {
    overlay = welcomeBack
      ? {
          title: 'Welcome back',
          message: `Your saved run was restored — score ${state.score}, level ${state.level}, ${formatClock(seconds)} played.`,
          actions: [
            { label: 'Continue', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New game', onClick: restart, kbd: 'R' },
          ],
        }
      : {
          title: 'Paused',
          message: 'Your run is autosaved — you can close the tab and continue later.',
          actions: [
            { label: 'Resume', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'Restart', onClick: restart, kbd: 'R' },
          ],
        };
  } else if (state.status === 'levelClear') {
    overlay = { title: `Level ${state.level} cleared!`, message: `Score ${state.score}`, actions: [] };
  } else if (state.status === 'gameOver') {
    overlay = {
      title: 'Game over',
      message: `Score ${state.score} · Level ${state.level} · Best ${best}${newBest ? ' — new best!' : ''}`,
      actions: [{ label: 'Play again', onClick: restart, primary: true, kbd: 'R' }],
    };
  }

  const statusLabel =
    state.status === 'dying' ? 'Caught!' : state.status === 'levelClear' ? 'Level clear!' : undefined;

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-pacman)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">Pac-Man</h1>
            <p className="arc-game__sub">Gobble the dots — and the ghosts, when they turn blue.</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={statusLabel}
        items={[
          { label: 'Score', value: state.score },
          { label: 'Best', value: best, highlight: newBest },
          { label: 'Lives', value: state.lives },
          { label: 'Level', value: state.level },
          { label: 'Time', value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <div className={`arc-game__board ${styles.boardWrap}`}>
          <GameBoard state={state} theme={theme} />
          {overlay && <GameOverlay {...overlay} />}
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">Game</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={primary} disabled={transition}>
                {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
              </button>
              <button type="button" className="arc-btn" onClick={restart} disabled={state.status === 'idle'}>
                Restart
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={inProgress ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Settings</h2>
            <IconThemeToggle theme={theme} onChange={setTheme} />
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Keys</h2>
            <KeyHelp rows={KEYS} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default PacmanGame;
