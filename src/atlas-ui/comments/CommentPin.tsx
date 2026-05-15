import type { CommentThread } from '../../atlas-core/types/comments';

type CommentPinProps = {
  thread: CommentThread;
  onClick: (threadId: string) => void;
};

const STATUS_COLORS = {
  open: 'bg-yellow-400 border-yellow-600',
  resolved: 'bg-green-400 border-green-600',
  archived: 'bg-stone-400 border-stone-600',
};

export function CommentPin({ thread, onClick }: CommentPinProps) {
  const anchor = thread.anchor;
  if (anchor.kind !== 'imagePoint' && anchor.kind !== 'imageRect') return null;

  const x = anchor.kind === 'imagePoint' ? anchor.x : anchor.rect.x + anchor.rect.width / 2;
  const y = anchor.kind === 'imagePoint' ? anchor.y : anchor.rect.y + anchor.rect.height / 2;

  const colorClass = STATUS_COLORS[thread.status] ?? STATUS_COLORS.open;

  return (
    <button
      onClick={() => onClick(thread.threadId)}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
      style={{ left: `${x}%`, top: `${y}%` }}
      title={`${thread.category} - ${thread.status} (${thread.messages.length} 条消息)`}
    >
      <span className={`block w-5 h-5 rounded-full border-2 ${colorClass} shadow-lg group-hover:scale-125 transition-transform`} />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-stone-800 rounded-full flex items-center justify-center text-[8px] text-stone-200 font-bold">
        {thread.messages.length}
      </span>
    </button>
  );
}
