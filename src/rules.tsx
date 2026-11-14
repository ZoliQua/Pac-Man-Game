import type { ReactNode } from 'react';
import {
  formatNumber,
  Germ,
  Toothbrush,
  useDental,
  useIsTouch,
  useKitMessages,
  useLang,
  useMessages,
  type RulesSection,
} from './arcade';
import { HollowGerm } from './components/Entities';
import { MESSAGES, TOUCH_ROWS } from './i18n';
import { POINTS, START_LIVES, THEMES } from './logic/constants';

function isIos(): boolean {
  return typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);
}

// Classic ghost silhouette in a 40 × 40 box: dome on top, three-point skirt below.
const GHOST = 'M0 40V18a20 20 0 0 1 40 0v22l-6.7-6-6.6 6-6.7-6-6.7 6-6.6-6z';

function Arrow({ x }: { x: number }) {
  return (
    <path
      d={`M${x} 46h26m-8-7 8 7-8 7`}
      fill="none"
      stroke="#c3c9d6"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/**
 * Power pellet → ghost → frightened ghost. The frightened ghost is told apart by its shape
 * (no eyes; in dental mode a hollow dashed germ) and by its label, never by colour alone.
 */
export function PowerDiagram() {
  const t = useMessages(MESSAGES);
  const [dental] = useDental();
  const spec = THEMES[dental ? 'dental' : 'normal'];
  const label = (x: number, text: string, bold = false) => (
    <text x={x} y="108" textAnchor="middle" fontSize="12" fontWeight={bold ? 700 : 400} fill="currentColor">
      {text}
    </text>
  );
  return (
    <svg
      viewBox="-15 0 360 116"
      width="360"
      role="img"
      aria-label={t('rulesDiagramAria')}
      data-dental={dental}
      style={{ display: 'block', margin: '4px auto 10px' }}
    >
      <rect x="4" y="12" width="322" height="70" rx="10" fill={spec.background} />
      {/* Power pellet */}
      {dental ? (
        <g transform="translate(37 24)">
          <Toothbrush size={44} />
        </g>
      ) : (
        <circle cx="59" cy="46" r="11" fill={spec.powerPellet} />
      )}
      <Arrow x={96} />
      {/* Ghost on patrol */}
      {dental ? (
        <g transform="translate(143 24)">
          <Germ size={44} fill={spec.ghosts.blinky} />
        </g>
      ) : (
        <g transform="translate(145 26)">
          <path d={GHOST} fill={spec.ghosts.blinky} />
          <circle cx="13" cy="17" r="5.5" fill={spec.eye} />
          <circle cx="27" cy="17" r="5.5" fill={spec.eye} />
          <circle cx="15" cy="17" r="2.6" fill={spec.pupil} />
          <circle cx="29" cy="17" r="2.6" fill={spec.pupil} />
        </g>
      )}
      <Arrow x={204} />
      {/* Frightened: no eyes / hollow germ */}
      {dental ? (
        <g transform="translate(249 24)">
          <svg width="44" height="44" viewBox="0 0 100 100" aria-hidden="true">
            <HollowGerm color={spec.frightened} />
          </svg>
        </g>
      ) : (
        <g transform="translate(251 26)">
          <path d={GHOST} fill={spec.frightened} />
        </g>
      )}
      {label(59, t('rulesDiagramPellet'))}
      {label(165, t('rulesDiagramGhost'))}
      {label(271, t('rulesDiagramFrightened'), true)}
    </svg>
  );
}

/** The Rules dialog content for Pac-Man; every number comes from the scoring constants. */
// The plan keeps the sections hook next to its diagram in one file; fast refresh is a dev nicety only.
// eslint-disable-next-line react-refresh/only-export-components
export function useRulesSections(): RulesSection[] {
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const num = (n: number) => formatNumber(n, lang);
  const chain = POINTS.ghostChain.map(num).join(' → ');
  const list = (items: ReactNode[]) => (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );

  return [
    { id: 'goal', body: <p>{t('rulesGoalText')}</p> },
    {
      id: 'play',
      body: (
        <>
          <p>{touch ? t('rulesPlayTouch') : t('rulesPlayKeys')}</p>
          <p>{t('rulesTurnQueue')}</p>
        </>
      ),
    },
    {
      id: 'rules',
      body: (
        <>
          {list([t('rulesLives', { lives: num(START_LIVES) }), t('rulesGhosts'), t('rulesPower'), t('rulesLevelClear')])}
          <PowerDiagram />
        </>
      ),
    },
    {
      id: 'scoring',
      body: list([
        t('rulesScorePellet', { points: num(POINTS.pellet) }),
        t('rulesScorePower', { points: num(POINTS.power) }),
        t('rulesScoreChain', { chain }),
      ]),
    },
    { id: 'dental', body: <p>{t('rulesDentalText')}</p> },
    {
      id: 'mobile',
      body: (
        <>
          {list([
            ...TOUCH_ROWS.map(([gesture, action]) => (
              <>
                <strong>{t(gesture)}</strong> – {t(action)}
              </>
            )),
            <>
              <strong>{k('fullscreen')}</strong> – {t('touchFullscreenAction')}
            </>,
          ])}
          {isIos() && <p>{k('iosHomeScreenTip')}</p>}
        </>
      ),
    },
  ];
}
