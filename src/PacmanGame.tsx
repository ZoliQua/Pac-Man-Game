import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  FinishButton,
  formatClock,
  formatNumber,
  FullscreenButton,
  gameName,
  GameOverlay,
  KeyHelp,
  RulesButton,
  SaveBadge,
  StatPanel,
  TouchHelp,
  TouchPad,
  useArcadeRun,
  useDental,
  useImmersive,
  useIsTouch,
  useKitMessages,
  useLang,
  useMessages,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  useSwipe,
  type ArcadeGameProps,
  type OverlayAction,
  type SessionEnvelope,
  type SwipeDir,
  type TouchPadButton,
} from './arcade';
import { GameBoard } from './components/GameBoard';
import { IconThemeToggle } from './components/IconThemeToggle';
import { useGameLoop } from './hooks/useGameLoop';
import { useIconTheme } from './hooks/useIconTheme';
import { useKeyboardDirection } from './hooks/useKeyboardDirection';
import { MESSAGES, TOUCH_ROWS, type PacmanMessageKey } from './i18n';
import { TICK_MS } from './logic/constants';
import { advanceGame, arcadeStatus, createInitialState, settleTransition } from './logic/game';
import { fromSaved, isSavedPacman, toSaved, type SavedGame } from './logic/persist';
import type { Direction, GameState, IconTheme } from './logic/types';
import { useRulesSections } from './rules';
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
const SWIPE_TO_DIRECTION: Record<SwipeDir, Direction> = { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT' };

const ARROW = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const PAD_ICONS = {
  up: ARROW('M12 19V5M5 12l7-7 7 7'),
  down: ARROW('M12 5v14M5 12l7 7 7-7'),
  left: ARROW('M19 12H5M12 5l-7 7 7 7'),
  right: ARROW('M5 12h14M12 5l7 7-7 7'),
  // Play triangle next to two pause bars: the button does both.
  playPause: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5l8 7-8 7z" />
      <rect x="14" y="5" width="3" height="14" rx="1" />
      <rect x="19" y="5" width="3" height="14" rx="1" />
    </svg>
  ),
};

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
  // Set by the Finish button: the run ended early and ranks the score shown at that moment.
  const [finishedEarly, setFinishedEarly] = useState(false);
  // While the Rules dialog or the Finish confirm is open the game (and its clock) holds still.
  const [rulesOpen, setRulesOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const hold = rulesOpen || finishOpen;
  const rootRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const immersive = useImmersive(rootRef);
  const sections = useRulesSections();
  const touch = useIsTouch();
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
  const seconds = useRunTimer(status === 'running' && !hold, runId, runId === 0 ? (restored?.seconds ?? 0) : 0);

  // Levels repeat forever, so a run can only end by losing the last life.
  const stats = useArcadeRun({
    gameId: 'pacman',
    status,
    score: state.score,
    seconds,
    runKey: runId,
    outcome: finishedEarly ? 'finished' : 'over',
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
  useGameLoop(status === 'running' && !hold, TICK_MS, tick);

  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  const startNewRun = useCallback((direction?: Direction) => {
    setWelcomeBack(false);
    setFinishedEarly(false);
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
    setFinishedEarly(false);
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

  // Escape also leaves the CSS full-screen mode (iPhone); there it only pauses, so leaving
  // full screen never resumes a paused run by accident.
  const pauseOnly = useCallback(() => {
    setWelcomeBack(false);
    setState((prev) => (prev.status === 'running' ? { ...prev, status: 'paused' } : prev));
  }, []);

  useKeyboardDirection({
    onDirection: handleDirection,
    onPrimary: primary,
    onTogglePause: togglePause,
    onEscape: immersive.active ? pauseOnly : undefined,
    onRestart: restart,
  });

  useSwipe(boardRef, (dir) => handleDirection(SWIPE_TO_DIRECTION[dir]));

  const onRulesOpenChange = useCallback(
    (open: boolean) => {
      setRulesOpen(open);
      if (open) pauseOnly();
    },
    [pauseOnly],
  );

  const finish = useCallback(() => {
    setFinishedEarly(true);
    setWelcomeBack(false);
    setState((prev) => (prev.status === 'idle' || prev.status === 'gameOver' ? prev : { ...prev, status: 'gameOver' }));
  }, []);

  const primaryLabel = status === 'running' ? k('pause') : status === 'paused' ? k('resume') : k('start');
  const padButtons: TouchPadButton[] = [
    { id: 'up', label: t('padUp'), icon: PAD_ICONS.up, onPress: () => handleDirection('UP') },
    { id: 'left', label: t('padLeft'), icon: PAD_ICONS.left, onPress: () => handleDirection('LEFT') },
    { id: 'right', label: t('padRight'), icon: PAD_ICONS.right, onPress: () => handleDirection('RIGHT') },
    { id: 'down', label: t('padDown'), icon: PAD_ICONS.down, onPress: () => handleDirection('DOWN') },
    { id: 'playPause', label: primaryLabel, icon: PAD_ICONS.playPause, onPress: primary },
  ];

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
      title: finishedEarly ? k('finishedEarly') : k('gameOver'),
      message:
        t('gameOverMessage', { score: num(state.score), level: state.level, best: num(best) }) +
        (newBest ? t('newBestSuffix') : ''),
      actions: [{ label: t('playAgain'), onClick: restart, primary: true, kbd: 'R' }],
    };
  }

  const statusLabel =
    state.status === 'dying' ? t('statusCaught') : state.status === 'levelClear' ? t('statusLevelClear') : undefined;

  return (
    <div ref={rootRef} className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-pacman)' } as CSSProperties}>
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

      <div className={styles.strip}>
        <RulesButton sections={sections} onOpenChange={onRulesOpenChange} hotkey={false} gameId="pacman" />
        <FinishButton
          score={state.score}
          visible={state.status !== 'idle' && state.status !== 'gameOver'}
          onFinish={finish}
          onOpenChange={setFinishOpen}
        />
        <FullscreenButton immersive={immersive} />
      </div>

      <div className={styles.layout}>
        <div className={styles.play}>
          <div ref={boardRef} className={`arc-game__board arc-board-touch ${styles.boardWrap}`}>
            <GameBoard state={state} theme={theme} label={t('maze')} />
            {overlay && <GameOverlay {...overlay} />}
          </div>
          <TouchPad buttons={padButtons} layout="dpad" />
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelGame')}</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={primary} disabled={transition}>
                {primaryLabel}
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
            <h2 className="arc-panel__title">{touch ? k('touchControls') : t('panelKeys')}</h2>
            <KeyHelp rows={KEYS.map(([keys, action]) => [keys ?? t('keySpace'), t(action)])} />
            <TouchHelp rows={TOUCH_ROWS.map(([gesture, action]) => [t(gesture), t(action)])} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default PacmanGame;
