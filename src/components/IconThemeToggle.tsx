import { useId } from 'react';
import type { IconTheme } from '../logic/types';

type Props = {
  theme: IconTheme;
  onChange: (theme: IconTheme) => void;
  /** Translated field label ("Icon theme"). */
  label: string;
  /** Translated name of each option ("Normal", "Fog"). */
  optionLabels: Record<IconTheme, string>;
};

const OPTIONS: readonly IconTheme[] = ['normal', 'fog'];

/**
 * Switches the icon set between `normal` (classic arcade) and `fog` (muted,
 * spooky reskin). Cosmetic only — it can be flipped at any time, including
 * mid-game, without resetting the board.
 */
export function IconThemeToggle({ theme, onChange, label, optionLabels }: Props) {
  const labelId = useId();
  return (
    <div className="arc-field">
      <span id={labelId}>{label}</span>
      <div className="arc-segmented" role="group" aria-labelledby={labelId}>
        {OPTIONS.map((value) => (
          <button key={value} type="button" aria-pressed={theme === value} onClick={() => onChange(value)}>
            {optionLabels[value]}
          </button>
        ))}
      </div>
    </div>
  );
}
