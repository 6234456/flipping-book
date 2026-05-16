import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import type { NoteId } from '../../atlas-core/types/primitives';
import { RichTextRenderer } from '../renderers/RichTextRenderer';
import { Chip, DrawerHeader, EmptyState, MOTION } from '../primitives';

type NotesDrawerProps = {
  noteIds: NoteId[];
  registry: BookRegistry;
  open: boolean;
  onToggle: () => void;
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  'speaker-note': '演讲备注',
  supplement: '补充材料',
  'legal-background': '法规背景',
  example: '示例',
  'authoring-note': '创作说明',
  'image-prompt-note': '图片生成提示',
  'review-note': '审阅备注',
};

export function NotesDrawer({ noteIds, registry, open, onToggle }: NotesDrawerProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const notes = noteIds
    .map((id) => registry.notes.get(id))
    .filter((n) => n != null)
    .filter((n) => n.visibility !== 'editor-only')
    .filter((n) => !filter || n.noteType === filter);

  const availableTypes = new Set(notes.map((n) => n.noteType));

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={MOTION.drawerSpring}
          className="fixed right-0 top-0 h-full w-96 bg-page border-l border-border z-40 flex flex-col shadow-[var(--shadow-2)]"
          role="dialog"
          aria-modal="false"
          aria-label="笔记面板"
        >
          <DrawerHeader icon={FileText} title="笔记" count={notes.length} onClose={onToggle} />

          {availableTypes.size > 1 && (
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border shrink-0">
              <button
                type="button"
                onClick={() => setFilter(null)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  !filter
                    ? 'bg-accent-bg text-accent'
                    : 'bg-surface-2 text-text-2 hover:text-text'
                }`}
              >
                全部
              </button>
              {Array.from(availableTypes).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilter(type)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    filter === type
                      ? 'bg-accent-bg text-accent'
                      : 'bg-surface-2 text-text-2 hover:text-text'
                  }`}
                >
                  {NOTE_TYPE_LABELS[type] ?? type}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {notes.map((note) => (
              <div key={note.noteId} className="bg-surface-2 rounded-md p-3 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-text-2">
                    {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
                  </span>
                  {note.tags?.map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
                {note.title?.['zh-CN'] && (
                  <h3 className="text-text text-sm font-semibold mb-1">{note.title['zh-CN']}</h3>
                )}
                <div className="text-text-2 text-sm leading-relaxed">
                  <RichTextRenderer
                    nodes={note.body}
                    registry={registry}
                    bookSlug={registry.manifest.slug}
                  />
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <EmptyState
                icon={FileText}
                title="这一页还没有笔记"
                description="切换章节,或查看其他页面。"
              />
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
