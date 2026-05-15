import { useState } from 'react';
import type { CommentThread } from '../../atlas-core/types/comments';
import { CommentComposer } from './CommentComposer';

type CommentPanelProps = {
  threads: CommentThread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onAddMessage: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
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

export function CommentPanel({
  threads,
  selectedThreadId,
  onSelectThread,
  onAddMessage,
  onResolve,
  onReopen,
  open,
  onToggle,
}: CommentPanelProps) {
  return (
    <div className={`fixed left-0 top-0 h-full bg-stone-950 border-r border-stone-700 transition-all z-40 flex flex-col ${
      open ? 'w-80' : 'w-0'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-stone-700 shrink-0">
        <h2 className="text-stone-200 font-semibold text-sm whitespace-nowrap">
          💬 评论 ({threads.length})
        </h2>
        <button
          onClick={onToggle}
          className="text-stone-400 hover:text-stone-200 text-lg leading-none px-1"
          aria-label="关闭评论"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.map((thread) => {
          const isSelected = selectedThreadId === thread.threadId;
          return (
            <div
              key={thread.threadId}
              className={`border-b border-stone-800 ${isSelected ? 'bg-stone-900' : ''}`}
            >
              <button
                onClick={() => onSelectThread(isSelected ? null : thread.threadId)}
                className="w-full text-left p-3 hover:bg-stone-900 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    thread.status === 'open' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <span className="text-xs text-stone-400">
                    {CATEGORY_LABELS[thread.category] ?? thread.category}
                  </span>
                  {thread.priority === 'high' && (
                    <span className="text-xs text-red-400">!!</span>
                  )}
                </div>
                {thread.messages.length > 0 && (
                  <p className="text-stone-300 text-sm line-clamp-2">
                    {thread.messages[thread.messages.length - 1].body
                      .filter((n) => n.type === 'text')
                      .map((n) => n.value)
                      .join('')}
                  </p>
                )}
                <p className="text-stone-500 text-xs mt-1">
                  {thread.messages.length} 条消息 · {thread.status === 'open' ? '未解决' : '已解决'}
                </p>
              </button>

              {/* Expanded thread messages */}
              {isSelected && (
                <div className="px-3 pb-2 space-y-2">
                  {thread.messages.map((msg) => (
                    <div key={msg.messageId} className="bg-stone-800 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-stone-400">{msg.authorId}</span>
                        <span className="text-xs text-stone-500">
                          {new Date(msg.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-stone-300 text-sm">
                        {msg.body
                          .filter((n) => n.type === 'text')
                          .map((n) => n.value)
                          .join('')}
                      </p>
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {thread.status === 'open' ? (
                      <button
                        onClick={() => onResolve(thread.threadId)}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        ✓ 标记已解决
                      </button>
                    ) : (
                      <button
                        onClick={() => onReopen(thread.threadId)}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        ↻ 重新打开
                      </button>
                    )}
                  </div>

                  {thread.status === 'open' && (
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
          <p className="text-stone-500 text-sm text-center p-8">暂无评论</p>
        )}
      </div>
    </div>
  );
}
