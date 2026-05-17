import { MessageSquare, FileText, List, Plus, PanelRightClose } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RailTab } from '../../atlas-core/reader/useRailState';
import { Button, Chip, Icon } from '../primitives';

export type RailHeaderProps = {
  activeTab: RailTab;
  commentCount: number;
  noteCount: number;
  onTabChange: (tab: RailTab) => void;
  onPlusClick: () => void;
  onCollapse: () => void;
};

const TABS: ReadonlyArray<{ id: RailTab; label: string; icon: LucideIcon }> = [
  { id: 'comments', label: '评论', icon: MessageSquare },
  { id: 'notes', label: '笔记', icon: FileText },
  { id: 'toc', label: '目录', icon: List },
];

export function RailHeader({
  activeTab,
  commentCount,
  noteCount,
  onTabChange,
  onPlusClick,
  onCollapse,
}: RailHeaderProps) {
  return (
    <div className="flex items-center border-b border-border h-10 shrink-0">
      <div role="tablist" className="flex h-full">
        {TABS.map(({ id, label, icon }) => {
          const active = id === activeTab;
          const badge = id === 'comments' ? commentCount : id === 'notes' ? noteCount : null;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={[
                'inline-flex items-center gap-1.5 px-3 text-[12px] font-medium transition-colors border-b-2 -mb-px',
                active
                  ? 'text-accent border-accent'
                  : 'text-text-2 border-transparent hover:text-text',
              ].join(' ')}
            >
              <Icon icon={icon} size={14} />
              {label}
              {badge != null && badge > 0 ? (
                <Chip variant={active ? 'accent' : 'neutral'}>{badge}</Chip>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-1 pr-2">
        {activeTab === 'comments' && (
          <Button
            variant="primary"
            size="sm"
            iconOnly
            leadingIcon={Plus}
            onClick={onPlusClick}
            aria-label="新增评论(快捷键 N)"
            title="新增评论 (N)"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={PanelRightClose}
          onClick={onCollapse}
          aria-label="收起侧栏"
          title="收起侧栏 (\)"
        />
      </div>
    </div>
  );
}
