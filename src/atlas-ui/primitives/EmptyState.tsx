import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center px-6 py-10 gap-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="text-divider mb-1">
        <Icon icon={icon} size={24} />
      </div>
      <div className="text-text font-medium text-sm">{title}</div>
      {description ? <div className="text-text-2 text-xs leading-relaxed">{description}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
