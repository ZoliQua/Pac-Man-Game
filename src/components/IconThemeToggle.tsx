import type { IconTheme } from '../logic/types';
import styles from './IconThemeToggle.module.css';

type Props = {
  theme: IconTheme;
  onChange: (theme: IconTheme) => void;
};

/**
 * Switches the icon set between `normal` (classic arcade) and `fog` (muted,
 * spooky reskin). Cosmetic only — it can be flipped at any time, including
 * mid-game, without resetting the board.
 */
export function IconThemeToggle({ theme, onChange }: Props) {
  const isFog = theme === 'fog';
  return (
    <label className={styles.wrap}>
      <span className={styles.label}>Icon theme</span>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={isFog}
        onChange={(event) => onChange(event.target.checked ? 'fog' : 'normal')}
        aria-label="Switch icon theme"
      />
      <span className={styles.state} aria-live="polite">
        {isFog ? 'Fog' : 'Normal'}
      </span>
    </label>
  );
}
