import type { CommentThread } from '../../atlas-core/types/comments';
import { CommentPin } from './CommentPin';

type CommentPinLayerProps = {
  threads: CommentThread[];
  highlightedThreadId: string | null;
  onHoverThread: (threadId: string | null) => void;
  onClickThread: (threadId: string) => void;
};

export function CommentPinLayer({ threads, highlightedThreadId, onHoverThread, onClickThread }: CommentPinLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {threads
        .filter((t) => t.status !== 'archived')
        .map((thread) => (
          <CommentPin
            key={thread.threadId}
            thread={thread}
            onClick={onClickThread}
            isHighlighted={highlightedThreadId === thread.threadId}
            onHover={onHoverThread}
          />
        ))}
    </div>
  );
}
