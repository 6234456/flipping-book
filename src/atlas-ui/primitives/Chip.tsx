import type { ReactNode } from 'react';

export type ChipProps = {
  variant?: 'neutral' | 'accent';
  children: ReactNode;
  className?: string;
};

const NEUTRAL = 'bg-surface-2 text-text-2';
const ACCENT = 'bg-accent-bg text-accent';

export function Chip({ variant = 'neutral', children, className }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums',
        variant === 'accent' ? ACCENT : NEUTRAL,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
