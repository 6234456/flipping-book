import { useState } from 'react';
import { Edit2, Trash2, Check } from 'lucide-react';
import type { CommentMessage } from '../../atlas-core/types/comments';
import { Button } from '../primitives';

export type MessageItemProps = {
  msg: CommentMessage;
  threadId: string;
  onEdit: (threadId: string, messageId: string, text: string) => void;
  onDelete: (threadId: string, messageId: string) => void;
};

function bodyText(msg: CommentMessage): string {
  return msg.body
    .filter((n) => n.type === 'text')
    .map((n) => n.value)
    .join('');
}

export function MessageItem({ msg, threadId, onEdit, onDelete }: MessageItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(() => bodyText(msg));

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
              setEditText(bodyText(msg));
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
      <p className="text-text text-sm">{bodyText(msg)}</p>
    </div>
  );
}
