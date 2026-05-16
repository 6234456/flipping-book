import type { ReactNode } from 'react';
import { Info, AlertTriangle, ShieldAlert, BookOpen, Check, type LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type CalloutVariant = 'info' | 'warning' | 'risk' | 'legal' | 'evidence';

export type CalloutProps = {
  variant: CalloutVariant;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

const STYLES: Record<CalloutVariant, { wrap: string; title: string; icon: LucideIcon }> = {
  info: {
    wrap: 'bg-surface-2 border border-border text-text-2',
    title: 'text-text',
    icon: Info,
  },
  warning: {
    wrap: 'bg-accent-bg-faint border border-accent-bg-2 text-accent-strong',
    title: 'text-accent-strong',
    icon: AlertTriangle,
  },
  risk: {
    wrap: 'bg-chrome text-divider border-l-[3px] border-l-accent-2',
    title: 'text-page',
    icon: ShieldAlert,
  },
  legal: {
    wrap: 'bg-surface-2 border border-border border-l-[3px] border-l-chrome text-text-2',
    title: 'text-text',
    icon: BookOpen,
  },
  evidence: {
    wrap: 'bg-page border border-accent-bg-2 border-l-[3px] border-l-accent text-text-2',
    title: 'text-accent',
    icon: Check,
  },
};

export function Callout({ variant, title, children, className }: CalloutProps) {
  const s = STYLES[variant];
  return (
    <div
      data-callout-variant={variant}
      className={['flex gap-2.5 rounded-md px-3.5 py-3 text-[13px] leading-relaxed', s.wrap, className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={`shrink-0 mt-0.5 ${s.title}`}>
        <Icon icon={s.icon} size={16} />
      </span>
      <div className="min-w-0">
        {title ? <div className={`font-semibold mb-0.5 ${s.title}`}>{title}</div> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
