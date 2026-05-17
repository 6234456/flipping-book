import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type ChromeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  pressed?: boolean;
  leadingIcon?: LucideIcon;
  children?: ReactNode;
  size?: 'sm' | 'md';
};

const BASE =
  'inline-flex items-center gap-1.5 rounded-md font-medium leading-none transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/50';

const SIZE = {
  sm: 'h-6 px-2 text-[11px]',
  md: 'h-7 px-2.5 text-xs',
} as const;

const ICON_SIZE = { sm: 12, md: 14 } as const;

const OFF =
  'bg-white/[0.08] text-divider hover:bg-white/[0.14] hover:text-page';
const ON = 'bg-accent text-page hover:bg-accent-hover';

export function ChromeButton({
  pressed = false,
  leadingIcon: LeadingIcon,
  children,
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ChromeButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={[BASE, SIZE[size], pressed ? ON : OFF, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {LeadingIcon ? <Icon icon={LeadingIcon} size={ICON_SIZE[size]} /> : null}
      {children}
    </button>
  );
}
