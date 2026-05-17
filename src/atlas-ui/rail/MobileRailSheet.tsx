import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { CommentThread } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import type { RailTab } from '../../atlas-core/reader/useRailState';
import { Button, MOTION } from '../primitives';
import { CommentsTab } from './tabs/CommentsTab';
import { NotesTab } from './tabs/NotesTab';
import { TocTab } from './tabs/TocTab';

export type MobileRailSheetProps = {
  registry: BookRegistry;
  threads: CommentThread[];
  noteIds: NoteId[];
  currentPageId: string | null;
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  tab: RailTab;
  onTabChange: (tab: RailTab) => void;
  onClose: () => void;
  onPlusClick: () => void;
  onNavigate: (pageId: string) => void;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
};

const TABS: { id: RailTab; label: string }[] = [
  { id: 'comments', label: '评论' },
  { id: 'notes', label: '笔记' },
  { id: 'toc', label: '目录' },
];

export function MobileRailSheet(props: MobileRailSheetProps) {
  const {
    tab,
    onTabChange,
    onClose,
    threads,
    noteIds,
    registry,
    currentPageId,
    selectedThreadId,
    highlightedThreadId,
    onNavigate,
    onPlusClick: _onPlusClick, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...threadHandlers
  } = props;

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label="侧栏内容"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={MOTION.drawerSpring}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.4 }}
      onDragEnd={(_e, info) => {
        if (info.offset.y > 120) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-[28%] z-40 bg-page rounded-t-xl shadow-[var(--shadow-3)] flex flex-col"
      style={{ touchAction: 'pan-y' }}
    >
      <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
        <div className="w-7 h-[3px] rounded bg-divider" />
      </div>
      <div role="tablist" className="flex items-center border-b border-border px-1">
        {TABS.map(({ id, label }) => {
          const active = id === tab;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={[
                'px-3 py-2 text-[12px] font-medium border-b-2 -mb-px',
                active ? 'text-accent border-accent' : 'text-text-2 border-transparent',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
        <Button
          className="ml-auto"
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={X}
          onClick={onClose}
          aria-label="关闭侧栏"
        />
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'comments' && (
          <CommentsTab
            threads={threads}
            selectedThreadId={selectedThreadId}
            highlightedThreadId={highlightedThreadId}
            {...threadHandlers}
          />
        )}
        {tab === 'notes' && <NotesTab noteIds={noteIds} registry={registry} />}
        {tab === 'toc' && (
          <TocTab registry={registry} currentPageId={currentPageId} onNavigate={onNavigate} />
        )}
      </div>
    </motion.div>
  );
}
