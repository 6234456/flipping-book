import { AnimatePresence, motion } from 'framer-motion';
import type { BookRegistry } from '../../atlas-core/registry';
import type { CommentThread } from '../../atlas-core/types/comments';
import type { NoteId } from '../../atlas-core/types/primitives';
import type { RailTab } from '../../atlas-core/reader/useRailState';
import { MOTION } from '../primitives';
import { RailHeader } from './RailHeader';
import { SlimRail } from './SlimRail';
import { CommentsTab } from './tabs/CommentsTab';
import { NotesTab } from './tabs/NotesTab';
import { TocTab } from './tabs/TocTab';

export type ReaderRailProps = {
  registry: BookRegistry;
  threads: CommentThread[];
  noteIds: NoteId[];
  currentPageId: string | null;
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  open: boolean;
  tab: RailTab;
  width: number;
  onTabChange: (tab: RailTab) => void;
  onCollapse: () => void;
  onExpand: (toTab: RailTab) => void;
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

export function ReaderRail(props: ReaderRailProps) {
  const {
    open,
    tab,
    width,
    threads,
    noteIds,
    registry,
    currentPageId,
    selectedThreadId,
    highlightedThreadId,
    onTabChange,
    onCollapse,
    onExpand,
    onPlusClick,
    onNavigate,
    ...threadHandlers
  } = props;

  const commentCount = threads.length;
  const noteCount = noteIds.length;

  if (!open) {
    return (
      <SlimRail
        activeTab={null}
        badges={{ comments: commentCount, notes: noteCount, toc: 0 }}
        onExpand={onExpand}
      />
    );
  }

  return (
    <motion.aside
      role="complementary"
      aria-label="侧栏"
      style={{ width }}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={MOTION.railWidth}
      className="bg-page border-l border-border flex flex-col shrink-0 overflow-hidden"
    >
      <RailHeader
        activeTab={tab}
        commentCount={commentCount}
        noteCount={noteCount}
        onTabChange={onTabChange}
        onPlusClick={onPlusClick}
        onCollapse={onCollapse}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          role="tabpanel"
          aria-label={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION.tabFade}
          className="flex-1 min-h-0"
        >
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
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  );
}
