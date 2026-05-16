import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { Icon } from './Icon';
import { Chip } from './Chip';
import { Button } from './Button';

export type DrawerHeaderProps = {
  icon: LucideIcon;
  title: string;
  count?: number;
  onClose: () => void;
};

export function DrawerHeader({ icon, title, count, onClose }: DrawerHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-text-2">
          <Icon icon={icon} size={18} />
        </span>
        <h2 className="text-text font-semibold text-sm truncate">{title}</h2>
        {count !== undefined ? <Chip>{count}</Chip> : null}
      </div>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        leadingIcon={X}
        onClick={onClose}
        aria-label={`关闭${title}`}
      />
    </div>
  );
}
