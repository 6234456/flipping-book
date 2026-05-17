import { MessageSquare, FileText, List } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '../primitives';
import type { RailTab } from '../../atlas-core/reader/useRailState';

export type SlimRailProps = {
  badges: Record<RailTab, number>;
  activeTab: RailTab | null;
  onExpand: (toTab: RailTab) => void;
};

const ITEMS: ReadonlyArray<{ id: RailTab; label: string; icon: LucideIcon }> = [
  { id: 'comments', label: '评论', icon: MessageSquare },
  { id: 'notes', label: '笔记', icon: FileText },
  { id: 'toc', label: '目录', icon: List },
];

export function SlimRail({ badges, activeTab, onExpand }: SlimRailProps) {
  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label="侧栏"
      className="w-9 bg-page border-l border-border flex flex-col items-center py-2 gap-1 shrink-0"
    >
      {ITEMS.map(({ id, label, icon }) => {
        const isActive = activeTab === id;
        const count = badges[id];
        return (
          <button
            key={id}
            type="button"
            data-slim-active={isActive ? 'true' : 'false'}
            onClick={() => onExpand(id)}
            aria-label={`打开${label}`}
            title={`打开${label}`}
            className={[
              'relative w-7 h-7 rounded-md flex items-center justify-center transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40',
              isActive
                ? 'bg-accent-bg text-accent'
                : 'text-text-2 hover:bg-surface-2 hover:text-text',
            ].join(' ')}
          >
            <Icon icon={icon} size={14} />
            {count > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-accent text-page text-[9px] font-semibold tabular-nums rounded-full flex items-center justify-center px-[3px]">
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
