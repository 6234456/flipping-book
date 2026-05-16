import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type ToggleProps = {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  leadingIcon: LucideIcon;
  children: ReactNode;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  className?: string;
};

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium leading-none transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40';

const SIZE = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3.5 text-[13px]',
} as const;

const ON = 'bg-accent text-page hover:bg-accent-hover';
const OFF = 'bg-page text-text-2 border border-border hover:bg-surface-2 hover:text-text';

export function Toggle({
  pressed,
  onPressedChange,
  leadingIcon,
  children,
  size = 'md',
  className,
  ...rest
}: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={[BASE, SIZE[size], pressed ? ON : OFF, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <Icon icon={leadingIcon} size={size === 'sm' ? 14 : 16} />
      {children}
    </button>
  );
}
