import { useId } from 'react';
import type { IconTheme } from '../logic/types';

type Props = {
  theme: IconTheme;
  onChange: (theme: IconTheme) => void;
};

const OPTIONS: { value: IconTheme; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'fog', label: 'Fog' },
];

/**
 * Switches the icon set between `normal` (classic arcade) and `fog` (muted,
 * spooky reskin). Cosmetic only — it can be flipped at any time, including
 * mid-game, without resetting the board.
 */
export function IconThemeToggle({ theme, onChange }: Props) {
  const labelId = useId();
  return (
    <div className="arc-field">
      <span id={labelId}>Icon theme</span>
      <div className="arc-segmented" role="group" aria-labelledby={labelId}>
        {OPTIONS.map((o) => (
          <button key={o.value} type="button" aria-pressed={theme === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
