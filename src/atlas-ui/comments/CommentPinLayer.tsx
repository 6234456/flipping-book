import type { CommentThread } from '../../atlas-core/types/comments';
import { CommentPin } from './CommentPin';

type CommentPinLayerProps = {
  threads: CommentThread[];
  onClickThread: (threadId: string) => void;
};

export function CommentPinLayer({ threads, onClickThread }: CommentPinLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {threads
        .filter((t) => t.status !== 'archived')
        .map((thread) => (
          <CommentPin
            key={thread.threadId}
            thread={thread}
            onClick={onClickThread}
          />
        ))}
    </div>
  );
}
