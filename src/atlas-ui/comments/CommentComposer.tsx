import { useState } from 'react';

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
    <div className="border-t border-stone-700 p-3 bg-stone-900">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="添加评论..."
        className="w-full bg-stone-800 text-stone-200 text-sm rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs rounded bg-stone-800 text-stone-400 hover:text-stone-200"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
    </div>
  );
}
