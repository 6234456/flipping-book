import type { CommentThread } from '../../atlas-core/types/comments';
import { Pin } from '../primitives';

type CommentPinProps = {
  thread: CommentThread;
  onClick: (threadId: string) => void;
  isHighlighted?: boolean;
  onHover?: (threadId: string | null) => void;
};

export function CommentPin({ thread, onClick, isHighlighted = false, onHover }: CommentPinProps) {
  const anchor = thread.anchor;
  if (anchor.kind !== 'imagePoint' && anchor.kind !== 'imageRect') return null;

  const x = anchor.kind === 'imagePoint' ? anchor.x : anchor.rect.x + anchor.rect.width / 2;
  const y = anchor.kind === 'imagePoint' ? anchor.y : anchor.rect.y + anchor.rect.height / 2;

  const pinStatus = thread.status === 'resolved' ? 'resolved' : 'open';
  const lastMessage = thread.messages[thread.messages.length - 1];
  const preview =
    lastMessage?.body
      .filter((n) => n.type === 'text')
      .map((n) => n.value)
      .join('')
      .slice(0, 24) ?? '新评论';

  return (
    <button
      type="button"
      onClick={() => onClick(thread.threadId)}
      onMouseEnter={() => onHover?.(thread.threadId)}
      onMouseLeave={() => onHover?.(null)}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label={`评论 · ${thread.category} · ${thread.messages.length} 条 · ${preview}`}
    >
      <Pin
        status={pinStatus}
        highlighted={isHighlighted}
        count={thread.messages.length}
        onClick={() => onClick(thread.threadId)}
        onHover={(entering) => onHover?.(entering ? thread.threadId : null)}
        label={preview}
      />
    </button>
  );
}
