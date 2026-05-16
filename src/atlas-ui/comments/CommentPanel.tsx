import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Edit2, Trash2, Check, RotateCcw } from 'lucide-react';
import type { CommentThread, CommentMessage } from '../../atlas-core/types/comments';
import { CommentComposer } from './CommentComposer';
import { Button, DrawerHeader, EmptyState, MOTION } from '../primitives';

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

function MessageItem({
  msg,
  threadId,
  onEdit,
  onDelete,
}: {
  msg: CommentMessage;
  threadId: string;
  onEdit: (threadId: string, messageId: string, text: string) => void;
  onDelete: (threadId: string, messageId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(
    msg.body.filter((n) => n.type === 'text').map((n) => n.value).join(''),
  );

  function handleSave() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(threadId, msg.messageId, trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-surface-2 rounded-md p-2 border border-border">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full bg-page text-text text-sm rounded p-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent-2/40"
          rows={3}
        />
        <div className="flex justify-end gap-1 mt-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>取消</Button>
          <Button variant="primary" size="sm" leadingIcon={Check} onClick={handleSave} disabled={!editText.trim()}>
            保存
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 rounded-md p-2 group border border-border">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-2">{msg.authorId}</span>
          <span className="text-[11px] text-text-muted">
            {new Date(msg.createdAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={Edit2}
            aria-label="编辑消息"
            onClick={() => {
              setEditText(msg.body.filter((n) => n.type === 'text').map((n) => n.value).join(''));
              setEditing(true);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={Trash2}
            aria-label="删除消息"
            onClick={() => onDelete(threadId, msg.messageId)}
          />
        </div>
      </div>
      <p className="text-text text-sm">
        {msg.body.filter((n) => n.type === 'text').map((n) => n.value).join('')}
      </p>
    </div>
  );
}

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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
            {threads.map((thread) => {
              const isSelected = selectedThreadId === thread.threadId;
              const isOpen = thread.status === 'open';
              const itemHighlight =
                highlightedThreadId === thread.threadId
                  ? 'bg-accent-bg-faint border-l-2 border-l-accent'
                  : isSelected
                  ? 'bg-surface-2'
                  : '';

              return (
                <div
                  key={thread.threadId}
                  className={`border-b border-border transition-colors ${itemHighlight}`}
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
                        className={`w-2 h-2 rounded-full ${
                          isOpen ? 'bg-accent' : 'bg-accent-soft'
                        }`}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDelete(null)}
                            >
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

            {threads.length === 0 && (
              <EmptyState
                icon={MessageSquare}
                title="这一页还没有评论"
                description="开启评论模式后,点击图片即可添加。"
              />
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
