import type { CommentThread } from '../../atlas-core/types/comments';

type CommentPinProps = {
  thread: CommentThread;
  onClick: (threadId: string) => void;
  isHighlighted?: boolean;
  onHover?: (threadId: string | null) => void;
};

const STATUS_COLORS = {
  open: 'bg-yellow-400 border-yellow-600',
  resolved: 'bg-green-400 border-green-600',
  archived: 'bg-stone-400 border-stone-600',
};

export function CommentPin({ thread, onClick, isHighlighted, onHover }: CommentPinProps) {
  const anchor = thread.anchor;
  if (anchor.kind !== 'imagePoint' && anchor.kind !== 'imageRect') return null;

  const x = anchor.kind === 'imagePoint' ? anchor.x : anchor.rect.x + anchor.rect.width / 2;
  const y = anchor.kind === 'imagePoint' ? anchor.y : anchor.rect.y + anchor.rect.height / 2;

  const colorClass = STATUS_COLORS[thread.status] ?? STATUS_COLORS.open;

  return (
    <button
      onClick={() => onClick(thread.threadId)}
      onMouseEnter={() => onHover?.(thread.threadId)}
      onMouseLeave={() => onHover?.(null)}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group/pin"
      style={{ left: `${x}%`, top: `${y}%` }}
      title={`${thread.category} - ${thread.status} (${thread.messages.length} 条消息)`}
    >
      <span
        className={`block rounded-full border-2 shadow-lg transition-all duration-150 ${
          isHighlighted
            ? 'w-7 h-7 border-white scale-125 ring-2 ring-white/50'
            : `w-5 h-5 group-hover/pin:scale-110 ${colorClass}`
        }`}
        style={isHighlighted ? { backgroundColor: colorClass.split(' ')[0].replace('bg-', '') } : {}}
      />
      {/* Highlight label on hover */}
      <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-stone-800 text-stone-200 px-1.5 py-0.5 rounded whitespace-nowrap transition-opacity pointer-events-none ${
        isHighlighted ? 'opacity-100' : 'opacity-0 group-hover/pin:opacity-100'
      }`}>
        {thread.messages[thread.messages.length - 1]?.body
          .filter((n) => n.type === 'text')
          .map((n) => n.value)
          .join('')
          .slice(0, 20) ?? '新评论'}
      </span>
      {/* Message count badge */}
      <span className={`absolute -top-1 -right-1 rounded-full flex items-center justify-center text-[8px] text-stone-200 font-bold transition-all ${
        isHighlighted ? 'w-4 h-4 bg-blue-500 -top-2 -right-2' : 'w-3 h-3 bg-stone-600'
      }`}>
        {thread.messages.length}
      </span>
    </button>
  );
}
