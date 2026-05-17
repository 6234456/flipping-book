import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import type { CommentThread } from '../../atlas-core/types/comments';
import { DrawerHeader, MOTION } from '../primitives';
import { ThreadList } from './ThreadList';

type CommentPanelProps = {
  threads: CommentThread[];
  selectedThreadId: string | null;
  highlightedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onHoverThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onEditMessage: (threadId: string, messageId: string, text: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
  open: boolean;
  onToggle: () => void;
};

export function CommentPanel({
  threads,
  selectedThreadId,
  highlightedThreadId,
  onSelectThread,
  onHoverThread,
  onAddMessage,
  onResolve,
  onReopen,
  onDeleteThread,
  onEditMessage,
  onDeleteMessage,
  open,
  onToggle,
}: CommentPanelProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={MOTION.drawerSpring}
          className="fixed left-0 top-0 h-full w-80 bg-page border-r border-border z-40 flex flex-col shadow-[var(--shadow-2)]"
          role="dialog"
          aria-modal="false"
          aria-label="评论面板"
        >
          <DrawerHeader icon={MessageSquare} title="评论" count={threads.length} onClose={onToggle} />

          <div className="flex-1 overflow-y-auto">
            <ThreadList
              threads={threads}
              selectedThreadId={selectedThreadId}
              highlightedThreadId={highlightedThreadId}
              onSelectThread={onSelectThread}
              onHoverThread={onHoverThread}
              onAddMessage={onAddMessage}
              onResolve={onResolve}
              onReopen={onReopen}
              onDeleteThread={onDeleteThread}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
            />
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
