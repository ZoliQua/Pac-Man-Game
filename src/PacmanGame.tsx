import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  formatClock,
  formatNumber,
  gameName,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useDental,
  useKitMessages,
  useLang,
  useMessages,
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
import { MESSAGES, type PacmanMessageKey } from './i18n';
import { TICK_MS } from './logic/constants';
import { advanceGame, arcadeStatus, createInitialState, settleTransition } from './logic/game';
import { fromSaved, isSavedPacman, toSaved, type SavedGame } from './logic/persist';
import type { Direction, GameState, IconTheme } from './logic/types';
import styles from './App.module.css';

/** Bump when SavedGame changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

/** Key-help rows; `null` keys stand for the translated name of the Space bar. */
const KEYS: [string | null, PacmanMessageKey][] = [
  ['← ↑ → ↓', 'keySteer'],
  [null, 'keyStartPause'],
  ['P Esc', 'keyPauseResume'],
  ['R', 'keyRestart'],
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
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const num = (n: number) => formatNumber(n, lang);
  const restored = useRestoredSession<SavedGame>('pacman', SESSION_SCHEMA, isSavedPacman);
  const [boot] = useState(() => bootState(restored));
  const [state, setState] = useState<GameState>(boot);
  const [runId, setRunId] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(boot.status === 'paused');
  const { theme: baseTheme, setTheme: setBaseTheme } = useIconTheme();
  // The Dental option is the shared arcade dental mode; Normal / Fog stay the per-game choice
  // and come back when dental mode is switched off anywhere.
  const [dental, setDental] = useDental();
  const theme: IconTheme = dental ? 'dental' : baseTheme;
  const setTheme = useCallback(
    (next: IconTheme) => {
      if (next === 'dental') {
        setDental(true);
        return;
      }
      setBaseTheme(next);
      setDental(false);
    },
    [setBaseTheme, setDental],
  );

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
      title: gameName('pacman', lang),
      message: t('idleMessage'),
      actions: [{ label: k('start'), onClick: restart, primary: true, kbd: t('keySpace') }],
    };
  } else if (state.status === 'paused') {
    overlay = welcomeBack
      ? {
          title: k('welcomeBack'),
          message: t('welcomeMessage', { score: num(state.score), level: state.level, time: formatClock(seconds) }),
          actions: [
            { label: t('continue'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: k('newGame'), onClick: restart, kbd: 'R' },
          ],
        }
      : {
          title: k('paused'),
          message: t('pausedMessage'),
          actions: [
            { label: k('resume'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: k('restart'), onClick: restart, kbd: 'R' },
          ],
        };
  } else if (state.status === 'levelClear') {
    overlay = {
      title: t('levelCleared', { level: state.level }),
      message: t('levelClearedMessage', { score: num(state.score) }),
      actions: [],
    };
  } else if (state.status === 'gameOver') {
    overlay = {
      title: k('gameOver'),
      message:
        t('gameOverMessage', { score: num(state.score), level: state.level, best: num(best) }) +
        (newBest ? t('newBestSuffix') : ''),
      actions: [{ label: t('playAgain'), onClick: restart, primary: true, kbd: 'R' }],
    };
  }

  const statusLabel =
    state.status === 'dying' ? t('statusCaught') : state.status === 'levelClear' ? t('statusLevelClear') : undefined;

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-pacman)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{gameName('pacman', lang)}</h1>
            <p className="arc-game__sub">{t('subtitle')}</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={statusLabel}
        items={[
          { label: k('score'), value: num(state.score) },
          { label: k('best'), value: num(best), highlight: newBest },
          { label: t('lives'), value: state.lives },
          { label: k('level'), value: state.level },
          { label: k('time'), value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <div className={`arc-game__board ${styles.boardWrap}`}>
          <GameBoard state={state} theme={theme} label={t('maze')} />
          {overlay && <GameOverlay {...overlay} />}
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelGame')}</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={primary} disabled={transition}>
                {status === 'running' ? k('pause') : status === 'paused' ? k('resume') : k('start')}
              </button>
              <button type="button" className="arc-btn" onClick={restart} disabled={state.status === 'idle'}>
                {k('restart')}
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={inProgress ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelSettings')}</h2>
            <IconThemeToggle
              theme={theme}
              onChange={setTheme}
              label={t('iconTheme')}
              optionLabels={{ normal: t('themeNormal'), fog: t('themeFog'), dental: t('themeDental') }}
            />
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelKeys')}</h2>
            <KeyHelp rows={KEYS.map(([keys, action]) => [keys ?? t('keySpace'), t(action)])} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default PacmanGame;
