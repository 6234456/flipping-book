import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger-default'
  | 'danger-confirm';

export type ButtonSize = 'sm' | 'md';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  iconOnly?: boolean;
  children?: ReactNode;
};

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium leading-none transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3.5 text-[13px]',
};

const SIZE_ICON_ONLY: Record<ButtonSize, string> = {
  sm: 'h-7 w-7 px-0',
  md: 'h-8 w-8 px-0',
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-page hover:bg-accent-hover',
  secondary:
    'bg-page text-text border border-border hover:bg-surface-2 hover:border-divider',
  ghost: 'bg-transparent text-text-2 hover:bg-surface-2 hover:text-text',
  'danger-default':
    'bg-page text-text-2 border border-border hover:bg-surface-2 hover:text-text hover:border-divider',
  'danger-confirm': 'bg-chrome text-page hover:bg-chrome-2 border border-chrome',
};

const ICON_SIZE: Record<ButtonSize, 14 | 16> = { sm: 14, md: 16 };

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  iconOnly,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconSize = ICON_SIZE[size];
  return (
    <button
      type={type}
      className={[BASE, iconOnly ? SIZE_ICON_ONLY[size] : SIZE[size], VARIANT[variant], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {leadingIcon ? <Icon icon={leadingIcon} size={iconSize} /> : null}
      {!iconOnly ? children : null}
      {trailingIcon ? <Icon icon={trailingIcon} size={iconSize} /> : null}
    </button>
  );
}
