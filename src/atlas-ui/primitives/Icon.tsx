import type { LucideIcon } from 'lucide-react';

export type IconSize = 14 | 16 | 18 | 20 | 24;

export type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  'aria-hidden'?: boolean;
};

export function Icon({ icon: LucideIconComp, size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <LucideIconComp
      width={size}
      height={size}
      strokeWidth={2}
      className={className}
      aria-hidden={ariaHidden ? true : undefined}
    />
  );
}
