import { useState } from 'react';
import { MessageSquare, Check, RotateCcw, Trash2 } from 'lucide-react';
import type { CommentThread } from '../../atlas-core/types/comments';
import { CommentComposer } from './CommentComposer';
import { MessageItem } from './MessageItem';
import { Button, EmptyState } from '../primitives';

const CATEGORY_LABELS: Record<string, string> = {
  question: '问题',
  correction: '纠正',
  'tax-risk': '税务风险',
  'legal-source': '法规来源',
  design: '设计',
  translation: '翻译',
  todo: '待办',
  general: '一般',
};

export type ThreadListProps = {
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

export function ThreadList({
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
}: ThreadListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="这一页还没有评论"
        description="开启评论模式后,点击图片即可添加。"
      />
    );
  }

  return (
    <div>
      {threads.map((thread) => {
        const isSelected = selectedThreadId === thread.threadId;
        const isOpen = thread.status === 'open';
        const highlighted = highlightedThreadId === thread.threadId;
        const containerClass = highlighted
          ? 'bg-accent-bg-faint border-l-2 border-l-accent'
          : isSelected
          ? 'bg-surface-2'
          : '';

        return (
          <div
            key={thread.threadId}
            data-thread-highlighted={highlighted ? 'true' : 'false'}
            className={`border-b border-border transition-colors ${containerClass}`}
          >
            <button
              type="button"
              onClick={() => onSelectThread(isSelected ? null : thread.threadId)}
              onMouseEnter={() => onHoverThread(thread.threadId)}
              onMouseLeave={() => onHoverThread(null)}
              className="w-full text-left p-3 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${isOpen ? 'bg-accent' : 'bg-accent-soft'}`}
                  aria-hidden="true"
                />
                <span className="text-[11px] text-text-2 font-medium">
                  {CATEGORY_LABELS[thread.category] ?? thread.category}
                </span>
                {thread.priority === 'high' && (
                  <span className="text-[11px] text-accent-strong font-bold">!!</span>
                )}
              </div>
              {thread.messages.length > 0 && (
                <p className="text-text text-sm line-clamp-2">
                  {thread.messages[thread.messages.length - 1].body
                    .filter((n) => n.type === 'text')
                    .map((n) => n.value)
                    .join('')}
                </p>
              )}
              <p className="text-text-muted text-xs mt-1">
                {thread.messages.length} 条消息 · {isOpen ? '未解决' : '已解决'}
              </p>
            </button>

            {isSelected && (
              <div className="px-3 pb-2 space-y-2">
                {thread.messages.map((msg) => (
                  <MessageItem
                    key={msg.messageId}
                    msg={msg}
                    threadId={thread.threadId}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                  />
                ))}

                <div className="flex items-center gap-2 flex-wrap">
                  {isOpen ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={Check}
                      onClick={() => onResolve(thread.threadId)}
                    >
                      标记已解决
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={RotateCcw}
                      onClick={() => onReopen(thread.threadId)}
                    >
                      重新打开
                    </Button>
                  )}

                  {confirmDelete === thread.threadId ? (
                    <>
                      <span className="text-[11px] text-text-2">确认删除?</span>
                      <Button
                        variant="danger-confirm"
                        size="sm"
                        onClick={() => {
                          onDeleteThread(thread.threadId);
                          setConfirmDelete(null);
                        }}
                      >
                        是
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                        否
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="danger-default"
                      size="sm"
                      leadingIcon={Trash2}
                      onClick={() => setConfirmDelete(thread.threadId)}
                    >
                      删除
                    </Button>
                  )}
                </div>

                {isOpen && (
                  <CommentComposer
                    onSubmit={(text) => onAddMessage(thread.threadId, text)}
                    onCancel={() => onSelectThread(null)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
