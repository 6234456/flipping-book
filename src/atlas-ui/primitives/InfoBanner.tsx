import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { Icon } from './Icon';

export type InfoBannerVariant = 'info' | 'accent';

export type InfoBannerProps = {
  message: ReactNode;
  icon?: LucideIcon;
  onDismiss?: () => void;
  variant?: InfoBannerVariant;
  className?: string;
};

const VARIANT_BG: Record<InfoBannerVariant, string> = {
  info: 'bg-surface-2 text-text-2 border-border',
  accent: 'bg-accent-bg-faint text-accent-strong border-accent-bg-2',
};

export function InfoBanner({
  message,
  icon,
  onDismiss,
  variant = 'info',
  className,
}: InfoBannerProps) {
  return (
    <div
      role="status"
      data-banner-variant={variant}
      className={[
        'flex items-center gap-2 px-3 h-8 border-b text-[12px] leading-none',
        VARIANT_BG[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? <Icon icon={icon} size={14} /> : null}
      <span className="flex-1">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="关闭通知"
          className="text-text-muted hover:text-text p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40"
        >
          <Icon icon={X} size={12} />
        </button>
      ) : null}
    </div>
  );
}
