import { useState } from 'react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { NoteId } from '../../atlas-core/types/primitives';
import { RichTextRenderer } from '../renderers/RichTextRenderer';

type NotesDrawerProps = {
  noteIds: NoteId[];
  registry: BookRegistry;
  open: boolean;
  onToggle: () => void;
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  'speaker-note': '演讲备注',
  'supplement': '补充材料',
  'legal-background': '法规背景',
  'example': '示例',
  'authoring-note': '创作说明',
  'image-prompt-note': '图片生成提示',
  'review-note': '审阅备注',
};

export function NotesDrawer({ noteIds, registry, open, onToggle }: NotesDrawerProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const notes = noteIds
    .map((id) => registry.notes.get(id))
    .filter((n) => n != null)
    .filter((n) => n.visibility !== 'editor-only') // hide editor-only notes from readers
    .filter((n) => !filter || n.noteType === filter);

  const availableTypes = new Set(notes.map((n) => n.noteType));

  return (
    <div className={`fixed right-0 top-0 h-full bg-stone-950 border-l border-stone-700 transition-all z-40 flex flex-col ${
      open ? 'w-96' : 'w-0'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-stone-700 shrink-0">
        <h2 className="text-stone-200 font-semibold text-sm whitespace-nowrap">
          📝 笔记 ({notes.length})
        </h2>
        <button
          onClick={onToggle}
          className="text-stone-400 hover:text-stone-200 text-lg leading-none px-1"
          aria-label="关闭笔记"
        >
          ✕
        </button>
      </div>

      {/* Filter chips */}
      {availableTypes.size > 1 && (
        <div className="flex flex-wrap gap-1 p-3 border-b border-stone-800 shrink-0">
          <button
            onClick={() => setFilter(null)}
            className={`px-2 py-0.5 rounded text-xs ${!filter ? 'bg-stone-600 text-stone-100' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}
          >
            全部
          </button>
          {Array.from(availableTypes).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-0.5 rounded text-xs ${filter === type ? 'bg-stone-600 text-stone-100' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}
            >
              {NOTE_TYPE_LABELS[type] ?? type}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notes.map((note) => (
          <div key={note.noteId} className="bg-stone-900 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-stone-500">
                {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
              </span>
              {note.tags?.map((tag) => (
                <span key={tag} className="text-xs bg-stone-800 text-stone-400 px-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
            {note.title?.['zh-CN'] && (
              <h3 className="text-stone-200 text-sm font-medium mb-1">
                {note.title['zh-CN']}
              </h3>
            )}
            <div className="text-stone-400 text-sm leading-relaxed">
              <RichTextRenderer
                nodes={note.body}
                registry={registry}
                bookSlug={registry.manifest.slug}
              />
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-stone-500 text-sm text-center">暂无笔记</p>
        )}
      </div>
    </div>
  );
}
