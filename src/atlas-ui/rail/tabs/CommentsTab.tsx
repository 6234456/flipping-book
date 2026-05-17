import type { CommentThread } from '../../../atlas-core/types/comments';
import { ThreadList } from '../../comments/ThreadList';

export type CommentsTabProps = {
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
};

export function CommentsTab(props: CommentsTabProps) {
  return (
    <div className="h-full overflow-y-auto">
      <ThreadList {...props} />
    </div>
  );
}
