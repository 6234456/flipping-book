import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../primitives';

type CommentComposerProps = {
  onSubmit: (text: string) => void;
  onCancel: () => void;
};

export function CommentComposer({ onSubmit, onCancel }: CommentComposerProps) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  }

  return (
    <div className="border-t border-border p-3 bg-surface-2 rounded-md">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="添加评论…"
        className="w-full bg-page text-text text-sm rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent-2/40 border border-border"
        rows={3}
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        <Button variant="primary" size="sm" trailingIcon={Send} onClick={handleSubmit} disabled={!text.trim()}>
          发送
        </Button>
      </div>
    </div>
  );
}
